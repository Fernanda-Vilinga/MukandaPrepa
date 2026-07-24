import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getResult, currentUser } from '../services/api.js';
import { Topbar } from '../components/Ui.jsx';
import { ChatFab } from '../components/Chat.jsx';
import { openPlans } from '../components/PlanModal.jsx';
import { PLAN_ATTEMPTS, PLAN_LABEL } from '../data/mock.js';

export default function ResultDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = currentUser();
  const [r, setR] = useState(null);
  const maxAtt = PLAN_ATTEMPTS[user?.plan ?? 'basic'];

  useEffect(() => { getResult(id).then(setR).catch(() => navigate('/resultados')); }, [id, navigate]);
  if (!r) return null;

  const canRetry = maxAtt === Infinity || r.attempt < maxAtt;

  return (
    <>
      <Topbar />
      <div className="wrap" style={{ maxWidth: 1080 }}>
        <div className="sm mut" style={{ marginBottom: 16 }}>
          <Link to="/resultados" style={{ textDecoration: 'none' }}>Resultados</Link> →{' '}
          <b style={{ color: 'var(--dark)' }}>{r.marathonTitle} · {r.attempt}ª tentativa</b>
        </div>

        <div className="card" style={{ background: 'var(--dark)', color: '#fff', display: 'flex', alignItems: 'center', gap: 32, padding: '32px 36px', marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="xs" style={{ color: '#8A8B9A', letterSpacing: '.15em' }}>RESULTADO VALIDADO ✓</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>{r.marathonTitle}</h1>
            <div className="sm" style={{ color: '#B9BAC6', marginTop: 4 }}>
              Validada por {r.validatedBy} · {r.date} · também enviada por email
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ background: 'rgba(251,109,29,.15)', border: '1px solid var(--orange)', borderRadius: 14, padding: '16px 24px', textAlign: 'center' }}>
              <div className="mont" style={{ fontSize: 30, fontWeight: 800, color: 'var(--orange)' }}>{r.score}/{r.total}</div>
              <div className="xs" style={{ color: '#B9BAC6' }}>NOTA</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 14, padding: '16px 24px', textAlign: 'center' }}>
              <div className="mont" style={{ fontSize: 30, fontWeight: 800 }}>{r.percent}%</div>
              <div className="xs" style={{ color: '#B9BAC6' }}>ACERTOS</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 14, padding: '16px 24px', textAlign: 'center' }}>
              <div className="mont" style={{ fontSize: 30, fontWeight: 800 }}>#{r.rank}</div>
              <div className="xs" style={{ color: '#B9BAC6' }}>RANKING</div>
            </div>
          </div>
        </div>

        {r.answers.map((a) => (
          <div key={a.n} style={{ border: '1px solid var(--brd)', background: '#fff', borderRadius: 14, padding: '20px 24px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="mont" style={{ fontWeight: 700 }}>
                Questão {a.n}{' '}
                <span className="mut sm" style={{ fontWeight: 500 }}>
                  · {a.type === 'mcq' ? 'Múltipla escolha' : a.type === 'text' ? 'Resposta escrita' : 'Upload de foto'}
                </span>
              </div>
              <span className="badge" style={a.correct ? { background: 'var(--green-l)', color: 'var(--green)' } : { background: 'var(--red-l)', color: 'var(--red)' }}>
                {a.correct ? '✓ Correcta' : '✗ Incorrecta'}
              </span>
            </div>
            <div className="sm" style={{ marginTop: 8 }}><span className="mut">A tua resposta:</span> {a.answer}</div>
            {a.feedback && (
              <div className="sm" style={{ marginTop: 10, background: 'var(--bg)', borderLeft: '3px solid var(--orange)', borderRadius: '0 10px 10px 0', padding: '10px 14px' }}>
                <b>Feedback do professor:</b> {a.feedback}
              </div>
            )}
          </div>
        ))}

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            {canRetry ? (
              <>
                <b>Ainda tens tentativas disponíveis ({r.attempt + 1}ª{maxAtt !== Infinity && ` de ${maxAtt}`} — plano {PLAN_LABEL[user?.plan]}).</b>
                <div className="mut sm">Novo sorteio de questões aleatórias do mesmo banco de 15.</div>
              </>
            ) : (
              <>
                <b>Atingiste o limite de tentativas do plano {PLAN_LABEL[user?.plan]}.</b>
                <div className="mut sm">Faz upgrade para Plus ou Premium para repetir maratonas.</div>
              </>
            )}
          </div>
          {canRetry
            ? <Link to={`/maratonas/${r.marathonId}`} className="btn blue" style={{ textDecoration: 'none' }}>🔁 Repetir maratona</Link>
            : <button className="btn blue" onClick={openPlans}>Fazer upgrade</button>}
        </div>
      </div>
      <ChatFab />
    </>
  );
}
