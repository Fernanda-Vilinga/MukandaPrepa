// Validar submissão — questão + resposta lado a lado, feedback por questão.
// MCQ pré-marcada automaticamente (professor confirma); texto/foto: manual.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getSubmission, confirmValidation } from './profDeps.js';
import { ProfTopbar, Pill } from '../../components/ProfUi.jsx';
import { ImagePh } from '../../components/Ui.jsx';

const LETTERS = 'ABCD';

export default function Validate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [idx, setIdx] = useState(0);
  const [marks, setMarks] = useState({});     // n -> true/false
  const [feedback, setFeedback] = useState({}); // n -> texto
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSubmission(id).then((s) => {
      setSub(s);
      // MCQ pré-corrigidas automaticamente
      const pre = {};
      s.answers.forEach((a) => {
        if (a.type === 'mcq') pre[a.n] = a.selected === a.correctIndex;
      });
      setMarks(pre);
    }).catch(() => navigate('/prof/validacao'));
  }, [id, navigate]);

  if (!sub) return <ProfTopbar />;

  const a = sub.answers[idx];
  const validatedCount = Object.keys(marks).length;
  const allMarked = sub.answers.every((x) => marks[x.n] != null);

  const confirm = async () => {
    setBusy(true);
    await confirmValidation(id, {
      answers: sub.answers.map((x) => ({ n: x.n, correct: !!marks[x.n], feedback: feedback[x.n] ?? '' })),
    });
    navigate('/prof/validacao', { replace: true });
  };

  const typeLabel = { mcq: 'Múltipla escolha', text: 'Resposta escrita', photo: 'Upload de fotografia' };

  return (
    <>
      <ProfTopbar />
      <div className="wrap" style={{ maxWidth: 1180 }}>
        <div className="sm mut" style={{ marginBottom: 14 }}>
          <Link to="/prof/validacao" style={{ textDecoration: 'none' }}>Validação</Link> →{' '}
          <b style={{ color: 'var(--dark)' }}>{sub.student} · {sub.marathon} · {sub.attempt}ª tentativa</b>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div className="qmap">
            {sub.answers.map((x, i) => (
              <button
                key={x.n}
                className={`qdot ${i === idx ? 'cur' : marks[x.n] != null ? 'done' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setIdx(i)}
              >
                {x.n}
              </button>
            ))}
          </div>
          <span className="sm mut">Avaliadas: <b style={{ color: 'var(--dark)' }}>{validatedCount} de {sub.answers.length}</b></span>
        </div>

        <div className="row">
          <div className="col" style={{ flex: 1.3 }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                  Questão {a.n} <span className="mut" style={{ fontWeight: 500 }}>· {typeLabel[a.type]}</span>
                </h3>
                {a.type === 'mcq'
                  ? <Pill kind="mcq">☑ pré-corrigida automática</Pill>
                  : <Pill kind={a.type === 'text' ? 'txt' : 'foto'}>{a.type === 'text' ? '📝' : '📷'} avaliação manual</Pill>}
              </div>
              <ImagePh height={200} />
              <div style={{ marginTop: 18 }}>
                <label className="label">Resposta do aluno</label>
                {a.type === 'mcq' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {a.options.map((opt, i) => {
                      const isSel = a.selected === i;
                      const isCorrect = a.correctIndex === i;
                      return (
                        <div key={i} className="opt" style={{
                          padding: '10px 14px',
                          borderColor: isSel ? (isCorrect ? 'var(--green)' : 'var(--red)') : isCorrect ? 'var(--green)' : 'var(--brd)',
                          background: isSel ? (isCorrect ? 'var(--green-l)' : 'var(--red-l)') : '#fff',
                        }}>
                          <span className="k">{LETTERS[i]}</span>
                          <span className="sm" style={{ flex: 1 }}>{opt}</span>
                          {isSel && <b className="xs">{isCorrect ? '✓ escolhida (correcta)' : '✗ escolhida'}</b>}
                          {!isSel && isCorrect && <b className="xs" style={{ color: 'var(--green)' }}>correcta</b>}
                        </div>
                      );
                    })}
                    {a.selected == null && <div className="sm mut" style={{ background: 'var(--amber-l)', color: '#B45309', borderRadius: 10, padding: '10px 14px' }}>⚠ Questão não respondida.</div>}
                  </div>
                )}
                {a.type === 'text' && (
                  <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16 }} className="sm">
                    {a.textAnswer}
                    <div className="xs mut" style={{ marginTop: 8 }}>{a.chars} caracteres</div>
                  </div>
                )}
                {a.type === 'photo' && (
                  a.photoUrl ? (
                    <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 12 }}>
                      {/* "Ampliar" era um botão sem função. Abrir num separador
                          novo dá o zoom do próprio browser, que é o que o
                          professor precisa para ler contas escritas à mão. */}
                      <a href={a.photoUrl} target="_blank" rel="noopener noreferrer" title="Abrir em tamanho real">
                        <img
                          src={a.photoUrl}
                          alt="Resolução do aluno"
                          style={{ width: '100%', maxHeight: 460, objectFit: 'contain', borderRadius: 10, background: '#fff', display: 'block' }}
                        />
                      </a>
                      <div className="xs mut" style={{ marginTop: 8 }}>Clica na imagem para a ver em tamanho real.</div>
                    </div>
                  ) : (
                    <div className="sm mut" style={{ background: 'var(--amber-l)', color: '#B45309', borderRadius: 10, padding: '10px 14px' }}>
                      ⚠ O aluno não enviou fotografia nesta questão.
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="col">
            <div className="card" style={{ borderTop: '4px solid var(--orange)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Avaliação</h3>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button
                  onClick={() => setMarks((m) => ({ ...m, [a.n]: true }))}
                  style={{
                    flex: 1, borderRadius: 12, padding: 14, textAlign: 'center', fontWeight: 700,
                    border: marks[a.n] === true ? '2px solid var(--green)' : '1.5px solid var(--brd)',
                    background: marks[a.n] === true ? 'var(--green-l)' : '#fff',
                    color: marks[a.n] === true ? 'var(--green)' : 'var(--mut)',
                  }}
                >
                  ✓ Correcta
                </button>
                <button
                  onClick={() => setMarks((m) => ({ ...m, [a.n]: false }))}
                  style={{
                    flex: 1, borderRadius: 12, padding: 14, textAlign: 'center', fontWeight: 700,
                    border: marks[a.n] === false ? '2px solid var(--red)' : '1.5px solid var(--brd)',
                    background: marks[a.n] === false ? 'var(--red-l)' : '#fff',
                    color: marks[a.n] === false ? 'var(--red)' : 'var(--mut)',
                  }}
                >
                  ✗ Incorrecta
                </button>
              </div>
              <label className="label">Feedback para o aluno <span className="mut" style={{ fontWeight: 400 }}>(recomendado)</span></label>
              <textarea
                className="input"
                style={{ height: 'clamp(88px, 18vh, 110px)', resize: 'vertical', marginBottom: 16 }}
                value={feedback[a.n] ?? ''}
                onChange={(e) => setFeedback((f) => ({ ...f, [a.n]: e.target.value }))}
                placeholder="Ex.: Boa justificação, faltou apenas…"
              />
              {idx < sub.answers.length - 1 && (
                <button className="btn sm ghost" style={{ width: '100%' }} onClick={() => setIdx(idx + 1)}>
                  Guardar e ir para a Q{sub.answers[idx + 1].n} →
                </button>
              )}
            </div>

            <div className="card" style={{ marginTop: 20, background: 'var(--blue-l)' }}>
              <div className="sm">
                <b>☑ MCQ pré-corrigidas:</b> marcadas automaticamente pelo sistema. Confirma ou altera antes de fechar a validação.
              </div>
            </div>

            <button className="btn green" style={{ width: '100%', marginTop: 20, padding: 16 }} disabled={!allMarked || busy} onClick={confirm}>
              {busy ? 'A confirmar…' : allMarked ? 'Confirmar validação e notificar aluno ✓' : `Avalia as ${sub.answers.length - validatedCount} questões em falta`}
            </button>
            <div className="xs mut" style={{ textAlign: 'center', marginTop: 10 }}>O aluno recebe o resultado por email + dashboard.</div>
          </div>
        </div>
      </div>
    </>
  );
}
