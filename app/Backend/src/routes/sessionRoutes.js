const express = require("express");
const { verificarToken } = require("../middleware/authMiddleware");
const c = require("../controllers/sessionController");

const router = express.Router();
router.use(verificarToken);
router.get("/active", c.activa);
router.patch("/:id/answers", c.guardarRespostas);
router.post("/:id/submit", c.submeter);

module.exports = router;
