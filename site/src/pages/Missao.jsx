import './Missao.css';

// ⚠️ Estatísticas de exemplo — NÃO são dados reais. Substituir por números
// verificados pela equipa antes do lançamento; não publicar como estão.
const ESTATISTICAS = [
  { valor: '500+', label: 'Estudantes inscritos (exemplo)' },
  { valor: '12', label: 'Maratonas realizadas (exemplo)' },
  { valor: '3', label: 'Universidades parceiras (exemplo)' },
  { valor: '18', label: 'Províncias alcançadas (exemplo)' },
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
            onde se nasce. É por isso que mantemos um plano totalmente
            gratuito com acesso a maratonas abertas, biblioteca de exames
            passados e uma comunidade activa de estudantes.
          </p>
        </div>
      </section>

      <section className="missao-stats">
        <div className="container">
          <h2>O nosso impacto</h2>
          <p className="missao-stats__aviso">
            Valores de exemplo, ainda por confirmar com dados reais.
          </p>
          <div className="missao-stats__grid">
            {ESTATISTICAS.map((e) => (
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
            18 províncias, com milhares de estudantes preparados todos os
            anos e uma taxa de aprovação acima da média nacional.
          </p>
        </div>
      </section>
    </>
  );
}
