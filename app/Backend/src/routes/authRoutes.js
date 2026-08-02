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
} = require("../controllers/authController");

const { verificarToken } = require("../middleware/authMiddleware");

router.post("/register", register);

router.post("/login", login);

router.get("/me", verificarToken, meuPerfil);
// A actualização do perfil vive em routes/StudentRoutes.js → PUT /api/students/me.
// Estava também registada aqui, o que dava o caminho /api/auth/students/me — que
// a app nunca chamou. Removido para não haver dois endereços para a mesma coisa.
router.post("/alterar-senha", verificarToken, alterarSenha);

router.post("/esqueci-senha", esqueciSenha);
router.post("/redefinir-senha", redefinirSenha);
router.get("/validar-token-recuperacao", validarTokenRecuperacao);

module.exports = router;