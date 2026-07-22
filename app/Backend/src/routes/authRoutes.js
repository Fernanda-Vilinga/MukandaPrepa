const express = require("express");

const router = express.Router();

const {
    register,
    login,
    alterarSenha,
    meuPerfil,
} = require("../controllers/authController");

const { verificarToken } = require("../middleware/authMiddleware");

router.post("/register", register);

router.post("/login", login);

router.get("/me", verificarToken, meuPerfil);

router.post("/alterar-senha", verificarToken, alterarSenha);

module.exports = router;