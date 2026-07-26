import { Link } from 'react-router-dom';
import './Footer.css';
import { CONTACTO } from '../config/contactos';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__col">
          <p className="footer__logo">MUKANDA PREPA</p>
          <p className="footer__tagline">A melhor preparação para o acesso à universidade.</p>
        </div>

        <div className="footer__col">
          <h4>Siga-nos</h4>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://tiktok.com" target="_blank" rel="noreferrer">TikTok</a>
        </div>

        <div className="footer__col">
          <h4>Links úteis</h4>
          <Link to="/planos">Planos &amp; Preços</Link>
          <Link to="/maratonas">Maratonas</Link>
          <Link to="/aulas-online">Aulas Online</Link>
          <Link to="/sobre">Sobre nós</Link>
          <Link to="/missao">A Nossa Missão</Link>
          <Link to="/equipa">A Nossa Equipa</Link>
          <Link to="/recursos">Recursos</Link>
          <Link to="/identidade-visual">Identidade Visual</Link>
        </div>

        <div className="footer__col">
          <h4>Contactos</h4>
          <p>Luanda, Angola</p>
          <a href="mailto:mukandaprepa@gmail.com">mukandaprepa@gmail.com</a>
          <a href={CONTACTO.telefoneLink}>{CONTACTO.telefoneLegivel}</a>
          <a href={CONTACTO.whatsappLink} target="_blank" rel="noreferrer">
            WhatsApp: {CONTACTO.telefoneLegivel}
          </a>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© 2026 MUKANDA PREPA. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
