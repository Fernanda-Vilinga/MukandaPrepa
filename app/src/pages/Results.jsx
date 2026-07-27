import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getResults } from '../services/api.js';
import { Topbar, Badge } from '../components/Ui.jsx';
import { ChatFab } from '../components/Chat.jsx';

export default function Results() {
  const [results, setResults] = useState([]);
  useEffect(() => { getResults().then(setResults); }, []);

  return (
    <>
      <Topbar />
      <div className="wrap" style={{ maxWidth: 1080 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>Resultados</h1>
        <div className="card" style={{ padding: '8px 28px' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Maratona</th><th>Tentativa</th><th>Data</th><th>Nota</th><th>Ranking</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.marathonTitle}</td>
                    <td>{r.attempt}ª</td>
                    <td className="mut">{r.date}</td>
                    <td>{r.score != null ? `${r.score}/${r.total} · ${r.percent}%` : '—'}</td>
                    <td>{r.rank ? `#${r.rank}` : '—'}</td>
                    <td><Badge status={r.status} /></td>
                    <td>
                      {r.status === 'validated'
                        ? <Link to={`/resultados/${r.id}`} className="btn sm dark" style={{ textDecoration: 'none' }}>Ver detalhe</Link>
                        : <span className="xs mut">aguarda professor</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ChatFab />
    </>
  );
}
