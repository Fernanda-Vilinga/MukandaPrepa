// Dados completos de uma maratona (visão admin) + exportação CSV.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMarathonData, exportAdminMarathonCSV } from '../../services/adminApi.js';
import { AdminTopbar, PlanPill } from '../../components/AdminUi.jsx';
import { Stat, Badge } from '../../components/Ui.jsx';

const STATE = {
  validated: { label: 'Validada', style: { background: 'var(--green-l)', color: 'var(--green)' } },
  pending: { label: '⏳ Em validação', style: { background: 'var(--amber-l)', color: '#B45309' } },
  abandoned: { label: 'Abandonada', style: { background: '#EEEEF0', color: 'var(--mut)' } },
};

export default function MarathonData() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { getMarathonData(id).then(setD); }, [id]);
  if (!d) return <AdminTopbar />;

  const exportCSV = async () => {
    setError('');
    setExporting(true);
    try {
      const slug = d.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await exportAdminMarathonCSV(id, `maratona-${slug || id}.csv`);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <AdminTopbar />
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {d.title} <Badge status={d.status} />
            </h1>
            <div className="mut sm">{d.professor} · janela {d.window} · {d.questions} questões · {d.perSession} por sessão · {d.duration} min</div>
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
          <Stat value={d.participants} label="Alunos participantes" />
          <Stat value={d.attempts} label="Tentativas realizadas" />
          <Stat value={d.avgScore} label="Nota média" />
          <Stat value={d.avgTime} label="Tempo médio de sessão" />
          <Stat value={d.worstQ} label={`Questão mais errada (${d.worstPct}%)`} color="var(--red)" style={{ borderTop: '4px solid var(--red)' }} />
        </div>

        <div className="card" style={{ padding: '8px 28px' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Aluno</th><th>Plano</th><th>Tentativa</th><th>Nota</th><th>Tempo</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {d.rows.map((r) => (
                  <tr key={r.name}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 34, height: 34, fontSize: 13, background: r.color }}>{r.initials}</div>
                        <b>{r.name}</b>
                      </div>
                    </td>
                    <td><PlanPill plan={r.plan} /></td>
                    <td>{r.attempt}</td>
                    <td>{r.score}</td>
                    <td className="mut">{r.time}</td>
                    <td><span className="badge" style={STATE[r.state].style}>{STATE[r.state].label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="row" style={{ marginTop: 24 }}>
          <div className="col card">
            <h3 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 14 }}>Questões mais erradas</h3>
            {d.errorTop.map((e) => (
              <div key={e.q} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span className="sm" style={{ width: 40, fontWeight: 600 }}>{e.q}</span>
                <div className="prog" style={{ flex: 1, height: 8 }}>
                  <div style={{ width: `${e.pct}%`, background: e.pct >= 50 ? 'var(--red)' : 'var(--orange)' }} />
                </div>
                <b className="sm">{e.pct}%</b>
              </div>
            ))}
          </div>
          <div className="col card">
            <h3 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 14 }}>Conclusão</h3>
            <div style={{ display: 'flex', gap: 12, textAlign: 'center' }}>
              <div style={{ flex: 1, background: 'var(--green-l)', borderRadius: 12, padding: 16 }}>
                <div className="mont" style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{d.completion.done}</div>
                <div className="xs mut">Completas</div>
              </div>
              <div style={{ flex: 1, background: 'var(--amber-l)', borderRadius: 12, padding: 16 }}>
                <div className="mont" style={{ fontSize: 22, fontWeight: 800, color: '#B45309' }}>{d.completion.pending}</div>
                <div className="xs mut">Em validação</div>
              </div>
              <div style={{ flex: 1, background: '#EEEEF0', borderRadius: 12, padding: 16 }}>
                <div className="mont" style={{ fontSize: 22, fontWeight: 800, color: 'var(--mut)' }}>{d.completion.abandoned}</div>
                <div className="xs mut">Abandonadas</div>
              </div>
            </div>
          </div>
          <div className="col card" style={{ background: 'var(--dark)', color: '#fff' }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 12 }}>Exportação CSV inclui</h3>
            <div className="sm" style={{ color: '#B9BAC6', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>· Aluno, plano, nº da tentativa</div>
              <div>· Notas e % por questão</div>
              <div>· Tempos de sessão</div>
              <div>· Respostas + feedback do professor</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
