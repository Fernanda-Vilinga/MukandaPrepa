// Fase gratuita — interruptor do servidor, fonte única.
//
// Decisão da equipa (D11 + 4 Ago 2026): na Fase 1 todos os estudantes estão
// ao mesmo nível — um único plano visível ("Gratuito") com os limites do
// plano BASIC da Gestão de planos, independentemente do que a conta tiver
// gravado (contas de teste antigas têm plus/premium, e tinham mais
// tentativas do que os alunos novos — era uma desigualdade real, não só um
// nome no ecrã).
//
// Por omissão está LIGADA, porque é o estado real desta fase; desliga-se com
// FASE_GRATUITA=false no ambiente (Fases 2/3, 2027), em conjunto com os
// interruptores do site (src/config/planos.js) e da app (src/config/fase.js).
const faseGratuita = () =>
    String(process.env.FASE_GRATUITA ?? "true").toLowerCase() !== "false";

module.exports = { faseGratuita };
