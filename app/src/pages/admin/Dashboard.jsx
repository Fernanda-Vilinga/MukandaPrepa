import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminOverview } from '../../services/adminApi.js';
import { AdminTopbar, RolePill, PlanPill } from '../../components/AdminUi.jsx';
import { Stat } from '../../components/Ui.jsx';

// Antes era `role === 'professor' ? 'professor' : 'estudante'`, o que fazia
// qualquer papel que não fosse professor — incluindo admin — aparecer como
// estudante na lista de últimos registos.
const PAPEL_LABEL = { admin: 'administrador', professor: 'professor', student: 'estudante' };

const ALERT_STYLE = {
  red: { background: 'var(--red-l)' },
  amber: { background: 'var(--amber-l)' },
  blue: { background: 'var(--blue-l)' },
};

export default function AdminDashboard() {
  const [ov, setOv] = useState(null);
  useEffect(() => { getAdminOverview().then(setOv); }, []);
  if (!ov) return <AdminTopbar />;
  const { kpis, activity, alerts, recent } = ov;
  const today = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <>
      <AdminTopbar />
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>Painel de administração</h1>
            <div className="mut">Visão global da plataforma · {today}</div>
          </div>
          <Link to="/admin/professores/novo" className="btn" style={{ textDecoration: 'none' }}>+ Registar professor</Link>
        </div>

        <div className="row" style={{ marginBottom: 24 }}>
          <div className="stat">
            <div className="v">{kpis.totalUsers}</div><div className="l">Utilizadores totais</div>
            <div className="xs" style={{ color: 'var(--green)', fontWeight: 600, marginTop: 6 }}>▲ +{kpis.newThisWeek} esta semana</div>
          </div>
          <div className="stat">
            <div className="v">{kpis.professors}</div><div className="l">Professores activos</div>
            <div className="xs mut" style={{ marginTop: 6 }}>{kpis.newProfsMonth} registados este mês</div>
          </div>
          <div className="stat">
            <div className="v" style={{ color: 'var(--green)' }}>{kpis.activeMarathons}</div><div className="l">Maratonas activas</div>
            <div className="xs mut" style={{ marginTop: 6 }}>{kpis.soonMarathons} em breve</div>
          </div>
          <div className="stat" style={{ borderTop: '4px solid var(--orange)' }}>
            <div className="v" style={{ color: 'var(--orange)' }}>{kpis.pendingValidations}</div><div className="l">Submissões pendentes</div>
            <div className="xs mut" style={{ marginTop: 6 }}>em {kpis.pendingProfessors} professores</div>
          </div>
        </div>

        <div className="row">
          <div className="col" style={{ flex: 1.6 }}>
            <div className="card">
              <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 20 }}>Actividade — sessões de maratona por semana</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 180 }}>
                {activity.map((w, i) => (
                  <div key={i} style={{ flex: 1, height: `${w.v}%`, background: 'var(--orange)', borderRadius: '8px 8px 0 0', opacity: .85 }} title={`${w.v}`} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                {activity.map((w, i) => <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11.5, color: 'var(--mut)' }}>{w.label}</span>)}
              </div>
            </div>
          </div>

          <div className="col">
            <div className="card" style={{ borderTop: '4px solid var(--red)', marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>🔔 Alertas do sistema</h3>
              <div className="sm" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {alerts.length === 0 && <div className="mut">Tudo em ordem — sem alertas de momento.</div>}
                {alerts.map((a, i) => (
                  <div key={i} style={{ ...ALERT_STYLE[a.level], borderRadius: 10, padding: '12px 14px' }}>{a.text}</div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Últimos registos</h3>
              <div className="sm" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recent.map((u) => (
                  <div key={u.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, background: u.color }}>{u.initials}</div>
                    <div style={{ flex: 1 }}>
                      {u.name}
                      <div className="xs mut">{PAPEL_LABEL[u.role] || 'estudante'} · {u.created}</div>
                    </div>
                    {u.role === 'student' ? <PlanPill plan={u.plan} /> : <RolePill role={u.role} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
