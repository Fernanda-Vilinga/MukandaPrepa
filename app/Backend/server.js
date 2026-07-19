require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const { profRouter, studentRouter } = require("./src/routes/marathonRoutes");
const seedAdmin = require("./src/utils/seedAdmin");


const app = express();


app.use(cors());

app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/prof/marathons", profRouter);
app.use("/api/marathons", studentRouter);



app.get("/", (req, res) => {

    res.json({
        mensagem: "API MukandaPrepa funcionando 🚀"
    });

});



const PORT = process.env.PORT || 5000;


app.listen(PORT, async () => {

    console.log(`Servidor rodando na porta ${PORT}`);
    await seedAdmin().catch((e) => console.error("Erro no seed do admin:", e.message));

});