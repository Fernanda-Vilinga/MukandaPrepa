const express = require("express");
const router = express.Router();

const { verificarToken, exigirRole } = require("../middleware/authMiddleware");
const { criarProfessor, listarUtilizadores } = require("../controllers/adminController");

router.post("/professores", verificarToken, exigirRole("admin"), criarProfessor);

router.get("/users", verificarToken, exigirRole("admin"), listarUtilizadores);

module.exports = router;
