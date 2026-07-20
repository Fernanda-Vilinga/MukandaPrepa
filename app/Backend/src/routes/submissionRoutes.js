const express = require("express");
const { verificarToken, exigirRole } = require("../middleware/authMiddleware");
const c = require("../controllers/submissionController");

// /api/prof/submissions — fila de validação do professor
const profSubs = express.Router();
profSubs.use(verificarToken, exigirRole("professor"));
profSubs.get("/", c.listar);
profSubs.get("/:id", c.obter);
profSubs.post("/:id/validate", c.validar);

// /api/students/me/results + /api/results/:id — estudante
const results = express.Router();
results.use(verificarToken);
results.get("/", c.meusResultados);

const resultDetail = express.Router();
resultDetail.use(verificarToken);
resultDetail.get("/:id", c.meuResultado);

module.exports = { profSubs, results, resultDetail };
