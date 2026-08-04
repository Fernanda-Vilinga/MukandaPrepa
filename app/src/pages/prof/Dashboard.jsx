import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProfOverview, getSubmissions, getProfChats, currentUser, openDraft, newDraft } from './profDeps.js';
import { ProfTopbar, Pill } from '../../components/ProfUi.jsx';
import { Stat, Badge } from '../../components/Ui.jsx';
export default function ProfDashboard() {
  const user = currentUser();
  const [ov, setOv] = useState(null);
  const [subs, setSubs] = useState([]);
  const [chats, setChats] = useState([]);
  const [erro, setErro] = useState("");

  // Sem tratamento de erro, uma falha da API deixava `ov` a null para sempre
  // e a página ficava em branco — sem nada que dissesse ao professor o que
  // aconteceu. As submissões e os chats são acessórios: se falharem, o
  // dashboard continua a abrir.
  useEffect(() => {
    getProfOverview()
      .then(setOv)
      .catch((e) => setErro(e.message || 'Não foi possível carregar o painel.'));
    getSubmissions().then((s) => setSubs(s.filter((x) => x.status === 'pending').slice(0, 3))).catch(() => {});
    getProfChats().then((c) => setChats(c.filter((x) => x.unread > 0))).catch(() => {});
  }, []);

  if (erro) {
    return (
      <>
        <ProfTopbar />
        <div className="wrap" style={{ maxWidth: 620 }}>
          <div className="card" style={{ borderLeft: "5px solid var(--red)" }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8 }}>Não foi possível carregar o painel</h2>
            <p className="mut sm" style={{ marginBottom: 18 }}>{erro}</p>
            <button className="btn" onClick={() => window.location.reload()}>Tentar de novo</button>
          </div>
        </div>
      </>
    );
  }

  if (!ov) return <ProfTopbar />;
  const firstName = (user?.name ?? 'Professor').split(' ')[0];

  return (
    <>
      <ProfTopbar />
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>Bom dia, Prof. {firstName} 👋</h1>
            <div className="mut">
              Tens {ov.pendingValidations} submissões pendentes de validação e {ov.connectedNow} alunos conectados agora.
            </div>
          </div>
          <Link to="/prof/maratonas/nova" className="btn" style={{ textDecoration: 'none' }} onClick={() => newDraft()}>+ Nova maratona</Link>
        </div>

        <div className="row" style={{ marginBottom: 24 }}>
          <Stat value={ov.marathons.filter((m) => m.status === 'active').length} label="Maratonas activas" />
          <Stat value={ov.connectedNow} label="Alunos conectados agora" color="var(--green)" />
          <Stat value={ov.pendingValidations} label="Submissões por validar" color="var(--orange)" style={{ borderTop: '4px solid var(--orange)' }} />
          <Stat value={ov.unreadChats} label="Chats não lidos" color="var(--blue)" />
        </div>

        <div className="row">
          <div className="col" style={{ flex: 1.6 }}>
            <div className="card">
              <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 18 }}>As tuas maratonas</h3>
              {ov.marathons.map((m) => (
                <div key={m.id} style={{ border: '1.5px solid var(--brd)', borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 18, marginBottom: 14, flexWrap: 'wrap' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: m.status === 'draft' ? '#EEEEF0' : 'var(--orange-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{m.icon}</div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 600 }}>
                      {m.title} {m.status === 'draft' && <Pill kind="gray">rascunho</Pill>}
                    </div>
                    <div className="mut sm">
                      {m.status === 'draft'
                        ? `${m.questionsUploaded}/15 questões carregadas · não publicada`
                        : `${m.durationMinutes} min · fecha ${m.accessEnd} · ${m.participants} participantes${m.connectedNow ? ` · ${m.connectedNow} conectados agora` : ''}`}
                    </div>
                  </div>
                  {m.status === 'draft' ? (
                    <>
                      <Badge status="soon" />
                      <Link to="/prof/maratonas/nova" className="btn sm" style={{ textDecoration: 'none' }} onClick={() => openDraft(m.id)}>Continuar</Link>
                    </>
                  ) : (
                    <>
                      {/* Estava fixo em 'active': qualquer maratona não-rascunho
                          aparecia como activa, mesmo com a janela de acesso ainda
                          fechada — enquanto o aluno via 'Em breve'. O estado vem do
                          servidor (statusEfectivo), que compara a hora com a janela. */}
                      <Badge status={m.status} />
                      <Link to={`/prof/monitorizacao/${m.id}`} className="btn sm blue" style={{ textDecoration: 'none' }}>Monitorizar</Link>
                      <Link to={`/prof/estatisticas/${m.id}`} className="btn sm ghost" style={{ textDecoration: 'none' }}>Estatísticas</Link>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="col">
            <div className="card" style={{ borderTop: '4px solid var(--orange)', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 16.5, fontWeight: 700 }}>Fila de validação</h3>
                <span className="badge" style={{ background: 'var(--orange)', color: '#fff' }}>{ov.pendingValidations}</span>
              </div>
              {subs.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < subs.length - 1 ? '1px solid #EFEFF2' : 'none' }}>
                  <div className="avatar" style={{ width: 34, height: 34, fontSize: 13, background: s.color }}>{s.initials}</div>
                  <div style={{ flex: 1 }} className="sm">
                    <b>{s.student}</b>
                    <div className="xs mut">{s.marathon.split('—')[1] ?? s.marathon} · {s.submittedAgo}</div>
                  </div>
                  <Link to={`/prof/validacao/${s.id}`} className="btn sm" style={{ textDecoration: 'none' }}>Validar</Link>
                </div>
              ))}
              <Link to="/prof/validacao" className="sm" style={{ display: 'block', textAlign: 'center', marginTop: 14, color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}>Ver fila completa →</Link>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 12 }}>💬 Alertas de chat</h3>
              <div className="sm" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {chats.map((c) => (
                  <Link key={c.id} to="/prof/chats" style={{ background: 'var(--blue-l)', borderRadius: 10, padding: '10px 14px', textDecoration: 'none' }}>
                    <b>{c.student}</b> · {c.ref ? `dúvida na ${c.ref}` : 'nova mensagem'} <span className="xs mut">{c.last}</span>
                  </Link>
                ))}
                {chats.length === 0 && <span className="mut">Sem mensagens por ler.</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
