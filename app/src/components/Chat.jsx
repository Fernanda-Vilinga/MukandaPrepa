// Chats do estudante: 💬 Dúvidas (privado com o professor) · 🎧 Suporte (geral)
import { useEffect, useState } from 'react';
import { getChat } from '../services/api.js';

export function ChatFab() {
  const [open, setOpen] = useState(null); // null | 'duvidas' | 'suporte'
  const [auto, setAuto] = useState(null); // mensagem automática (ex.: upgrade de plano)

  useEffect(() => {
    const h = (e) => { setAuto(e.detail.autoText ?? null); setOpen(e.detail.channel); };
    window.addEventListener('mkp:openChat', h);
    return () => window.removeEventListener('mkp:openChat', h);
  }, []);

  return (
    <>
      <div className="fab">
        <button className="b" style={{ background: 'var(--blue)' }} title="Dúvidas com o professor" onClick={() => setOpen('duvidas')}>💬</button>
        <button className="b" style={{ background: 'var(--dark)' }} title="Suporte geral" onClick={() => setOpen('suporte')}>🎧</button>
      </div>
      {open && <ChatPanel channel={open} autoText={auto} onClose={() => { setOpen(null); setAuto(null); }} onSwitch={setOpen} />}
    </>
  );
}

function ChatPanel({ channel, autoText, onClose, onSwitch }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    let timer;
    let cancelled = false;
    getChat(channel).then((base) => {
      if (cancelled) return;
      if (!autoText) return setMsgs(base);
      const now = new Date().toTimeString().slice(0, 5);
      setMsgs([...base, { from: 'me', text: autoText, time: now }]);
      // Resposta automática do suporte (mock — no real: admins notificados
      // por email na conta Gmail suporte e respondem por aqui)
      // TODO backend: substituir +244 9XX XXX XXX pelo número oficial e
      // transformá-lo em interlink que abre o WhatsApp Business
      // (https://wa.me/<numero>)
      timer = setTimeout(() => {
        setMsgs((m) => [...m, {
          from: 'prof',
          text: 'Bem-vindo(a) à família MUKANDA PREPA! 🎉 Recebemos o teu pedido e um administrador já está a tratar de tudo — estás em boas mãos. É simples: 1️⃣ vais receber neste chat e no teu email os dados para o pagamento; 2️⃣ efectuas o pagamento e envias o comprovativo aqui mesmo; 3️⃣ confirmamos e o teu plano fica activo de imediato — nós avisamos-te por email. Centenas de estudantes já actualizaram o plano por este canal, com total segurança. Alguma dúvida? Fala directamente com os nossos gestores comerciais no WhatsApp: +244 9XX XXX XXX. Estamos aqui para te ajudar a ir mais longe! 🚀',
          time: new Date().toTimeString().slice(0, 5),
        }]);
      }, 1200);
    });
    // cleanup: evita mensagens duplicadas (StrictMode corre os efeitos 2x em dev)
    return () => { cancelled = true; clearTimeout(timer); };
  }, [channel, autoText]);

  const send = () => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { from: 'me', text, time: new Date().toTimeString().slice(0, 5) }]);
    setText('');
  };

  return (
    <div className="chat-panel">
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--brd)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <b className="mont" style={{ fontSize: 17, flex: 1 }}>Mensagens</b>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--mut)' }}>✕</button>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '16px 24px', borderBottom: '1px solid var(--brd)' }}>
        <button className={`btn sm ${channel === 'duvidas' ? '' : 'ghost'}`} style={{ flex: 1 }} onClick={() => onSwitch('duvidas')}>💬 Dúvidas</button>
        <button className={`btn sm ${channel === 'suporte' ? '' : 'ghost'}`} style={{ flex: 1 }} onClick={() => onSwitch('suporte')}>🎧 Suporte</button>
      </div>
      <div className="xs mut" style={{ padding: '10px 24px', background: 'var(--bg)' }}>
        {channel === 'duvidas' ? 'Chat privado com o professor da maratona' : 'Canal geral — problemas de acesso, passwords, etc.'}
      </div>
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
        {msgs.map((m, i) => (
          <div
            key={i}
            className="sm"
            style={{
              maxWidth: '78%',
              alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start',
              background: m.from === 'me' ? 'var(--orange)' : 'var(--bg)',
              color: m.from === 'me' ? '#fff' : 'var(--dark)',
              borderRadius: m.from === 'me' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              padding: '12px 16px',
            }}
          >
            {m.text}
            <div className="xs" style={{ opacity: .7, marginTop: 4 }}>{m.time}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--brd)', display: 'flex', gap: 10 }}>
        <input
          className="input"
          placeholder="Escreve a tua mensagem…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          style={{ flex: 1 }}
        />
        <button className="btn" style={{ padding: '14px 18px' }} onClick={send}>➤</button>
      </div>
    </div>
  );
}
