import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/api.js';
import { Brand } from '../components/Ui.jsx';

export function AuthLeft() {
  return (
    <div className="auth-left">
      <Brand light size={48} />
      <div>
        <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.15 }}>
          A tua preparação<br />começa aqui.
        </h1>
        <p style={{ marginTop: 16, fontSize: 16, opacity: .9, maxWidth: 380 }}>
          Maratonas cronometradas, correcção pelos professores e resultados directamente no teu dashboard.
        </p>
      </div>
      <div style={{ fontSize: 13, opacity: .75 }}>app.mukandaprepa.ao · Luanda, Angola</div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : user.role === 'professor' ? '/prof' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <AuthLeft />
      <div className="auth-right">
        <form className="card" style={{ width: 460, padding: 44 }} onSubmit={submit}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Entrar</h2>
          <p className="mut sm" style={{ margin: '6px 0 28px' }}>
            Acede à tua conta de estudante para veres as maratonas disponíveis.
          </p>
          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="oteu@email.com" />
          </div>
          <div className="field">
            <label className="label" htmlFor="pass">Password</label>
            <input id="pass" className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <Link to="/recuperar-senha" className="sm" style={{ color: 'var(--blue)', fontWeight: 500, textDecoration: 'none' }}>Esqueceste a password?</Link>
          </div>
          {error && <div className="sm" style={{ background: 'var(--red-l)', color: 'var(--red)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>{error}</div>}
          <button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'A entrar…' : 'Entrar'}</button>
          <div style={{ textAlign: 'center', marginTop: 22 }} className="sm mut">
            Ainda não tens conta?{' '}
            <Link to="/registo" style={{ color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}>Regista-te como estudante</Link>
          </div>
          <div className="xs" style={{ marginTop: 24, background: 'var(--blue-l)', borderRadius: 12, padding: '12px 16px' }}>
            ℹ️ O registo é exclusivo para estudantes. Professores são registados pela administração.
          </div>
        </form>
      </div>
    </div>
  );
}
