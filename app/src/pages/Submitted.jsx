import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getMarathon } from '../services/api.js';
import { Topbar } from '../components/Ui.jsx';
import { ChatFab } from '../components/Chat.jsx';

export default function Submitted() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const auto = params.get('auto') === '1';
  const [m, setM] = useState(null);
  useEffect(() => { getMarathon(id).then(setM); }, [id]);

  const now = new Date();
  const fmt = now.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' }) + ', ' + now.toTimeString().slice(0, 5);

  return (
    <>
      <Topbar />
      <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card" style={{ maxWidth: 620, width: '100%', padding: 56, textAlign: 'center' }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--orange-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 24px' }}>⏳</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>
            {auto ? 'Tempo esgotado — respostas submetidas' : 'Respostas submetidas!'}
          </h1>
          <p className="mut" style={{ maxWidth: 440, margin: '0 auto' }}>
            {auto && 'O tempo da sessão terminou e as respostas guardadas até ao momento foram submetidas automaticamente. '}
            {m ? `${m.professor} foi notificado` : 'O professor foi notificado'} por email e vai validar as tuas respostas manualmente. As respostas ficaram bloqueadas.
          </p>
          <div className="row" style={{ gap: 14, margin: '32px 0', textAlign: 'left' }}>
            <div className="col" style={{ background: 'var(--bg)', borderRadius: 12, padding: 16 }}>
              <div className="xs mut">SUBMETIDA</div><div style={{ fontWeight: 600 }}>{fmt}</div>
            </div>
            <div className="col" style={{ background: 'var(--bg)', borderRadius: 12, padding: 16 }}>
              <div className="xs mut">VALIDAÇÃO</div><div style={{ fontWeight: 600 }}>Manual, pelo professor</div>
            </div>
            <div className="col" style={{ background: 'var(--bg)', borderRadius: 12, padding: 16 }}>
              <div className="xs mut">PRAZO ESTIMADO</div><div style={{ fontWeight: 600 }}>até 48 horas</div>
            </div>
          </div>
          <div className="sm" style={{ background: 'var(--blue-l)', borderRadius: 12, padding: '14px 18px', marginBottom: 28 }}>
            📧 Receberás o resultado por <b>email</b> e no teu <b>dashboard</b> assim que a validação terminar.
          </div>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn" style={{ textDecoration: 'none' }}>Ir para o dashboard</Link>
            <Link to="/maratonas" className="btn ghost" style={{ textDecoration: 'none' }}>Ver outras maratonas</Link>
          </div>
        </div>
      </div>
      <ChatFab />
    </>
  );
}
