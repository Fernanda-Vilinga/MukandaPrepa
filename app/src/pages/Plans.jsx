// Página de planos (upgrade).
//
// Era uma janela sobreposta. Passou a página própria porque a sobreposição
// criava problemas de navegação: o botão Voltar do browser fechava a app em
// vez de fechar a janela, o endereço não mudava (não se podia partilhar nem
// recarregar), e em telemóvel ficavam duas barras de scroll aninhadas.
//
// Ao escolher um plano, cria o pedido no backend e abre o chat Suporte, onde
// a mensagem automática e o acompanhamento da compra já ficam à espera.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentUser, requestPlanUpgrade, getPlans } from '../services/api.js';
import { Topbar } from '../components/Ui.jsx';

// Cor de destaque por plano — puramente visual, não vem do backend.
const ACCENT = { basic: '#64748B', plus: '#1742E7', premium: '#FB6D1D' };

// O preço vem do backend como "10 000 Kz (pagamento único)". A parte entre
// parênteses é uma nota, não um valor: separada, para não ir no tamanho grande
// do preço e partir em duas linhas num ecrã estreito.
function separarPreco(precoCompleto) {
  const m = String(precoCompleto || '').match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? { valor: m[1], nota: m[2] } : { valor: precoCompleto, nota: null };
}

export default function Plans() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);
  const [promo, setPromo] = useState('');
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState('');
  const user = currentUser();

  useEffect(() => {
    getPlans().then((data) => setPlans(data.plans)).catch(() => setPlans([]));
  }, []);

  const voltar = () => navigate(-1);

  const choose = async (plan) => {
    setBusy(plan.id);
    setError('');
    try {
      await requestPlanUpgrade(plan.id, promo.trim());
      setBusy(null);
      navigate('/', { replace: true });
      // Abre o chat Suporte — a mensagem automática já foi criada pelo backend.
      window.dispatchEvent(new CustomEvent('mkp:openChat', { detail: { channel: 'suporte' } }));
    } catch (err) {
      setBusy(null);
      setError(err.message);
    }
  };

  return (
    <>
      <Topbar />
      <div className="wrap" style={{ maxWidth: 1080 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Planos MUKANDA PREPA</h1>
            <p className="mut sm" style={{ marginTop: 4 }}>
              O teu plano actual está marcado. A compra é acompanhada pelos administradores no chat Suporte.
            </p>
          </div>
          <button
            onClick={voltar}
            aria-label="Fechar e voltar"
            style={{ background: 'none', border: '1.5px solid var(--brd)', borderRadius: 10, width: 40, height: 40, fontSize: 18, color: 'var(--mut)', flexShrink: 0 }}
          >
            ✕
          </button>
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
              const { valor, nota } = separarPreco(p.price);
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
                  <div className="mont" style={{ fontWeight: 800, fontSize: 26, color: accent, marginTop: 6 }}>{valor}</div>
                  {nota && <div className="xs mut" style={{ marginBottom: 16 }}>{nota}</div>}
                  {!nota && <div style={{ marginBottom: 16 }} />}
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
    </>
  );
}
