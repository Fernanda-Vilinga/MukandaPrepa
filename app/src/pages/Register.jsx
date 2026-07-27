import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api.js';
import { AuthLeft } from './Login.jsx';
import { AREAS } from '../data/mock.js';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', area: '', password: '', confirm: '', terms: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // O botão só fica disponível com todos os campos preenchidos + termos aceites
  const complete =
    form.name.trim() !== '' &&
    form.email.trim() !== '' &&
    form.phone.trim() !== '' &&
    form.area !== '' &&
    form.password !== '' &&
    form.confirm !== '' &&
    form.terms;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('A password deve ter pelo menos 8 caracteres.');
    if (form.password !== form.confirm) return setError('As passwords não coincidem.');
    setBusy(true);
    try {
      await register(form);
      navigate('/');
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
        <form className="card auth-card wide" onSubmit={submit}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Criar conta de estudante</h2>
          <p className="mut sm" style={{ margin: '6px 0 20px' }}>Rápido e simples — só precisas destes dados.</p>

          <div className="sm" style={{ background: 'var(--green-l)', color: 'var(--green)', borderRadius: 12, padding: '12px 16px', marginBottom: 24, fontWeight: 500 }}>
            ✓ A criação de conta é 100% gratuita. Entras no plano Basic e, já dentro da app, podes actualizar o plano quando quiseres.
          </div>

          <div className="field">
            <label className="label" htmlFor="name">Nome completo</label>
            <input id="name" className="input" required value={form.name} onChange={set('name')} placeholder="O teu nome completo" />
          </div>
          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="input" type="email" required value={form.email} onChange={set('email')} placeholder="oteu@email.com" />
          </div>
          <div className="field">
            <label className="label" htmlFor="phone">Contacto</label>
            <input
              id="phone"
              className="input"
              required
              value={form.phone}
              onChange={set('phone')}
              placeholder="9XX XXX XXX"
              inputMode="numeric"
              pattern="^\s*9\d{2}\s*\d{3}\s*\d{3}\s*$"
              title="Nove dígitos começados por 9 — ex.: 923 456 789"
            />
            <div className="xs mut" style={{ marginTop: 4 }}>Nove dígitos começados por 9 — ex.: 923 456 789</div>
          </div>
          <div className="field">
            <label className="label" htmlFor="area">Área de conhecimento</label>
            <select id="area" className="input" required value={form.area} onChange={set('area')} style={{ appearance: 'auto' }}>
              <option value="" disabled>Escolhe a tua área…</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="row" style={{ gap: 16 }}>
            <div className="col field">
              <label className="label" htmlFor="pass">Senha</label>
              <input id="pass" className="input" type="password" required value={form.password} onChange={set('password')} placeholder="Mín. 8 caracteres" />
            </div>
            <div className="col field">
              <label className="label" htmlFor="confirm">Confirmar senha</label>
              <input id="confirm" className="input" type="password" required value={form.confirm} onChange={set('confirm')} placeholder="Repete a senha" />
            </div>
          </div>

          <label className="sm" style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '4px 0 22px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.terms} onChange={(e) => setForm((f) => ({ ...f, terms: e.target.checked }))} />
            <span>
              Li e aceito os{' '}
              <Link to="/termos" target="_blank" style={{ color: 'var(--blue)' }}>termos e condições</Link>{' '}
              e a política de privacidade.
            </span>
          </label>

          {error && <div className="sm" style={{ background: 'var(--red-l)', color: 'var(--red)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>{error}</div>}

          <button className="btn" style={{ width: '100%' }} disabled={!complete || busy}>
            {busy ? 'A criar conta…' : 'Criar conta gratuita'}
          </button>
          {!complete && (
            <div className="xs mut" style={{ textAlign: 'center', marginTop: 10 }}>
              Preenche todos os campos e aceita os termos para activar o botão.
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 20 }} className="sm mut">
            Já tens conta? <Link to="/login" style={{ color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}>Entrar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
