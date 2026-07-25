import './CtaFinal.css';
import { APP_REGISTO } from '../config/appLinks';

export default function CtaFinal() {
  return (
    <section className="cta-final">
      <div className="container cta-final__inner">
        <h2>Começa hoje, é grátis!</h2>
        <a href={APP_REGISTO} className="btn btn-white" target="_blank" rel="noreferrer">Criar Conta</a>
      </div>
    </section>
  );
}
