// Notícias do site — fonte única.
//
// A página Notícias mostra todas; a página Blog mostra as três mais recentes.
// Estavam escritas nos dois sítios e já tinham divergido nas datas.
//
// Só entram aqui factos confirmados pelo calendário oficial
// (Calendario-Realizacao-MukandaPrepa-2026-2027): lançamento e abertura de
// inscrições a 17 de Agosto às 12h; primeira maratona a 20 de Agosto às 20h00
// (esta última também em src/config/maratona.js, que alimenta o contador).
// Nada de números, planos ou parcerias por confirmar.
export const NOTICIAS = [
  {
    titulo: 'MUKANDA PREPA lança a primeira Maratona Nacional',
    data: '20 Ago 2026',
    resumo: 'A primeira maratona aberta a todos os estudantes acontece a 20 de Agosto, às 20h00, com inscrições abertas desde 17 de Agosto.',
    cor: '#1742E7',
  },
  {
    titulo: 'Lançamento oficial da plataforma MUKANDA PREPA',
    data: '17 Ago 2026',
    resumo: 'O website entra oficialmente no ar a 17 de Agosto, ao meio-dia, com a abertura das inscrições para as maratonas.',
    cor: '#FB6D1D',
  },
  {
    titulo: 'Maratonas e Aulas Online 2026: 100% gratuitas',
    data: '17 Ago 2026',
    resumo: 'Nesta primeira fase, as maratonas e as aulas online MUKANDA PREPA 2026 são totalmente gratuitas para todos os estudantes.',
    cor: '#FB6D1D',
  },
];

// As três mais recentes, para o resumo da página Blog.
export const NOTICIAS_RECENTES = NOTICIAS.slice(0, 3);
