// Componentes partilhados do perfil PROFESSOR
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { currentUser, logout } from '../services/api.js';
import { Brand } from './Ui.jsx';

export function ProfTopbar() {
  const user = currentUser();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const items = [
    ['Dashboard', '/prof'],
    ['Maratonas', '/prof/maratonas'],
    ['Validação', '/prof/validacao'],
    ['Monitorização', '/prof/monitorizacao'],
    ['Chats', '/prof/chats'],
  ];

  return (
    <header className="topbar">
      <Brand />
      <nav className="nav">
        {items.map(([label, to]) => (
          <Link key={to} to={to} className={pathname === to || (to !== '/prof' && pathname.startsWith(to)) ? 'on' : ''}>
            {label}
          </Link>
        ))}
      </nav>
      <span className="plan-chip" style={{ background: 'var(--orange-l)', color: 'var(--orange-d)' }}>👨‍🏫 Professor</span>
      <div ref={menuRef} style={{ position: 'relative' }}>
        <div className="avatar" style={{ background: 'var(--blue)', cursor: 'pointer' }} onClick={() => setMenu((m) => !m)}>
          {(user?.name ?? 'P').split(' ').map((p) => p[0]).slice(0, 2).join('')}
        </div>
        {menu && (
          <div style={{ position: 'absolute', top: 52, right: 0, background: '#fff', borderRadius: 14, boxShadow: 'var(--sh)', border: '1px solid var(--brd)', minWidth: 230, padding: 8, zIndex: 60 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--brd)', marginBottom: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Prof. {user?.name}</div>
              <div className="xs mut">{user?.email}</div>
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

export function Pill({ kind, children }) {
  const styles = {
    mcq: { background: 'var(--blue-l)', color: 'var(--blue)' },
    txt: { background: 'var(--amber-l)', color: '#B45309' },
    foto: { background: 'var(--green-l)', color: 'var(--green)' },
    gray: { background: '#EEEEF0', color: 'var(--mut)' },
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 999, ...(styles[kind] ?? styles.gray) }}>
      {children}
    </span>
  );
}

export function Steps({ current }) {
  const labels = ['Dados da maratona', 'Banco de questões', 'Pré-visualizar', 'Publicar'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32, flexWrap: 'wrap' }}>
      {labels.map((l, i) => {
        const n = i + 1;
        const state = n < current ? 'ok' : n === current ? 'on' : '';
        return (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {i > 0 && <div style={{ width: 48, height: 2, background: 'var(--brd)' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 600, color: state ? 'var(--dark)' : 'var(--mut)' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Montserrat', fontSize: 13,
                background: state === 'ok' ? 'var(--green)' : state === 'on' ? 'var(--orange)' : '#EEEEF0',
                color: state ? '#fff' : 'var(--mut)',
              }}>
                {state === 'ok' ? '✓' : n}
              </div>
              {l}
            </div>
          </div>
        );
      })}
    </div>
  );
}
