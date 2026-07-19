const express = require("express");
const { verificarToken, exigirRole } = require("../middleware/authMiddleware");
const c = require("../controllers/marathonController");

// /api/prof/marathons — rotas do professor
const profRouter = express.Router();
profRouter.use(verificarToken, exigirRole("professor"));
profRouter.get("/", c.listarDoProfessor);
profRouter.post("/", c.criar);
profRouter.put("/:id", c.actualizar);
profRouter.put("/:id/questions/:slot", c.guardarQuestao);
profRouter.post("/:id/publish", c.publicar);

// /api/marathons — rotas do estudante (qualquer utilizador autenticado)
const studentRouter = express.Router();
studentRouter.use(verificarToken);
studentRouter.get("/", c.listar);
studentRouter.get("/:id", c.obter);
studentRouter.post("/:id/enter", c.entrar);

module.exports = { profRouter, studentRouter };
