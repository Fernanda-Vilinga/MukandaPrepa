import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getMarathon, enterMarathon, currentUser } from '../services/api.js';
import { Topbar, Badge, AttemptDots } from '../components/Ui.jsx';
import { PLAN_ATTEMPTS, PLAN_LABEL } from '../data/mock.js';
import { ChatFab } from '../components/Chat.jsx';

const PASS_LEN = 6;

export default function MarathonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = currentUser();
  const [m, setM] = useState(null);
  const [chars, setChars] = useState(Array(PASS_LEN).fill(''));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const maxAtt = PLAN_ATTEMPTS[user?.plan ?? 'basic'];

  useEffect(() => { getMarathon(id).then(setM).catch(() => navigate('/maratonas')); }, [id, navigate]);

  if (!m) return null;

  const setChar = (i, v) => {
    const c = v.slice(-1).toUpperCase();
    setChars((prev) => prev.map((x, j) => (j === i ? c : x)));
    if (c && i < PASS_LEN - 1) document.getElementById(`pw${i + 1}`)?.focus();
  };

  const enter = async () => {
    setError('');
    setBusy(true);
    try {
      await enterMarathon(id, chars.join(''));
      navigate(`/maratonas/${id}/countdown`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const fmt = (d) => new Date(d).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <Topbar />
      <div className="wrap">
        <div className="sm mut" style={{ marginBottom: 16 }}>
          <Link to="/maratonas" style={{ textDecoration: 'none' }}>Maratonas</Link> → <b style={{ color: 'var(--dark)' }}>{m.title}</b>
        </div>
        <div className="row">
          <div className="col" style={{ flex: 1.5 }}>
            <div className="card">
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 }}>
                <Badge status={m.status} />
                <span className="mut sm">acesso até {fmt(m.accessEnd)}</span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>{m.title}</h1>
              <p className="mut">{m.description}</p>
              <div className="row" style={{ marginTop: 24, gap: 16 }}>
                {[['ÁREA', m.area], ['DISCIPLINA', m.discipline], ['DURAÇÃO', `${m.durationMinutes} minutos`], ['QUESTÕES', `${m.questionsPerSession} de 15 (aleatórias)`]].map(([k, v]) => (
                  <div key={k} className="col" style={{ background: 'var(--bg)', borderRadius: 12, padding: 16 }}>
                    <div className="xs mut">{k}</div>
                    <div style={{ fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="sm" style={{ marginTop: 24, background: 'var(--amber-l)', borderRadius: 12, padding: '14px 18px' }}>
                ⚠️ O cronómetro é único e global para toda a sessão. Se o tempo esgotar, as respostas guardadas são submetidas automaticamente.
              </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 16 }}>As tuas tentativas — plano {PLAN_LABEL[user?.plan]}</h3>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                <AttemptDots used={m.attemptsUsed} max={maxAtt} />
                <div className="sm mut">
                  {m.attemptsUsed} usada{m.attemptsUsed !== 1 && 's'} ·{' '}
                  <b style={{ color: 'var(--dark)' }}>
                    esta será a {m.attemptsUsed + 1}ª{maxAtt !== Infinity && ` de ${maxAtt}`}
                  </b>
                </div>
              </div>
            </div>
          </div>

          <div className="col">
            <div className="card" style={{ borderTop: '5px solid var(--orange)' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>🔑 Entrar na maratona</h3>
              <p className="mut sm" style={{ margin: '8px 0 20px' }}>
                Insere a password partilhada pelo professor. Sem ela não é possível aceder.
              </p>
              <label className="label">Password da maratona</label>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {chars.map((c, i) => (
                  <input
                    key={i}
                    id={`pw${i}`}
                    className={`input ${error ? 'err' : ''}`}
                    style={{ width: 52, height: 60, textAlign: 'center', fontSize: 22, fontWeight: 700, padding: 0 }}
                    maxLength={2}
                    value={c}
                    onChange={(e) => setChar(i, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Backspace' && !c && i > 0) document.getElementById(`pw${i - 1}`)?.focus(); }}
                  />
                ))}
              </div>
              {error && <div className="sm" style={{ background: 'var(--red-l)', color: 'var(--red)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>{error}</div>}
              <button className="btn" style={{ width: '100%' }} disabled={busy || m.status !== 'active' || chars.some((c) => !c)} onClick={enter}>
                {busy ? 'A verificar…' : 'Entrar na maratona →'}
              </button>
              <div className="xs mut" style={{ marginTop: 14, textAlign: 'center' }}>Ao entrar, o countdown de preparação inicia de imediato.</div>
            </div>

            <div className="card" style={{ marginTop: 24, background: 'var(--dark)', color: '#fff' }}>
              <div className="mont" style={{ fontWeight: 700, marginBottom: 10 }}>Como funciona</div>
              <div className="sm" style={{ color: '#B9BAC6', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>1 · Countdown de preparação (1-2 min)</div>
                <div>2 · {m.questionsPerSession} questões, uma de cada vez</div>
                <div>3 · Revisão final e submissão</div>
                <div>4 · Validação manual pelo professor</div>
                <div>5 · Resultado por email + dashboard</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ChatFab />
    </>
  );
}
