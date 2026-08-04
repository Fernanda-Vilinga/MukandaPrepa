const jwt = require("jsonwebtoken");

// O payload inclui o role — os guards de rota do frontend dependem disso
// (substitui o mock por prefixo de email: "prof..." / "admin...")
function gerarToken(usuario) {
    // NUNCA escrever segredos nos registos.
    //
    // Havia aqui uma linha de depuração que imprimia a chave de assinatura em
    // texto simples, a cada login e a cada registo. Os registos da hospedagem
    // ficam guardados e são visíveis a quem tenha acesso ao painel — e com essa
    // chave fabrica-se um token válido para qualquer conta, incluindo a de
    // administrador, sem saber senha nenhuma.
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
