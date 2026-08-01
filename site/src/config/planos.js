// Planos e preços — fonte única do site.
//
// Estavam escritos em dois sítios (a página Planos e a pré-visualização da
// homepage) e já tinham divergido dos valores da plataforma: o site anunciava
// 10.000 e 20.000 Kzs enquanto a app cobrava outros valores. Um aluno que
// visse o site e depois entrasse na app encontrava preços diferentes.
//
// Valores fixados pela liderança a 29 de Julho de 2026.
//
// IMPORTANTE: estes números têm de coincidir com a configuração da plataforma,
// em Gestão de planos. O site é material de campanha; quem cobra é a app.
export const PLANOS = [
  {
    key: 'basic',
    nome: 'Basic',
    preco: 'Grátis',
    tentativas: '2',
    destaque: false,
  },
  {
    key: 'plus',
    nome: 'Plus',
    preco: '5.000 Kz',
    tentativas: '5',
    destaque: true,
  },
  {
    key: 'premium',
    nome: 'Premium',
    preco: '15.000 Kz',
    tentativas: 'Ilimitadas',
    destaque: false,
  },
];

// Pagamento único, sem mensalidades — decisão de 23 de Julho de 2026.
export const NOTA_PAGAMENTO = 'pagamento único, sem mensalidade';
