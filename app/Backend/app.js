require("dotenv").config();

const express = require("express");
const cors = require("cors");
const studentRoutes = require("./src/routes/StudentRoutes");
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const { profRouter, studentRouter } = require("./src/routes/marathonRoutes");
const sessionRoutes = require("./src/routes/sessionRoutes");
const { profSubs, results, resultDetail } = require("./src/routes/submissionRoutes");
const { studentRouter: chatStudent, profRouter: chatProf, adminRouter: chatAdmin } = require("./src/routes/chatRoutes");
const planRoutes = require("./src/routes/planRoutes");
const { uploads: uploadRoutes, imagens: imagensRoutes } = require("./src/routes/uploadRoutes");
const { varrerExpiradas } = require("./src/controllers/sessionController");
const seedAdmin = require("./src/utils/seedAdmin");
const app = express();


// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
// Em produção só se aceitam as origens listadas em CORS_ORIGINS (separadas por
// vírgula) — por exemplo o site institucional e a app. Sem a variável definida
// mantém-se o comportamento aberto de antes, útil em desenvolvimento local.
const origensPermitidas = String(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);

app.use(cors(
    origensPermitidas.length === 0
        ? undefined
        : {
            origin(origin, callback) {
                // Pedidos sem Origin (curl, health checks, apps nativas) passam.
                if (!origin) return callback(null, true);
                const limpa = origin.replace(/\/$/, "");
                if (origensPermitidas.includes(limpa)) return callback(null, true);
                callback(new Error(`Origem não permitida por CORS: ${origin}`));
            },
            credentials: true,
        }
));

app.use(express.json());


// ---------------------------------------------------------------------------
// Conta de administrador
// ---------------------------------------------------------------------------
// Antes corria no arranque do servidor. Em serverless não há "arranque", por
// isso corre uma única vez por instância, à boleia do primeiro pedido. É
// idempotente: se o admin já existir, não faz nada.
let seedFeito = null;
app.use((req, res, next) => {
    if (!seedFeito) {
        seedFeito = seedAdmin().catch((e) => {
            console.error("Erro no seed do admin:", e.message);
        });
    }
    seedFeito.then(() => next(), () => next());
});


// ---------------------------------------------------------------------------
// Rotas
// ---------------------------------------------------------------------------
const api = express.Router();

api.use("/auth", authRoutes);
api.use("/admin", adminRoutes);
api.use("/prof/marathons", profRouter);
api.use("/marathons", studentRouter);
api.use("/sessions", sessionRoutes);
api.use("/prof/submissions", profSubs);
api.use("/students/me/results", results);
api.use("/results", resultDetail);
api.use("/chats", chatStudent);
api.use("/prof/chats", chatProf);
api.use("/admin/chats", chatAdmin);
api.use("/plans", planRoutes);
// Registada no router `api`, como todas as outras. Estava directamente no `app`
// com o caminho fixo "/api/students", o que a deixava de fora da montagem dupla
// abaixo: se a reescrita da hospedagem entregar o pedido já sem o prefixo /api,
// tudo continuava a funcionar excepto a actualização do perfil.
api.use("/students", studentRoutes);
api.use("/uploads", uploadRoutes);
api.use("/imagens", imagensRoutes);   // leitura aberta — ver uploadRoutes.js

// Fecho de sessões expiradas, chamado pelo agendador (Vercel Cron).
// Substitui o setInterval, que não sobrevive num ambiente serverless.
// Protegido por CRON_SECRET para não ficar exposto publicamente.
api.all("/cron/sessoes-expiradas", async (req, res) => {
    const segredo = process.env.CRON_SECRET;
    if (segredo) {
        const enviado = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
        if (enviado !== segredo) {
            return res.status(401).json({ mensagem: "Não autorizado." });
        }
    }
    await varrerExpiradas();
    res.json({ ok: true, executadoEm: new Date().toISOString() });
});

api.get("/", (req, res) => {
    res.json({ mensagem: "API MukandaPrepa funcionando 🚀" });
});

// Montado duas vezes de propósito: consoante a configuração de reescrita da
// hospedagem, o pedido pode chegar à função já sem o prefixo /api. Assim
// /api/auth/login e /auth/login resolvem os dois, sem depender disso.
app.use("/api", api);
app.use("/", api);


module.exports = app;
