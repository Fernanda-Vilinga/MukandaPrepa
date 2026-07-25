import heroImage from '../assets/Hero.jpg';
import './Hero.css';
import { APP_REGISTO } from '../config/appLinks';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__text">
          <h1>A melhor preparação para o acesso à universidade</h1>
          <p className="hero__subtitle">
            Plataforma Criada 100% angolana: a MUKANDA PREPA junta
            exames passados, maratonas online e aulas ao vivo, para
            estudares ao teu ritmo e onde quiseres.
          </p>
          <a href={APP_REGISTO} className="btn btn-primary hero__cta" target="_blank" rel="noreferrer">
            Inscrever-me agora gratuitamente
          </a>
        </div>

        <div className="hero__illustration">
          <img
            src={heroImage}
            alt="Estudante angolana a estudar"
            className="hero__illustration-img"
          />
        </div>
      </div>
    </section>
  );
}
