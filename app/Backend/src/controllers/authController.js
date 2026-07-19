const { db } = require("../config/firebase");
const bcrypt = require("bcrypt");
const gerarToken = require("../utils/jwt");

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

        const emailNormalizado = String(email).trim().toLowerCase();

        // verificar se email já existe
        const usuarioExistente = await db
            .collection("usuarios")
            .where("email", "==", emailNormalizado)
            .get();

        if (!usuarioExistente.empty) {
            return res.status(400).json({
                mensagem: "Este email já está registrado.",
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const novoUsuario = {
            nome,
            email: emailNormalizado,
            senha: senhaHash,
            contacto,
            area,
            role: "student",          // registo público cria SEMPRE estudante
            plano: "basic",           // toda a conta nova entra no Basic (grátis)
            estado: "activo",
            criadoEm: new Date(),
        };

        const docRef = await db.collection("usuarios").add(novoUsuario);

        const usuario = { id: docRef.id, ...novoUsuario };
        const token = gerarToken(usuario);

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
