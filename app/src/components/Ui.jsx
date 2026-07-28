// Componentes base do design system MUKANDA PREPA
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { currentUser, logout } from '../services/api.js';
import { PLAN_LABEL } from '../data/mock.js';

// Logotipo oficial MUKANDA PREPA (ícone). Versão branca sobre fundos
// escuros/laranja (light), laranja sobre fundos claros (por defeito).
export function Logo({ size = 40, light = false }) {
  return (
    <img
      src={light ? '/logo-icon-branco.png' : '/logo-icon.png'}
      alt="MUKANDA PREPA"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
}

export function Brand({ light = false, size = 40 }) {
  return (
    <Link to="/" className="brand">
      <Logo size={size} light={light} />
      <span className="name" style={light ? { color: '#fff' } : undefined}>
        MUKANDA<br />PREPA
      </span>
    </Link>
  );
}

/* Placeholder de imagem (questões, fotos) — TODO: substituir por <img> real */
export function ImagePh({ height = 260, label = 'Imagem da questão carregada pelo professor' }) {
  return (
    <div className="ph" style={{ height }}>
      <div style={{ fontSize: 40 }}>🖼</div>
      <div className="sm">{label}</div>
    </div>
  );
}

export function Badge({ status }) {
  const map = {
    active: ['act', '● Activa'],
    soon: ['soon', 'Em breve'],
    closed: ['end', 'Encerrada'],
    draft: ['end', 'Rascunho'],
    validated: ['act', 'Validada'],
    pending: ['soon', '⏳ Em validação'],
  };
  const [cls, label] = map[status] ?? ['end', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function Stat({ value, label, color, style }) {
  return (
    <div className="stat" style={style}>
      <div className="v" style={color ? { color } : undefined}>{value}</div>
      <div className="l">{label}</div>
    </div>
  );
}

/* Indicador de tentativas: verde = usada · laranja = actual/disponível · cinza = bloqueada */
export function AttemptDots({ used, max }) {
  const total = max === Infinity ? Math.max(used + 1, 3) : max;
  return (
    <div className="qmap">
      {Array.from({ length: total }, (_, i) => {
        const cls = i < used ? 'done' : i === used ? 'cur' : '';
        const label = i < used ? '✓' : i + 1;
        return <div key={i} className={`qdot ${cls}`}>{label}</div>;
      })}
      {max === Infinity && <div className="qdot" style={{ border: 'none' }}>∞</div>}
    </div>
  );
}

// Navegação partilhada pelas três topbars (estudante, professor, admin).
//
// Em ecrãs largos é a barra de links de sempre. Abaixo de 900px o CSS
// transforma-a num painel por baixo da topbar, aberto pelo botão de
// hambúrguer. Antes destes ecrãs a navegação era simplesmente escondida:
// quem entrasse pelo telemóvel ficava sem forma de mudar de página.
export function TopbarNav({ items, activo }) {
  const [aberto, setAberto] = useState(false);
  const { pathname } = useLocation();

  // Mudar de página fecha o menu — senão ficava aberto por cima do conteúdo.
  useEffect(() => { setAberto(false); }, [pathname]);

  // Escape fecha, para quem navega por teclado.
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  return (
    <>
      <button
        className="nav-toggle"
        aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={aberto}
        onClick={() => setAberto((a) => !a)}
      >
        {aberto ? '✕' : '☰'}
      </button>
      <nav className={`nav${aberto ? ' open' : ''}`}>
        {items.map(([label, to]) => (
          <Link key={to} to={to} className={activo(to, pathname) ? 'on' : ''}>{label}</Link>
        ))}
      </nav>
    </>
  );
}

export function Topbar() {
  const user = currentUser();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);

  // fecha o menu ao clicar fora
  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const items = [
    ['Dashboard', '/'],
    ['Maratonas', '/maratonas'],
    ['Resultados', '/resultados'],
  ];
  return (
    <header className="topbar">
      <Brand />
      <TopbarNav items={items} activo={(to, actual) => actual === to} />
      {/* Sem seta de menu: já não abre um dropdown, leva à página de planos. */}
      <button
        className="plan-chip"
        style={{ border: 'none', cursor: 'pointer' }}
        title="Ver planos e fazer upgrade"
        onClick={() => navigate('/planos')}
      >
        Plano {PLAN_LABEL[user?.plan] ?? '—'}
      </button>
      <div ref={menuRef} style={{ position: 'relative' }}>
        <div
          className="avatar"
          title={user?.name ?? ''}
          style={{ cursor: 'pointer' }}
          onClick={() => setMenu((m) => !m)}
        >
          {(user?.name ?? 'U').split(' ').map((p) => p[0]).slice(0, 2).join('')}
        </div>
        {menu && (
          <div className="menu-conta" style={{ position: 'absolute', top: 52, right: 0, background: '#fff', borderRadius: 14, boxShadow: 'var(--sh)', border: '1px solid var(--brd)', minWidth: 230, padding: 8, zIndex: 60 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--brd)', marginBottom: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
              <div className="xs mut" style={{ wordBreak: 'break-word' }}>{user?.email}</div>
            </div>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', padding: '10px 14px', borderRadius: 10, fontSize: 14, fontWeight: 500, textAlign: 'left' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              onClick={() => { setMenu(false); navigate('/perfil'); }}
            >
              👤 Ver perfil
            </button>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', padding: '10px 14px', borderRadius: 10, fontSize: 14, fontWeight: 500, textAlign: 'left', color: 'var(--red)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-l)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
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

export function fmtTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  return `${String(m).padStart(2, '0')}:${sec}`;
}

export function Timer({ seconds }) {
  return (
    <div className={`timer ${seconds < 300 ? 'low' : ''}`}>
      <span className="dot" />
      {fmtTime(seconds)}
    </div>
  );
}


// Texto de mensagem de chat: preserva as quebras de linha e transforma
// endereços http(s) em links clicáveis. Sem isto, a mensagem com os dados
// de pagamento (multilinha, com o link de WhatsApp) chegava ao aluno como
// um bloco colado e o link não era clicável — ou seja, inútil.
export function TextoComLinks({ children }) {
  const texto = String(children ?? '');
  const partes = texto.split(/(https?:\/\/[^\s]+)/g);
  return (
    <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {partes.map((parte, i) =>
        /^https?:\/\//.test(parte) ? (
          <a
            key={i}
            href={parte}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 600 }}
          >
            {parte}
          </a>
        ) : (
          parte
        )
      )}
    </span>
  );
}
