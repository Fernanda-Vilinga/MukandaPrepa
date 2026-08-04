// Estatísticas da maratona — erros por questão, distribuição, exportar.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMarathonStats, exportMarathonCSV } from './profDeps.js';
import { ProfTopbar } from '../../components/ProfUi.jsx';
import { Stat } from '../../components/Ui.jsx';

function Bar({ label, pct, color = 'var(--orange)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
      <div className="sm" style={{ width: 80, fontWeight: 600 }}>{label}</div>
      <div className="prog" style={{ flex: 1, height: 8 }}><div style={{ width: `${pct}%`, background: color }} /></div>
      <div className="sm mut" style={{ width: 44, textAlign: 'right' }}>{pct}%</div>
    </div>
  );
}

export default function Stats() {
  const { id } = useParams();
  const [s, setS] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { getMarathonStats(id).then(setS); }, [id]);
  if (!s) return <ProfTopbar />;

  const exportCSV = async () => {
    setError('');
    setExporting(true);
    try {
      const slug = s.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await exportMarathonCSV(id, `estatisticas-${slug || id}.csv`);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const barColor = (pct) => (pct >= 50 ? 'var(--red)' : pct <= 20 ? 'var(--green)' : 'var(--orange)');

  return (
    <>
      <ProfTopbar />
      <div className="wrap" style={{ maxWidth: 1080 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Estatísticas — {s.title}</h1>
            <div className="mut sm">Janela: {s.window} · {s.totalQuestions} questões no banco · {s.questionsPerSession} por sessão</div>
          </div>
          <button className="btn dark" onClick={exportCSV} disabled={exporting}>
            {exporting ? 'A exportar…' : '⬇ Exportar CSV'}
          </button>
        </div>

        {error && (
          <div className="sm" style={{ background: 'var(--red-l, #fdecec)', color: 'var(--red, #c0392b)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="row" style={{ marginBottom: 24 }}>
          <Stat value={s.participants} label="Alunos participantes" />
          <Stat value={`${s.completionRate}%`} label="Taxa de conclusão" />
          <Stat value={s.avgTime} label="Tempo médio de sessão" />
          <Stat value={`${s.avgScore}%`} label="Média de acertos" />
        </div>

        <div className="row">
          <div className="col" style={{ flex: 1.4 }}>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Taxa de erro por questão (15 do banco)</h3>
              {s.errorByQuestion.map((e) => <Bar key={e.q} label={e.q} pct={e.pct} color={barColor(e.pct)} />)}
              <div className="xs mut">Ordenado por % de respostas erradas · só questões já sorteadas</div>
            </div>
          </div>
          <div className="col">
            <div className="card" style={{ borderLeft: '5px solid var(--red)', marginBottom: 20 }}>
              <div className="xs mut" style={{ letterSpacing: '.1em' }}>QUESTÃO MAIS ERRADA</div>
              <div className="mont" style={{ fontWeight: 700, fontSize: 17, margin: '6px 0' }}>
                {s.worst.q} · {s.worst.type} — {s.worst.pct}% de erros
              </div>
              <div className="sm mut">{s.worst.note}</div>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Distribuição de notas</h3>
              {s.gradeDist.map((g, i) => (
                <Bar key={g.label} label={g.label} pct={g.pct} color={i < 2 ? 'var(--green)' : i === s.gradeDist.length - 1 ? 'var(--red)' : 'var(--orange)'} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
