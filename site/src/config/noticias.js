// Notícias do site — fonte única.
//
// A página Notícias mostra todas; a página Blog mostra as três mais recentes.
// Estavam escritas nos dois sítios e já tinham divergido nas datas.
//
// Conteúdo provisório, a substituir pelas notícias reais quando o documento
// institucional estiver disponível. As duas primeiras datas são as únicas
// confirmadas: lançamento a 10 de Agosto, primeira maratona a 17 de Agosto
// (esta última também em src/config/maratona.js, que alimenta o contador).
export const NOTICIAS = [
  {
    titulo: 'MUKANDA PREPA lança a primeira Maratona Nacional',
    data: '17 Ago 2026',
    resumo: 'A primeira maratona aberta a todos os estudantes acontece a 17 de Agosto, com inscrições já abertas.',
    cor: '#1742E7',
  },
  {
    titulo: 'Lançamento oficial da plataforma mukandaprepa.ao',
    data: '10 Ago 2026',
    resumo: 'O website MUKANDA PREPA entra oficialmente no ar a 10 de Agosto, com Homepage, planos, maratonas e aulas online.',
    cor: '#FB6D1D',
  },
  {
    titulo: 'Novo plano Premium já disponível',
    data: '25 Jul 2026',
    resumo: 'Aulas gravadas, maratonas por universidade e plano de estudo individualizado, tudo num só plano.',
    cor: '#FB6D1D',
  },
  {
    titulo: 'Parceria com professores especializados',
    data: '15 Jul 2026',
    resumo: 'Reforçámos a equipa pedagógica para as aulas ao vivo dos planos Plus e Premium.',
    cor: '#1742E7',
  },
  {
    titulo: 'Como preparar-te para os exames de acesso',
    data: '30 Jun 2026',
    resumo: 'Reunimos as melhores estratégias de estudo para os últimos meses antes do exame.',
    cor: '#FB6D1D',
  },
  {
    titulo: 'MUKANDA PREPA ultrapassa os 500 estudantes inscritos',
    data: '15 Jun 2026',
    resumo: 'Um marco importante na nossa missão de tornar o acesso à universidade mais justo em Angola.',
    cor: '#1742E7',
  },
];

// As três mais recentes, para o resumo da página Blog.
export const NOTICIAS_RECENTES = NOTICIAS.slice(0, 3);
