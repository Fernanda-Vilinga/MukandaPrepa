// Janela de planos (upgrade) — abre ao clicar no chip do plano na navbar
// ou em qualquer botão "Fazer upgrade". Ao escolher um plano, inicia uma
// mensagem automática no chat Suporte para dar seguimento à compra.
import { useEffect, useState } from 'react';
import { currentUser, requestPlanUpgrade } from '../services/api.js';
import { PLAN_INFO, PLAN_LABEL } from '../data/mock.js';

export function openPlans() {
  window.dispatchEvent(new CustomEvent('mkp:openPlans'));
}

export default function PlanModal() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const [promo, setPromo] = useState('');
  const user = currentUser();

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener('mkp:openPlans', h);
    return () => window.removeEventListener('mkp:openPlans', h);
  }, []);

  if (!open) return null;

  const choose = async (plan) => {
    setBusy(plan.id);
    await requestPlanUpgrade(plan.id); // notifica admins (email → Gmail suporte)
    setBusy(null);
    setOpen(false);
    // Abre o chat Suporte com a mensagem automática de compra
    window.dispatchEvent(new CustomEvent('mkp:openChat', {
      detail: {
        channel: 'suporte',
        autoText: `Olá! Quero actualizar o meu plano ${PLAN_LABEL[user?.plan]} para o plano ${plan.name} (${plan.price}).${promo.trim() ? ` Código promocional: ${promo.trim().toUpperCase()}.` : ''} Podem dar seguimento à compra? — mensagem automática`,
      },
    }));
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,31,.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={() => setOpen(false)}
    >
      <div className="card" style={{ maxWidth: 980, width: '100%', padding: 40, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Planos MUKANDA PREPA</h2>
            <p className="mut sm" style={{ marginTop: 4 }}>
              O teu plano actual está marcado. A compra é acompanhada pelos administradores no chat Suporte.
            </p>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--mut)' }}>✕</button>
        </div>

        <div className="row" style={{ marginTop: 20, gap: 16, alignItems: 'stretch' }}>
          {PLAN_INFO.map((p) => {
            const isCurrent = user?.plan === p.id;
            return (
              <div
                key={p.id}
                className="col"
                style={{
                  border: isCurrent ? `2.5px solid ${p.accent}` : '1.5px solid var(--brd)',
                  borderRadius: 16, padding: 26, position: 'relative', display: 'flex', flexDirection: 'column',
                  background: isCurrent ? '#fff' : '#fff',
                }}
              >
                {isCurrent && (
                  <span className="badge" style={{ position: 'absolute', top: -12, left: 24, background: p.accent, color: '#fff' }}>✓ Plano actual</span>
                )}
                {!isCurrent && p.popular && (
                  <span className="badge" style={{ position: 'absolute', top: -12, left: 24, background: 'var(--blue-l)', color: 'var(--blue)' }}>Mais popular</span>
                )}
                <div className="mont" style={{ fontWeight: 800, fontSize: 19 }}>{p.name}</div>
                <div className="mont" style={{ fontWeight: 800, fontSize: 26, color: p.accent, margin: '6px 0 16px' }}>{p.price}</div>
                <div className="sm" style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {p.features.map((f) => <div key={f}>✓ {f}</div>)}
                  {p.missing.map((f) => <div key={f} className="mut">✗ {f}</div>)}
                </div>
                <button
                  className={`btn ${isCurrent ? 'ghost' : ''}`}
                  style={{ width: '100%', marginTop: 20, ...(isCurrent ? {} : { background: p.accent }) }}
                  disabled={isCurrent || busy != null}
                  onClick={() => choose(p)}
                >
                  {isCurrent ? 'É o teu plano' : busy === p.id ? 'A contactar o suporte…' : 'Escolher este plano'}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          <label className="sm" style={{ fontWeight: 600 }}>🎟 Tens um código promocional?</label>
          <input
            className="input"
            style={{ width: 220, padding: '10px 14px', textTransform: 'uppercase', fontWeight: 600 }}
            placeholder="Ex.: MUKANDA26"
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
          />
          <span className="xs mut">É incluído no teu pedido e o desconto é aplicado pela administração na confirmação.</span>
        </div>
        <div className="sm mut" style={{ marginTop: 16, background: 'var(--bg)', borderRadius: 12, padding: '14px 18px' }}>
          💳 <b style={{ color: 'var(--dark)' }}>Como funciona a compra:</b> ao escolheres um plano, abre-se uma conversa
          automática no chat <b style={{ color: 'var(--dark)' }}>Suporte</b> com os administradores, que acompanham o
          pagamento e a activação. Recebes as confirmações por <b style={{ color: 'var(--dark)' }}>email</b> e podes falar
          directamente com os gestores comerciais por <b style={{ color: 'var(--dark)' }}>WhatsApp</b>. Enviado e confirmado
          o comprovativo, o teu plano é actualizado — basta actualizar a página.
        </div>
      </div>
    </div>
  );
}
