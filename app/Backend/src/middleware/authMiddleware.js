const jwt = require("jsonwebtoken");

// Verifica o token JWT (Authorization: Bearer <token>)
function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ mensagem: "Token não enviado." });
    }

    const token = authHeader.split(" ")[1];

    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ mensagem: "Token inválido." });
    }
}

// Restringe a rota a um role específico (usar DEPOIS de verificarToken)
// Ex.: router.post("/professores", verificarToken, exigirRole("admin"), ...)
function exigirRole(...roles) {
    return (req, res, next) => {
        if (!req.usuario || !roles.includes(req.usuario.role)) {
            return res.status(403).json({ mensagem: "Sem permissão para esta operação." });
        }
        next();
    };
}

module.exports = { verificarToken, exigirRole };
