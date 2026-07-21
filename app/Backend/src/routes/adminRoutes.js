const express = require("express");
const router = express.Router();

const { verificarToken, exigirRole } = require("../middleware/authMiddleware");
const { criarProfessor, listarUtilizadores, actualizarUtilizador } = require("../controllers/adminController");
const { estatisticasGlobais, visaoGeralAdmin, exportarRelatorioGlobal } = require("../controllers/statsController");
const adminMar = require("../controllers/adminMarathonController");

router.post("/professores", verificarToken, exigirRole("admin"), criarProfessor);

router.get("/users", verificarToken, exigirRole("admin"), listarUtilizadores);

router.patch("/users/:id", verificarToken, exigirRole("admin"), actualizarUtilizador);

router.get("/stats", verificarToken, exigirRole("admin"), estatisticasGlobais);
router.get("/stats/export.csv", verificarToken, exigirRole("admin"), exportarRelatorioGlobal);

router.get("/overview", verificarToken, exigirRole("admin"), visaoGeralAdmin);

router.get("/marathons", verificarToken, exigirRole("admin"), adminMar.listarTodas);
router.get("/marathons/:id", verificarToken, exigirRole("admin"), adminMar.obterDados);
router.get("/marathons/:id/export.csv", verificarToken, exigirRole("admin"), adminMar.exportarCSV);

module.exports = router;
