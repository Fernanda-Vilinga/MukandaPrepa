// Sessão de maratona: questões uma a uma + revisão final + submissão.
// Countdown global, auto-save, submissão automática no fim do tempo (spec).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMarathon, activeSession, savedAnswers, saveAnswers, submitSession, observarGuardado, haPorEnviar } from '../services/api.js';
import { uploadFotoResposta } from '../services/imagens.js';
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
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erroFoto, setErroFoto] = useState('');
  const [erroSubmissao, setErroSubmissao] = useState('');
  const [aSubmeter, setASubmeter] = useState(false);
  const [guardado, setGuardado] = useState('guardado');
  const submitting = useRef(false);

  // Ligação à internet, detectada no instante em que cai — os eventos do
  // browser disparam antes de o auto-save sequer tentar. Perder a rede a
  // meio de uma prova cronometrada é o pior momento possível para um aviso
  // discreto: a faixa por baixo do cabeçalho não deixa dúvidas, diz ao aluno
  // exactamente o que fazer (continuar a resolver, não fechar a página), e
  // confirma em verde quando tudo ficou de novo no servidor.
  const [online, setOnline] = useState(() => navigator.onLine);
  const [recuperado, setRecuperado] = useState(false);
  const estavaEmRisco = useRef(false);

  useEffect(() => {
    const ligou = () => setOnline(true);
    const caiu = () => setOnline(false);
    window.addEventListener('online', ligou);
    window.addEventListener('offline', caiu);
    return () => {
      window.removeEventListener('online', ligou);
      window.removeEventListener('offline', caiu);
    };
  }, []);

  useEffect(() => {
    const emRisco = !online || guardado === 'por-guardar';
    if (emRisco) {
      estavaEmRisco.current = true;
      setRecuperado(false);
      return undefined;
    }
    if (estavaEmRisco.current && guardado === 'guardado') {
      estavaEmRisco.current = false;
      setRecuperado(true);
      const t = setTimeout(() => setRecuperado(false), 6000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [online, guardado]);

  // Os dados da maratona só alimentam o cabeçalho (título). Se a chamada
  // falhar a meio da prova, o ecrã ficava em branco PARA SEMPRE — com o
  // cronómetro a correr invisível e as respostas inacessíveis. A prova em si
  // vive no browser (session + auto-save), portanto não depende desta
  // chamada: falhando, segue-se com um título genérico e a prova continua.
  useEffect(() => {
    getMarathon(id)
      .then(setM)
      .catch(() => setM({ title: 'Maratona MUKANDA' }));
  }, [id]);
  useEffect(() => { if (!session) navigate(`/maratonas/${id}`, { replace: true }); }, [session, id, navigate]);

  // countdown global
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => observarGuardado(setGuardado), []);

  // Fechar o separador com respostas por enviar é a forma mais provável de as
  // perder: elas estão só no browser. O aviso do próprio browser é a única
  // maneira de interromper isso a tempo.
  useEffect(() => {
    const avisar = (e) => {
      if (!haPorEnviar()) return;
      e.preventDefault();
      e.returnValue = '';   // exigido para o aviso aparecer
    };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, []);

  // Submeter é o momento em que falhar custa mais — e era o único sem
  // tratamento de erro.
  //
  // O que acontecia sem o try/catch: o pedido rebentava (rede a cair, servidor
  // lento — provável numa ligação móvel a meio de uma prova), o navigate nunca
  // corria, e `submitting.current` ficava em true PARA SEMPRE. Todos os cliques
  // seguintes em "Submeter" saíam em silêncio pela primeira linha. O aluno
  // ficava a carregar no botão, sem mensagem nenhuma, com o tempo a correr.
  //
  // Nota: o submitSession() só limpa a sessão do browser DEPOIS de o servidor
  // responder. Se falhar, fica tudo onde estava e voltar a tentar funciona. E
  // do lado do servidor a operação é idempotente: submeter duas vezes devolve
  // a mesma resposta em vez de erro.
  const doSubmit = useCallback(async (auto = false) => {
    if (submitting.current) return;
    submitting.current = true;
    setErroSubmissao('');
    setASubmeter(true);
    try {
      await submitSession();
      navigate(`/maratonas/${id}/submetido${auto ? '?auto=1' : ''}`, { replace: true });
    } catch (err) {
      submitting.current = false;   // liberta o travão — é isto que destranca o botão
      setASubmeter(false);
      setErroSubmissao(
        auto
          ? `O tempo terminou mas não foi possível confirmar a submissão: ${err.message} `
            + 'As respostas guardadas automaticamente durante a prova já estão no servidor. '
            + 'Tenta de novo para confirmar.'
          // A mensagem do erro já costuma dizer o que fazer ("verifica a tua
          // internet"), por isso aqui só se acrescenta o que ela não diz: que
          // nada se perdeu.
          : `Não foi possível submeter: ${err.message} As tuas respostas continuam guardadas — nada se perdeu.`
      );
    }
  }, [id, navigate]);

  // Submissão automática quando o tempo esgota.
  //
  // O `left` desce de segundo a segundo, portanto este efeito volta a correr a
  // cada segundo depois do fim. Enquanto o doSubmit ficava travado para sempre
  // ao falhar, isso não se notava. Agora que liberta o travão, sem esta guarda
  // passaria a repetir o pedido uma vez por segundo — precisamente contra um
  // servidor que já está a responder mal.
  //
  // Tenta uma vez. Se falhar, o aluno vê o aviso e decide. A prova não se
  // perde: o servidor fecha sozinho as sessões cujo tempo esgotou, com as
  // respostas que recebeu do auto-save.
  const autoSubmetido = useRef(false);
  useEffect(() => {
    if (left > 0 || !session || autoSubmetido.current) return;
    autoSubmetido.current = true;
    doSubmit(true);
  }, [left, session, doSubmit]);

  if (!session || !m) return null;

  const qs = session.questions;
  const q = qs[idx];
  const setAnswer = (value) => {
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    saveAnswers(next); // auto-save
    setSavedAt(Date.now());
  };
  // A fotografia sobe primeiro e só depois é que fica registada como resposta.
  // Guardava-se o nome do ficheiro do telemóvel do aluno — texto que nem o
  // professor conseguia corrigir, porque a imagem nunca saía do aparelho dele.
  const enviarFoto = async (ficheiro) => {
    if (!ficheiro) return;
    setErroFoto('');
    setEnviandoFoto(true);
    try {
      const url = await uploadFotoResposta(session.id, idx, ficheiro);
      setAnswer(url);
    } catch (err) {
      setErroFoto(err.message);
    } finally {
      setEnviandoFoto(false);
    }
  };

  const answered = (question) => {
    const a = answers[question.id];
    return a != null && a !== '';
  };
  const missing = qs.filter((x) => !answered(x));

  return (
    <>
      {/* Marca à esquerda; à direita um bloco com duas zonas — a larga com o
          título e o progresso, a estreita com o cronómetro e a contagem. */}
      <header className="topbar session">
        {/* Em telemóvel a marca sai: durante a prova o espaço é todo preciso
            para o título, o progresso e o cronómetro. */}
        <span className="marca-sessao"><Brand size={36} /></span>
        <div className="sessao-info">
          <div className="sessao-info__principal">
            <div className="mont titulo-sessao">{m.title}</div>
            <div className="prog" style={{ marginTop: 8, maxWidth: 520 }}>
              <div style={{ width: `${((review ? qs.length : idx + 1) / qs.length) * 100}%` }} />
            </div>
          </div>
          <div className="sessao-info__lado">
            <Timer seconds={left} />
            <div className="mut contagem-sessao">
              {review ? 'Revisão final' : `Questão ${idx + 1} de ${qs.length}`}
            </div>
          </div>
        </div>
      </header>

      {/* Faixa de estado da ligação — visível nas duas vistas (questões e
          revisão), cola-se ao topo ao rolar, por cima de tudo. */}
      {(!online || guardado === 'por-guardar') && (
        <div role="alert" style={{ position: 'sticky', top: 0, zIndex: 30, background: 'var(--red)', color: '#fff', padding: '12px 18px', textAlign: 'center', fontWeight: 600, fontSize: 14.5 }}>
          ⚠ {online
            ? 'As tuas respostas ainda não chegaram ao servidor.'
            : 'A tua ligação à internet caiu.'}{' '}
          Continua a resolver — as respostas ficam guardadas neste dispositivo
          e são reenviadas sozinhas assim que a ligação voltar.
          <b> Não feches nem recarregues esta página.</b>
        </div>
      )}
      {recuperado && (
        <div role="status" style={{ position: 'sticky', top: 0, zIndex: 30, background: 'var(--green)', color: '#fff', padding: '10px 18px', textAlign: 'center', fontWeight: 600, fontSize: 14.5 }}>
          ✓ Ligação restabelecida — todas as respostas estão no servidor. Boa prova!
        </div>
      )}

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
                  style={{ height: 'clamp(96px, 22vh, 160px)', resize: 'vertical' }}
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
                {enviandoFoto ? (
                  <div style={{ display: 'block', border: '2px dashed var(--brd)', borderRadius: 14, padding: 36, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>⏳</div>
                    <div style={{ fontWeight: 600 }}>A enviar a fotografia…</div>
                    <div className="xs mut" style={{ marginTop: 10 }}>O cronómetro não pára — mas a imagem é reduzida antes de subir, demora segundos.</div>
                  </div>
                ) : !answers[q.id] ? (
                  <label style={{ display: 'block', border: '2px dashed var(--orange)', background: 'var(--orange-l)', borderRadius: 14, padding: 36, textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
                    <div style={{ fontWeight: 600 }}>Tira uma fotografia ou escolhe do telemóvel</div>
                    <div className="xs mut" style={{ marginTop: 10 }}>JPG ou PNG · podes substituir antes de submeter</div>
                    {/* capture="environment" abre a câmara traseira directamente
                        no telemóvel, que é como a resolução em papel é
                        fotografada. Nos computadores é ignorado. */}
                    <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => enviarFoto(e.target.files[0])} />
                  </label>
                ) : (
                  <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 12 }}>
                    {/* Mostra-se a fotografia, não o nome do ficheiro: é a única
                        forma de o aluno confirmar que saiu legível antes de
                        submeter — e ilegível é nota zero. */}
                    <img
                      src={answers[q.id]}
                      alt="A tua resolução"
                      style={{ width: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 10, background: '#fff' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10 }}>
                      <span className="xs mut">Confere se está legível antes de submeteres.</span>
                      <label className="btn sm ghost" style={{ cursor: 'pointer', flexShrink: 0 }}>
                        Substituir
                        <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => enviarFoto(e.target.files[0])} />
                      </label>
                    </div>
                  </div>
                )}
                {erroFoto && (
                  <div className="sm" style={{ background: 'var(--red-l)', color: 'var(--red)', borderRadius: 10, padding: '10px 14px', marginTop: 10 }}>
                    {erroFoto}
                  </div>
                )}
              </>
            )}

            {/* Quando o tempo esgota, o aluno está AQUI e não no ecrã de
                revisão — por isso o aviso de falha na submissão tem de
                aparecer também nesta vista, com o botão para tentar de novo. */}
            {erroSubmissao && (
              <div className="sm" style={{ background: 'var(--red-l)', color: 'var(--red)', borderRadius: 12, padding: '14px 18px', margin: '16px 0', fontWeight: 500 }}>
                {erroSubmissao}
                <button
                  className="btn sm"
                  style={{ marginTop: 12, background: 'var(--red)' }}
                  disabled={aSubmeter}
                  onClick={() => doSubmit(true)}
                >
                  {aSubmeter ? 'A tentar…' : 'Tentar submeter de novo'}
                </button>
              </div>
            )}

            {/* Os botões ficam nos extremos e o aviso centrado por baixo. Antes
                estava entre os dois e era esmagado a três linhas em telemóvel. */}
            <div className="accoes-sessao">
              <div className="accoes-sessao__botoes">
                <button className="btn ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Anterior</button>
                {idx < qs.length - 1
                  ? <button className="btn" onClick={() => setIdx(idx + 1)}>Seguinte →</button>
                  : <button className="btn green" onClick={() => setReview(true)}>Rever respostas ✓</button>}
              </div>
              {/* Este aviso dizia sempre "guardada", acontecesse o que
                  acontecesse. Agora reflecte o que se passa de facto: o aluno
                  tem direito a saber que as respostas não estão a chegar,
                  enquanto ainda pode fazer alguma coisa quanto a isso. */}
              <div
                className="sm accoes-sessao__aviso"
                style={{
                  fontWeight: guardado === 'por-guardar' ? 600 : 500,
                  color: guardado === 'por-guardar' ? 'var(--red)' : guardado === 'a-guardar' ? 'var(--mut)' : 'var(--green)',
                }}
              >
                {guardado === 'por-guardar'
                  ? '⚠ Sem ligação: as respostas ainda não chegaram ao servidor. Continua a responder — vamos tentar sozinhos. Não feches esta página.'
                  : guardado === 'a-guardar'
                    ? '⏳ A guardar…'
                    : savedAt ? '✓ Resposta guardada automaticamente' : 'As respostas são guardadas automaticamente'}
              </div>
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
          {guardado === 'por-guardar' && !erroSubmissao && (
            <div className="sm" style={{ background: 'var(--amber-l)', color: '#B45309', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontWeight: 500 }}>
              ⚠ Algumas respostas ainda não chegaram ao servidor — estão guardadas apenas neste
              dispositivo. Podes submeter na mesma: a submissão leva tudo de uma vez. Não feches
              esta página antes disso.
            </div>
          )}
          {erroSubmissao && (
            <div className="sm" style={{ background: 'var(--red-l)', color: 'var(--red)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontWeight: 500 }}>
              {erroSubmissao}
            </div>
          )}
          <div className="accoes-sessao__botoes">
            <button className="btn ghost" disabled={aSubmeter} onClick={() => setReview(false)}>← Voltar às questões</button>
            <button className="btn green" style={{ padding: '16px 40px' }} disabled={aSubmeter} onClick={() => doSubmit(false)}>
              {aSubmeter ? 'A submeter…' : erroSubmissao ? 'Tentar submeter de novo ✓' : 'Submeter definitivamente ✓'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
