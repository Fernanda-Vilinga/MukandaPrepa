// Lista de maratonas do professor + botão para criar nova.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProfOverview, openDraft, newDraft } from './profDeps.js';
import { ProfTopbar, Pill } from '../../components/ProfUi.jsx';
import { Badge } from '../../components/Ui.jsx';

export default function ProfMarathons() {
  const [marathons, setMarathons] = useState([]);
  const [filter, setFilter] = useState('all');

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
                  {m.status === 'draft' ? <Badge status="soon" /> : <Badge status="active" />}
                </div>
                <div className="mut sm" style={{ marginTop: 4 }}>
                  {m.status === 'draft'
                    ? <>{m.questionsUploaded}/15 questões carregadas · não publicada <Pill kind="gray">rascunho</Pill></>
                    : `${m.durationMinutes} min · ${m.questionsPerSession} questões por sessão · fecha ${m.accessEnd} · ${m.participants} participantes`}
                </div>
              </div>
              {m.status === 'draft' ? (
                <Link to="/prof/maratonas/nova" className="btn sm" style={{ textDecoration: 'none' }} onClick={() => openDraft(m.id)}>Continuar</Link>
              ) : (
                <>
                  <Link to="/prof/monitorizacao" className="btn sm blue" style={{ textDecoration: 'none' }}>Monitorizar</Link>
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
