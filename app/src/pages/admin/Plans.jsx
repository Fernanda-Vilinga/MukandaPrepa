// Gestão de planos — preços, tentativas, activação, códigos promocionais
// e dados de pagamento (usados pelo botão "Enviar dados de pagamento" no
// chat Suporte). Tudo guardado em /api/admin/plans.
import { useEffect, useState } from 'react';
import { getPlansConfig, savePlansConfig } from '../../services/adminApi.js';
import { AdminTopbar } from '../../components/AdminUi.jsx';

const ACCENT = { basic: '#64748B', plus: '#1742E7', premium: '#FB6D1D' };
const PAYMENT_VAZIO = { banco: '', iban: '', titular: '', mobileMoneyOperadora: '', mobileMoneyNumero: '', instrucoes: '', whatsapp: '' };

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [promos, setPromos] = useState([]);
  const [payment, setPayment] = useState(PAYMENT_VAZIO);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [backup, setBackup] = useState(null);
  const [newPromo, setNewPromo] = useState({ code: '', desc: '', expires: '' });

  useEffect(() => {
    getPlansConfig().then(({ plans, promos, payment }) => {
      setPlans(plans.map((p) => ({ ...p })));
      setPromos(promos.map((p) => ({ ...p })));
      setPayment({ ...PAYMENT_VAZIO, ...payment });
      setLoaded(true);
    });
  }, []);

  const startEdit = () => {
    setBackup({ plans: plans.map((p) => ({ ...p })), promos: promos.map((p) => ({ ...p })), payment: { ...payment } });
    setEditing(true);
    setSaved(false);
    setError('');
  };

  const cancel = () => {
    if (backup) { setPlans(backup.plans); setPromos(backup.promos); setPayment(backup.payment); }
    setEditing(false);
  };

  const update = (id, patch) => setPlans((all) => all.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const addPromo = () => {
    const code = newPromo.code.trim().toUpperCase();
    if (!code) return;
    setPromos((all) => [...all, { code, desc: newPromo.desc.trim(), expires: newPromo.expires.trim(), active: true }]);
    setNewPromo({ code: '', desc: '', expires: '' });
  };
  const togglePromo = (code) => setPromos((all) => all.map((p) => (p.code === code ? { ...p, active: !p.active } : p)));
  const removePromo = (code) => setPromos((all) => all.filter((p) => p.code !== code));

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await savePlansConfig({ plans, promos, payment });
      setBusy(false);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setBusy(false);
      setError(err.message);
    }
  };

  if (!loaded) {
    return (<><AdminTopbar /><div className="wrap"><div className="sm mut" style={{ padding: 40, textAlign: 'center' }}>A carregar…</div></div></>);
  }

  return (
    <>
      <AdminTopbar />
      <div className="wrap" style={{ maxWidth: 1160 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>Gestão de planos</h1>
            <div className="mut sm">Preços, tentativas e dados de pagamento — aplicam-se de imediato a toda a plataforma.</div>
          </div>
          {!editing && <button className="btn" onClick={startEdit}>✏️ Modificar</button>}
        </div>

        {error && (
          <div className="sm" style={{ background: 'var(--red-l, #fdecec)', color: 'var(--red, #c0392b)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            {error}
          </div>
        )}

        <div className="row" style={{ marginBottom: 28, alignItems: 'stretch' }}>
          {plans.map((p) => {
            const accent = ACCENT[p.id] || 'var(--dark)';
            return (
              <div key={p.id} className="col card" style={{ border: p.popular ? `2px solid ${accent}` : '1.5px solid var(--brd)', position: 'relative', padding: 32, display: 'flex', flexDirection: 'column' }}>
                {p.popular && <span className="badge" style={{ position: 'absolute', top: -12, left: 32, background: accent, color: '#fff' }}>Mais popular</span>}
                <div className="mont" style={{ fontWeight: 800, fontSize: 20 }}>{p.name}</div>

                <div style={{ margin: '10px 0 16px' }}>
                  <div className="xs mut">PREÇO — PAGAMENTO ÚNICO (Kz) — 0 = Grátis</div>
                  <input
                    className="input mont"
                    type="number" min="0" step="100"
                    style={{ fontWeight: 800, fontSize: 20, color: accent, marginTop: 6, padding: '8px 12px', width: '100%' }}
                    value={p.priceKz}
                    onChange={(e) => update(p.id, { priceKz: Number(e.target.value) })}
                    disabled={!editing}
                  />
                  <div className="xs mut" style={{ marginTop: 4 }}>{p.priceKz === 0 ? 'Grátis' : `${Number(p.priceKz).toLocaleString('pt-PT')} Kz (pagamento único)`}</div>
                </div>

                <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 14, marginBottom: 18 }}>
                  <div className="xs mut">TENTATIVAS POR MARATONA (vazio = ilimitadas)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                    <input
                      className="input"
                      type="number" min="1"
                      style={{ width: 90, padding: '8px 12px', fontWeight: 700, textAlign: 'center' }}
                      value={p.attempts ?? ''}
                      placeholder="∞"
                      onChange={(e) => update(p.id, { attempts: e.target.value === '' ? null : Number(e.target.value) })}
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
            );
          })}
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 4 }}>🎟 Códigos promocionais</h3>
          <div className="mut sm" style={{ marginBottom: 16 }}>O aluno insere o código no pedido de upgrade; o desconto é aplicado por ti ao confirmar o pagamento.</div>

          {promos.length === 0 && <div className="sm mut" style={{ marginBottom: 12 }}>Nenhum código criado ainda.</div>}
          {promos.map((c) => (
            <div key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '10px 0', borderBottom: '1px solid #EFEFF2' }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: c.active ? 'var(--orange-l)' : '#EEEEF0', color: c.active ? 'var(--orange-d)' : 'var(--mut)' }}>{c.code}</span>
              <span className="sm mut" style={{ flex: 1, minWidth: 180 }}>{c.desc || '—'}{c.expires ? ` · expira ${c.expires}` : ''}</span>
              {editing ? (
                <>
                  <button className="btn sm ghost" onClick={() => togglePromo(c.code)}>{c.active ? 'Desactivar' : 'Activar'}</button>
                  <button className="btn sm ghost" onClick={() => removePromo(c.code)}>Remover</button>
                </>
              ) : (
                <span className="xs mut">{c.active ? 'Activo' : 'Inactivo'}</span>
              )}
            </div>
          ))}

          {editing && (
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <input className="input sm" style={{ flex: '1 1 120px', minWidth: 110, textTransform: 'uppercase' }} placeholder="CÓDIGO" value={newPromo.code} onChange={(e) => setNewPromo((n) => ({ ...n, code: e.target.value }))} />
              <input className="input sm" style={{ flex: 1, minWidth: 160 }} placeholder="Descrição (ex.: 30% no 1º mês)" value={newPromo.desc} onChange={(e) => setNewPromo((n) => ({ ...n, desc: e.target.value }))} />
              <input className="input sm" style={{ flex: '1 1 140px', minWidth: 130 }} placeholder="Expira (ex.: 31 Ago 2026)" value={newPromo.expires} onChange={(e) => setNewPromo((n) => ({ ...n, expires: e.target.value }))} />
              <button className="btn sm" onClick={addPromo}>+ Adicionar</button>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 4 }}>💳 Dados de pagamento</h3>
          <div className="mut sm" style={{ marginBottom: 16 }}>Enviados aos alunos pelo botão "Enviar dados de pagamento" no chat Suporte.</div>
          <div className="row" style={{ gap: 14 }}>
            <div className="col">
              <label className="xs mut">Banco</label>
              <input className="input sm" style={{ width: '100%', marginTop: 4 }} value={payment.banco} disabled={!editing} onChange={(e) => setPayment((p) => ({ ...p, banco: e.target.value }))} />
            </div>
            <div className="col">
              <label className="xs mut">IBAN</label>
              <input className="input sm" style={{ width: '100%', marginTop: 4 }} value={payment.iban} disabled={!editing} onChange={(e) => setPayment((p) => ({ ...p, iban: e.target.value }))} />
            </div>
            <div className="col">
              <label className="xs mut">Titular da conta</label>
              <input className="input sm" style={{ width: '100%', marginTop: 4 }} value={payment.titular} disabled={!editing} onChange={(e) => setPayment((p) => ({ ...p, titular: e.target.value }))} />
            </div>
          </div>
          <div className="row" style={{ gap: 14, marginTop: 14 }}>
            <div className="col">
              <label className="xs mut">Operadora de mobile money</label>
              <input className="input sm" style={{ width: '100%', marginTop: 4 }} placeholder="Ex.: Unitel Money" value={payment.mobileMoneyOperadora} disabled={!editing} onChange={(e) => setPayment((p) => ({ ...p, mobileMoneyOperadora: e.target.value }))} />
            </div>
            <div className="col">
              <label className="xs mut">Número de mobile money</label>
              <input className="input sm" style={{ width: '100%', marginTop: 4 }} value={payment.mobileMoneyNumero} disabled={!editing} onChange={(e) => setPayment((p) => ({ ...p, mobileMoneyNumero: e.target.value }))} />
            </div>
          </div>
          <div className="row" style={{ gap: 14, marginTop: 14 }}>
            <div className="col">
              <label className="xs mut">WhatsApp para receber comprovativos</label>
              <input className="input sm" style={{ width: '100%', marginTop: 4 }} placeholder="9XX XXX XXX" value={payment.whatsapp || ''} disabled={!editing} onChange={(e) => setPayment((p) => ({ ...p, whatsapp: e.target.value }))} />
              <div className="xs mut" style={{ marginTop: 4 }}>
                O aluno recebe um link que abre a conversa com este número, já com a mensagem preenchida — só tem de anexar a foto. Sem número preenchido, o botão não aparece na mensagem.
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label className="xs mut">Instruções adicionais (aparecem na mensagem enviada ao aluno)</label>
            <textarea className="input sm" style={{ width: '100%', marginTop: 4, minHeight: 70, resize: 'vertical' }} value={payment.instrucoes} disabled={!editing} onChange={(e) => setPayment((p) => ({ ...p, instrucoes: e.target.value }))} />
          </div>
        </div>

        {saved && <div className="sm" style={{ background: 'var(--green-l)', color: 'var(--green)', borderRadius: 10, padding: '12px 16px', marginTop: 20 }}>✓ Alterações guardadas. Aplicam-se de imediato.</div>}

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
