// Estatísticas da maratona — erros por questão, distribuição, exportar.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMarathonStats } from './profDeps.js';
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
  useEffect(() => { getMarathonStats(id).then(setS); }, [id]);
  if (!s) return <ProfTopbar />;

  const barColor = (pct) => (pct >= 50 ? 'var(--red)' : pct <= 20 ? 'var(--green)' : 'var(--orange)');

  return (
    <>
      <ProfTopbar />
      <div className="wrap" style={{ maxWidth: 1080 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Estatísticas — Álgebra Linear</h1>
            <div className="mut sm">Janela: 12–19 Jul 2026 · 15 questões no banco · 5 por sessão</div>
          </div>
          {/* TODO backend: GET /api/prof/marathons/:id/export.csv */}
          <button className="btn dark">⬇ Exportar CSV</button>
        </div>

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
