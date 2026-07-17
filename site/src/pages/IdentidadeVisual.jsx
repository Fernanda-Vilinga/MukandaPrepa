import './IdentidadeVisual.css';

// Valores reais, tal como definidos no Briefing de Desenvolvimento v1.0,
// secção 1.1 "Identidade Visual Aplicada" — não são placeholder.
const CORES = [
  { nome: 'Orange (principal)', hex: '#FB6D1D' },
  { nome: 'Blue (secundária)', hex: '#1742E7' },
  { nome: 'Dark', hex: '#14141F' },
  { nome: 'Fundo / Branco', hex: '#FBFBFB' },
  { nome: 'Texto secundário (Mid Gray)', hex: '#64748B' },
];

export default function IdentidadeVisual() {
  return (
    <>
      <section className="iv-hero">
        <div className="container">
          <h1>Identidade Visual</h1>
          <p>A linguagem visual da MUKANDA PREPA, para uso consistente em todas as plataformas.</p>
        </div>
      </section>

      <section className="iv-logo">
        <div className="container iv-logo__inner">
          <img src="/01.png" alt="Logótipo MUKANDA PREPA" className="iv-logo__img" />
          <p>Logótipo oficial. Usar sempre sobre fundo claro, com espaço de respiro à volta.</p>
        </div>
      </section>

      <section className="iv-cores">
        <div className="container">
          <h2>Paleta de cores</h2>
          <div className="iv-cores__grid">
            {CORES.map((c) => (
              <div className="cor-card" key={c.hex}>
                <div className="cor-card__swatch" style={{ background: c.hex }} />
                <p className="cor-card__nome">{c.nome}</p>
                <p className="cor-card__hex">{c.hex}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="iv-tipografia">
        <div className="container">
          <h2>Tipografia</h2>
          <div className="iv-tipografia__grid">
            <div className="tipo-card">
              <p className="tipo-card__label">Títulos — Montserrat Semibold</p>
              <p className="tipo-card__amostra tipo-card__amostra--titulo">
                A melhor preparação para o acesso à universidade
              </p>
            </div>
            <div className="tipo-card">
              <p className="tipo-card__label">Sub-títulos e corpo — Poppins Bold / Regular</p>
              <p className="tipo-card__amostra tipo-card__amostra--corpo">
                Exames passados, maratonas online e aulas ao vivo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="iv-componentes">
        <div className="container">
          <h2>Componentes base</h2>
          <div className="iv-componentes__grid">
            <div className="componente-card">
              <p className="componente-card__label">Botões</p>
              <div className="componente-card__demo">
                <button type="button" className="btn btn-primary">Botão primário</button>
                <button type="button" className="btn btn-outline">Botão outline</button>
              </div>
            </div>
            <div className="componente-card">
              <p className="componente-card__label">Cards — border-radius 8–12px</p>
              <div className="componente-card__demo">
                <div className="iv-card-exemplo">Card de exemplo</div>
              </div>
            </div>
            <div className="componente-card">
              <p className="componente-card__label">Input — altura 48px, borda #E0E0E0</p>
              <div className="componente-card__demo">
                <input type="text" placeholder="Campo de exemplo" className="iv-input-exemplo" readOnly />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
