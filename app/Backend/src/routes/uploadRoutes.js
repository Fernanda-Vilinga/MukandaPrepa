const express = require("express");
const { verificarToken, exigirRole } = require("../middleware/authMiddleware");
const c = require("../controllers/uploadController");
const { TAMANHO_MAXIMO } = require("../utils/armazenamento");
const { limitar } = require("../middleware/limitador");

// O corpo é binário, não JSON. O express.json() da app não toca nestes pedidos
// porque só actua sobre Content-Type: application/json — aqui declara-se o
// contrário e o Express entrega o ficheiro inteiro em req.body como Buffer.
//
// A lista de tipos aceites é a primeira barreira, mas não a que conta: o
// Content-Type é escrito pelo cliente e pode mentir. A verificação a sério
// (primeiros bytes do ficheiro) está em utils/armazenamento.js.
const TIPOS = ["image/jpeg", "image/png", "image/webp"];

const raw = express.raw({ type: TIPOS, limit: TAMANHO_MAXIMO });

// Quando o Content-Type não está na lista, o express.raw não toca no pedido e
// req.body fica vazio — o erro que sairia seria "Nenhuma imagem recebida", que
// manda o utilizador procurar no sítio errado. O caso real é o HEIC do iPhone.
//
// E quando o ficheiro excede o limite, o express.raw lança um erro que o
// Express trata devolvendo uma página HTML. O browser tenta lê-la como JSON,
// falha, e o utilizador acaba com uma mensagem genérica. Aqui devolve-se JSON.
function receberImagem(req, res, next) {
    const tipo = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();

    if (!TIPOS.includes(tipo)) {
        const heic = /hei[cf]/.test(tipo);
        return res.status(415).json({
            mensagem: heic
                ? "Fotografias no formato HEIC do iPhone não são aceites. Muda em Definições → Câmara → Formatos para \"Mais compatível\", ou envia como JPG."
                : `Formato não aceite (${tipo || "desconhecido"}). Envia a imagem em JPG, PNG ou WEBP.`,
        });
    }

    raw(req, res, (erro) => {
        if (!erro) return next();
        if (erro.type === "entity.too.large") {
            return res.status(413).json({
                mensagem: "A imagem é demasiado grande (máximo 900 kB). Tenta com menos resolução.",
            });
        }
        console.error("recepção da imagem:", erro.message);
        return res.status(400).json({ mensagem: "Não foi possível ler a imagem enviada." });
    });
}

// Limite de envios por utilizador.
//
// As imagens vivem no Firestore, com 1 GB gratuito: cerca de 1 100 imagens
// enchem-no. Sem limite, um professor autenticado enche o armazenamento da
// plataforma em minutos, e a partir daí ninguém consegue guardar mais nada.
//
// 40 em 10 minutos deixa folga larga para o uso real — as 15 questões de uma
// maratona, com substituições e enganos pelo meio — e trava um envio em série.
// Conta-se por utilizador e não por endereço: dentro de uma escola o endereço
// é partilhado, e não faz sentido um professor gastar a quota do colega.
const limitarUploads = limitar({
    nome: "uploads",
    maximo: 40,
    janelaMs: 10 * 60 * 1000,
    chaveDe: (req) => req.usuario?.id || "anonimo",
    mensagem: "Demasiadas imagens enviadas em pouco tempo.",
});

// ── Envio (autenticado) ─────────────────────────────────────────────────────
const uploads = express.Router();
uploads.use(verificarToken);
uploads.post("/questions/:id/:slot", exigirRole("professor"), limitarUploads, receberImagem, c.imagemDaQuestao);
uploads.post("/answers/:id/:questao", limitarUploads, receberImagem, c.fotografiaDaResposta);

// ── Leitura (aberta) ────────────────────────────────────────────────────────
// Router separado, de propósito: assim é impossível alguém acrescentar aqui
// uma rota a pensar que está protegida pelo verificarToken acima.
const imagens = express.Router();
imagens.get("/:id", c.servirImagem);

module.exports = { uploads, imagens };
