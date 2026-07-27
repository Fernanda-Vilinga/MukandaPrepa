// Recuperação de senha — pede o email e chama o backend real
// (POST /api/auth/esqueci-senha). A resposta é sempre a mesma, exista ou
// não a conta — por isso não há forma de saber pelo ecrã se um email está
// registado; o link de recuperação segue no email (ResetPassword.jsx).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLeft } from './Login.jsx';
import { forgotPassword } from '../services/api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await forgotPassword(email);
      setSent(true);
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
        <form className="card auth-card" onSubmit={submit}>
          {!sent ? (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>Recuperar senha</h2>
              <p className="mut sm" style={{ margin: '6px 0 28px' }}>
                Indica o email da tua conta. Vamos enviar-te um link seguro para definires uma nova senha.
              </p>
              <div className="field">
                <label className="label" htmlFor="email">Email da conta</label>
                <input
                  id="email" className="input" type="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="oteu@email.com"
                />
              </div>
              {error && (
                <div className="sm" style={{ background: 'var(--red-l, #fdecec)', color: 'var(--red, #c0392b)', borderRadius: 10, padding: '12px 16px', margin: '4px 0 12px' }}>
                  {error}
                </div>
              )}
              <button className="btn" style={{ width: '100%', marginTop: 6 }} disabled={busy || !email}>
                {busy ? 'A enviar…' : 'Enviar link de recuperação'}
              </button>
              <div className="xs mut" style={{ marginTop: 16, textAlign: 'center' }}>
                O link é válido por tempo limitado. Verifica também a pasta de spam.
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>📧</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Verifica o teu email</h2>
              <p className="mut sm" style={{ maxWidth: 340, margin: '0 auto 24px' }}>
                Se existir uma conta associada a <b style={{ color: 'var(--dark)' }}>{email}</b>, vais receber
                um email com as instruções para definires uma nova senha.
              </p>
              <button type="button" className="btn ghost sm" onClick={() => setSent(false)}>Enviar novamente</button>
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 24, borderTop: '1px solid var(--brd)', paddingTop: 18 }} className="sm mut">
            <Link to="/login" style={{ color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}>← Voltar ao login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
