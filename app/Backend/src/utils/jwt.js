const jwt = require("jsonwebtoken");

// O payload inclui o role — os guards de rota do frontend dependem disso
// (substitui o mock por prefixo de email: "prof..." / "admin...")
function gerarToken(usuario) {
    console.log("JWT_SECRET:", process.env.JWT_SECRET);
    return jwt.sign(
        {
            id: usuario.id,
            email: usuario.email,
            role: usuario.role || "student",
            plano: String(usuario.plano || "basic").toLowerCase(),
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

module.exports = gerarToken;
