// Estatísticas globais da plataforma.
import { useEffect, useState } from 'react';
import { getGlobalStats, exportGlobalReportCSV } from '../../services/adminApi.js';
import { AdminTopbar } from '../../components/AdminUi.jsx';
import { Stat } from '../../components/Ui.jsx';

export default function GlobalStats() {
  const [s, setS] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { getGlobalStats().then(setS); }, []);
  if (!s) return <AdminTopbar />;

  const exportCSV = async () => {
    setError('');
    setExporting(true);
    try {
      await exportGlobalReportCSV();
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };
  const totalPlan = s.byPlan.basic + s.byPlan.plus + s.byPlan.premium;
  const pct = (n) => Math.round((n / totalPlan) * 100);

  return (
    <>
      <AdminTopbar />
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Estatísticas globais</h1>
          <button className="btn dark" onClick={exportCSV} disabled={exporting}>
            {exporting ? 'A exportar…' : '⬇ Exportar relatório'}
          </button>
        </div>

        {error && (
          <div className="sm" style={{ background: 'var(--red-l, #fdecec)', color: 'var(--red, #c0392b)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="row" style={{ marginBottom: 24 }}>
          <Stat value={s.users} label="Utilizadores" />
          <Stat value={s.marathonsCreated} label="Maratonas criadas" />
          <Stat value={`${s.completionRate}%`} label="Taxa de conclusão média" />
          <Stat value={s.sessions.toLocaleString('pt-PT')} label="Sessões realizadas" />
        </div>

        <div className="row">
          <div className="col" style={{ flex: 1.5 }}>
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Maratonas por mês</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 150 }}>
                {s.byMonth.map((m) => (
                  <div
                    key={m.label}
                    title={`${m.label}: ${m.v}`}
                    style={{ flex: 1, height: m.v > 0 ? `${m.v}%` : 3, background: m.v > 0 ? 'var(--blue)' : 'var(--brd)', borderRadius: '8px 8px 0 0', opacity: .85 }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                {s.byMonth.map((m) => <span key={m.label} style={{ flex: 1, textAlign: 'center', fontSize: 11.5, color: 'var(--mut)' }}>{m.label}</span>)}
              </div>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Taxa de conclusão por área</h3>
              {s.byArea.map((a) => (
                <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span className="sm" style={{ width: 160, fontWeight: 600 }}>{a.label}</span>
                  <div className="prog" style={{ flex: 1, height: 8 }}><div style={{ width: `${a.pct}%`, background: a.color }} /></div>
                  <b className="sm">{a.pct}%</b>
                </div>
              ))}
            </div>
          </div>

          <div className="col">
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Utilizadores por plano</h3>
              <div style={{ display: 'flex', gap: 12, textAlign: 'center' }}>
                <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 12, padding: 18 }}>
                  <div className="mont" style={{ fontSize: 24, fontWeight: 800 }}>{s.byPlan.basic}</div>
                  <div className="xs mut">Basic · {pct(s.byPlan.basic)}%</div>
                </div>
                <div style={{ flex: 1, background: 'var(--blue-l)', borderRadius: 12, padding: 18 }}>
                  <div className="mont" style={{ fontSize: 24, fontWeight: 800, color: 'var(--blue)' }}>{s.byPlan.plus}</div>
                  <div className="xs mut">Plus · {pct(s.byPlan.plus)}%</div>
                </div>
                <div style={{ flex: 1, background: 'var(--orange-l)', borderRadius: 12, padding: 18 }}>
                  <div className="mont" style={{ fontSize: 24, fontWeight: 800, color: 'var(--orange-d)' }}>{s.byPlan.premium}</div>
                  <div className="xs mut">Premium · {pct(s.byPlan.premium)}%</div>
                </div>
              </div>
              <div className="sm mut" style={{ marginTop: 14 }}>
                Receita recorrente: <b style={{ color: 'var(--dark)' }}>Plus + Premium = {pct(s.byPlan.plus + s.byPlan.premium)}%</b> da base
              </div>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Professores mais activos</h3>
              <table>
                <thead><tr><th>Professor</th><th>Maratonas</th><th>Validação média</th></tr></thead>
                <tbody>
                  {s.topProfessors.map((p) => (
                    <tr key={p.name}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.marathons}</td>
                      <td>
                        <span className="badge" style={p.ok ? { background: 'var(--green-l)', color: 'var(--green)' } : { background: 'var(--amber-l)', color: '#B45309' }}>
                          {p.avgValidation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
