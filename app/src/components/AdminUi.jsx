// Componentes partilhados do perfil ADMINISTRADOR
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentUser, logout } from '../services/api.js';
import { Brand, TopbarNav } from './Ui.jsx';

export function AdminTopbar() {
  const user = currentUser();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const items = [
    ['Dashboard', '/admin'],
    ['Utilizadores', '/admin/utilizadores'],
    ['Maratonas', '/admin/maratonas'],
    ['Estatísticas', '/admin/estatisticas'],
    ['Planos', '/admin/planos'],
    ['Suporte', '/admin/suporte'],
  ];

  return (
    <header className="topbar">
      <Brand />
      <TopbarNav
        items={items}
        activo={(to, actual) =>
          actual === to || (to !== '/admin' && actual.startsWith(to.split('/').slice(0, 3).join('/')))}
      />
      <span className="plan-chip" style={{ background: 'var(--dark)', color: '#fff' }}>⚙️ Administrador</span>
      <div ref={menuRef} style={{ position: 'relative' }}>
        <div className="avatar" style={{ background: 'var(--dark)', cursor: 'pointer' }} onClick={() => setMenu((m) => !m)}>
          {(user?.name ?? 'A').split(' ').map((p) => p[0]).slice(0, 2).join('')}
        </div>
        {menu && (
          <div className="menu-conta" style={{ position: 'absolute', top: 52, right: 0, background: '#fff', borderRadius: 14, boxShadow: 'var(--sh)', border: '1px solid var(--brd)', minWidth: 230, padding: 8, zIndex: 60 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--brd)', marginBottom: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
              <div className="xs mut" style={{ wordBreak: 'break-word' }}>{user?.email}</div>
            </div>
            <button
              style={{ display: 'flex', gap: 10, width: '100%', background: 'none', border: 'none', padding: '10px 14px', borderRadius: 10, fontSize: 14, fontWeight: 500, textAlign: 'left', color: 'var(--red)' }}
              onClick={() => { logout(); navigate('/login'); }}
            >
              🚪 Desconectar
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export function RolePill({ role }) {
  const map = {
    student: { label: 'Estudante', style: { background: 'var(--green-l)', color: 'var(--green)' } },
    professor: { label: 'Professor', style: { background: 'var(--blue-l)', color: 'var(--blue)' } },
    admin: { label: 'Admin', style: { background: 'var(--dark)', color: '#fff' } },
  };
  const { label, style } = map[role] ?? map.student;
  return <span style={{ display: 'inline-flex', fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 999, ...style }}>{label}</span>;
}

export function PlanPill({ plan }) {
  const map = {
    basic: { label: 'Basic', style: { background: '#EEEEF0', color: 'var(--mut)' } },
    plus: { label: 'Plus', style: { background: 'var(--blue-l)', color: 'var(--blue)' } },
    premium: { label: 'Premium', style: { background: 'var(--orange-l)', color: 'var(--orange-d)' } },
  };
  if (!plan) return <span className="mut">—</span>;
  const { label, style } = map[plan];
  return <span style={{ display: 'inline-flex', fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 999, ...style }}>{label}</span>;
}
