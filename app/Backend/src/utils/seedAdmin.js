const { db } = require("../config/firebase");
const bcrypt = require("bcrypt");

// Cria a conta de administrador no arranque, se ainda não existir.
// Credenciais vêm do .env: ADMIN_NOME, ADMIN_EMAIL, ADMIN_SENHA.
// (Corresponde à "conta criada na instalação" da spec.)
async function seedAdmin() {
    const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const senha = process.env.ADMIN_SENHA;
    const nome = process.env.ADMIN_NOME || "Administrador MUKANDA";

    if (!email || !senha) {
        console.log("ℹ Seed do admin ignorado (definir ADMIN_EMAIL e ADMIN_SENHA no .env).");
        return;
    }

    const existente = await db
        .collection("usuarios")
        .where("email", "==", email)
        .get();

    if (!existente.empty) {
        console.log(`✔ Admin já existe: ${email}`);
        return;
    }

    await db.collection("usuarios").add({
        nome,
        email,
        senha: await bcrypt.hash(senha, 10),
        role: "admin",
        trocarSenha: true,   // a senha do .env é temporária: troca obrigatória no 1º login
        estado: "activo",
        criadoEm: new Date(),
    });
    console.log(`✔ Conta de administrador criada: ${email}`);
}

module.exports = seedAdmin;
