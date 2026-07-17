// Gestão de planos — tentativas editáveis, activação, códigos promocionais.
import { useEffect, useState } from 'react';
import { getPlansConfig, savePlansConfig } from '../../services/adminApi.js';
import { AdminTopbar } from '../../components/AdminUi.jsx';

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [promos, setPromos] = useState([]);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [backup, setBackup] = useState([]);

  useEffect(() => {
    getPlansConfig().then(({ plans, promos }) => { setPlans(plans.map((p) => ({ ...p }))); setPromos(promos); });
  }, []);

  const startEdit = () => {
    setBackup(plans.map((p) => ({ ...p })));
    setEditing(true);
    setSaved(false);
  };

  const cancel = () => {
    setPlans(backup.map((p) => ({ ...p })));
    setEditing(false);
  };

  const update = (id, patch) => setPlans((all) => all.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const save = async () => {
    setBusy(true);
    await savePlansConfig(plans);
    setBusy(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <AdminTopbar />
      <div className="wrap" style={{ maxWidth: 1160 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>Gestão de planos</h1>
            <div className="mut sm">Os limites de tentativas aplicam-se a todas as maratonas da plataforma.</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn ghost">🎟 Códigos promocionais</button>
            {!editing && <button className="btn" onClick={startEdit}>✏️ Modificar</button>}
          </div>
        </div>

        <div className="row" style={{ marginBottom: 28, alignItems: 'stretch' }}>
          {plans.map((p) => (
            <div key={p.id} className="col card" style={{ border: p.popular ? `2px solid ${p.accent}` : '1.5px solid var(--brd)', position: 'relative', padding: 32, display: 'flex', flexDirection: 'column' }}>
              {p.popular && <span className="badge" style={{ position: 'absolute', top: -12, left: 32, background: p.accent, color: '#fff' }}>Mais popular</span>}
              <div className="mont" style={{ fontWeight: 800, fontSize: 20 }}>{p.name}</div>
              {/* TODO: preços provisórios — confirmar com equipa comercial */}
              <input
                className="input mont"
                style={{ fontWeight: 800, fontSize: 22, color: p.accent, margin: '10px 0 16px', padding: '8px 12px' }}
                value={p.price}
                onChange={(e) => update(p.id, { price: e.target.value })}
                disabled={!editing}
              />
              <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 14, marginBottom: 18 }}>
                <div className="xs mut">TENTATIVAS POR MARATONA</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <input
                    className="input"
                    style={{ width: 90, padding: '8px 12px', fontWeight: 700, textAlign: 'center' }}
                    value={p.attempts}
                    onChange={(e) => update(p.id, { attempts: e.target.value })}
                    disabled={!editing}
                  />
                  {editing && <span className="xs mut">editável</span>}
                </div>
              </div>
              <div className="sm" style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, marginBottom: 20 }}>
                {p.features.map((f) => <div key={f}>✓ {f}</div>)}
                {p.missing.map((f) => <div key={f} className="mut">✗ {f}</div>)}
              </div>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <span className="sm mut">Activo</span>
                <button
                  type="button"
                  disabled={!editing}
                  onClick={() => editing && update(p.id, { active: !p.active })}
                  style={{ width: 44, height: 24, borderRadius: 99, border: 'none', position: 'relative', background: p.active ? 'var(--green)' : '#D8D8DE', cursor: editing ? 'pointer' : 'default', opacity: editing ? 1 : .6 }}
                >
                  <span style={{ position: 'absolute', top: 3, left: p.active ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
                </button>
              </label>
            </div>
          ))}
        </div>

        {promos.map((c) => (
          <div key={c.code} className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <b>🎟 Código promocional activo:</b>{' '}
              <span style={{ display: 'inline-flex', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'var(--orange-l)', color: 'var(--orange-d)' }}>{c.code}</span>
              <span className="sm mut"> — {c.desc} · expira {c.expires} · usado {c.used} vezes</span>
            </div>
            <button className="btn sm ghost">Editar</button>
            <button className="btn sm">+ Novo código</button>
          </div>
        ))}

        {saved && <div className="sm" style={{ background: 'var(--green-l)', color: 'var(--green)', borderRadius: 10, padding: '12px 16px', marginTop: 20 }}>✓ Alterações guardadas. Os novos limites aplicam-se de imediato.</div>}

        {editing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 28 }}>
            <button className="btn ghost" onClick={cancel}>Cancelar alterações</button>
            <button className="btn" onClick={save} disabled={busy}>{busy ? 'A guardar…' : 'Guardar alterações'}</button>
          </div>
        )}
      </div>
    </>
  );
}
