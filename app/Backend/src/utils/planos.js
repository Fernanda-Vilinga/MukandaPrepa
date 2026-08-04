// Limites por plano — fonte única.
//
// O número de tentativas estava escrito à mão em três controllers
// (sessionController, marathonController, adminMarathonController) e ao mesmo
// tempo era editável pelo administrador em Gestão de planos. As duas coisas
// nunca se falaram: mudar o campo no painel não alterava nada, porque o limite
// aplicado era o número fixo no código. O painel mentia a quem o usava.
//
// Agora o limite vem sempre da configuração guardada. Os valores por omissão
// do configController (2 / 5 / ilimitadas) continuam a valer enquanto ninguém
// os alterar.
const { _obterConfig } = require("../controllers/configController");
const { faseGratuita } = require("./fase");

// null no campo `attempts` significa ilimitadas.
const paraLimite = (attempts) => (attempts == null ? Infinity : Number(attempts));

/**
 * Limite de tentativas de um plano, lido da configuração.
 * Se a configuração falhar ou o plano não existir, cai no Basic — o mais
 * restritivo — para nunca dar acesso a mais do que o devido por engano.
 *
 * FASE GRATUITA: o plano gravado na conta é ignorado e vale sempre o limite
 * do BASIC (é o que o administrador edita na Gestão de planos). Sem isto,
 * contas antigas com plus/premium tinham mais tentativas do que os alunos
 * novos — todos vêem "Gratuito" e todos têm o mesmo limite.
 */
async function limiteDeTentativas(plano) {
    const id = faseGratuita() ? "basic" : String(plano || "basic").toLowerCase();
    try {
        const config = await _obterConfig();
        const encontrado = (config.plans || []).find((p) => p.id === id);
        if (encontrado) return paraLimite(encontrado.attempts);

        const basic = (config.plans || []).find((p) => p.id === "basic");
        return basic ? paraLimite(basic.attempts) : 2;
    } catch (e) {
        console.error("Limite de tentativas: falha ao ler a configuração —", e.message);
        return 2;
    }
}

/**
 * Todos os limites de uma vez, para quem precisa de os usar dentro de um
 * ciclo síncrono (ex.: mapear centenas de linhas de um relatório sem
 * consultar a configuração em cada iteração).
 */
async function limitesPorPlano() {
    try {
        const config = await _obterConfig();
        const limites = {};
        for (const p of config.plans || []) limites[p.id] = paraLimite(p.attempts);

        // Fase gratuita: quem consulta por plano gravado (relatórios, stats)
        // recebe o limite do basic para TODOS os planos — a mesma regra do
        // limiteDeTentativas, para nenhum caminho contar de outra forma.
        if (faseGratuita() && limites.basic !== undefined) {
            for (const id of Object.keys(limites)) limites[id] = limites.basic;
        }
        return limites;
    } catch (e) {
        console.error("Limites por plano: falha ao ler a configuração —", e.message);
        return {};
    }
}

module.exports = { limiteDeTentativas, limitesPorPlano };
