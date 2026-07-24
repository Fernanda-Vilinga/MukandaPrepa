// Perfil do estudante: ver/modificar dados + actualizar plano.
import { useState } from 'react';
import { currentUser, updateProfile } from '../services/api.js';
import { Topbar } from '../components/Ui.jsx';
import { ChatFab } from '../components/Chat.jsx';
import { openPlans } from '../components/PlanModal.jsx';
import { AREAS, PLAN_LABEL, PLAN_ATTEMPTS } from '../data/mock.js';

export default function Profile() {
  const [user, setUser] = useState(() => currentUser());
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name ?? '', area: user?.area ?? '', phone: user?.phone ?? '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const maxAtt = PLAN_ATTEMPTS[user?.plan ?? 'basic'];

  const save = async () => {
    setError('');
    setSaved(false);
    if (form.password && form.password.length < 8) return setError('A nova senha deve ter pelo menos 8 caracteres.');
    if (form.password !== form.confirm) return setError('As senhas não coincidem.');
    setBusy(true);
    const data = { name: form.name, area: form.area, phone: form.phone };
    // A senha só é enviada se foi alterada (backend: endpoint próprio)
    const next = await updateProfile(data);
    setUser(next);
    setBusy(false);
    setEditing(false);
    setSaved(true);
    setForm((f) => ({ ...f, password: '', confirm: '' }));
  };

  const cancel = () => {
    setEditing(false);
    setError('');
    setForm({ name: user?.name ?? '', area: user?.area ?? '', phone: user?.phone ?? '', password: '', confirm: '' });
  };

  return (
    <>
      <Topbar />
      <div className="wrap" style={{ maxWidth: 760 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>O meu perfil</h1>

        <div className="card" style={{ padding: 36, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28 }}>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 22 }}>
              {(user?.name ?? 'U').split(' ').map((p) => p[0]).slice(0, 2).join('')}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.name}</div>
              <div className="mut sm">{user?.email} · conta de estudante</div>
            </div>
            {!editing && <button className="btn sm ghost" onClick={() => { setEditing(true); setSaved(false); }}>✏️ Modificar</button>}
          </div>

          <div className="field">
            <label className="label">Nome completo</label>
            <input className="input" value={form.name} onChange={set('name')} disabled={!editing} />
          </div>
          <div className="row" style={{ gap: 16 }}>
            <div className="col field">
              <label className="label">Email</label>
              <input className="input" value={user?.email ?? ''} disabled title="O email não pode ser alterado" />
            </div>
            <div className="col field">
              <label className="label">Contacto</label>
              <input className="input" value={form.phone} onChange={set('phone')} disabled={!editing} />
            </div>
          </div>
          <div className="field">
            <label className="label">Área de conhecimento</label>
            <select className="input" style={{ appearance: 'auto' }} value={form.area} onChange={set('area')} disabled={!editing}>
              <option value="" disabled>Escolhe a tua área…</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {editing && (
            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 20, margin: '6px 0 4px' }}>
              <div className="sm" style={{ fontWeight: 600, marginBottom: 12 }}>🔑 Alterar senha <span className="mut" style={{ fontWeight: 400 }}>(opcional)</span></div>
              <div className="row" style={{ gap: 16 }}>
                <div className="col field" style={{ marginBottom: 0 }}>
                  <label className="label">Nova senha</label>
                  <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="Mín. 8 caracteres" />
                </div>
                <div className="col field" style={{ marginBottom: 0 }}>
                  <label className="label">Confirmar nova senha</label>
                  <input className="input" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repete a senha" />
                </div>
              </div>
            </div>
          )}

          {error && <div className="sm" style={{ background: 'var(--red-l)', color: 'var(--red)', borderRadius: 10, padding: '10px 14px', marginTop: 16 }}>{error}</div>}
          {saved && <div className="sm" style={{ background: 'var(--green-l)', color: 'var(--green)', borderRadius: 10, padding: '10px 14px', marginTop: 16 }}>✓ Alterações guardadas com sucesso.</div>}

          {editing && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn ghost" onClick={cancel}>Cancelar</button>
              <button className="btn" onClick={save} disabled={busy}>{busy ? 'A guardar…' : 'Guardar alterações'}</button>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 36, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="xs mut" style={{ letterSpacing: '.1em' }}>PLANO ACTUAL</div>
            <div className="mont" style={{ fontWeight: 800, fontSize: 24, color: 'var(--orange)', margin: '4px 0' }}>
              {PLAN_LABEL[user?.plan]}
            </div>
            <div className="mut sm">
              {maxAtt === Infinity ? 'Tentativas ilimitadas por maratona' : `${maxAtt} tentativas por maratona`}
            </div>
          </div>
          <button className="btn blue" onClick={openPlans}>Actualizar plano</button>
        </div>
      </div>
      <ChatFab />
    </>
  );
}
