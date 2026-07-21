// Lista de TODAS as maratonas da plataforma (qualquer professor) — visão admin.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllMarathons } from '../../services/adminApi.js';
import { AdminTopbar } from '../../components/AdminUi.jsx';
import { Badge } from '../../components/Ui.jsx';

export default function AdminMarathons() {
  const [marathons, setMarathons] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { getAllMarathons().then(setMarathons); }, []);

  const list = marathons.filter((m) => filter === 'all' || m.status === filter);

  return (
    <>
      <AdminTopbar />
      <div className="wrap" style={{ maxWidth: 1080 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>Maratonas</h1>
            <div className="mut sm">{marathons.length} na plataforma · de todos os professores</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[['all', 'Todas'], ['active', 'Activas'], ['soon', 'Em breve'], ['draft', 'Rascunhos'], ['closed', 'Fechadas']].map(([id, label]) => (
            <button key={id} className={`btn sm ${filter === id ? 'dark' : 'ghost'}`} onClick={() => setFilter(id)}>
              {label} ({marathons.filter((m) => id === 'all' || m.status === id).length})
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {list.map((m) => (
            <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px 28px', flexWrap: 'wrap' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: m.status === 'draft' ? '#EEEEF0' : 'var(--orange-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{m.icon}</div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>{m.title}</span>
                  <Badge status={m.status} />
                </div>
                <div className="mut sm" style={{ marginTop: 4 }}>
                  {m.professor} · {m.durationMinutes} min · {m.questionsPerSession} questões por sessão
                  {m.accessEnd ? ` · fecha ${m.accessEnd}` : ''} · {m.participants} participantes
                </div>
              </div>
              <Link to={`/admin/maratonas/${m.id}`} className="btn sm ghost" style={{ textDecoration: 'none' }}>Ver dados</Link>
            </div>
          ))}
          {list.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--mut)', padding: 48 }}>
              Nenhuma maratona nesta categoria.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
