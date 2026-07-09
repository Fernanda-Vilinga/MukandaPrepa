import './Pilares.css';

const PILARES = [
  {
    title: 'Maratonas Online',
    desc: 'Sessões intensivas de exercícios cronometrados, por área e por universidade.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke="#FB6D1D" strokeWidth="2" />
        <path d="M12 7v5l3 3" stroke="#FB6D1D" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Aulas ao Vivo',
    desc: 'Professores especializados a explicar as matérias mais difíceis, em directo.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="5" width="18" height="12" rx="2" stroke="#FB6D1D" strokeWidth="2" />
        <path d="M8 21h8M12 17v4" stroke="#FB6D1D" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Exames Passados',
    desc: 'Biblioteca completa de exames de anos anteriores, com resoluções.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="#FB6D1D" strokeWidth="2" />
        <path d="M9 12h6M9 16h6" stroke="#FB6D1D" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Pilares() {
  return (
    <section className="pilares">
      <div className="container pilares__grid">
        {PILARES.map((p) => (
          <div className="pilar-card" key={p.title}>
            <div className="pilar-card__icon">{p.icon}</div>
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
