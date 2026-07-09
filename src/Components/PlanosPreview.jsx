import './PlanosPreview.css';

const PLANOS = [
  {
    nome: 'Basic',
    preco: 'Grátis',
    destaque: false,
  },
  {
    nome: 'Plus',
    preco: '10.000 Kzs',
    destaque: true,
  },
  {
    nome: 'Premium',
    preco: '20.000 Kzs',
    destaque: false,
  },
];

export default function PlanosPreview() {
  return (
    <section className="planos-preview">
      <div className="container">
        <h2 className="planos-preview__title">Escolhe o teu plano</h2>

        <div className="planos-preview__grid">
          {PLANOS.map((plano) => (
            <div
              className={`plano-card ${plano.destaque ? 'plano-card--destaque' : ''}`}
              key={plano.nome}
            >
              {plano.destaque && <span className="plano-card__badge">Popular</span>}
              <h3>{plano.nome}</h3>
              <p className="plano-card__preco">{plano.preco}</p>
              <p className="plano-card__pagamento">Pagamento único</p>
              <a
                href="/planos"
                className={`btn ${plano.destaque ? 'btn-primary' : 'btn-outline'} plano-card__cta`}
              >
                Ver detalhes
              </a>
            </div>
          ))}
        </div>

        <div className="planos-preview__footer">
          <a href="/planos" className="btn btn-outline">Ver todos os planos</a>
        </div>
      </div>
    </section>
  );
}
