const express = require("express");
const { verificarToken, exigirRole } = require("../middleware/authMiddleware");
const c = require("../controllers/uploadController");
const { TAMANHO_MAXIMO } = require("../utils/armazenamento");

// O corpo é binário, não JSON. O express.json() da app não toca nestes pedidos
// porque só actua sobre Content-Type: application/json — aqui declara-se o
// contrário e o Express entrega o ficheiro inteiro em req.body como Buffer.
//
// A lista de tipos aceites é a primeira barreira, mas não a que conta: o
// Content-Type é escrito pelo cliente e pode mentir. A verificação a sério
// (primeiros bytes do ficheiro) está em utils/armazenamento.js.
const receberImagem = express.raw({
    type: ["image/jpeg", "image/png", "image/webp"],
    limit: TAMANHO_MAXIMO,
});

// ── Envio (autenticado) ─────────────────────────────────────────────────────
const uploads = express.Router();
uploads.use(verificarToken);
uploads.post("/questions/:id/:slot", exigirRole("professor"), receberImagem, c.imagemDaQuestao);
uploads.post("/answers/:id/:questao", receberImagem, c.fotografiaDaResposta);

// ── Leitura (aberta) ────────────────────────────────────────────────────────
// Router separado, de propósito: assim é impossível alguém acrescentar aqui
// uma rota a pensar que está protegida pelo verificarToken acima.
const imagens = express.Router();
imagens.get("/:id", c.servirImagem);

module.exports = { uploads, imagens };
