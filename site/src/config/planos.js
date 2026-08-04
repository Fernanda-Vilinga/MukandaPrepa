// Planos e preços — fonte única do site.
//
// Estavam escritos em dois sítios (a página Planos e a pré-visualização da
// homepage) e já tinham divergido dos valores da plataforma: o site anunciava
// 10.000 e 20.000 Kzs enquanto a app cobrava outros valores. Um aluno que
// visse o site e depois entrasse na app encontrava preços diferentes.
//
// Valores fixados pela liderança a 29 de Julho de 2026.
//
// ┌──────────────────────────────────────────────────────────────────────┐
// │  REGRA: estes valores têm de ser alterados EM CONJUNTO com o painel  │
// │  da plataforma — Gestão de planos, na app.                           │
// │                                                                      │
// │  Foi decidido manter duas cópias, aqui e na configuração da app, para │
// │  o site não depender do backend. O preço deste desacoplamento é este  │
// │  cuidado manual: mudar num sítio e esquecer o outro faz o site        │
// │  anunciar um preço e a app cobrar outro — foi o que já aconteceu.     │
// │                                                                      │
// │  Ao alterar aqui:  admin → Gestão de planos → Modificar → Guardar     │
// └──────────────────────────────────────────────────────────────────────┘
// ── FASE GRATUITA ───────────────────────────────────────────────────────────
// Decisão da equipa (D11 + D-A3, 3 Ago 2026): na Fase 1 (até 15/09) as
// maratonas e as aulas online são gratuitas para todos; Plus e Premium não
// estão disponíveis e ficam ESCONDIDOS (não "brevemente"). Os planos pagos
// voltam nas Fases 2/3 (2027) — para os repor, basta pôr isto a false.
// O mesmo interruptor existe na app (src/config/fase.js) e no backend
// (variável FASE_GRATUITA) — mudar os três em conjunto.
export const FASE_GRATUITA = true;

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
