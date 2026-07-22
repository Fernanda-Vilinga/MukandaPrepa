// Chats do estudante: 💬 Dúvidas (o aluno escolhe a maratona/professor) · 🎧 Suporte (geral)
// REAL — mensagens persistidas no backend; "tempo real" por polling
// (sem WebSocket/Socket.io nesta fase, decisão pragmática documentada
// também em prof/Monitor.jsx).
import { useEffect, useRef, useState } from 'react';
import {
  getDuvidasThreads, getDuvidasThread, sendDuvidas,
  getSuporte, sendSuporte, getMarathons,
} from '../services/api.js';

const POLL_MS = 6000;

export function ChatFab() {
  const [open, setOpen] = useState(null); // null | 'duvidas' | 'suporte'
  const [auto, setAuto] = useState(null); // mensagem automática (ex.: upgrade de plano — vai para o Suporte)

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
  const [maratonaId, setMaratonaId] = useState(null);

  useEffect(() => { if (channel !== 'duvidas') setMaratonaId(null); }, [channel]);

  return (
    <div className="chat-panel">
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--brd)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <b className="mont" style={{ fontSize: 17, flex: 1 }}>Mensagens</b>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--mut)' }}>✕</button>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '16px 24px', borderBottom: '1px solid var(--brd)' }}>
        <button className={`btn sm ${channel === 'duvidas' ? '' : 'ghost'}`} style={{ flex: 1 }} onClick={() => { onSwitch('duvidas'); setMaratonaId(null); }}>💬 Dúvidas</button>
        <button className={`btn sm ${channel === 'suporte' ? '' : 'ghost'}`} style={{ flex: 1 }} onClick={() => onSwitch('suporte')}>🎧 Suporte</button>
      </div>

      {channel === 'duvidas'
        ? (maratonaId
          ? <DuvidasThread maratonaId={maratonaId} onBack={() => setMaratonaId(null)} />
          : <DuvidasPicker onPick={setMaratonaId} />)
        : <SuportePanel autoText={autoText} />}
    </div>
  );
}

// Lista as conversas já iniciadas + as maratonas activas ainda por escolher.
// Só o professor dono da maratona escolhida vê e responde a esta conversa.
function DuvidasPicker({ onPick }) {
  const [threads, setThreads] = useState(null);
  const [marathons, setMarathons] = useState(null);

  useEffect(() => {
    getDuvidasThreads().then(setThreads);
    getMarathons().then((list) => setMarathons(list.filter((m) => m.status === 'active')));
  }, []);

  if (threads === null || marathons === null) {
    return <div style={{ flex: 1, padding: 24 }} className="sm mut">A carregar…</div>;
  }

  const iniciadasIds = new Set(threads.map((t) => t.maratonaId));
  const novas = marathons.filter((m) => !iniciadasIds.has(m.id));

  return (
    <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="xs mut">Escolhe a maratona sobre a qual queres tirar dúvidas — só o professor dessa maratona recebe e responde.</div>

      {threads.length > 0 && (
        <div>
          <b className="sm" style={{ display: 'block', marginBottom: 10 }}>As tuas conversas</b>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {threads.map((t) => (
              <button
                key={t.maratonaId}
                onClick={() => onPick(t.maratonaId)}
                className="sm"
                style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--brd)', background: '#fff', cursor: 'pointer', width: '100%' }}
              >
                <span style={{ fontSize: 20 }}>{t.icon}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display: 'block' }}>{t.title}</b>
                  <span className="xs mut">
                    Prof. {t.professorName}
                    {t.lastMessage ? ` · ${t.lastMessage.slice(0, 40)}${t.lastMessage.length > 40 ? '…' : ''}` : ''}
                  </span>
                </span>
                {t.unread > 0 && <span className="badge" style={{ background: 'var(--orange)', color: '#fff' }}>{t.unread}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <b className="sm" style={{ display: 'block', marginBottom: 10 }}>Nova dúvida</b>
        {novas.length === 0 ? (
          <div className="xs mut">
            {marathons.length === 0 ? 'Não há maratonas activas de momento.' : 'Já tens conversa aberta com todas as maratonas activas.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {novas.map((m) => (
              <button
                key={m.id}
                onClick={() => onPick(m.id)}
                className="sm"
                style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: '1px dashed var(--brd)', background: 'var(--bg)', cursor: 'pointer', width: '100%' }}
              >
                <span style={{ fontSize: 20 }}>{m.icon}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display: 'block' }}>{m.title}</b>
                  <span className="xs mut">Prof. {m.professor}</span>
                </span>
                <span className="xs" style={{ color: 'var(--orange)', fontWeight: 700 }}>Perguntar →</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DuvidasThread({ maratonaId, onBack }) {
  const [msgs, setMsgs] = useState([]);
  const [ref, setRef] = useState(null);
  const [title, setTitle] = useState(null);
  const [professorName, setProfessorName] = useState(null);
  const [text, setText] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await getDuvidasThread(maratonaId);
      if (cancelled) return;
      setMsgs(data.messages);
      setRef(data.ref);
      setTitle(data.title);
      setProfessorName(data.professorName);
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, [maratonaId]);

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    const sent = await sendDuvidas(maratonaId, value);
    setMsgs((m) => [...m, sent]);
  };

  return (
    <>
      <div className="xs mut" style={{ padding: '10px 24px', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--orange)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>← maratonas</button>
        <span>· {title}{professorName ? ` — Prof. ${professorName}` : ''}{ref && ref !== title ? ` · ${ref}` : ''}</span>
      </div>
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
        {msgs.length === 0 && <div className="sm mut">Escreve a tua primeira mensagem ao professor desta maratona.</div>}
        {msgs.map((m, i) => <Bubble key={i} m={m} />)}
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
    </>
  );
}

function SuportePanel({ autoText }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const autoSentRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    autoSentRef.current = false;

    const load = async () => {
      const data = await getSuporte();
      if (cancelled) return;
      setMsgs(data.messages);

      // Mensagem automática (ex.: pedido de upgrade de plano) — enviada
      // uma única vez como mensagem real ao abrir o painel com autoText.
      if (autoText && !autoSentRef.current) {
        autoSentRef.current = true;
        const sent = await sendSuporte(autoText);
        if (!cancelled) setMsgs((m) => [...m, sent]);
      }
    };
    load();

    const timer = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    const sent = await sendSuporte(value);
    setMsgs((m) => [...m, sent]);
  };

  return (
    <>
      <div className="xs mut" style={{ padding: '10px 24px', background: 'var(--bg)' }}>Canal geral — problemas de acesso, passwords, etc.</div>
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
        {msgs.map((m, i) => <Bubble key={i} m={m} />)}
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
    </>
  );
}

function Bubble({ m }) {
  return (
    <div
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
  );
}
