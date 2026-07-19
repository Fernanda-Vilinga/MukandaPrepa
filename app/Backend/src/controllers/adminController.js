const { db } = require("../config/firebase");
const bcrypt = require("bcrypt");

// POST /api/admin/professores  (protegido: só admin)
// Cria conta de professor com senha temporária — o professor deve
// trocá-la no 1º login (flag trocarSenha no documento e no login).
exports.criarProfessor = async (req, res) => {
    try {
        const { nome, email, contacto, area, disciplinas, senhaTemporaria } = req.body;

        if (!nome || !email || !area || !senhaTemporaria) {
            return res.status(400).json({
                mensagem: "Campos obrigatórios: nome, email, área e senha temporária.",
            });
        }

        if (String(senhaTemporaria).length < 8) {
            return res.status(400).json({
                mensagem: "A senha temporária deve ter pelo menos 8 caracteres.",
            });
        }

        const emailNormalizado = String(email).trim().toLowerCase();

        const existente = await db
            .collection("usuarios")
            .where("email", "==", emailNormalizado)
            .get();

        if (!existente.empty) {
            return res.status(400).json({ mensagem: "Este email já está registrado." });
        }

        const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

        const novoProfessor = {
            nome,
            email: emailNormalizado,
            senha: senhaHash,
            contacto: contacto || "",
            area,
            disciplinas: disciplinas || "",
            role: "professor",
            trocarSenha: true,          // obriga a trocar a senha no 1º login
            estado: "activo",
            criadoEm: new Date(),
            criadoPor: req.usuario.id,  // admin que criou a conta
        };

        const docRef = await db.collection("usuarios").add(novoProfessor);

        res.status(201).json({
            mensagem: "Professor registado com sucesso.",
            usuario: {
                id: docRef.id,
                nome,
                email: emailNormalizado,
                contacto: novoProfessor.contacto,
                area,
                disciplinas: novoProfessor.disciplinas,
                role: "professor",
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};
