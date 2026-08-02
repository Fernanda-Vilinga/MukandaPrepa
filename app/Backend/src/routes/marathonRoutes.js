const express = require("express");
const { verificarToken, exigirRole } = require("../middleware/authMiddleware");
const c = require("../controllers/marathonController");
const sess = require("../controllers/sessionController");
const stats = require("../controllers/statsController");
const live = require("../controllers/liveController");
const chat = require("../controllers/chatController");

// /api/prof/marathons — rotas do professor
const profRouter = express.Router();
profRouter.use(verificarToken, exigirRole("professor"));
profRouter.get("/", c.listarDoProfessor);
profRouter.get("/overview/kpis", stats.visaoGeralProfessor);
profRouter.get("/:id", c.obterDoProfessor);
profRouter.get("/:id/password", c.obterPassword);
profRouter.post("/", c.criar);
profRouter.put("/:id", c.actualizar);
profRouter.put("/:id/questions/:slot", c.guardarQuestao);
profRouter.post("/:id/publish", c.publicar);
profRouter.delete("/:id", c.apagar);
profRouter.get("/:id/stats", stats.estatisticasMaratona);
profRouter.get("/:id/export.csv", stats.exportarCSV);
profRouter.get("/:id/live", live.obterAoVivo);
profRouter.post("/:id/broadcast-password", chat.broadcastPassword);

// /api/marathons — rotas do estudante (qualquer utilizador autenticado)
const studentRouter = express.Router();
studentRouter.use(verificarToken);
studentRouter.get("/", c.listar);
studentRouter.get("/:id", c.obter);
studentRouter.post("/:id/enter", c.entrar);
studentRouter.post("/:id/sessions", sess.iniciar);

module.exports = { profRouter, studentRouter };
