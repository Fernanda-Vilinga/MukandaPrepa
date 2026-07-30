const express = require("express");

const router = express.Router();

const {
    register,
    login,
    alterarSenha,
    meuPerfil,
    atualizarPerfil,
    esqueciSenha,
    redefinirSenha,
    validarTokenRecuperacao,
} = require("../controllers/authController");

const { verificarToken } = require("../middleware/authMiddleware");

router.post("/register", register);

router.post("/login", login);

router.get("/me", verificarToken, meuPerfil);
router.put("/students/me", verificarToken, atualizarPerfil);
router.post("/alterar-senha", verificarToken, alterarSenha);

router.post("/esqueci-senha", esqueciSenha);
router.post("/redefinir-senha", redefinirSenha);
router.get("/validar-token-recuperacao", validarTokenRecuperacao);

module.exports = router;