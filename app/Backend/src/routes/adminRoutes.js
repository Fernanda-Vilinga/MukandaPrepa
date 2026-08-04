const express = require("express");
const router = express.Router();

const { verificarToken, exigirRole } = require("../middleware/authMiddleware");
const {
    criarProfessor, listarUtilizadores, actualizarUtilizador, normalizarUtilizadores,
} = require("../controllers/adminController");
const { estatisticasGlobais, visaoGeralAdmin, exportarRelatorioGlobal } = require("../controllers/statsController");
const adminMar = require("../controllers/adminMarathonController");
const config = require("../controllers/configController");
const purchase = require("../controllers/purchaseController");

router.post("/professores", verificarToken, exigirRole("admin"), criarProfessor);

router.get("/users", verificarToken, exigirRole("admin"), listarUtilizadores);

router.patch("/users/:id", verificarToken, exigirRole("admin"), actualizarUtilizador);

// Manutenção de uma vez: preencher os campos de procura nas contas antigas.
// Ver adminController.normalizarUtilizadores.
router.post("/manutencao/normalizar", verificarToken, exigirRole("admin"), normalizarUtilizadores);

router.get("/stats", verificarToken, exigirRole("admin"), estatisticasGlobais);
router.get("/stats/export.csv", verificarToken, exigirRole("admin"), exportarRelatorioGlobal);

router.get("/overview", verificarToken, exigirRole("admin"), visaoGeralAdmin);

router.get("/marathons", verificarToken, exigirRole("admin"), adminMar.listarTodas);
router.get("/marathons/:id", verificarToken, exigirRole("admin"), adminMar.obterDados);
router.get("/marathons/:id/export.csv", verificarToken, exigirRole("admin"), adminMar.exportarCSV);

router.get("/plans", verificarToken, exigirRole("admin"), config.obterPlanosAdmin);
router.put("/plans", verificarToken, exigirRole("admin"), config.actualizarPlanos);

router.get("/purchases", verificarToken, exigirRole("admin"), purchase.listarAdmin);
router.post("/purchases/:id/confirm", verificarToken, exigirRole("admin"), purchase.confirmar);
router.post("/purchases/:id/reject", verificarToken, exigirRole("admin"), purchase.rejeitar);

module.exports = router;
