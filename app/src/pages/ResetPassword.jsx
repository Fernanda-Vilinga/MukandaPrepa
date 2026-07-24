// Definir nova senha a partir do link recebido por email
// (?token=... — ver ForgotPassword.jsx / authController.esqueciSenha).
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLeft } from './Login.jsx';
import { resetPassword } from '../services/api.js';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ next: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!token) {
    return (
      <div className="auth">
        <AuthLeft />
        <div className="auth-right">
          <div className="card" style={{ width: 460, padding: 44, textAlign: 'center' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Link inválido</h2>
            <p className="mut sm" style={{ marginBottom: 20 }}>
              Este link de recuperação está incompleto ou já não é válido.
            </p>
            <Link to="/recuperar-senha" className="btn sm">Pedir novo link</Link>
          </div>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.next.length < 8) return setError('A nova senha deve ter pelo menos 8 caracteres.');
    if (form.next !== form.confirm) return setError('As senhas não coincidem.');
    setBusy(true);
    try {
      await resetPassword(token, form.next);
      setDone(true);
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
        <div className="card" style={{ width: 460, padding: 44 }}>
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>✓</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Senha redefinida</h2>
              <p className="mut sm" style={{ marginBottom: 24 }}>Já podes entrar com a tua nova senha.</p>
              <button className="btn" style={{ width: '100%' }} onClick={() => navigate('/login', { replace: true })}>Ir para o login</button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>Define a tua nova senha</h2>
              <p className="mut sm" style={{ margin: '6px 0 28px' }}>
                Escolhe uma senha nova para a tua conta.
              </p>
              <div className="field">
                <label className="label" htmlFor="next">Nova senha</label>
                <input id="next" className="input" type="password" required autoFocus
                  value={form.next} onChange={set('next')} placeholder="Mín. 8 caracteres" />
              </div>
              <div className="field">
                <label className="label" htmlFor="confirm">Confirmar nova senha</label>
                <input id="confirm" className="input" type="password" required
                  value={form.confirm} onChange={set('confirm')} placeholder="Repete a nova senha" />
              </div>
              {error && (
                <div className="sm" style={{ background: 'var(--red-l, #fdecec)', color: 'var(--red, #c0392b)', borderRadius: 10, padding: '12px 16px', margin: '4px 0 12px' }}>
                  {error}
                </div>
              )}
              <button className="btn" style={{ width: '100%', marginTop: 6 }} disabled={busy || !form.next || !form.confirm}>
                {busy ? 'A guardar…' : 'Guardar nova senha'}
              </button>
            </form>
          )}
          <div style={{ textAlign: 'center', marginTop: 24, borderTop: '1px solid var(--brd)', paddingTop: 18 }} className="sm mut">
            <Link to="/login" style={{ color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}>← Voltar ao login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
