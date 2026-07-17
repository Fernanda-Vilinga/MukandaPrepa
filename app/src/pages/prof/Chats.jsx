// Gestão de chats — apenas Dúvidas (privado por aluno).
// O canal Suporte é gerido exclusivamente pelos ADMINISTRADORES.
import { useEffect, useState } from 'react';
import { getProfChats } from './profDeps.js';
import { ProfTopbar, Pill } from '../../components/ProfUi.jsx';

export default function ProfChats() {
  const [chats, setChats] = useState([]);
  const [cur, setCur] = useState(null);
  const [text, setText] = useState('');

  useEffect(() => {
    getProfChats().then((c) => { setChats(c); setCur(c[0] ?? null); });
  }, []);

  const unread = chats.reduce((n, c) => n + c.unread, 0);

  const send = () => {
    if (!text.trim() || !cur) return;
    const msg = { from: 'prof', text, time: new Date().toTimeString().slice(0, 5) };
    setChats((all) => all.map((c) => (c.id === cur.id ? { ...c, messages: [...c.messages, msg], unread: 0 } : c)));
    setCur((c) => ({ ...c, messages: [...c.messages, msg], unread: 0 }));
    setText('');
  };

  return (
    <>
      <ProfTopbar />
      <div className="wrap">
        <div style={{ display: 'flex', gap: 24, height: 700 }}>
          <div className="card" style={{ width: 380, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--brd)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 className="mont" style={{ fontSize: 17, fontWeight: 800, flex: 1 }}>💬 Dúvidas dos alunos</h3>
                {unread > 0 && <span className="badge" style={{ background: 'var(--orange)', color: '#fff' }}>{unread}</span>}
              </div>
              <div className="xs mut" style={{ marginTop: 6 }}>Conversas privadas por aluno. O suporte geral é dado pelos administradores.</div>
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
                      {c.ref ? `${c.ref}: ` : ''}{c.messages.at(-1)?.text}
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
              <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--brd)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="avatar" style={{ background: cur.color }}>{cur.initials}</div>
                <div style={{ flex: 1 }}>
                  <b>{cur.student}</b>
                  <div className="xs mut">Plano {cur.plan}{cur.ref ? ` · em sessão: ${cur.ref.split('—')[1] ?? ''}` : ''}</div>
                </div>
                {cur.online && <span className="badge act">● online</span>}
              </div>
              <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bg)', overflowY: 'auto' }}>
                {cur.ref && (
                  <div style={{ alignSelf: 'center' }}><Pill kind="gray">referência automática · {cur.ref}</Pill></div>
                )}
                {cur.messages.map((m, i) => (
                  <div
                    key={i}
                    className="sm"
                    style={{
                      maxWidth: '70%',
                      alignSelf: m.from === 'prof' ? 'flex-end' : 'flex-start',
                      background: m.from === 'prof' ? 'var(--blue)' : '#fff',
                      color: m.from === 'prof' ? '#fff' : 'var(--dark)',
                      borderRadius: m.from === 'prof' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      padding: '12px 16px',
                      boxShadow: m.from === 'prof' ? 'none' : 'var(--sh)',
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
                <button className="btn blue" style={{ padding: '14px 18px' }} onClick={send}>➤</button>
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
