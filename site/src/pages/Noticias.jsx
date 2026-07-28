import './Noticias.css';

// Conteúdo provisório — aguardava protótipo (Briefing v1.0, secção 2.1) e
// ainda não há CMS ligado (Briefing v2.0, secção 07). Substituir por
// notícias reais assim que o CMS estiver configurado.
const NOTICIAS = [
  {
    titulo: 'Lançamento oficial da plataforma mukandaprepa.ao',
    data: '08 Jul 2026',
    resumo: 'O website MUKANDA PREPA está oficialmente no ar, com Homepage, planos, maratonas e aulas online.',
    cor: '#FB6D1D',
  },
  {
    titulo: 'MUKANDA PREPA lança a primeira Maratona Nacional',
    data: '22 Jun 2026',
    resumo: 'A primeira maratona aberta a todos os estudantes acontece a 17 de Agosto, com inscrições já abertas.',
    cor: '#1742E7',
  },
  {
    titulo: 'Novo plano Premium já disponível',
    data: '15 Jun 2026',
    resumo: 'Aulas gravadas, maratonas por universidade e plano de estudo individualizado, tudo num só plano.',
    cor: '#FB6D1D',
  },
  {
    titulo: 'Parceria com professores especializados',
    data: '05 Jun 2026',
    resumo: 'Reforçámos a equipa pedagógica para as aulas ao vivo dos planos Plus e Premium.',
    cor: '#1742E7',
  },
  {
    titulo: 'Como preparar-te para os exames de acesso',
    data: '28 Mai 2026',
    resumo: 'Reunimos as melhores estratégias de estudo para os últimos meses antes do exame.',
    cor: '#FB6D1D',
  },
  {
    titulo: 'MUKANDA PREPA ultrapassa os 500 estudantes inscritos',
    data: '20 Mai 2026',
    resumo: 'Um marco importante na nossa missão de tornar o acesso à universidade mais justo em Angola.',
    cor: '#1742E7',
  },
];

export default function Noticias() {
  return (
    <>
      <section className="noticias-hero">
        <div className="container">
          <h1>Notícias</h1>
          <p>As últimas novidades da MUKANDA PREPA.</p>
        </div>
      </section>

      <section className="noticias-lista">
        <div className="container noticias-lista__grid">
          {NOTICIAS.map((n) => (
            <article className="noticia-card" key={n.titulo}>
              <div className="noticia-card__imagem" style={{ background: n.cor }} aria-hidden="true" />
              <div className="noticia-card__corpo">
                <time className="noticia-card__data">{n.data}</time>
                <h3>{n.titulo}</h3>
                <p>{n.resumo}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
