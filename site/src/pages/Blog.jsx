import { Link } from 'react-router-dom';
import './Blog.css';
import { NOTICIAS_RECENTES } from '../config/noticias';

const CATEGORIAS = [
  {
    titulo: 'Aulas Online',
    desc: 'Aulas ao vivo e gravadas com professores especializados, por matéria.',
    href: '/aulas-online',
  },
  {
    titulo: 'Maratonas MUKANDA',
    desc: 'Sessões intensivas de exercícios cronometrados para chegares preparado ao exame.',
    href: '/maratonas',
  },
  {
    titulo: 'Notícias',
    desc: 'As últimas novidades da MUKANDA PREPA e da comunidade estudantil.',
    href: '/noticias',
  },
  {
    titulo: 'Artigos',
    desc: 'Conteúdo pedagógico gratuito, filtrável por matéria e nível.',
    href: '/artigos',
  },
];

// As notícias recentes vêm da mesma fonte da página Notícias.

const ARTIGOS_RECENTES = [
  { titulo: 'Como resolver equações do 2º grau sem erros', materia: 'Matemática' },
  { titulo: 'As leis de Newton explicadas com exemplos do dia-a-dia', materia: 'Física' },
  { titulo: 'Tabela periódica: truques para memorizar os elementos', materia: 'Química' },
];

export default function Blog() {
  return (
    <>
      <section className="blog-hero">
        <div className="container">
          <h1>Blog MUKANDA PREPA</h1>
          <p>Aulas, maratonas, notícias e artigos — tudo o que precisas para te preparares, num só sítio.</p>
        </div>
      </section>

      <section className="blog-categorias">
        <div className="container blog-categorias__grid">
          {CATEGORIAS.map((c) => (
            <Link to={c.href} className="categoria-card" key={c.titulo}>
              <h3>{c.titulo}</h3>
              <p>{c.desc}</p>
              <span className="categoria-card__cta">Ver mais →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="blog-previews">
        <div className="container blog-previews__grid">
          <div>
            <div className="blog-previews__header">
              <h2>Notícias recentes</h2>
              <Link to="/noticias">Ver todas</Link>
            </div>
            <ul className="blog-previews__lista">
              {NOTICIAS_RECENTES.map((n) => (
                <li key={n.titulo}>
                  <span>{n.titulo}</span>
                  <time>{n.data}</time>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="blog-previews__header">
              <h2>Artigos recentes</h2>
              <Link to="/artigos">Ver todos</Link>
            </div>
            <ul className="blog-previews__lista">
              {ARTIGOS_RECENTES.map((a) => (
                <li key={a.titulo}>
                  <span>{a.titulo}</span>
                  <span className="pill-materia">{a.materia}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
