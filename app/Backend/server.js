require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/authRoutes");


const app = express();


app.use(cors());

app.use(express.json());


app.use("/api/auth", authRoutes);



app.get("/", (req, res) => {

    res.json({
        mensagem: "API MukandaPrepa funcionando 🚀"
    });

});



const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {

    console.log(`Servidor rodando na porta ${PORT}`);

});