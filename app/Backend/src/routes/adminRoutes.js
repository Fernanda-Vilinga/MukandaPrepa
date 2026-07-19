const express = require("express");
const router = express.Router();

const { verificarToken, exigirRole } = require("../middleware/authMiddleware");
const { criarProfessor } = require("../controllers/adminController");

router.post("/professores", verificarToken, exigirRole("admin"), criarProfessor);

module.exports = router;
