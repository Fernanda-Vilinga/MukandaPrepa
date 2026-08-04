import './Missao.css';

// Decisão da equipa (D5, 3 Ago 2026): a plataforma lança sem histórico, por
// isso esta secção não anuncia números — anuncia compromissos. Quando houver
// dados reais de maratonas realizadas e estudantes inscritos, os números
// entram aqui com fonte.
const COMPROMISSOS = [
  { valor: 'Gratuito', label: 'Maratonas e aulas online 2026 sem custos' },
  { valor: 'Nacional', label: 'Abertas a estudantes de todo o país' },
  { valor: 'No telemóvel', label: 'Pensado para dados móveis e ecrãs pequenos' },
  { valor: 'Comunidade', label: 'Estudantes e professores lado a lado' },
];

export default function Missao() {
  return (
    <>
      <section className="missao-hero">
        <div className="container">
          <h1>A Nossa Missão</h1>
          <p>Tornar o acesso à universidade mais justo para todos os estudantes angolanos.</p>
        </div>
      </section>

      <section className="missao-texto">
        <div className="container missao-texto__inner">
          <p>
            Em Angola, o percurso até à universidade não depende só do
            esforço individual do estudante — depende também de onde vive,
            do acesso a bons professores e de ter, ou não, materiais de
            estudo organizados. A MUKANDA PREPA existe para reduzir essa
            desigualdade.
          </p>
          <p>
            Construímos uma plataforma pensada para o contexto angolano:
            acessível maioritariamente via telemóvel, funcional em ligações
            3G/4G, e com conteúdos alinhados directamente com os exames de
            acesso ao ensino superior em Angola — não traduções de
            materiais estrangeiros.
          </p>
          <p>
            Acreditamos que a preparação para a universidade não devia
            depender da capacidade financeira da família ou da província
            onde se nasce. É por isso que, nesta primeira fase, as maratonas
            e as aulas online são totalmente gratuitas para todos os
            estudantes, com uma comunidade activa a acompanhar cada semana.
          </p>
        </div>
      </section>

      <section className="missao-stats">
        <div className="container">
          <h2>O nosso compromisso</h2>
          <div className="missao-stats__grid">
            {COMPROMISSOS.map((e) => (
              <div className="stat-card" key={e.label}>
                <span className="stat-card__valor">{e.valor}</span>
                <span className="stat-card__label">{e.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="missao-visao">
        <div className="container missao-visao__inner">
          <h2>Visão 2030</h2>
          <p>
            Até 2030, queremos ser a plataforma de referência na preparação
            para o acesso ao ensino superior em Angola, presente em todas as
            províncias do país, com milhares de estudantes preparados todos os
            anos e uma taxa de aprovação acima da média nacional.
          </p>
        </div>
      </section>
    </>
  );
}
