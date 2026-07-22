require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const { profRouter, studentRouter } = require("./src/routes/marathonRoutes");
const sessionRoutes = require("./src/routes/sessionRoutes");
const { profSubs, results, resultDetail } = require("./src/routes/submissionRoutes");
const { studentRouter: chatStudent, profRouter: chatProf, adminRouter: chatAdmin } = require("./src/routes/chatRoutes");
const planRoutes = require("./src/routes/planRoutes");
const { varrerExpiradas } = require("./src/controllers/sessionController");
const seedAdmin = require("./src/utils/seedAdmin");


const app = express();


app.use(cors());

app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/prof/marathons", profRouter);
app.use("/api/marathons", studentRouter);
app.use("/api/sessions", sessionRoutes);
app.use("/api/prof/submissions", profSubs);
app.use("/api/students/me/results", results);
app.use("/api/results", resultDetail);
app.use("/api/chats", chatStudent);
app.use("/api/prof/chats", chatProf);
app.use("/api/admin/chats", chatAdmin);
app.use("/api/plans", planRoutes);



app.get("/", (req, res) => {

    res.json({
        mensagem: "API MukandaPrepa funcionando 🚀"
    });

});



const PORT = process.env.PORT || 5000;


app.listen(PORT, async () => {

    console.log(`Servidor rodando na porta ${PORT}`);
    await seedAdmin().catch((e) => console.error("Erro no seed do admin:", e.message));
    // Fecho automático de sessões expiradas (produção: job Bull + Redis)
    setInterval(varrerExpiradas, 60 * 1000);

});