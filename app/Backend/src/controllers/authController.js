const { db } = require("../config/firebase");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const gerarToken = require("../utils/jwt");
const { enviarEmail } = require("../utils/email");
const tpl = require("../utils/emailTemplates");
const val = require("../utils/validacao");

// Planos válidos — sempre em minúsculas (alinhado com o frontend da app)
const PLANOS = ["basic", "plus", "premium"];
const normalizarPlano = (p) => {
    const plano = String(p || "basic").toLowerCase();
    return PLANOS.includes(plano) ? plano : "basic";
};

// Formato único do utilizador devolvido à app (sem a senha!)
const usuarioPublico = (usuario) => ({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    contacto: usuario.contacto || "",
    area: usuario.area || "",
    role: usuario.role || "student",
    plano: normalizarPlano(usuario.plano),
    trocarSenha: usuario.trocarSenha === true,
});

// POST /api/auth/register
// Auto-registo APENAS de estudantes (regra da spec — role bloqueado no servidor)
exports.register = async (req, res) => {
    try {
        const { nome, email, senha, contacto, area } = req.body;

        if (!nome || !email || !senha || !contacto || !area) {
            return res.status(400).json({
                mensagem: "Todos os campos são obrigatórios (nome, email, senha, contacto, área).",
            });
        }

        if (String(senha).length < 8) {
            return res.status(400).json({
                mensagem: "A senha deve ter pelo menos 8 caracteres.",
            });
        }

        if (!val.contactoValido(contacto)) {
            return res.status(400).json({ mensagem: val.MENSAGEM_CONTACTO });
        }

        const emailNormalizado = val.normalizarEmail(email);
        const contactoFormatado = val.formatarContacto(contacto);

        // Nome, email e contacto têm de ser únicos em toda a plataforma —
        // duas contas com o mesmo contacto tornam impossível saber a quem
        // pertence um comprovativo de pagamento.
        const duplicado = await val.procurarDuplicados(db, {
            nome, email: emailNormalizado, contacto: contactoFormatado,
        });
        if (duplicado) {
            return res.status(400).json({ mensagem: duplicado });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const novoUsuario = {
            nome: String(nome).trim().replace(/\s+/g, " "),
            email: emailNormalizado,
            senha: senhaHash,
            contacto: contactoFormatado,
            area,
            role: "student",          // registo público cria SEMPRE estudante
            plano: "basic",           // toda a conta nova entra no Basic (grátis)
            estado: "activo",
            criadoEm: new Date(),
        };

        const docRef = await db.collection("usuarios").add(novoUsuario);

        const usuario = { id: docRef.id, ...novoUsuario };
        const token = gerarToken(usuario);

        // Esperado antes de responder: em serverless a função é congelada
        // assim que a resposta sai (ver nota em utils/email.js).
        const bv = tpl.boasVindasEstudante({ nome: usuario.nome });
        await enviarEmail({ to: usuario.email, subject: bv.subject, html: bv.html });

        res.status(201).json({
            mensagem: "Usuário criado com sucesso.",
            token,
            usuario: usuarioPublico(usuario),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                mensagem: "Email e senha são obrigatórios.",
            });
        }

        const resultado = await db
            .collection("usuarios")
            .where("email", "==", String(email).trim().toLowerCase())
            .get();

        // Segurança: mesma resposta (mensagem E status) quer o email não
        // exista quer a senha esteja errada — não revelar que contas existem.
        if (resultado.empty) {
            return res.status(401).json({ mensagem: "Usuário não encontrado." });
        }

        const documento = resultado.docs[0];
        const usuario = { id: documento.id, ...documento.data() };

        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ mensagem: "Usuário não encontrado." });
        }

        if (usuario.estado === "suspenso") {
            return res.status(403).json({ mensagem: "Esta conta está suspensa. Contacta a administração." });
        }

        const token = gerarToken(usuario);

        res.json({
            mensagem: "Login realizado com sucesso.",
            token,
            usuario: usuarioPublico(usuario),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// GET /api/auth/me  (autenticado) — perfil actual, sempre lido do Firestore.
// Usado para re-sincronizar sessionStorage depois de um F5, já que o
// token/plano/estado só ficam gravados no browser no momento do login.
exports.meuPerfil = async (req, res) => {
    try {
        const doc = await db.collection("usuarios").doc(req.usuario.id).get();
        if (!doc.exists) return res.status(404).json({ mensagem: "Conta não encontrada." });

        const usuario = { id: doc.id, ...doc.data() };
        if (usuario.estado === "suspenso") {
            return res.status(403).json({ mensagem: "Esta conta está suspensa. Contacta a administração." });
        }

        res.json({ usuario: usuarioPublico(usuario) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// POST /api/auth/alterar-senha  (autenticado)
// Troca a senha do próprio utilizador; limpa a flag trocarSenha
// (usada no 1º login do professor com senha temporária).
exports.alterarSenha = async (req, res) => {
    try {
        const { senhaActual, novaSenha } = req.body;

        if (!senhaActual || !novaSenha) {
            return res.status(400).json({ mensagem: "Senha actual e nova senha são obrigatórias." });
        }

        if (String(novaSenha).length < 8) {
            return res.status(400).json({ mensagem: "A nova senha deve ter pelo menos 8 caracteres." });
        }

        const doc = await db.collection("usuarios").doc(req.usuario.id).get();

        if (!doc.exists) {
            return res.status(404).json({ mensagem: "Conta não encontrada." });
        }

        const usuario = doc.data();
        const senhaValida = await bcrypt.compare(senhaActual, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ mensagem: "Senha actual incorrecta." });
        }

        // Qualquer link de recuperação pendente deixa de valer: quem acabou
        // de definir uma senha nova não quer um email antigo a permitir
        // trocá-la outra vez.
        await db.collection("usuarios").doc(req.usuario.id).update({
            senha: await bcrypt.hash(novaSenha, 10),
            trocarSenha: false,
            resetTokenHash: null,
            resetTokenExpira: null,
        });

        res.json({ mensagem: "Senha alterada com sucesso." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// POST /api/auth/esqueci-senha  { email }
// Gera um token de recuperação (válido 1h) e envia por email. A resposta é
// sempre a mesma, exista ou não a conta com este email — mesma lógica de
// segurança do login (não revelar quais emails estão registados).
exports.esqueciSenha = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ mensagem: "Email é obrigatório." });
        }

        const emailNormalizado = String(email).trim().toLowerCase();
        const resultado = await db.collection("usuarios").where("email", "==", emailNormalizado).get();

        if (!resultado.empty) {
            const documento = resultado.docs[0];
            const usuario = { id: documento.id, ...documento.data() };

            const tokenBruto = crypto.randomBytes(32).toString("hex");
            const tokenHash = crypto.createHash("sha256").update(tokenBruto).digest("hex");
            const expiraEm = Date.now() + 60 * 60 * 1000; // 1 hora

            await db.collection("usuarios").doc(usuario.id).update({
                resetTokenHash: tokenHash,
                resetTokenExpira: expiraEm,
            });

            const appUrl = process.env.APP_URL || "http://localhost:5173";
            const url = `${appUrl}/redefinir-senha?token=${tokenBruto}`;
            const { subject, html } = tpl.recuperarSenha({ nome: usuario.nome, url });
            await enviarEmail({ to: usuario.email, subject, html });
        }

        // Mesma mensagem quer a conta exista quer não — evita confirmar/negar emails registados.
        res.json({ mensagem: "Se existir uma conta com este email, vais receber instruções para definires uma nova senha." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// POST /api/auth/redefinir-senha  { token, novaSenha }
// Define uma nova senha a partir do token recebido por email (esqueciSenha).
exports.redefinirSenha = async (req, res) => {
    try {
        const { token, novaSenha } = req.body;

        if (!token || !novaSenha) {
            return res.status(400).json({ mensagem: "Token e nova senha são obrigatórios." });
        }
        if (String(novaSenha).length < 8) {
            return res.status(400).json({ mensagem: "A nova senha deve ter pelo menos 8 caracteres." });
        }

        const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
        const resultado = await db.collection("usuarios").where("resetTokenHash", "==", tokenHash).get();

        if (resultado.empty) {
            return res.status(400).json({ mensagem: "Link de recuperação inválido ou já utilizado." });
        }

        const documento = resultado.docs[0];
        const usuario = { id: documento.id, ...documento.data() };

        if (!usuario.resetTokenExpira || Date.now() > usuario.resetTokenExpira) {
            return res.status(400).json({ mensagem: "Link de recuperação expirado. Pede um novo em \"Esqueceste a password?\"." });
        }

        await db.collection("usuarios").doc(usuario.id).update({
            senha: await bcrypt.hash(novaSenha, 10),
            trocarSenha: false,
            resetTokenHash: null,
            resetTokenExpira: null,
        });

        res.json({ mensagem: "Senha redefinida com sucesso. Já podes entrar com a nova senha." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};
