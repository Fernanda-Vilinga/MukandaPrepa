// Fase gratuita — interruptor da app.
//
// Decisão da equipa (D11 + D-A3, 3 Ago 2026): na Fase 1 (até 15/09) todos os
// alunos estão no plano Basic, as maratonas e aulas online são gratuitas e os
// upgrades Plus/Premium não estão disponíveis. A página de planos mostra um
// aviso em vez dos cartões de compra, e o pedido de upgrade está igualmente
// desligado no backend (variável FASE_GRATUITA — recusa mesmo que alguém
// chame a API à mão).
//
// O mesmo interruptor existe no site (src/config/planos.js) e no backend
// (.env FASE_GRATUITA). Ao reactivar os planos pagos (Fases 2/3, 2027),
// mudar os três em conjunto.
export const FASE_GRATUITA = true;
