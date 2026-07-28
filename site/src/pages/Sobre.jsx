import { Link } from 'react-router-dom';
import './Sobre.css';
import { APP_REGISTO } from '../config/appLinks';
import { FUNDADORES } from '../config/equipa.jsx';

// Conteúdo provisório — esta página aguardava protótipo do designer (Briefing
// v1.0, secção 2.1). Avançou-se sem protótipo por decisão da equipa; rever
// texto e imagens assim que o Figma estiver disponível.
const VALORES = [
  {
    titulo: 'Excelência',
    desc: 'Conteúdos rigorosos, alinhados com os exames de acesso às universidades angolanas.',
  },
  {
    titulo: 'Acessibilidade',
    desc: 'Educação de qualidade ao alcance de todos os estudantes, independentemente da região ou possibilidades financeiras.',
  },
  {
    titulo: 'Comunidade',
    desc: 'Uma rede de estudantes que se apoiam e crescem juntos rumo ao mesmo objectivo.',
  },
  {
    titulo: 'Inovação',
    desc: 'Tecnologia ao serviço da aprendizagem, pensada para o contexto e a realidade de Angola.',
  },
  {
    titulo: 'Compromisso',
    desc: 'Com o percurso de cada estudante, do primeiro acesso à conquista da vaga na universidade.',
  },
];

export default function Sobre() {
  return (
    <>
      <section className="sobre-hero">
        <div className="container">
          <h1>Sobre a MUKANDA PREPA</h1>
          <p>
            Uma plataforma educativa angolana especializada na preparação de
            estudantes para os exames de acesso ao ensino superior.
          </p>
        </div>
      </section>

      <section className="sobre-historia">
        <div className="container sobre-historia__inner">
          <div className="sobre-historia__texto">
            <h2>A nossa missão</h2>
            <p>
              A MUKANDA PREPA nasceu para responder a um problema muito
              concreto: milhares de estudantes angolanos chegam à fase decisiva
              do acesso à universidade sem acompanhamento estruturado, sem
              acesso a exames passados organizados e sem uma comunidade que os
              ajude a preparar-se com confiança.
            </p>
            <p>
              Juntamos maratonas de exercícios, aulas ao vivo e uma biblioteca
              de exames passados numa só plataforma, pensada para o contexto
              angolano — incluindo o acesso maioritariamente via telemóvel e
              ligações 3G/4G.
            </p>
            <Link to="/missao" className="sobre-historia__link">
              Conhece a nossa Visão 2030 →
            </Link>
          </div>
        </div>
      </section>

      <section className="sobre-valores">
        <div className="container">
          <h2>Os nossos valores</h2>
          <div className="sobre-valores__grid">
            {VALORES.map((v) => (
              <div className="valor-card" key={v.titulo}>
                <h3>{v.titulo}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sobre-equipa">
        <div className="container sobre-equipa__inner">
          <h2>A equipa</h2>
          <p>
            A MUKANDA PREPA é liderada por Henrique Catraio, CEO &amp; Fundador,
            com uma equipa dedicada a construir a melhor preparação para o
            acesso à universidade em Angola.
          </p>
          {/* Fundadores em destaque; o resto da equipa vive na página
              própria, com o mesmo tipo de link usado para a Visão 2030. */}
          <div className="sobre-equipa__fundadores">
            {FUNDADORES.map((f) => (
              <div className="sobre-equipa__perfil" key={f.nome}>
                <div className="sobre-equipa__avatar" aria-hidden="true">
                  {f.nome.split(' ').slice(0, 2).map((p) => p[0]).join('')}
                </div>
                <h3>{f.nome}</h3>
                <p>{f.cargo}</p>
              </div>
            ))}
          </div>

          <Link to="/equipa" className="sobre-historia__link">
            Conhece toda a equipa →
          </Link>
        </div>
      </section>

      <section className="sobre-cta-final">
        <div className="container sobre-cta-final__inner">
          <h2>Queres fazer parte desta comunidade?</h2>
          <a href={APP_REGISTO} className="btn btn-white" target="_blank" rel="noreferrer">Criar Conta Grátis</a>
        </div>
      </section>
    </>
  );
}
