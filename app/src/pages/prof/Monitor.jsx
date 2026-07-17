// Monitorização ao vivo — alunos conectados, progresso, tempos.
// (Real: WebSocket/Socket.io; aqui os dados são mock.)
import { useEffect, useState } from 'react';
import { getLiveSessions } from './profDeps.js';
import { ProfTopbar } from '../../components/ProfUi.jsx';
import { Stat } from '../../components/Ui.jsx';

export default function Monitor() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('live');

  useEffect(() => { getLiveSessions().then(setData); }, []);
  if (!data) return <ProfTopbar />;

  return (
    <>
      <ProfTopbar />
      <div className="wrap">
        <div className="card" style={{ background: 'var(--dark)', color: '#fff', display: 'flex', alignItems: 'center', gap: 32, padding: '24px 32px', marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="xs" style={{ color: '#8A8B9A', letterSpacing: '.15em' }}>MONITORIZAÇÃO AO VIVO</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>Matemática — Álgebra Linear</h1>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="mont" style={{ fontSize: 26, fontWeight: 800, color: 'var(--green)' }}>● {data.connected}</div>
            <div className="xs" style={{ color: '#B9BAC6' }}>CONECTADOS AGORA</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="mont" style={{ fontSize: 26, fontWeight: 800 }}>{data.participants}</div>
            <div className="xs" style={{ color: '#B9BAC6' }}>TOTAL PARTICIPANTES</div>
          </div>
          <div className="timer" style={{ background: 'rgba(251,109,29,.15)', border: '1px solid var(--orange)', fontSize: 15 }}>
            <span className="dot" />Janela fecha em 2d 08h
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ fontSize: 16.5, fontWeight: 700 }}>Sessões em curso</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={`btn sm ${tab === 'live' ? 'dark' : 'ghost'}`} onClick={() => setTab('live')}>Ao vivo ({data.sessions.length})</button>
              <button className={`btn sm ${tab === 'hist' ? 'dark' : 'ghost'}`} onClick={() => setTab('hist')}>Histórico ({data.completed})</button>
            </div>
          </div>
          {tab === 'live' ? (
            <table>
              <thead>
                <tr><th>Aluno</th><th>Questão actual</th><th>Progresso</th><th>Tempo de sessão</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {data.sessions.map((s) => (
                  <tr key={s.student}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 34, height: 34, fontSize: 13, background: s.color }}>{s.initials}</div>
                        <b>{s.student}</b>
                      </div>
                    </td>
                    <td>{s.question}</td>
                    <td><div className="prog" style={{ width: 140, height: 8 }}><div style={{ width: `${s.progress}%` }} /></div></td>
                    <td className="mut">{s.time}</td>
                    <td>
                      <span className="badge" style={s.state === 'A rever' ? { background: 'var(--amber-l)', color: '#B45309' } : { background: 'var(--green-l)', color: 'var(--green)' }}>
                        {s.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="mut sm" style={{ padding: 20, textAlign: 'center' }}>
              Histórico: {data.completed} submissões completas · {data.abandoned} sessões abandonadas · tempo médio {data.avgTime}.
            </div>
          )}
        </div>

        <div className="row" style={{ marginTop: 24 }}>
          <Stat value={data.completed} label="Submissões completas" />
          <Stat value={data.abandoned} label="Sessões abandonadas" />
          <Stat value={data.avgTime} label="Tempo médio de sessão" />
          <Stat value={data.pendingValidation} label="Aguardam validação" color="var(--orange)" />
        </div>
      </div>
    </>
  );
}
