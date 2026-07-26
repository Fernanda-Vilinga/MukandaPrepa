import { useEffect, useState } from 'react';
import './MaratonaCountdown.css';
import { APP_REGISTO, propsLink } from '../config/appLinks';

// Data da 1ª Maratona: 22 de Julho de 2026, 14h00 (Briefing 1.3 / Spec 2.x)
const MARATONA_DATE = new Date('2026-07-22T14:00:00');

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
  ctaLabel = 'Inscrever-me na Maratona',
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
        <h2>Participa na próxima Maratona</h2>

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
          <p className="maratona__encerrado">A maratona já começou!</p>
        )}

        <div className="maratona__actions">
          <a href={ctaHref} className="btn btn-primary" {...propsLink(ctaHref)}>{ctaLabel}</a>
          <a href={secondaryHref} className="btn btn-outline" {...propsLink(secondaryHref)}>{secondaryLabel}</a>
        </div>
      </div>
    </section>
  );
}
