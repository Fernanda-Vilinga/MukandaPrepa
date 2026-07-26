// Chat Suporte — EXCLUSIVO dos administradores.
// Canal onde passam todas as compras de planos (comprovativo, confirmação)
// e problemas de acesso. Uma conversa com um pedido de upgrade pendente
// mostra os atalhos reais: enviar os dados de pagamento configurados em
// Gestão de planos, ou confirmar o pedido (actualiza o plano do estudante
// e envia o email de confirmação).
import { useEffect, useRef, useState } from 'react';
import { getSupportChats, sendSupportChat, getPlansConfig, confirmPurchase, rejectPurchase } from '../../services/adminApi.js';
import { AdminTopbar, PlanPill } from '../../components/AdminUi.jsx';
import { TextoComLinks } from '../../components/Ui.jsx';

const PLANO_LABEL = { basic: 'Basic', plus: 'Plus', premium: 'Premium' };

// Link de WhatsApp com o texto já preenchido: o aluno clica, abre a conversa
// com o MUKANDA e só tem de anexar a foto do comprovativo. Sem isto, a
// mensagem dizia "envia o comprovativo aqui neste chat" e o chat não tinha
// forma nenhuma de anexar ficheiros — era um beco sem saída.
function linkWhatsApp(numero, { nomeAluno, nomePlano }) {
  const digitos = String(numero || '').replace(/\D/g, '');
  if (!digitos) return null;
  const comIndicativo = digitos.startsWith('244') ? digitos : `244${digitos}`;
  const texto = `Olá! Sou ${nomeAluno || 'aluno'} da MUKANDA PREPA. Envio o comprovativo de pagamento do plano ${nomePlano || ''}.`.trim();
  return `https://wa.me/${comIndicativo}?text=${encodeURIComponent(texto)}`;
}

function mensagemDadosPagamento(config, pendente, nomeAluno) {
  const plan = (config.plans || []).find((p) => p.id === pendente.planoPedido);
  const pay = config.payment || {};
  if (!pay.banco && !pay.iban && !pay.mobileMoneyNumero) return null;

  const linhas = [`Aqui estão os dados para pagares o plano ${plan ? plan.name : PLANO_LABEL[pendente.planoPedido]}${plan ? ` (${plan.price})` : ''}:`];
  if (pay.banco || pay.iban) {
    linhas.push(`\n🏦 Transferência bancária${pay.banco ? ` — ${pay.banco}` : ''}${pay.iban ? `\nIBAN: ${pay.iban}` : ''}${pay.titular ? `\nTitular: ${pay.titular}` : ''}`);
  }
  if (pay.mobileMoneyNumero) {
    linhas.push(`\n📱 ${pay.mobileMoneyOperadora || 'Mobile money'}: ${pay.mobileMoneyNumero}`);
  }
  if (pay.instrucoes) linhas.push(`\n${pay.instrucoes}`);

  const nomePlano = plan ? plan.name : PLANO_LABEL[pendente.planoPedido];
  const wa = linkWhatsApp(pay.whatsapp, { nomeAluno, nomePlano });
  if (wa) {
    linhas.push(`\n📎 Depois de pagares, envia-nos o comprovativo por WhatsApp:\n${wa}`);
    linhas.push(`\n(Clica no link acima — a mensagem já vai preenchida, só tens de anexar a foto.)`);
  } else {
    linhas.push(`\nDepois de pagares, avisa-nos aqui neste chat para combinarmos o envio do comprovativo.`);
  }
  return linhas.join('\n');
}

