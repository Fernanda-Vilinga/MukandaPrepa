const express = require("express");

const router = express.Router();

const {
    register,
    login,
    alterarSenha
} = require("../controllers/authController");

const { verificarToken } = require("../middleware/authMiddleware");

router.post("/register", register);

router.post("/login", login);

router.post("/alterar-senha", verificarToken, alterarSenha);

module.exports = router;