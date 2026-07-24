import './AulasOnline.css';

const COMO_FUNCIONAM = [
  {
    titulo: 'Ao vivo',
    desc: 'Aulas semanais com professores especializados, em directo, com interacção em tempo real.',
  },
  {
    titulo: 'Gravadas',
    desc: 'No plano Premium, todas as aulas ficam gravadas para reveres quando quiseres.',
  },
  {
    titulo: 'Por matéria',
    desc: 'Escolhe as matérias onde precisas de mais apoio, organizadas por área de exame.',
  },
];

// Horário provisório — o Briefing não especificava dias/horas/matérias concretas.
// Substituir pelo horário real definido pela equipa pedagógica.
const HORARIO = [
  { dia: 'Segunda', materia: 'Matemática', hora: '18h00', plano: 'Plus' },
  { dia: 'Terça', materia: 'Física', hora: '18h00', plano: 'Premium' },
  { dia: 'Quarta', materia: 'Português', hora: '18h00', plano: 'Plus' },
  { dia: 'Quinta', materia: 'Química', hora: '18h00', plano: 'Premium' },
];

export default function AulasOnline() {
  return (
    <>
      <section className="aulas-hero">
        <div className="container aulas-hero__inner">
          <div className="aulas-hero__text">
            <h1>Aulas Online ao Vivo</h1>
            <p>
              Professores especializados a explicar as matérias mais difíceis,
              com aulas ao vivo e gravadas, por matéria e ao teu ritmo.
            </p>
            <a href="/planos" className="btn btn-primary">Ver plano com aulas</a>
          </div>
          <div className="aulas-hero__illustration" aria-hidden="true">
            <svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">
              <rect x="30" y="40" width="340" height="240" rx="16" fill="#FFF1E8" />
              <rect x="70" y="90" width="260" height="18" rx="9" fill="#FB6D1D" />
              <rect x="70" y="130" width="180" height="14" rx="7" fill="#1742E7" opacity="0.8" />
              <rect x="70" y="160" width="220" height="14" rx="7" fill="#14141F" opacity="0.15" />
              <circle cx="300" cy="220" r="40" fill="#1742E7" opacity="0.15" />
              <circle cx="90" cy="230" r="24" fill="#FB6D1D" opacity="0.25" />
            </svg>
          </div>
        </div>
      </section>

      <section className="aulas-explicacao">
        <div className="container aulas-explicacao__grid">
          {COMO_FUNCIONAM.map((c) => (
            <div className="aulas-explicacao__card" key={c.titulo}>
              <h3>{c.titulo}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="aulas-horario">
        <div className="container">
          <h2>Horário semanal</h2>
          <div className="aulas-horario__scroll">
            <table>
              <thead>
                <tr>
                  <th>Dia</th>
                  <th>Matéria</th>
                  <th>Hora</th>
                  <th>Plano</th>
                </tr>
              </thead>
              <tbody>
                {HORARIO.map((h) => (
                  <tr key={`${h.dia}-${h.materia}`}>
                    <td>{h.dia}</td>
                    <td>{h.materia}</td>
                    <td>{h.hora}</td>
                    <td>
                      <span className="pill-plano">{h.plano}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="aulas-cta-final">
        <div className="container aulas-cta-final__inner">
          <h2>Pronto para aprender?</h2>
          <a href="/planos" className="btn btn-white">Ver todos os planos</a>
        </div>
      </section>
    </>
  );
}