export default function Support() {
  const [chats, setChats] = useState([]);
  const [cur, setCur] = useState(null);
  const [text, setText] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const curIdRef = useRef(null);
  useEffect(() => { curIdRef.current = cur?.id ?? null; }, [cur]);

  const refresh = async () => {
    const c = await getSupportChats();
    setChats(c);
    setCur((prev) => {
      if (!prev) return c[0] ?? null;
      return c.find((x) => x.id === curIdRef.current) ?? prev;
    });
  };

  useEffect(() => {
    refresh();
    // Sem WebSocket nesta fase — "tempo real" aproximado por polling (ver Monitor.jsx).
    const timer = setInterval(refresh, 6000);
    return () => clearInterval(timer);
  }, []);

  const unread = chats.reduce((n, c) => n + c.unread, 0);

  const send = async () => {
    const value = text.trim();
    if (!value || !cur) return;
    setText('');
    const msg = await sendSupportChat(cur.id, value);
    setChats((all) => all.map((c) => (c.id === cur.id ? { ...c, messages: [...c.messages, msg], unread: 0 } : c)));
    setCur((c) => ({ ...c, messages: [...c.messages, msg], unread: 0 }));
  };

  const enviarDadosPagamento = async () => {
    if (!cur?.pendingPurchase) return;
    setActionBusy(true);
    setActionError('');
    try {
      const config = await getPlansConfig();
      const texto = mensagemDadosPagamento(config, cur.pendingPurchase, cur.student);
      if (!texto) {
        setActionError('Ainda não configuraste os dados de pagamento — vai a Gestão de planos → Dados de pagamento.');
      } else {
        const msg = await sendSupportChat(cur.id, texto);
        setChats((all) => all.map((c) => (c.id === cur.id ? { ...c, messages: [...c.messages, msg], unread: 0 } : c)));
        setCur((c) => ({ ...c, messages: [...c.messages, msg], unread: 0 }));
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const confirmarPlano = async () => {
    if (!cur?.pendingPurchase) return;
    setActionBusy(true);
    setActionError('');
    try {
      await confirmPurchase(cur.pendingPurchase.id);
      await refresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const recusarPlano = async () => {
    if (!cur?.pendingPurchase) return;
    const motivo = window.prompt('Motivo (opcional) — o aluno vê esta mensagem no chat:', '');
    if (motivo === null) return; // cancelou
    setActionBusy(true);
    setActionError('');
    try {
      await rejectPurchase(cur.pendingPurchase.id, motivo);
      await refresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <>
      <AdminTopbar />
      <div className="wrap">
        <div style={{ display: 'flex', gap: 24, height: 700 }}>
          <div className="card" style={{ width: 400, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--brd)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 className="mont" style={{ fontSize: 17, fontWeight: 800, flex: 1 }}>🎧 Suporte</h3>
                {unread > 0 && <span className="badge" style={{ background: 'var(--orange)', color: '#fff' }}>{unread}</span>}
              </div>
              <div className="xs mut" style={{ marginTop: 6 }}>
                Compras de planos, acessos e problemas gerais. Canal exclusivo da administração.
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {chats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCur(c); setActionError(''); setChats((all) => all.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x))); }}
                  style={{
                    display: 'flex', gap: 12, alignItems: 'center', width: '100%', textAlign: 'left',
                    padding: '16px 24px', border: 'none', borderBottom: '1px solid #EFEFF2',
                    background: cur?.id === c.id ? 'var(--orange-l)' : '#fff', cursor: 'pointer',
                  }}
                >
                  <div className="avatar" style={{ width: 40, height: 40, background: c.color }}>{c.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b className="sm">{c.student}</b>
                    <div className="xs mut" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.topic} · {c.messages.at(-1)?.text}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {c.unread > 0 && <span className="badge" style={{ background: 'var(--orange)', color: '#fff' }}>{c.unread}</span>}
                    <div className="xs mut" style={{ marginTop: 4 }}>{c.last}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {cur ? (
            <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--brd)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div className="avatar" style={{ background: cur.color }}>{cur.initials}</div>
                <div style={{ flex: 1 }}>
                  <b>{cur.student}</b>
                  <div className="xs mut" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                    {cur.topic} · plano actual: <PlanPill plan={cur.plan} />
                    {cur.pendingPurchase && <> → pedido: <PlanPill plan={cur.pendingPurchase.planoPedido} />{cur.pendingPurchase.promoCode && ` (código ${cur.pendingPurchase.promoCode})`}</>}
                  </div>
                </div>
                {cur.pendingPurchase && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn sm ghost" disabled={actionBusy} onClick={enviarDadosPagamento} title="Enviar os dados de pagamento configurados em Gestão de planos">
                      📧 Enviar dados de pagamento
                    </button>
                    <button className="btn sm ghost" disabled={actionBusy} onClick={recusarPlano} title="Recusar este pedido">
                      ✗ Recusar
                    </button>
                    <button className="btn sm green" disabled={actionBusy} onClick={confirmarPlano} title="Após confirmar o comprovativo">
                      {actionBusy ? '…' : '✓ Confirmar e actualizar plano'}
                    </button>
                  </div>
                )}
              </div>
              {actionError && (
                <div className="sm" style={{ background: 'var(--red-l, #fdecec)', color: 'var(--red, #c0392b)', padding: '10px 28px' }}>
                  {actionError}
                </div>
              )}
              <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bg)', overflowY: 'auto' }}>
                {cur.messages.map((m, i) => (
                  <div
                    key={i}
                    className="sm"
                    style={{
                      maxWidth: '70%',
                      whiteSpace: 'pre-line',
                      alignSelf: m.from === 'admin' ? 'flex-end' : 'flex-start',
                      background: m.from === 'admin' ? 'var(--dark)' : '#fff',
                      color: m.from === 'admin' ? '#fff' : 'var(--dark)',
                      borderRadius: m.from === 'admin' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      padding: '12px 16px',
                      boxShadow: m.from === 'admin' ? 'none' : 'var(--sh)',
                    }}
                  >
                    <TextoComLinks>{m.text}</TextoComLinks>
                    <div className="xs" style={{ opacity: .7, marginTop: 4 }}>{m.time}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '16px 28px', borderTop: '1px solid var(--brd)', display: 'flex', gap: 10 }}>
                <input
                  className="input"
                  placeholder={`Responde a ${cur.student.split(' ')[0]}…`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  style={{ flex: 1 }}
                />
                <button className="btn dark" style={{ padding: '14px 18px' }} onClick={send}>➤</button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mut)' }}>
              Escolhe uma conversa.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
