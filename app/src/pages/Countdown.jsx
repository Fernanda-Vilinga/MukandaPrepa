import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMarathon, startSession } from '../services/api.js';
import { Brand, fmtTime } from '../components/Ui.jsx';

const PREP_SECONDS = 90; // 1-2 min de preparação (spec)
const TIPS = [
  'Lê bem cada questão antes de responder. Podes voltar atrás e alterar as respostas antes de submeter.',
  'As tuas respostas são guardadas automaticamente — concentra-te em resolver.',
  'Gere o teu tempo: o cronómetro é global para toda a sessão.',
];

// Estilo partilhado dos painéis de erro deste ecrã (fundo escuro).
const ERRO_BOX = {
  background: 'rgba(192,57,43,.14)',
  border: '1px solid rgba(192,57,43,.5)',
  borderRadius: 16,
  padding: 'clamp(16px, 5vw, 24px) clamp(18px, 6vw, 32px)',
  marginTop: 'clamp(24px, 7vw, 48px)',
  maxWidth: 560,
};

export default function Countdown() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [m, setM] = useState(null);
  const [left, setLeft] = useState(PREP_SECONDS);
  const [tip, setTip] = useState(0);

  // Este é o ecrã das 19h58 do dia da maratona: se a API soluçar aqui, ficar
  // em branco (ou preso num alert) é o pior desfecho possível. Cada chamada
  // tem estado de erro próprio, mensagem visível e botão para tentar de novo.
  const [erroCarregar, setErroCarregar] = useState('');
  const [erroInicio, setErroInicio] = useState('');
  const [aIniciar, setAIniciar] = useState(false);

  const carregar = useCallback(() => {
    setErroCarregar('');
    getMarathon(id)
      .then(setM)
      .catch((err) => setErroCarregar(err.message || 'Não foi possível carregar a maratona.'));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  // O contador e a rotação dos conselhos pausam enquanto houver um erro no
  // ecrã: não faz sentido "começar" uma prova contra uma API que acabou de
  // falhar, nem trocar o conselho por baixo de uma mensagem de erro.
  const emErro = Boolean(erroCarregar || erroInicio);
  useEffect(() => {
    if (emErro) return undefined;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    const tt = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 8000);
    return () => { clearInterval(t); clearInterval(tt); };
  }, [emErro]);

  // Arranque da sessão. Antes: alert() + regresso à página da maratona — a um
  // minuto da prova, expulsar o aluno do ecrã é pedir-lhe que refaça o
  // caminho todo. Agora falha NO ecrã, com botão para tentar de novo.
  const iniciar = useCallback(() => {
    setErroInicio('');
    setAIniciar(true);
    startSession(id)
      .then(() => navigate(`/maratonas/${id}/sessao`, { replace: true }))
      .catch((err) => {
        setAIniciar(false);
        setErroInicio(err.message || 'Não foi possível iniciar a prova.');
      });
  }, [id, navigate]);

  // Dispara uma única vez quando o contador chega a zero (o `left` continua a
  // descer a cada segundo, e sem a guarda o efeito repetiria o pedido contra
  // um servidor já em dificuldades — o mesmo padrão do auto-submit da Session).
  const iniciado = useRef(false);
  useEffect(() => {
    if (left > 0 || iniciado.current) return;
    iniciado.current = true;
    iniciar();
  }, [left, iniciar]);

  return (
    // 100dvh: em telemóveis com barra de endereço dinâmica, 100vh é maior do
    // que a área visível e cortava o rodapé ("O início é automático…").
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(180deg,#14141F,#1E1E2E)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'clamp(16px, 5vw, 40px)' }}>
      <div style={{ marginBottom: 'clamp(24px, 7vw, 56px)' }}><Brand light size={48} /></div>
      <div className="mont" style={{ fontSize: 14, letterSpacing: '.25em', color: '#8A8B9A', fontWeight: 600 }}>A MARATONA COMEÇA EM</div>
      {/* Em MM:SS são 5 caracteres: a 110px fixos davam ~340px e não cabiam
          num telemóvel de 360px. O clamp() acompanha a largura do ecrã e
          mantém os 110px no computador. */}
      <div className="mont" style={{ fontSize: 'clamp(56px, 18vw, 110px)', fontWeight: 800, letterSpacing: '.02em', margin: '12px 0 8px', lineHeight: 1.05 }}>{fmtTime(Math.max(0, left))}</div>
      {m && <div style={{ color: '#8A8B9A' }}>{m.title} · {m.questionsPerSession} questões · {m.durationMinutes} minutos</div>}

      {erroCarregar && (
        <div style={ERRO_BOX}>
          <div className="mont" style={{ color: '#F58E6B', fontWeight: 700, marginBottom: 8 }}>⚠ Sem ligação à plataforma</div>
          <div style={{ fontSize: 16 }}>{erroCarregar}</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
            <button className="btn" onClick={carregar}>Tentar de novo</button>
            <button className="btn ghost" style={{ color: '#fff', borderColor: '#3A3A4A' }} onClick={() => navigate(`/maratonas/${id}`)}>Voltar à maratona</button>
          </div>
        </div>
      )}

      {erroInicio && (
        <div style={ERRO_BOX}>
          <div className="mont" style={{ color: '#F58E6B', fontWeight: 700, marginBottom: 8 }}>⚠ A prova não conseguiu começar</div>
          <div style={{ fontSize: 16 }}>{erroInicio}</div>
          <div className="xs" style={{ color: '#8A8B9A', marginTop: 8 }}>Nada se perdeu — a tua tentativa só conta depois de a prova abrir.</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
            <button className="btn" disabled={aIniciar} onClick={iniciar}>{aIniciar ? 'A iniciar…' : 'Tentar iniciar de novo'}</button>
            <button className="btn ghost" style={{ color: '#fff', borderColor: '#3A3A4A' }} onClick={() => navigate(`/maratonas/${id}`)}>Voltar à maratona</button>
          </div>
        </div>
      )}

      {!emErro && (
        <>
          <div style={{ background: 'rgba(251,109,29,.12)', border: '1px solid rgba(251,109,29,.4)', borderRadius: 16, padding: 'clamp(16px, 5vw, 24px) clamp(18px, 6vw, 32px)', marginTop: 'clamp(24px, 7vw, 48px)', maxWidth: 560 }}>
            <div className="mont" style={{ color: 'var(--orange)', fontWeight: 700, marginBottom: 8 }}>💡 Conselho</div>
            <div style={{ fontSize: 17 }}>{TIPS[tip]}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
            {TIPS.map((_, i) => (
              <div key={i} style={{ width: i === tip ? 24 : 6, height: 6, borderRadius: 99, background: i === tip ? 'var(--orange)' : '#3A3A4A', transition: 'width .3s' }} />
            ))}
          </div>
          <div className="xs" style={{ color: '#8A8B9A', marginTop: 'clamp(24px, 7vw, 56px)' }}>
            {aIniciar ? 'A iniciar a prova…' : 'O início é automático. Boa sorte! 🍀'}
          </div>
        </>
      )}
    </div>
  );
}
