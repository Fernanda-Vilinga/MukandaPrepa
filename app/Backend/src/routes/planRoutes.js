const express = require("express");
const { verificarToken } = require("../middleware/authMiddleware");
const config = require("../controllers/configController");
const purchase = require("../controllers/purchaseController");

// /api/plans — qualquer utilizador autenticado
const router = express.Router();
router.use(verificarToken);
router.get("/", config.obterPlanos);
router.post("/upgrade-request", purchase.solicitar);

module.exports = router;
