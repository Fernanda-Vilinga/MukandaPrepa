// Janela de planos (upgrade) — abre ao clicar no chip do plano na navbar
// ou em qualquer botão "Fazer upgrade". Ao escolher um plano, cria o
// pedido no backend (real) e abre o chat Suporte, onde a mensagem
// automática e o acompanhamento da compra já ficam à espera do aluno.
import { useEffect, useState } from 'react';
import { currentUser, requestPlanUpgrade, getPlans } from '../services/api.js';

export function openPlans() {
  window.dispatchEvent(new CustomEvent('mkp:openPlans'));
}

// Cor de destaque por plano — puramente visual, não vem do backend.
const ACCENT = { basic: '#64748B', plus: '#1742E7', premium: '#FB6D1D' };

export default function PlanModal() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const [promo, setPromo] = useState('');
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState('');
  const user = currentUser();

  useEffect(() => {
    const h = () => { setOpen(true); setError(''); };
    window.addEventListener('mkp:openPlans', h);
    return () => window.removeEventListener('mkp:openPlans', h);
  }, []);

  useEffect(() => {
    if (open && !plans) {
      getPlans().then((data) => setPlans(data.plans)).catch(() => setPlans([]));
    }
  }, [open, plans]);

  if (!open) return null;

  const choose = async (plan) => {
    setBusy(plan.id);
    setError('');
    try {
      await requestPlanUpgrade(plan.id, promo.trim());
      setBusy(null);
      setOpen(false);
      // Abre o chat Suporte — a mensagem automática já foi criada pelo backend
      window.dispatchEvent(new CustomEvent('mkp:openChat', { detail: { channel: 'suporte' } }));
    } catch (err) {
      setBusy(null);
      setError(err.message);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,31,.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={() => setOpen(false)}
    >
      <div className="card modal-card" style={{ maxWidth: 980, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Planos MUKANDA PREPA</h2>
            <p className="mut sm" style={{ marginTop: 4 }}>
              O teu plano actual está marcado. A compra é acompanhada pelos administradores no chat Suporte.
            </p>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--mut)' }}>✕</button>
        </div>

        {error && (
          <div className="sm" style={{ background: 'var(--red-l, #fdecec)', color: 'var(--red, #c0392b)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {!plans ? (
          <div className="sm mut" style={{ padding: '32px 0', textAlign: 'center' }}>A carregar planos…</div>
        ) : (
          <div className="row" style={{ marginTop: 20, gap: 16, alignItems: 'stretch' }}>
            {plans.map((p) => {
              const accent = ACCENT[p.id] || 'var(--dark)';
              const isCurrent = user?.plan === p.id;
              return (
                <div
                  key={p.id}
                  className="col"
                  style={{
                    border: isCurrent ? `2.5px solid ${accent}` : '1.5px solid var(--brd)',
                    borderRadius: 16, padding: 26, position: 'relative', display: 'flex', flexDirection: 'column',
                    background: '#fff',
                  }}
                >
                  {isCurrent && (
                    <span className="badge" style={{ position: 'absolute', top: -12, left: 24, background: accent, color: '#fff' }}>✓ Plano actual</span>
                  )}
                  {!isCurrent && p.popular && (
                    <span className="badge" style={{ position: 'absolute', top: -12, left: 24, background: 'var(--blue-l)', color: 'var(--blue)' }}>Mais popular</span>
                  )}
                  <div className="mont" style={{ fontWeight: 800, fontSize: 19 }}>{p.name}</div>
                  <div className="mont" style={{ fontWeight: 800, fontSize: 26, color: accent, margin: '6px 0 16px' }}>{p.price}</div>
                  <div className="sm" style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    {p.features.map((f) => <div key={f}>✓ {f}</div>)}
                    {p.missing.map((f) => <div key={f} className="mut">✗ {f}</div>)}
                  </div>
                  <button
                    className={`btn ${isCurrent ? 'ghost' : ''}`}
                    style={{ width: '100%', marginTop: 20, ...(isCurrent ? {} : { background: accent }) }}
                    disabled={isCurrent || busy != null}
                    onClick={() => choose(p)}
                  >
                    {isCurrent ? 'É o teu plano' : busy === p.id ? 'A enviar pedido…' : 'Escolher este plano'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          <label className="sm" style={{ fontWeight: 600 }}>🎟 Tens um código promocional?</label>
          <input
            className="input"
            style={{ flex: '1 1 180px', maxWidth: 220, padding: '10px 14px', textTransform: 'uppercase', fontWeight: 600 }}
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
