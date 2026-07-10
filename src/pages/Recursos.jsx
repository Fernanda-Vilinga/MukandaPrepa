import './Recursos.css';

// Catálogo provisório — ainda não existem ficheiros reais para download.
// Os botões ficam desactivados de propósito (em vez de apontar para um
// PDF que não existe) até a equipa carregar os materiais definitivos.
const RECURSOS = [
  { titulo: 'Ficha de fórmulas — Matemática', materia: 'Matemática' },
  { titulo: 'Resumo de Mecânica — Física', materia: 'Física' },
  { titulo: 'Exame modelo — Química', materia: 'Química' },
  { titulo: 'Guia de estudo — Biologia', materia: 'Biologia' },
  { titulo: 'Ficha de análise sintáctica — Português', materia: 'Português' },
  { titulo: 'Guia de redacção para o exame', materia: 'Português' },
];

export default function Recursos() {
  return (
    <>
      <section className="recursos-hero">
        <div className="container">
          <h1>Recursos</h1>
          <p>Materiais de estudo gratuitos para download, organizados por matéria.</p>
        </div>
      </section>

      <section className="recursos-lista">
        <div className="container">
          <p className="recursos-aviso">
            Os ficheiros ainda estão a ser preparados pela equipa pedagógica —
            os downloads ficam disponíveis brevemente.
          </p>
          <div className="recursos-grid">
            {RECURSOS.map((r) => (
              <div className="recurso-card" key={r.titulo}>
                <span className="pill-materia">{r.materia}</span>
                <h3>{r.titulo}</h3>
                <button type="button" className="btn btn-outline recurso-card__btn" disabled>
                  Brevemente disponível
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
