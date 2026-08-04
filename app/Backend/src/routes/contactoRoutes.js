const express = require("express");

const router = express.Router();

const { enviarContacto } = require("../controllers/contactoController");
const { limitar } = require("../middleware/limitador");

// Rota pública que dispara emails — mesma família de risco da recuperação de
// senha (ver limitador.js): sem travão, qualquer pessoa esvazia a quota
// diária de envio do Gmail institucional a partir do formulário do site.
const limitarContacto = limitar({
    nome: "contacto",
    maximo: 5,
    janelaMs: 15 * 60 * 1000,
    mensagem: "Demasiadas mensagens seguidas.",
});

router.post("/", limitarContacto, enviarContacto);

module.exports = router;
