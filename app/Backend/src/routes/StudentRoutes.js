// Rotas do próprio estudante sobre a sua conta.
//
// O tratamento do pedido estava escrito aqui dentro, em duplicado com o
// atualizarPerfil do authController. Eram duas versões da mesma coisa, e a que
// respondia — esta — era a mais fraca: não validava nada e devolvia o documento
// inteiro do Firestore ao browser, incluindo o hash da senha e os tokens de
// recuperação. Ficou uma só, a do controller, que já usa o usuarioPublico.
const express = require("express");
const router = express.Router();

const { verificarToken } = require("../middleware/authMiddleware");
const { atualizarPerfil } = require("../controllers/authController");

// PUT /api/students/me — actualizar nome, contacto e área
router.put("/me", verificarToken, atualizarPerfil);

module.exports = router;
