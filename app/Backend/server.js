// Arranque local (desenvolvimento).
//
// A aplicação Express em si vive em app.js, sem ficar à escuta — é isso que
// permite que o mesmo código corra numa função serverless (ver api/index.js).
// Este ficheiro é apenas o arranque tradicional: `npm run dev` / `npm start`.
const app = require("./app");
const { varrerExpiradas } = require("./src/controllers/sessionController");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);

    // Fecho automático de sessões expiradas. Em produção serverless isto é
    // feito pelo agendador, através de /api/cron/sessoes-expiradas.
    setInterval(varrerExpiradas, 60 * 1000);
});
