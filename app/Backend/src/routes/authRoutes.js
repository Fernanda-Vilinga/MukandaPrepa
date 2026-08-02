const express = require("express");

const router = express.Router();

const {
    register,
    login,
    alterarSenha,
    meuPerfil,
    esqueciSenha,
    redefinirSenha,
    validarTokenRecuperacao,
    LIMITE_LOGIN,
} = require("../controllers/authController");

const { verificarToken } = require("../middleware/authMiddleware");
const { limitar, limitarFalhas } = require("../middleware/limitador");

// ── Limites de frequência ───────────────────────────────────────────────────
// Ver src/middleware/limitador.js para o que isto protege e porque é aproximado.

// Recuperação de senha: o mais importante dos três. Sem limite, dispara-se um
// número ilimitado de emails a partir da conta institucional, e o Gmail corta
// o envio ao fim de algumas centenas por dia — deixando a plataforma muda.
const limitarRecuperacao = limitar({
    nome: "esqueci-senha",
    maximo: 5,
    janelaMs: 15 * 60 * 1000,
    mensagem: "Demasiados pedidos de recuperação de senha.",
});

// Também por email: impede alguém de encher a caixa de correio de UMA pessoa
// em concreto, mudando de endereço de origem.
const limitarRecuperacaoPorEmail = limitar({
    nome: "esqueci-senha-email",
    maximo: 3,
    janelaMs: 60 * 60 * 1000,
    chaveDe: (req) => String(req.body?.email || "").trim().toLowerCase() || "sem-email",
    mensagem: "Já foram pedidos vários emails de recuperação para esta conta.",
});

// Registo: trava a criação de contas em massa.
const limitarRegisto = limitar({
    nome: "registo",
    maximo: 10,
    janelaMs: 60 * 60 * 1000,
    mensagem: "Demasiadas contas criadas a partir deste dispositivo.",
});

// Login: só verifica; quem conta as falhas é o controller (ver authController).
const limitarLogin = limitarFalhas({
    nome: LIMITE_LOGIN.nome,
    maximo: LIMITE_LOGIN.maximo,
    mensagem: "Demasiadas tentativas de entrada falhadas.",
});

// ── Rotas ───────────────────────────────────────────────────────────────────
router.post("/register", limitarRegisto, register);

router.post("/login", limitarLogin, login);

router.get("/me", verificarToken, meuPerfil);
// A actualização do perfil vive em routes/StudentRoutes.js → PUT /api/students/me.
// Estava também registada aqui, o que dava o caminho /api/auth/students/me — que
// a app nunca chamou. Removido para não haver dois endereços para a mesma coisa.
router.post("/alterar-senha", verificarToken, alterarSenha);

router.post("/esqueci-senha", limitarRecuperacao, limitarRecuperacaoPorEmail, esqueciSenha);
router.post("/redefinir-senha", redefinirSenha);
router.get("/validar-token-recuperacao", validarTokenRecuperacao);

module.exports = router;
