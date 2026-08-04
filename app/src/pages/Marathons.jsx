import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMarathons, getResults, currentUser } from '../services/api.js';
import { Topbar, Badge } from '../components/Ui.jsx';
import { ChatFab } from '../components/Chat.jsx';

const FILTERS = [
  ['all', 'Todas'],
  ['active', 'Activas'],
  ['soon', 'Em breve'],
  ['closed', 'Encerradas'],
];

export default function Marathons() {
  const user = currentUser();
  const [marathons, setMarathons] = useState([]);
  const [results, setResults] = useState([]);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  // As tentativas mostradas nesta página vêm de cada maratona (m.attemptsMax),
  // calculadas no servidor. Havia aqui um maxAtt da tabela fixa do frontend que
  // nada usava — removido para ninguém voltar a pegar nele por engano.

  useEffect(() => {
    getMarathons().then(setMarathons);
    getResults().then(setResults);
  }, []);

  const list = marathons.filter(
    (m) =>
      (filter === 'all' || m.status === filter) &&
      (q === '' || m.title.toLowerCase().includes(q.toLowerCase()) || m.discipline.toLowerCase().includes(q.toLowerCase()))
  );

  const resultFor = (m) => results.find((r) => r.marathonId === m.id && r.status === 'validated');

  return (
    <>
      <Topbar />
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Maratonas</h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input className="input" placeholder="🔍 Pesquisar…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 220, maxWidth: '100%', flex: '1 1 180px', padding: '10px 14px' }} />
            {FILTERS.map(([id, label]) => (
              <button key={id} className={`btn sm ${filter === id ? 'dark' : 'ghost'}`} onClick={() => setFilter(id)}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {list.map((m) => {
            const res = resultFor(m);
            const closed = m.status === 'closed';
            return (
              <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '24px 28px', opacity: closed ? .75 : 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: closed ? '#EEEEF0' : 'var(--orange-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{m.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{m.title}</span>
                    <Badge status={m.status} />
                  </div>
                  <div className="mut sm" style={{ marginTop: 4 }}>
                    {m.area} · {m.discipline} · {m.durationMinutes} min ·{' '}
                    {m.status === 'soon'
                      ? `abre ${new Date(m.accessStart).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}`
                      : `acesso até ${new Date(m.accessEnd).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}`}
                  </div>
                </div>
                <div className="sm mut" style={{ textAlign: 'right', marginRight: 8 }}>
                  {res
                    ? `Nota: ${res.score}/${res.total} · ${res.percent}% · #${res.rank}`
                    : m.status === 'soon'
                      ? 'Recebes email na abertura'
                      : `Tentativas: ${m.attemptsUsed} de ${m.attemptsMax ?? '∞'} usadas`}
                </div>
                {m.status === 'active' && <Link to={`/maratonas/${m.id}`} className="btn sm" style={{ textDecoration: 'none' }}>Entrar</Link>}
                {m.status === 'soon' && <Link to={`/maratonas/${m.id}`} className="btn sm ghost" style={{ textDecoration: 'none' }}>Detalhes</Link>}
                {closed && res && <Link to={`/resultados/${res.id}`} className="btn sm dark" style={{ textDecoration: 'none' }}>Ver resultado</Link>}
                {closed && !res && <span className="btn sm ghost" style={{ pointerEvents: 'none' }}>Encerrada</span>}
              </div>
            );
          })}
          {list.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--mut)' }}>Nenhuma maratona corresponde ao filtro.</div>
          )}
        </div>
      </div>
      <ChatFab />
    </>
  );
}
