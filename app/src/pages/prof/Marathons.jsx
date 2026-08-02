// Lista de maratonas do professor + botão para criar nova.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProfOverview, openDraft, newDraft, getMarathonPassword, broadcastMarathonPassword } from './profDeps.js';
import { ProfTopbar, Pill } from '../../components/ProfUi.jsx';
import { Badge } from '../../components/Ui.jsx';

export default function ProfMarathons() {
  const [marathons, setMarathons] = useState([]);
  const [filter, setFilter] = useState('all');
  const [copiedFor, setCopiedFor] = useState(null);
  const [pwError, setPwError] = useState('');
  const [sendingFor, setSendingFor] = useState(null);
  const [sentFor, setSentFor] = useState(null);

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
                </>
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
