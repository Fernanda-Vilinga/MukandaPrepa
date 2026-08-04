import './SobreResumo.css';

const BULLETS = [
  'Conteúdos alinhados às universidades angolanas',
  'Acompanhamento por tutores',
  'Comunidade activa',
];

export default function SobreResumo() {
  return (
    <section className="sobre-resumo">
      <div className="container sobre-resumo__inner">
        <div className="sobre-resumo__imagem" aria-hidden="true">
          <svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="340" height="280" rx="16" fill="#EAF0FF" />
            <circle cx="180" cy="120" r="50" fill="#1742E7" opacity="0.25" />
            <rect x="110" y="190" width="140" height="16" rx="8" fill="#1742E7" opacity="0.5" />
            <rect x="130" y="220" width="100" height="12" rx="6" fill="#14141F" opacity="0.15" />
          </svg>
        </div>

        <div className="sobre-resumo__texto">
          <h2>Sobre nós</h2>
          <ul className="sobre-resumo__lista">
            {BULLETS.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <a href="/sobre" className="btn btn-outline">Saber mais</a>
        </div>
      </div>
    </section>
  );
}
