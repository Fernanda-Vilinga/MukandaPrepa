// Troca obrigatória de senha — 1º login do professor com senha temporária.
// Também acessível a qualquer utilizador autenticado que precise de trocar a senha.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLeft } from './Login.jsx';
import { currentUser, changePassword, logout } from '../services/api.js';

const homeFor = (role) => (role === 'admin' ? '/admin' : role === 'professor' ? '/prof' : '/');

export default function ChangePassword() {
  const navigate = useNavigate();
  const user = currentUser();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const complete = form.current && form.next && form.confirm;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.next.length < 8) return setError('A nova senha deve ter pelo menos 8 caracteres.');
    if (form.next !== form.confirm) return setError('As senhas não coincidem.');
    if (form.next === form.current) return setError('A nova senha deve ser diferente da actual.');
    setBusy(true);
    try {
      await changePassword(form.current, form.next);
      navigate(homeFor(user.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const exit = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="auth">
      <AuthLeft />
      <div className="auth-right">
        <form className="card" style={{ width: 460, padding: 44 }} onSubmit={submit}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Define a tua nova senha</h2>
          <p className="mut sm" style={{ margin: '6px 0 28px' }}>
            Olá, <b style={{ color: 'var(--dark)' }}>{user.name?.split(' ')[0]}</b>. Por segurança,
            tens de substituir a senha temporária antes de continuar.
          </p>
          <div className="field">
            <label className="label" htmlFor="current">Senha temporária (actual)</label>
            <input id="current" className="input" type="password" required autoFocus
              value={form.current} onChange={set('current')} placeholder="A senha que recebeste" />
          </div>
          <div className="field">
            <label className="label" htmlFor="next">Nova senha</label>
            <input id="next" className="input" type="password" required
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
          <button className="btn" style={{ width: '100%', marginTop: 6 }} disabled={busy || !complete}>
            {busy ? 'A guardar…' : 'Guardar nova senha e entrar'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 24, borderTop: '1px solid var(--brd)', paddingTop: 18 }} className="sm mut">
            <button type="button" onClick={exit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--orange)', fontWeight: 600, fontSize: 'inherit' }}>
              Sair e entrar mais tarde
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
