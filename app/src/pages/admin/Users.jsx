// Gestão de utilizadores — filtros, acções (activar, suspender, plano, senha).
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, updateUser } from '../../services/adminApi.js';
import { AdminTopbar, RolePill, PlanPill } from '../../components/AdminUi.jsx';

const PLANOS = [
  ['basic', 'Basic'],
  ['plus', 'Plus'],
  ['premium', 'Premium'],
];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('all');
  const [q, setQ] = useState('');
  const [actionsFor, setActionsFor] = useState(null);
  const [planModalFor, setPlanModalFor] = useState(null);
  const [resetResult, setResetResult] = useState(null); // { user, temporaryPassword }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const actionsRef = useRef(null);

  const reload = () => getUsers().then((u) => setUsers([...u]));
  useEffect(() => { reload(); }, []);

  // fecha o menu de acções ao clicar fora
  useEffect(() => {
    const h = (e) => { if (actionsRef.current && !actionsRef.current.contains(e.target)) setActionsFor(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const count = (r) => users.filter((u) => r === 'all' || u.role === r).length;
  const list = users.filter(
    (u) =>
      (role === 'all' || u.role === role) &&
      (q === '' || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))
  );

  const toggleActive = async (u) => {
    setActionsFor(null);
    setError('');
    try {
      await updateUser(u.id, { active: !u.active });
      setUsers((all) => all.map((x) => (x.id === u.id ? { ...x, active: !u.active } : x)));
    } catch (err) {
      setError(err.message);
    }
  };

  const changePlan = async (u, plan) => {
    setBusy(true);
    setError('');
    try {
      await updateUser(u.id, { plan });
      setUsers((all) => all.map((x) => (x.id === u.id ? { ...x, plan } : x)));
      setPlanModalFor(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (u) => {
    setActionsFor(null);
    setError('');
    try {
      const res = await updateUser(u.id, { resetPassword: true });
      setResetResult({ user: u, temporaryPassword: res.temporaryPassword });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <AdminTopbar />
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>
            Utilizadores <span className="mut" style={{ fontSize: 16, fontWeight: 500 }}>{users.length}</span>
          </h1>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input className="input" placeholder="🔍 Pesquisar por nome ou email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300, maxWidth: '100%', flex: '1 1 200px', padding: '11px 16px' }} />
            <Link to="/admin/professores/novo" className="btn" style={{ textDecoration: 'none' }}>+ Registar professor</Link>
          </div>
        </div>

        {error && (
          <div className="sm" style={{ background: 'var(--red-l, #fdecec)', color: 'var(--red, #c0392b)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[['all', 'Todos'], ['student', 'Estudantes'], ['professor', 'Professores'], ['admin', 'Admins']].map(([id, label]) => (
            <button key={id} className={`btn sm ${role === id ? 'dark' : 'ghost'}`} onClick={() => setRole(id)}>
              {label} ({count(id)})
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: '8px 28px' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Utilizador</th><th>Perfil</th><th>Plano</th><th>Estado</th><th>Acções</th></tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, background: u.color }}>{u.initials}</div>
                        <div><b>{u.name}</b><div className="xs mut">{u.email}</div></div>
                      </div>
                    </td>
                    <td><RolePill role={u.role} /></td>
                    <td><PlanPill plan={u.plan} /></td>
                    <td>
                      <span className="badge" style={u.active ? { background: 'var(--green-l)', color: 'var(--green)' } : { background: 'var(--amber-l)', color: '#B45309' }}>
                        {u.active ? 'Activo' : 'Suspenso'}
                      </span>
                    </td>
                    <td style={{ position: 'relative' }}>
                      <button className="btn sm ghost" onClick={() => setActionsFor(actionsFor === u.id ? null : u.id)}>⋯ Acções</button>
                      {actionsFor === u.id && (
                        <div ref={actionsRef} style={{ position: 'absolute', right: 16, top: 52, background: '#fff', borderRadius: 12, boxShadow: 'var(--sh)', border: '1px solid var(--brd)', minWidth: 210, padding: 6, zIndex: 30 }}>
                          <button className="sm" style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '9px 12px', borderRadius: 8 }} onClick={() => toggleActive(u)}>
                            {u.active ? '⏸ Suspender conta' : '✅ Activar conta'}
                          </button>
                          {u.role === 'student' && (
                            <button className="sm" style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '9px 12px', borderRadius: 8 }} onClick={() => { setPlanModalFor(u); setActionsFor(null); }}>
                              💳 Alterar plano
                            </button>
                          )}
                          <button className="sm" style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '9px 12px', borderRadius: 8 }} onClick={() => resetPassword(u)}>
                            🔑 Redefinir senha
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mut sm" style={{ marginTop: 16 }}>A mostrar {list.length} de {users.length} utilizadores</div>
      </div>

      {/* Modal: alterar plano */}
      {planModalFor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,31,.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setPlanModalFor(null)}>
          <div className="card" style={{ maxWidth: 420, width: '100%', padding: 32 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Alterar plano</h2>
            <p className="mut sm" style={{ marginBottom: 20 }}>
              <b style={{ color: 'var(--dark)' }}>{planModalFor.name}</b> — plano actual: <PlanPill plan={planModalFor.plan} />
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PLANOS.map(([id, label]) => (
                <button
                  key={id}
                  className={`btn sm ${planModalFor.plan === id ? 'dark' : 'ghost'}`}
                  disabled={busy || planModalFor.plan === id}
                  onClick={() => changePlan(planModalFor, id)}
                  style={{ justifyContent: 'flex-start' }}
                >
                  {planModalFor.plan === id ? '✓ ' : ''}{label}
                </button>
              ))}
            </div>
            <button className="btn ghost sm" style={{ width: '100%', marginTop: 16 }} onClick={() => setPlanModalFor(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal: senha redefinida */}
      {resetResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,31,.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setResetResult(null)}>
          <div className="card" style={{ maxWidth: 440, width: '100%', padding: 32 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Senha redefinida</h2>
            <p className="mut sm" style={{ marginBottom: 16 }}>
              Nova senha temporária para <b style={{ color: 'var(--dark)' }}>{resetResult.user.name}</b>. Vai ser pedida a troca no próximo login.
            </p>
            <div style={{ background: '#F4F4F6', borderRadius: 10, padding: '14px 16px', fontWeight: 700, letterSpacing: '.05em', fontSize: 18, textAlign: 'center', marginBottom: 16 }}>
              {resetResult.temporaryPassword}
            </div>
            <p className="xs mut" style={{ marginBottom: 16 }}>Partilha esta senha com o utilizador por um canal seguro. Ela não volta a ser mostrada.</p>
            <button className="btn sm" style={{ width: '100%' }} onClick={() => setResetResult(null)}>Fechar</button>
          </div>
        </div>
      )}
    </>
  );
}
