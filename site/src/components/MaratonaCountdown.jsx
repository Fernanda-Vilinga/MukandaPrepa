import { useEffect, useState } from 'react';
import './MaratonaCountdown.css';
import { APP_REGISTO, propsLink } from '../config/appLinks';
import { DATA_PROXIMA_MARATONA, DATA_PROXIMA_MARATONA_LEGIVEL } from '../config/maratona';

const MARATONA_DATE = DATA_PROXIMA_MARATONA;

function getTimeLeft() {
  const diff = MARATONA_DATE.getTime() - Date.now();
  if (diff <= 0) return { dias: 0, horas: 0, minutos: 0, terminou: true };

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutos = Math.floor((diff / (1000 * 60)) % 60);

  return { dias, horas, minutos, terminou: false };
}

// O botão principal leva sempre ao registo na app — é a acção que se quer
// desta secção. O secundário é que fica para "saber mais" dentro do site.
export default function MaratonaCountdown({
  ctaHref = APP_REGISTO,
  ctaLabel,
  secondaryHref = '/maratonas',
  secondaryLabel = 'Saber mais',
}) {
  const [tempo, setTempo] = useState(getTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => setTempo(getTimeLeft()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="maratona">
      <div className="container maratona__inner">
        <h2>{tempo.terminou ? 'As maratonas já começaram' : 'Participa na próxima Maratona'}</h2>

        {!tempo.terminou && (
          <p className="maratona__data">{DATA_PROXIMA_MARATONA_LEGIVEL}</p>
        )}

        {!tempo.terminou ? (
          <div className="maratona__countdown">
            <div className="maratona__block">
              <span className="maratona__number">{tempo.dias}</span>
              <span className="maratona__label">Dias</span>
            </div>
            <div className="maratona__block">
              <span className="maratona__number">{tempo.horas}</span>
              <span className="maratona__label">Horas</span>
            </div>
            <div className="maratona__block">
              <span className="maratona__number">{tempo.minutos}</span>
              <span className="maratona__label">Minutos</span>
            </div>
          </div>
        ) : (
          /* O objectivo do contador é criar urgência: quando a data passa, a
             mensagem passa de contagem para chamada à acção. */
          <p className="maratona__encerrado">
            <b>Não percas mais tempo.</b> Entra agora e começa a treinar com as
            maratonas que já estão a decorrer.
          </p>
        )}

        <div className="maratona__actions">
          <a href={ctaHref} className="btn btn-primary" {...propsLink(ctaHref)}>
            {ctaLabel ?? (tempo.terminou ? 'Entrar agora' : 'Inscrever-me na Maratona')}
          </a>
          <a href={secondaryHref} className="btn btn-outline" {...propsLink(secondaryHref)}>{secondaryLabel}</a>
        </div>
      </div>
    </section>
  );
}
