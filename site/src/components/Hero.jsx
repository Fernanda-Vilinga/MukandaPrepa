import './Hero.css';
import { APP_REGISTO } from '../config/appLinks';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__text">
          <h1>A melhor preparação para o acesso à universidade</h1>
          <p className="hero__subtitle">
            Plataforma 100% angolana: a MUKANDA PREPA junta
            exames passados, maratonas online e aulas ao vivo, para
            estudares ao teu ritmo e onde quiseres.
          </p>
          <a href={APP_REGISTO} className="btn btn-primary hero__cta" target="_blank" rel="noreferrer">
            Inscrever-me agora gratuitamente
          </a>
        </div>

        {/*
          Ilustração provisória, no mesmo registo da secção "Sobre nós".
          Substitui a fotografia Hero.jpg, que tinha 12,5 MB — era a primeira
          coisa que qualquer visitante descarregava e, numa ligação móvel,
          atrasava a página inteira. Um SVG desenhado no código pesa uns
          poucos bytes e acompanha o ecrã sem perder nitidez.
          A fotografia definitiva deve entrar já optimizada (WebP, < 200 kB).
        */}
        <div className="hero__illustration" aria-hidden="true">
          <svg viewBox="0 0 420 340" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="20" width="400" height="300" rx="20" fill="#FFF0E6" />
            <rect x="46" y="60" width="200" height="18" rx="9" fill="#FB6D1D" opacity="0.55" />
            <rect x="46" y="94" width="140" height="14" rx="7" fill="#14141F" opacity="0.14" />
            <rect x="46" y="140" width="328" height="120" rx="14" fill="#fff" />
            <circle cx="96" cy="176" r="16" fill="#1742E7" opacity="0.25" />
            <rect x="126" y="168" width="150" height="12" rx="6" fill="#14141F" opacity="0.16" />
            <circle cx="96" cy="224" r="16" fill="#FB6D1D" opacity="0.35" />
            <rect x="126" y="216" width="196" height="12" rx="6" fill="#14141F" opacity="0.12" />
            <rect x="46" y="280" width="110" height="20" rx="10" fill="#FB6D1D" opacity="0.75" />
          </svg>
        </div>
      </div>
    </section>
  );
}
