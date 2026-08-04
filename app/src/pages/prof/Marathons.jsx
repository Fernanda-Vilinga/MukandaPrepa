// Lista de maratonas do professor + botão para criar nova.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProfOverview, openDraft, newDraft, getMarathonPassword, broadcastMarathonPassword, deleteMarathon, updateMarathon } from './profDeps.js';
import { ProfTopbar, Pill } from '../../components/ProfUi.jsx';
import { Badge } from '../../components/Ui.jsx';

export default function ProfMarathons() {
  const [marathons, setMarathons] = useState([]);
  const [filter, setFilter] = useState('all');
  const [copiedFor, setCopiedFor] = useState(null);
  const [pwError, setPwError] = useState('');
  const [sendingFor, setSendingFor] = useState(null);
  const [sentFor, setSentFor] = useState(null);
  const [confirmarApagar, setConfirmarApagar] = useState(null);
  const [apagando, setApagando] = useState(null);
  const [editarFor, setEditarFor] = useState(null);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(null);

  const copyPassword = async (m) => {
    setPwError('');
    try {
      const password = await getMarathonPassword(m.id);
      await navigator.clipboard.writeText(password);
      setCopiedFor(m.id);
      setTimeout(() => setCopiedFor(null), 2000);
    } catch (err) {
      setPwError(err.message);
    }
  };

  const sendPasswordToChat = async (m) => {
    setPwError('');
    setSendingFor(m.id);
    try {
      const { enviados } = await broadcastMarathonPassword(m.id);
      setSentFor({ id: m.id, enviados });
      setTimeout(() => setSentFor(null), 3000);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setSendingFor(null);
    }
  };

  // Abre o painel de edição já preenchido com os valores actuais. As datas
  // vêm em ISO e o campo datetime-local só aceita "AAAA-MM-DDTHH:MM".
  const paraCampoData = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');

  const abrirEdicao = (m) => {
    setPwError('');
    setEditarFor(m.id);
    setForm({ ...valoresDe(m), password: '' });
  };

  const valoresDe = (m) => ({
    title: m.edit?.title ?? '',
    discipline: m.edit?.discipline ?? '',
    area: m.edit?.area ?? '',
    description: m.edit?.description ?? '',
    duration: m.edit?.duration ?? 60,
    perSession: m.edit?.perSession ?? 5,
    start: paraCampoData(m.edit?.start),
    end: paraCampoData(m.edit?.end),
  });

  // Um campo bloqueado por haver tentativas volta a ficar editável se estiver
  // VAZIO — preencher o que falta é reparar a maratona, não alterá-la. É o
  // servidor que aplica esta regra; aqui só se espelha para não desactivar um
  // campo que ele aceitaria.
  const bloqueado = (m, campo) => m.hasAttempts && !!valoresDe(m)[campo];

  // Envia SÓ o que mudou. É o que permite editar um campo isolado sem tocar no
  // resto — e evita bater nas regras do servidor por campos que nem se mexeu.
  const guardarEdicao = async (m) => {
    setPwError('');
    const original = valoresDe(m);

    const mudou = {};
    for (const k of Object.keys(original)) {
      if (String(form[k] ?? '') !== String(original[k] ?? '')) mudou[k] = form[k];
    }
    if (form.password?.trim()) mudou.password = form.password.trim().toUpperCase();

    if (!Object.keys(mudou).length) {
      setEditarFor(null);
      return;
    }

    setGuardando(m.id);
    try {
      await updateMarathon(m.id, mudou);
      const { marathons } = await getProfOverview();
      setMarathons(marathons);
      setEditarFor(null);
      if (mudou.password) {
        await navigator.clipboard.writeText(mudou.password).catch(() => {});
        setCopiedFor(m.id);
        setTimeout(() => setCopiedFor(null), 2500);
      }
    } catch (err) {
      setPwError(err.message);
    } finally {
      setGuardando(null);
    }
  };

  // Apagar é irreversível, por isso pede confirmação no próprio cartão em vez
  // de uma janela do browser — assim continua a ver-se qual é a maratona.
  const apagar = async (m) => {
    setPwError('');
    setApagando(m.id);
    try {
      await deleteMarathon(m.id);
      setMarathons((todas) => todas.filter((x) => x.id !== m.id));
      setConfirmarApagar(null);
    } catch (err) {
      // O servidor recusa se algum aluno já tiver tentado. A razão vem de lá,
      // com a contagem — é mais útil do que um "não foi possível".
      setPwError(err.message);
      setConfirmarApagar(null);
    } finally {
      setApagando(null);
    }
  };

  useEffect(() => { getProfOverview().then((ov) => setMarathons(ov.marathons)); }, []);

  const list = marathons.filter((m) => filter === 'all' || m.status === filter);

  return (
    <>
      <ProfTopbar />
      <div className="wrap" style={{ maxWidth: 1080 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>As tuas maratonas</h1>
            <div className="mut sm">{marathons.length} criadas · geridas por ti</div>
          </div>
          <Link to="/prof/maratonas/nova" className="btn" style={{ textDecoration: 'none' }} onClick={() => newDraft()}>+ Nova maratona</Link>
        </div>

        {pwError && (
          <div className="sm" style={{ background: 'var(--red-l, #fdecec)', color: 'var(--red, #c0392b)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            {pwError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button className={`btn sm ${filter === 'all' ? 'dark' : 'ghost'}`} onClick={() => setFilter('all')}>Todas ({marathons.length})</button>
          <button className={`btn sm ${filter === 'active' ? 'dark' : 'ghost'}`} onClick={() => setFilter('active')}>Activas ({marathons.filter((m) => m.status === 'active').length})</button>
          <button className={`btn sm ${filter === 'draft' ? 'dark' : 'ghost'}`} onClick={() => setFilter('draft')}>Rascunhos ({marathons.filter((m) => m.status === 'draft').length})</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {list.map((m) => (
            <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px 28px', flexWrap: 'wrap' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: m.status === 'draft' ? '#EEEEF0' : 'var(--orange-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{m.icon}</div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>{m.title}</span>
                  {/* Mesmo problema do dashboard: o estado real vem do servidor. */}
                  <Badge status={m.status} />
                </div>
                <div className="mut sm" style={{ marginTop: 4 }}>
                  {m.status === 'draft'
                    ? <>{m.questionsUploaded}/15 questões carregadas · não publicada <Pill kind="gray">rascunho</Pill></>
                    : `${m.durationMinutes} min · ${m.questionsPerSession} questões por sessão · fecha ${m.accessEnd} · ${m.participants} participantes`}
                </div>
                {/* Maratonas criadas antes de existir upload real têm questões
                    marcadas como carregadas mas sem enunciado. Sem este aviso,
                    nada na interface as distingue de uma maratona pronta — e o
                    professor só descobria pelos alunos, no dia. */}
                {m.questionsMissingImage > 0 && (
                  <div className="sm" style={{ marginTop: 8, background: 'var(--red-l)', color: 'var(--red)', borderRadius: 10, padding: '8px 12px' }}>
                    ⚠ {m.questionsMissingImage} {m.questionsMissingImage === 1 ? 'questão está' : 'questões estão'} sem imagem do enunciado.
                    {m.status === 'draft'
                      ? ' Abre-as e carrega a imagem antes de publicar.'
                      : ' Os alunos não conseguem entrar nesta maratona — apaga-a ou carrega as imagens em falta.'}
                  </div>
                )}
              </div>
              {m.status === 'draft' ? (
                <Link to="/prof/maratonas/nova" className="btn sm" style={{ textDecoration: 'none' }} onClick={() => openDraft(m.id)}>Continuar</Link>
              ) : (
                <>
                  <button className="btn sm ghost" onClick={() => copyPassword(m)} title="Copiar a password para partilhar com os alunos">
                    {copiedFor === m.id ? '✓ Copiada!' : '🔑 Copiar password'}
                  </button>
                  <button
                    className="btn sm ghost"
                    onClick={() => sendPasswordToChat(m)}
                    disabled={sendingFor === m.id}
                    title="Enviar a password como mensagem no chat Dúvidas a todos os alunos ligados a esta maratona"
                  >
                    {sendingFor === m.id
                      ? 'A enviar…'
                      : (sentFor && sentFor.id === m.id
                        ? (sentFor.enviados > 0 ? `✓ Enviada a ${sentFor.enviados}` : 'Sem alunos ainda')
                        : '📤 Enviar no chat')}
                  </button>
                  <Link to={`/prof/monitorizacao/${m.id}`} className="btn sm blue" style={{ textDecoration: 'none' }}>Monitorizar</Link>
                  <Link to={`/prof/estatisticas/${m.id}`} className="btn sm ghost" style={{ textDecoration: 'none' }}>Estatísticas</Link>

                  <button className="btn sm ghost" onClick={() => abrirEdicao(m)} title="Editar esta maratona">
                    ✏️ Editar
                  </button>
                </>
              )}

              {/* Painel de edição. O que aparece depende de a maratona já ter
                  sido tentada por algum aluno — e é o servidor que o diz
                  (m.hasAttempts), para a interface não prometer o que ele
                  recusa. */}
              {editarFor === m.id && (
                <div style={{ width: '100%', borderTop: '1.5px solid var(--brd)', marginTop: 16, paddingTop: 18 }}>
                  {m.hasAttempts && (
                    <div className="sm" style={{ background: 'var(--blue-l)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                      ℹ️ Esta maratona já tem tentativas de alunos. Só podes mudar o que não afecta os
                      resultados — e a data de fim, apenas para a <b>adiar</b>. Alterar a duração ou as
                      questões agora tornaria os resultados incomparáveis entre si.
                      <br />Campos que estejam <b>vazios</b> podem ser preenchidos: preencher o que falta é reparar, não alterar.
                    </div>
                  )}

                  <div className="field">
                    <label className="label">Título</label>
                    <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>

                  <div className="row" style={{ gap: 16 }}>
                    <div className="col field">
                      <label className="label">Disciplina</label>
                      <input className="input" value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })} />
                    </div>
                    <div className="col field">
                      {/* A área decide onde a maratona aparece ao aluno e é o
                          que o dashboard dele mostra por baixo do título. */}
                      <label className="label">
                        Área {bloqueado(m, 'area') && <span className="mut" style={{ fontWeight: 400 }}>(bloqueado)</span>}
                      </label>
                      <select
                        className="input"
                        disabled={bloqueado(m, 'area')}
                        value={form.area}
                        onChange={(e) => setForm({ ...form, area: e.target.value })}
                      >
                        <option value="">Escolhe a área</option>
                        <option value="eng">Engenharia e Tecnologia</option>
                        <option value="soc">Ciências Sociais</option>
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Nova password <span className="mut" style={{ fontWeight: 400 }}>(deixa vazio para manter)</span></label>
                    <input
                      className="input"
                      style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1, maxWidth: 260 }}
                      placeholder="••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>

                  <div className="field">
                    <label className="label">Descrição</label>
                    <textarea className="input" style={{ height: 70, resize: 'vertical' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>

                  <div className="row" style={{ gap: 16 }}>
                    <div className="col field">
                      <label className="label">
                        Início {bloqueado(m, 'start') && <span className="mut" style={{ fontWeight: 400 }}>(bloqueado)</span>}
                      </label>
                      <input type="datetime-local" className="input" disabled={bloqueado(m, 'start')} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
                    </div>
                    <div className="col field">
                      <label className="label">
                        Fim {bloqueado(m, 'end') && <span className="mut" style={{ fontWeight: 400 }}>(só para adiar)</span>}
                      </label>
                      <input type="datetime-local" className="input" min={bloqueado(m, 'end') ? valoresDe(m).end : undefined} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
                    </div>
                  </div>

                  <div className="row" style={{ gap: 16 }}>
                    <div className="col field">
                      <label className="label">
                        Duração (min) {bloqueado(m, 'duration') && <span className="mut" style={{ fontWeight: 400 }}>(bloqueado)</span>}
                      </label>
                      <input type="number" min="5" className="input" disabled={bloqueado(m, 'duration')} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                    </div>
                    <div className="col field">
                      <label className="label">
                        Questões por sessão {bloqueado(m, 'perSession') && <span className="mut" style={{ fontWeight: 400 }}>(bloqueado)</span>}
                      </label>
                      <input type="number" min="4" max="5" className="input" disabled={bloqueado(m, 'perSession')} value={form.perSession} onChange={(e) => setForm({ ...form, perSession: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button className="btn sm" disabled={guardando === m.id} onClick={() => guardarEdicao(m)}>
                      {guardando === m.id ? 'A guardar…' : 'Guardar alterações'}
                    </button>
                    <button className="btn sm ghost" onClick={() => setEditarFor(null)}>Cancelar</button>
                  </div>
                </div>
              )}

              {/* Apagar fica sempre à direita e discreto: não é uma acção do
                  dia-a-dia. O servidor recusa se algum aluno já tiver tentado,
                  para não levar com ela submissões e notas. */}
              {confirmarApagar === m.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', width: '100%' }}>
                  <span className="sm" style={{ color: 'var(--red)', fontWeight: 600 }}>
                    Apagar “{m.title}” de vez? Não há como recuperar.
                  </span>
                  <button className="btn sm" style={{ background: 'var(--red)' }} disabled={apagando === m.id} onClick={() => apagar(m)}>
                    {apagando === m.id ? 'A apagar…' : 'Sim, apagar'}
                  </button>
                  <button className="btn sm ghost" onClick={() => setConfirmarApagar(null)}>Cancelar</button>
                </div>
              ) : (
                <button
                  className="btn sm ghost"
                  style={{ color: 'var(--red)', borderColor: 'var(--red-l)' }}
                  onClick={() => setConfirmarApagar(m.id)}
                  title="Só é possível se nenhum aluno tiver tentado esta maratona"
                >
                  🗑 Apagar
                </button>
              )}
            </div>
          ))}
          {list.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--mut)', padding: 48 }}>
              Ainda não tens maratonas nesta categoria.
              <div style={{ marginTop: 16 }}>
                <Link to="/prof/maratonas/nova" className="btn sm" style={{ textDecoration: 'none' }}>+ Criar a primeira</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
