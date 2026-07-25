import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_LOGIN, APP_REGISTO } from '../config/appLinks';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [blogOpen, setBlogOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          <img src="/01.png" alt="MUKANDA PREPA" className="navbar__logo-img" />
        </Link>

        <nav className="navbar__links">
          <Link to="/">Home</Link>
          <Link to="/sobre">Sobre</Link>
          <Link to="/planos">Planos &amp; Pre&ccedil;os</Link>

          <div
            className="navbar__dropdown"
            onMouseEnter={() => setBlogOpen(true)}
            onMouseLeave={() => setBlogOpen(false)}
          >
            <Link to="/blog" className="navbar__dropdown-trigger">
              Blog <span className="navbar__caret">&#9662;</span>
            </Link>
            {blogOpen && (
              <div className="navbar__megamenu">
                <Link to="/aulas-online">Aulas online</Link>
                <Link to="/maratonas">Maratonas MUKANDA</Link>
                <Link to="/noticias">Not&iacute;cias</Link>
                <Link to="/artigos">Artigos</Link>
              </div>
            )}
          </div>

          <Link to="/contactos">Contactos</Link>
        </nav>

        <div className="navbar__actions">
          <a href={APP_LOGIN} className="btn btn-outline" target="_blank" rel="noreferrer">Login</a>
          <a href={APP_REGISTO} className="btn btn-primary" target="_blank" rel="noreferrer">Inscrever-me</a>
        </div>
      </div>
    </header>
  );
}
