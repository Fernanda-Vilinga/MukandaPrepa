import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMarathon, startSession } from '../services/api.js';
import { Brand, fmtTime } from '../components/Ui.jsx';

const PREP_SECONDS = 90; // 1-2 min de preparação (spec)
const TIPS = [
  'Lê bem cada questão antes de responder. Podes voltar atrás e alterar as respostas antes de submeter.',
  'As tuas respostas são guardadas automaticamente — concentra-te em resolver.',
  'Gere o teu tempo: o cronómetro é global para toda a sessão.',
];

export default function Countdown() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [m, setM] = useState(null);
  const [left, setLeft] = useState(PREP_SECONDS);
  const [tip, setTip] = useState(0);

  useEffect(() => { getMarathon(id).then(setM); }, [id]);

  useEffect(() => {
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    const tt = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 8000);
    return () => { clearInterval(t); clearInterval(tt); };
  }, []);

  useEffect(() => {
    if (left <= 0) {
      startSession(id).then(() => navigate(`/maratonas/${id}/sessao`, { replace: true }));
    }
  }, [left, id, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#14141F,#1E1E2E)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
      <div style={{ marginBottom: 56 }}><Brand light size={48} /></div>
      <div className="mont" style={{ fontSize: 14, letterSpacing: '.25em', color: '#8A8B9A', fontWeight: 600 }}>A MARATONA COMEÇA EM</div>
      <div className="mont" style={{ fontSize: 110, fontWeight: 800, letterSpacing: '.02em', margin: '12px 0 8px' }}>{fmtTime(left)}</div>
      {m && <div style={{ color: '#8A8B9A' }}>{m.title} · {m.questionsPerSession} questões · {m.durationMinutes} minutos</div>}
      <div style={{ background: 'rgba(251,109,29,.12)', border: '1px solid rgba(251,109,29,.4)', borderRadius: 16, padding: '24px 32px', marginTop: 48, maxWidth: 560 }}>
        <div className="mont" style={{ color: 'var(--orange)', fontWeight: 700, marginBottom: 8 }}>💡 Conselho</div>
        <div style={{ fontSize: 17 }}>{TIPS[tip]}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
        {TIPS.map((_, i) => (
          <div key={i} style={{ width: i === tip ? 24 : 6, height: 6, borderRadius: 99, background: i === tip ? 'var(--orange)' : '#3A3A4A', transition: 'width .3s' }} />
        ))}
      </div>
      <div className="xs" style={{ color: '#8A8B9A', marginTop: 56 }}>O início é automático. Boa sorte! 🍀</div>
    </div>
  );
}
