const jwt = require("jsonwebtoken");
const { db } = require("../config/firebase");

// ─────────────────────────────────────────────────────────────────────────────
// Estado da conta verificado a cada pedido
//
// Antes, o middleware só verificava a assinatura do token. Consequência: um
// utilizador suspenso pelo administrador continuava a usar a plataforma
// normalmente até o token expirar — até 7 dias — e despromover um professor
// não lhe tirava o acesso, porque o papel vinha de dentro do token.
//
// Agora o estado e o papel são lidos da base de dados. Para que isso não
// signifique uma leitura do Firestore em cada pedido — os chats consultam o
// servidor de 6 em 6 segundos, o que multiplicaria as leituras — há uma cache
// curta em memória.
//
// O que a cache implica: uma suspensão demora até TTL_MS a fazer efeito, em vez
// de ser imediata. Um minuto contra sete dias é a troca que se faz aqui — e a
// suspensão feita pelo painel de administração é imediata, porque o
// adminController chama esquecerConta(). Em serverless há várias instâncias,
// cada uma com a sua cache, mas todas expiram no mesmo prazo.
//
// Ordem de grandeza das leituras ao Firestore, com 100 alunos ligados durante
// uma maratona de duas horas (os chats consultam o servidor de 6 em 6 s, ou
// seja 1200 pedidos por aluno):
//   sem cache ......... ~120 000 leituras   (1 por pedido)
//   TTL de 60 s .......  ~12 000 leituras   (1 por aluno por minuto)
//   TTL de 30 s .......  ~24 000 leituras
// O plano gratuito do Firebase dá 50 000 leituras por dia — daí o TTL de 60 s
// como valor por omissão. Ajustável em AUTH_CACHE_MS: baixar torna a suspensão
// mais rápida e as leituras proporcionalmente mais caras.
//
// Nota: em serverless cada instância tem a sua própria cache, portanto com
// várias instâncias em paralelo o número real fica acima destas contas.
// ─────────────────────────────────────────────────────────────────────────────
const TTL_MS = Number(process.env.AUTH_CACHE_MS || 60000);
const cache = new Map();

async function estadoDaConta(id) {
    const agora = Date.now();
    const emCache = cache.get(id);
    if (emCache && agora < emCache.expiraEm) return emCache.valor;

    const doc = await db.collection("usuarios").doc(id).get();
    const valor = doc.exists
        ? { existe: true, estado: doc.data().estado || "activo", role: doc.data().role || "student" }
        : { existe: false };

    cache.set(id, { valor, expiraEm: agora + TTL_MS });

    // A cache não pode crescer sem limite numa instância de longa duração.
    if (cache.size > 500) {
        for (const [k, v] of cache) if (agora >= v.expiraEm) cache.delete(k);
    }
    return valor;
}

// Verifica o token JWT (Authorization: Bearer <token>) e confirma que a conta
// continua activa. O papel usado nas autorizações passa a ser o da base de
// dados, não o que ficou gravado no token.
async function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ mensagem: "Token não enviado." });
    }

    const token = authHeader.split(" ")[1];

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return res.status(401).json({ mensagem: "Token inválido." });
    }

    try {
        const conta = await estadoDaConta(payload.id);

        if (!conta.existe) {
            return res.status(401).json({ mensagem: "Conta não encontrada." });
        }
        if (conta.estado === "suspenso") {
            return res.status(403).json({
                mensagem: "Esta conta está suspensa. Contacta a administração.",
                suspenso: true,
            });
        }

        // O papel vem sempre da base de dados: é o que permite que promover ou
        // despromover alguém tenha efeito sem obrigar a novo login.
        req.usuario = { ...payload, role: conta.role };
        next();
    } catch (e) {
        // Uma falha ao consultar a base de dados não deve deixar entrar seja
        // quem for — mas também não é culpa de quem está a pedir.
        console.error("Verificação do estado da conta:", e.message);
        return res.status(503).json({ mensagem: "Serviço temporariamente indisponível. Tenta de novo." });
    }
}

// Restringe a rota a um role específico (usar DEPOIS de verificarToken).
// Ex.: router.post("/professores", verificarToken, exigirRole("admin"), ...)
function exigirRole(...roles) {
    return (req, res, next) => {
        if (!req.usuario || !roles.includes(req.usuario.role)) {
            return res.status(403).json({ mensagem: "Sem permissão para esta operação." });
        }
        next();
    };
}

// Usado pelo painel de administração depois de suspender, reactivar ou mudar o
// papel de alguém: limpa a entrada em cache desta instância, para o efeito ser
// imediato aqui. Nas outras instâncias, o TTL trata do resto.
function esquecerConta(id) {
    cache.delete(id);
}

module.exports = { verificarToken, exigirRole, esquecerConta };
