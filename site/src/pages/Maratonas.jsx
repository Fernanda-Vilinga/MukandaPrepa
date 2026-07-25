import MaratonaCountdown from '../components/MaratonaCountdown';
import './Maratonas.css';
import { APP_REGISTO } from '../config/appLinks';

const PILARES = [
  {
    titulo: 'Resolve',
    desc: 'Exercícios cronometrados que simulam o exame real de acesso à universidade.',
  },
  {
    titulo: 'Compite',
    desc: 'Vê a tua posição no ranking em tempo real com outros estudantes.',
  },
  {
    titulo: 'Cresce',
    desc: 'Recebe feedback imediato depois de cada maratona e evolui a cada semana.',
  },
];

// Calendário provisório — o Briefing não especificava as datas/áreas de cada
// semana além da 1ª maratona (22 Jul 2026). Substituir por calendário real.
const CALENDARIO = [
  { semana: 'Semana 1 · 22 Jul 2026', fase: 'Fase Aberta', area: 'Geral', estado: 'aberta' },
  { semana: 'Semana 2 · 29 Jul 2026', fase: 'Fase Temática', area: 'Matemática', estado: 'brevemente' },
  { semana: 'Semana 3 · 05 Ago 2026', fase: 'Fase Temática', area: 'Física', estado: 'brevemente' },
  { semana: 'Semana 4 · 12 Ago 2026', fase: 'Fase Temática', area: 'Química', estado: 'brevemente' },
  { semana: 'Semana 5 · 19 Ago 2026', fase: 'Fase Temática', area: 'Biologia', estado: 'brevemente' },
  { semana: 'Semana 6 · 26 Ago 2026', fase: 'Fase Temática', area: 'Português', estado: 'brevemente' },
];

export default function Maratonas() {
  return (
    <>
      <section className="maratonas-hero">
        <div className="container maratonas-hero__inner">
          <div className="maratonas-hero__text">
            <h1>Maratona MUKANDA</h1>
            <p>
              Sessões intensivas de exercícios cronometrados, por área e por
              universidade, para chegares preparado ao dia do exame.
            </p>
            <a href={APP_REGISTO} className="btn btn-primary" target="_blank" rel="noreferrer">Inscrever-me numa Maratona</a>
          </div>
          <div className="maratonas-hero__illustration" aria-hidden="true">
            <svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">
              <rect x="30" y="40" width="340" height="240" rx="16" fill="#EAF0FF" />
              <rect x="70" y="90" width="260" height="18" rx="9" fill="#1742E7" />
              <rect x="70" y="130" width="180" height="14" rx="7" fill="#FB6D1D" opacity="0.8" />
              <rect x="70" y="160" width="220" height="14" rx="7" fill="#14141F" opacity="0.15" />
              <circle cx="300" cy="220" r="40" fill="#FB6D1D" opacity="0.15" />
              <circle cx="90" cy="230" r="24" fill="#1742E7" opacity="0.25" />
            </svg>
          </div>
        </div>
      </section>

      <section className="maratonas-explicacao">
        <div className="container maratonas-explicacao__grid">
          {PILARES.map((p) => (
            <div className="maratonas-explicacao__card" key={p.titulo}>
              <h3>{p.titulo}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <MaratonaCountdown ctaHref={APP_REGISTO} secondaryHref="#calendario" secondaryLabel="Ver calendário" />

      <section className="maratonas-calendario" id="calendario">
        <div className="container">
          <h2>Calendário de Maratonas</h2>
          <div className="maratonas-calendario__scroll">
            <table>
              <thead>
                <tr>
                  <th>Semana</th>
                  <th>Fase</th>
                  <th>Área</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {CALENDARIO.map((c) => (
                  <tr key={c.semana}>
                    <td>{c.semana}</td>
                    <td>{c.fase}</td>
                    <td>{c.area}</td>
                    <td>
                      <span className={`pill pill--${c.estado}`}>
                        {c.estado === 'aberta' ? 'Inscrições abertas' : 'Em breve'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
