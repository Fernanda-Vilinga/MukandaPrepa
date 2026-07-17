// Fila de validação — submissões pendentes.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSubmissions } from './profDeps.js';
import { ProfTopbar, Pill } from '../../components/ProfUi.jsx';

export default function Queue() {
  const [subs, setSubs] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { getSubmissions().then(setSubs); }, []);

  const pending = subs.filter((s) => s.status === 'pending');
  const marathons = [...new Set(pending.map((s) => s.marathon))];
  const list = filter === 'all' ? pending : pending.filter((s) => s.marathon === filter);

  return (
    <>
      <ProfTopbar />
      <div className="wrap" style={{ maxWidth: 1080 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Fila de validação</h1>
          <span className="badge" style={{ background: 'var(--orange)', color: '#fff', fontSize: 14 }}>{pending.length} pendentes</span>
        </div>
        <p className="mut" style={{ marginBottom: 24 }}>
          Recebes um email a cada submissão. MCQ é pré-corrigida automaticamente — só confirmas. Texto e foto exigem avaliação manual.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button className={`btn sm ${filter === 'all' ? 'dark' : 'ghost'}`} onClick={() => setFilter('all')}>Todas ({pending.length})</button>
          {marathons.map((m) => (
            <button key={m} className={`btn sm ${filter === m ? 'dark' : 'ghost'}`} onClick={() => setFilter(m)}>
              {m.split('—')[1]?.trim() ?? m} ({pending.filter((s) => s.marathon === m).length})
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {list.map((s) => (
            <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '20px 26px', flexWrap: 'wrap' }}>
              <div className="avatar" style={{ background: s.color }}>{s.initials}</div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <b>{s.student}</b>
                <div className="mut sm">{s.marathon} · {s.attempt}ª tentativa ({s.plan}) · submetida {s.submittedAgo}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Pill kind="mcq">☑ {s.types.mcq} MCQ</Pill>
                <Pill kind="txt">📝 {s.types.text} texto</Pill>
                <Pill kind="foto">📷 {s.types.photo} foto</Pill>
              </div>
              <Link to={`/prof/validacao/${s.id}`} className="btn sm" style={{ textDecoration: 'none' }}>Validar agora</Link>
            </div>
          ))}
          {list.length === 0 && <div className="card" style={{ textAlign: 'center', color: 'var(--mut)' }}>Sem submissões pendentes. Bom trabalho! 🎉</div>}
        </div>
      </div>
    </>
  );
}
