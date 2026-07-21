// Chat Suporte — EXCLUSIVO dos administradores.
// Canal onde passam todas as compras de planos (comprovativo, confirmação)
// e problemas de acesso. Após confirmar pagamento: actualizar o plano do
// estudante em Utilizadores → Acções → Alterar plano, e o sistema envia
// o email de confirmação (TODO backend).
import { useEffect, useRef, useState } from 'react';
import { getSupportChats, sendSupportChat } from '../../services/adminApi.js';
import { AdminTopbar, PlanPill } from '../../components/AdminUi.jsx';

export default function Support() {
  const [chats, setChats] = useState([]);
  const [cur, setCur] = useState(null);
  const [text, setText] = useState('');

  const curIdRef = useRef(null);
  useEffect(() => { curIdRef.current = cur?.id ?? null; }, [cur]);

  useEffect(() => {
    const load = () => getSupportChats().then((c) => {
      setChats(c);
      setCur((prev) => {
        if (!prev) return c[0] ?? null;
        return c.find((x) => x.id === curIdRef.current) ?? prev;
      });
    });
    load();
    // Sem WebSocket nesta fase — "tempo real" aproximado por polling (ver Monitor.jsx).
    const timer = setInterval(load, 6000);
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
                  onClick={() => { setCur(c); setChats((all) => all.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x))); }}
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
                  </div>
                </div>
                {cur.topic.includes('Upgrade') && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {/* Atalhos do fluxo de compra */}
                    <button className="btn sm ghost" title="Enviar dados de pagamento por email">📧 Enviar dados de pagamento</button>
                    <button className="btn sm green" title="Após confirmar o comprovativo">✓ Confirmar e actualizar plano</button>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bg)', overflowY: 'auto' }}>
                {cur.messages.map((m, i) => (
                  <div
                    key={i}
                    className="sm"
                    style={{
                      maxWidth: '70%',
                      alignSelf: m.from === 'admin' ? 'flex-end' : 'flex-start',
                      background: m.from === 'admin' ? 'var(--dark)' : '#fff',
                      color: m.from === 'admin' ? '#fff' : 'var(--dark)',
                      borderRadius: m.from === 'admin' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      padding: '12px 16px',
                      boxShadow: m.from === 'admin' ? 'none' : 'var(--sh)',
                    }}
                  >
                    {m.text}
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
