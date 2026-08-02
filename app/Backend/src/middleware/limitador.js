// Limitação de frequência de pedidos.
//
// ┌──────────────────────────────────────────────────────────────────────┐
// │  O QUE ISTO PROTEGE, por ordem de probabilidade:                     │
// │                                                                      │
// │  1. A conta de email. /auth/esqueci-senha sem limite permite disparar │
// │     milhares de emails a partir do Gmail institucional. O Gmail corta │
// │     ao fim de algumas centenas por dia — e a plataforma fica sem      │
// │     conseguir enviar sequer os emails de resultados, no pior dia.     │
// │                                                                      │
// │  2. O armazenamento. Cada imagem pode ter 900 kB e o plano gratuito   │
// │     do Firestore dá 1 GB: cerca de 1 100 imagens enchem-no. Um        │
// │     professor autenticado consegue enviá-las em minutos.              │
// │                                                                      │
// │  3. As senhas. Sem bloqueio, testam-se combinações indefinidamente.   │
// └──────────────────────────────────────────────────────────────────────┘
//
// A contagem vive na memória da instância. Em serverless há várias instâncias
// em paralelo, cada uma com a sua — portanto o limite real é mais folgado do
// que o número configurado. Isto é uma barreira contra abuso grosseiro, não uma
// garantia exacta; com um Redis partilhado seria exacta, e é o que se deve
// fazer quando houver servidor próprio.

const baldes = new Map();   // nome → Map(chave → { contagem, expiraEm })

function balde(nome) {
    if (!baldes.has(nome)) baldes.set(nome, new Map());
    return baldes.get(nome);
}

// Endereço de quem faz o pedido. Atrás da hospedagem, o endereço real vem no
// cabeçalho X-Forwarded-For (o primeiro da lista; os seguintes são os proxies).
// req.ip veria sempre o endereço interno da plataforma, igual para todos.
function ipDe(req) {
    const encaminhado = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    return encaminhado || req.ip || req.socket?.remoteAddress || "desconhecido";
}

function limpar(nome, chave) {
    balde(nome).delete(chave);
}

// Conta uma ocorrência. Devolve os segundos que faltam até desbloquear, ou 0.
function registar(nome, chave, { janelaMs, maximo }) {
    const b = balde(nome);
    const agora = Date.now();
    const actual = b.get(chave);

    if (!actual || agora >= actual.expiraEm) {
        b.set(chave, { contagem: 1, expiraEm: agora + janelaMs });
        arrumar(b, agora);
        return 0;
    }

    actual.contagem += 1;
    return actual.contagem > maximo ? Math.ceil((actual.expiraEm - agora) / 1000) : 0;
}

// Só consulta, sem contar. Usado onde o pedido legítimo não deve penalizar —
// ver o login abaixo.
function excedido(nome, chave, maximo) {
    const actual = balde(nome).get(chave);
    if (!actual || Date.now() >= actual.expiraEm) return 0;
    return actual.contagem >= maximo ? Math.ceil((actual.expiraEm - Date.now()) / 1000) : 0;
}

function arrumar(b, agora) {
    if (b.size < 5000) return;
    for (const [k, v] of b) if (agora >= v.expiraEm) b.delete(k);
}

const emMinutos = (s) => (s >= 60 ? `${Math.ceil(s / 60)} minuto(s)` : `${s} segundo(s)`);

/**
 * Middleware que conta cada pedido e bloqueia ao ultrapassar o máximo.
 *
 * @param {string}   nome     identifica o balde (não se misturam entre rotas)
 * @param {number}   maximo   pedidos permitidos na janela
 * @param {number}   janelaMs duração da janela
 * @param {function} chaveDe  como identificar quem faz o pedido
 * @param {string}   mensagem o que se diz a quem for bloqueado
 */
function limitar({ nome, maximo, janelaMs, chaveDe = ipDe, mensagem }) {
    return (req, res, next) => {
        const segundos = registar(nome, chaveDe(req), { janelaMs, maximo });
        if (!segundos) return next();

        res.set("Retry-After", String(segundos));
        return res.status(429).json({
            mensagem: `${mensagem} Tenta de novo daqui a ${emMinutos(segundos)}.`,
        });
    };
}

/**
 * Variante para o login: consulta sem contar.
 *
 * Contar todos os pedidos bloquearia quem entra correctamente muitas vezes —
 * e num laboratório de informática, ou numa escola atrás do mesmo endereço,
 * são dezenas de alunos legítimos a partilhar o mesmo IP. O que se conta são
 * as falhas, e o controller é que as regista (ver authController.login).
 */
function limitarFalhas({ nome, maximo, mensagem }) {
    return (req, res, next) => {
        const segundos = excedido(nome, ipDe(req), maximo);
        if (!segundos) return next();

        res.set("Retry-After", String(segundos));
        return res.status(429).json({
            mensagem: `${mensagem} Tenta de novo daqui a ${emMinutos(segundos)}.`,
        });
    };
}

module.exports = { limitar, limitarFalhas, registar, limpar, ipDe, _baldes: baldes };
