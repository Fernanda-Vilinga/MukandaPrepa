// Gestão de utilizadores — filtros, acções (activar, suspender, plano, senha).
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, updateUser } from '../../services/adminApi.js';
import { AdminTopbar, RolePill, PlanPill } from '../../components/AdminUi.jsx';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('all');
  const [q, setQ] = useState('');
  const [actionsFor, setActionsFor] = useState(null);
  const actionsRef = useRef(null);

  useEffect(() => { getUsers().then((u) => setUsers([...u])); }, []);

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
    await updateUser(u.id, { active: !u.active });
    setUsers((all) => all.map((x) => (x.id === u.id ? { ...x, active: !u.active } : x)));
    setActionsFor(null);
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
            <input className="input" placeholder="🔍 Pesquisar por nome ou email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300, padding: '11px 16px' }} />
            <Link to="/admin/professores/novo" className="btn" style={{ textDecoration: 'none' }}>+ Registar professor</Link>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[['all', 'Todos'], ['student', 'Estudantes'], ['professor', 'Professores'], ['admin', 'Admins']].map(([id, label]) => (
            <button key={id} className={`btn sm ${role === id ? 'dark' : 'ghost'}`} onClick={() => setRole(id)}>
              {label} ({count(id)})
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: '8px 28px' }}>
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
                          <button className="sm" style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '9px 12px', borderRadius: 8 }} onClick={() => setActionsFor(null)}>
                            💳 Alterar plano
                          </button>
                        )}
                        <button className="sm" style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '9px 12px', borderRadius: 8 }} onClick={() => setActionsFor(null)}>
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
        <div className="mut sm" style={{ marginTop: 16 }}>A mostrar {list.length} de {users.length} utilizadores</div>
      </div>
    </>
  );
}
