const express = require("express");
const router = express.Router();

const { verificarToken, exigirRole } = require("../middleware/authMiddleware");
const { criarProfessor, listarUtilizadores, actualizarUtilizador } = require("../controllers/adminController");

router.post("/professores", verificarToken, exigirRole("admin"), criarProfessor);

router.get("/users", verificarToken, exigirRole("admin"), listarUtilizadores);

router.patch("/users/:id", verificarToken, exigirRole("admin"), actualizarUtilizador);

module.exports = router;
