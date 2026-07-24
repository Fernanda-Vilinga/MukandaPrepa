// Sessão de maratona: questões uma a uma + revisão final + submissão.
// Countdown global, auto-save, submissão automática no fim do tempo (spec).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMarathon, activeSession, savedAnswers, saveAnswers, submitSession } from '../services/api.js';
import { Brand, Timer, ImagePh } from '../components/Ui.jsx';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function Session() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [m, setM] = useState(null);
  const [session] = useState(() => activeSession());
  const [answers, setAnswers] = useState(() => savedAnswers());
  const [idx, setIdx] = useState(0);
  const [review, setReview] = useState(false);
  const [left, setLeft] = useState(() => {
    if (!session) return 0;
    const elapsed = (Date.now() - session.startedAt) / 1000;
    return Math.max(0, session.durationSeconds - elapsed);
  });
  const [savedAt, setSavedAt] = useState(null);
  const submitting = useRef(false);

  useEffect(() => { getMarathon(id).then(setM); }, [id]);
  useEffect(() => { if (!session) navigate(`/maratonas/${id}`, { replace: true }); }, [session, id, navigate]);

  // countdown global
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, []);

  const doSubmit = useCallback(async (auto = false) => {
    if (submitting.current) return;
    submitting.current = true;
    await submitSession();
    navigate(`/maratonas/${id}/submetido${auto ? '?auto=1' : ''}`, { replace: true });
  }, [id, navigate]);

  // submissão automática quando o tempo esgota
  useEffect(() => { if (left <= 0 && session) doSubmit(true); }, [left, session, doSubmit]);

  if (!session || !m) return null;

  const qs = session.questions;
  const q = qs[idx];
  const setAnswer = (value) => {
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    saveAnswers(next); // auto-save
    setSavedAt(Date.now());
  };
  const answered = (question) => {
    const a = answers[question.id];
    return a != null && a !== '';
  };
  const missing = qs.filter((x) => !answered(x));

  return (
    <>
      <header className="topbar" style={{ gap: 24 }}>
        <Brand size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mont" style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
          <div className="prog" style={{ marginTop: 8, maxWidth: 520 }}>
            <div style={{ width: `${((review ? qs.length : idx + 1) / qs.length) * 100}%` }} />
          </div>
        </div>
        <div className="mut" style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}>
          {review ? 'Revisão final' : `Questão ${idx + 1} de ${qs.length}`}
        </div>
        <Timer seconds={left} />
      </header>

      {!review ? (
        <div className="wrap" style={{ maxWidth: 960 }}>
          <div className="card" style={{ padding: 36 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div className="mont" style={{ fontWeight: 700, fontSize: 17 }}>
                Questão {idx + 1}{' '}
                <span className="mut" style={{ fontWeight: 500 }}>
                  · {q.type === 'mcq' ? 'Múltipla escolha' : q.type === 'text' ? 'Resposta escrita' : 'Upload de fotografia'}
                </span>
              </div>
              <span className="badge end">1 valor</span>
            </div>

            {/* TODO: quando q.imageUrl existir, renderizar <img src={q.imageUrl} …/> */}
            <div style={{ marginBottom: 28 }}>
              {q.imageUrl ? <img src={q.imageUrl} alt={`Questão ${idx + 1}`} style={{ width: '100%', borderRadius: 12 }} /> : <ImagePh height={280} />}
            </div>

            {q.type === 'mcq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {q.options.map((opt, i) => (
                  <button key={i} className={`opt ${answers[q.id] === i ? 'sel' : ''}`} onClick={() => setAnswer(i)}>
                    <span className="k">{LETTERS[i]}</span>{opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'text' && (
              <>
                <label className="label">📝 Escreve a tua resposta</label>
                <textarea
                  className="input"
                  style={{ height: 160, resize: 'vertical' }}
                  maxLength={2000}
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Desenvolve aqui a tua resposta…"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }} className="xs mut">
                  <span>Corrigida manualmente pelo professor</span>
                  <span>{(answers[q.id] ?? '').length} / 2000 caracteres</span>
                </div>
              </>
            )}

            {q.type === 'photo' && (
              <>
                <label className="label">📷 Faz upload da resolução em papel</label>
                {!answers[q.id] ? (
                  <label style={{ display: 'block', border: '2px dashed var(--orange)', background: 'var(--orange-l)', borderRadius: 14, padding: 36, textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
                    <div style={{ fontWeight: 600 }}>Arrasta a fotografia para aqui ou clica para escolher</div>
                    <div className="xs mut" style={{ marginTop: 10 }}>JPG ou PNG · máx. 10 MB · podes substituir antes de submeter</div>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && setAnswer(e.target.files[0].name)} />
                  </label>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg)', borderRadius: 12, padding: '12px 16px' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: '#D8D8DE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🖼</div>
                    <div style={{ flex: 1 }}>
                      <div className="sm" style={{ fontWeight: 600 }}>{answers[q.id]}</div>
                      <div className="xs mut">carregada agora</div>
                    </div>
                    <button className="btn sm ghost" onClick={() => setAnswer('')}>Substituir</button>
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
              <button className="btn ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Anterior</button>
              <div className="sm" style={{ color: 'var(--green)', fontWeight: 500 }}>
                {savedAt ? '✓ Resposta guardada automaticamente' : 'As respostas são guardadas automaticamente'}
              </div>
              {idx < qs.length - 1
                ? <button className="btn" onClick={() => setIdx(idx + 1)}>Seguinte →</button>
                : <button className="btn green" onClick={() => setReview(true)}>Rever respostas ✓</button>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <div className="qmap">
              {qs.map((question, i) => (
                <button
                  key={question.id}
                  className={`qdot ${i === idx ? 'cur' : answered(question) ? 'done' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIdx(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="wrap" style={{ maxWidth: 1080 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Revê as tuas respostas</h1>
          <p className="mut" style={{ marginBottom: 28 }}>Depois de submeteres, as respostas ficam bloqueadas e o professor é notificado.</p>
          <div className="row" style={{ marginBottom: 24, gap: 16 }}>
            {qs.map((question, i) => {
              const ok = answered(question);
              return (
                <div key={question.id} className="col" style={{ border: `1.5px solid ${ok ? 'var(--green)' : 'var(--amber)'}`, background: ok ? 'var(--green-l)' : 'var(--amber-l)', borderRadius: 14, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="mont" style={{ fontWeight: 700 }}>Questão {i + 1}</div>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: ok ? 'var(--green)' : '#B45309', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{ok ? '✓' : '!'}</div>
                  </div>
                  <div className="xs mut" style={{ marginTop: 6 }}>
                    {question.type === 'mcq' ? 'Múltipla escolha' : question.type === 'text' ? 'Resposta escrita' : 'Upload de foto'}
                  </div>
                  <div className="sm" style={{ fontWeight: 600, color: ok ? 'var(--green)' : '#B45309', marginTop: 10 }}>
                    {ok
                      ? question.type === 'mcq' ? `Respondida — ${LETTERS[answers[question.id]]}` : 'Respondida'
                      : '⚠ Em falta'}
                  </div>
                  <button className="xs" style={{ color: 'var(--blue)', fontWeight: 500, background: 'none', border: 'none', padding: 0, marginTop: 6 }} onClick={() => { setIdx(i); setReview(false); }}>
                    Rever →
                  </button>
                </div>
              );
            })}
          </div>
          {missing.length > 0 && (
            <div className="card" style={{ borderLeft: '5px solid var(--amber)', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <div style={{ fontSize: 26 }}>⚠️</div>
              <div>
                <b>{missing.length === 1 ? 'Há 1 questão em falta.' : `Há ${missing.length} questões em falta.`}</b>{' '}
                <span className="mut">Podes voltar atrás e responder, ou submeter mesmo assim — as questões em branco contam como não respondidas.</span>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn ghost" onClick={() => setReview(false)}>← Voltar às questões</button>
            <button className="btn green" style={{ padding: '16px 40px' }} onClick={() => doSubmit(false)}>Submeter definitivamente ✓</button>
          </div>
        </div>
      )}
    </>
  );
}
