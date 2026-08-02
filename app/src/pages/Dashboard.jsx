import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMarathons, getResults, currentUser } from '../services/api.js';
import { Topbar, Badge, Stat, AttemptDots } from '../components/Ui.jsx';
import { ChatFab } from '../components/Chat.jsx';
import { PLAN_LABEL } from '../data/mock.js';
import { useMaxAttempts } from '../hooks/useMaxAttempts.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = currentUser();
  const [marathons, setMarathons] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    getMarathons().then(setMarathons);
    getResults().then(setResults);
  }, []);

  const active = marathons.filter((m) => m.status === 'active');
  const soon = marathons.filter((m) => m.status === 'soon');

  // Maratona escolhida para ver as tentativas restantes — por omissão a
  // primeira activa, mas o estudante pode trocar na lista de acesso rápido.
  useEffect(() => {
    if (active.length && !active.some((m) => m.id === selectedId)) {
      setSelectedId(active[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marathons]);
  const validated = results.filter((r) => r.status === 'validated');
  const pending = results.filter((r) => r.status === 'pending');
  const best = validated.reduce((b, r) => (r.rank && (!b || r.rank < b) ? r.rank : b), null);
  const avg = validated.length
    ? Math.round(validated.reduce((s, r) => s + (r.percent ?? 0), 0) / validated.length)
    : null;
  const maxAtt = useMaxAttempts(user?.plan);
  const firstName = (user?.name ?? 'Estudante').split(' ')[0];
  const featured = active.find((m) => m.id === selectedId) ?? active[0];

  return (
    <>
      <Topbar />
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>Olá, {firstName} 👋</h1>
            <div className="mut">
              Tens {active.length} maratona{active.length !== 1 && 's'} activa{active.length !== 1 && 's'}
              {pending.length > 0 && ` e ${pending.length} resultado pendente de validação`}.
            </div>
          </div>
          {active.length > 0 && <span className="badge act">● {active.length} a decorrer agora</span>}
        </div>

        <div className="row" style={{ marginBottom: 24 }}>
          <Stat value={validated.length} label="Maratonas concluídas" />
          <Stat value={avg != null ? `${avg}%` : '—'} label="Média de acertos" />
          <Stat value={best ? `#${best}` : '—'} label="Melhor ranking" />
          <Stat
            value={PLAN_LABEL[user?.plan]}
            // maxAtt indefinido = ainda a chegar do servidor; melhor não dizer
            // nada do que dizer um número e corrigi-lo um instante depois.
            label={maxAtt === undefined ? ' '
              : maxAtt === Infinity ? 'Tentativas ilimitadas'
              : maxAtt == null ? 'Plano actual'
              : `Até ${maxAtt} tentativas por maratona`}
            color="var(--orange)"
            style={{ background: 'var(--dark)', color: '#fff' }}
          />
        </div>

        <div className="row">
          <div className="col" style={{ flex: 1.6 }}>
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontSize: 16.5, fontWeight: 700 }}>Maratonas activas</h3>
                <Link to="/maratonas" className="sm" style={{ color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}>Ver todas →</Link>
              </div>
              {[...active, ...soon].map((m) => (
                <div key={m.id} style={{ border: '1.5px solid var(--brd)', borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: m.status === 'active' ? 'var(--orange-l)' : 'var(--blue-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{m.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{m.title}</div>
                    <div className="mut sm">{m.area} · {m.durationMinutes} min · {m.professor}</div>
                  </div>
                  <Badge status={m.status} />
                  <Link to={`/maratonas/${m.id}`} className={`btn sm ${m.status === 'active' ? '' : 'ghost'}`} style={{ textDecoration: 'none' }}>
                    {m.status === 'active' ? 'Entrar' : 'Detalhes'}
                  </Link>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 14 }}>Histórico</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Maratona</th><th>Data</th><th>Nota</th><th>Ranking</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.marathonTitle}</td>
                        <td className="mut">{r.date}</td>
                        <td>{r.score != null ? `${r.score}/${r.total} · ${r.percent}%` : '—'}</td>
                        <td>{r.rank ? `#${r.rank}` : '—'}</td>
                        <td><Badge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col">
            {pending.length > 0 && (
              <div className="card" style={{ marginBottom: 24, background: 'var(--orange-l)' }}>
                <div className="mont" style={{ fontWeight: 700, marginBottom: 6 }}>⏳ Resultado pendente</div>
                <div className="sm">
                  {pending[0].marathonTitle}: o professor foi notificado. Receberás o resultado por email e aqui no dashboard.
                </div>
              </div>
            )}
            {featured && (
              <div className="card">
                <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 14 }}>As tuas tentativas — plano {PLAN_LABEL[user?.plan]}</h3>
                {active.length > 1 ? (
                  <select
                    className="input sm"
                    style={{ marginBottom: 12, width: '100%' }}
                    value={featured.id}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    {active.map((m) => (
                      <option key={m.id} value={m.id}>{m.icon} {m.title}</option>
                    ))}
                  </select>
                ) : (
                  <div className="sm mut" style={{ marginBottom: 12 }}>{featured.title}</div>
                )}
                <AttemptDots used={featured.attemptsUsed} max={featured.attemptsMax ?? Infinity} />
                <div className="sm mut" style={{ marginTop: 12 }}>
                  {featured.attemptsUsed} usada{featured.attemptsUsed !== 1 && 's'} ·{' '}
                  <b style={{ color: 'var(--dark)' }}>
                    {featured.attemptsMax == null ? 'ilimitadas' : `${featured.attemptsMax - featured.attemptsUsed} disponíveis`}
                  </b>
                </div>
                {user?.plan !== 'premium' && (
                  <button className="btn blue sm" style={{ marginTop: 16, width: '100%' }} onClick={() => navigate('/planos')}>Fazer upgrade de plano</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <ChatFab />
    </>
  );
}
