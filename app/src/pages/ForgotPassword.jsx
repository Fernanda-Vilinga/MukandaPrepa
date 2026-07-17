// Recuperação de senha — página estática por agora.
// TODO backend: envio real do email com link/código de recuperação,
// expiração do token e página de definição de nova senha.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLeft } from './Login.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    // Mock: o backend enviará o email de recuperação
    await new Promise((r) => setTimeout(r, 500));
    setBusy(false);
    setSent(true);
  };

  return (
    <div className="auth">
      <AuthLeft />
      <div className="auth-right">
        <form className="card" style={{ width: 460, padding: 44 }} onSubmit={submit}>
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
