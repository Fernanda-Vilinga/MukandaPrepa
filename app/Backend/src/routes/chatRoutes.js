const express = require("express");
const { verificarToken, exigirRole } = require("../middleware/authMiddleware");
const chat = require("../controllers/chatController");

// /api/chats — canais do estudante (duvidas | suporte)
const studentRouter = express.Router();
studentRouter.use(verificarToken);
studentRouter.get("/:channel", chat.estudanteObterThread);
studentRouter.post("/:channel", chat.estudanteEnviar);

// /api/prof/chats — inbox de Dúvidas do professor
const profRouter = express.Router();
profRouter.use(verificarToken, exigirRole("professor"));
profRouter.get("/", chat.profListar);
profRouter.post("/:id", chat.profEnviar);

// /api/admin/chats — inbox de Suporte do admin
const adminRouter = express.Router();
adminRouter.use(verificarToken, exigirRole("admin"));
adminRouter.get("/", chat.adminListar);
adminRouter.post("/:id", chat.adminEnviar);

module.exports = { studentRouter, profRouter, adminRouter };
