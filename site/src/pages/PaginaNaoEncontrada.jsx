import { Link } from 'react-router-dom';
import './PaginaNaoEncontrada.css';

export default function PaginaNaoEncontrada() {
  return (
    <section className="nf">
      <div className="container nf__inner">
        <p className="nf__codigo">404</p>
        <h1>Página não encontrada</h1>
        <p className="nf__texto">
          A página que procuras não existe ou foi movida. Verifica o endereço
          ou volta para um dos destinos abaixo.
        </p>

        <div className="nf__ctas">
          <Link to="/" className="btn btn-primary">Voltar à Página Inicial</Link>
          <Link to="/contactos" className="btn btn-outline">Contactar-nos</Link>
        </div>

        <div className="nf__links">
          <Link to="/planos">Planos &amp; Preços</Link>
          <Link to="/maratonas">Maratonas</Link>
          <Link to="/aulas-online">Aulas Online</Link>
          <Link to="/blog">Blog</Link>
        </div>
      </div>
    </section>
  );
}
