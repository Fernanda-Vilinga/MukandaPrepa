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

// GET /api/admin/users  (protegido: só admin)
// Lista todos os utilizadores no formato esperado pela página de gestão.
const CORES = ["var(--orange)", "var(--blue)", "var(--green)", "var(--dark)", "#9333EA"];

const iniciais = (nome = "") =>
    nome.trim().split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";

const dataCurta = (d) => {
    if (!d) return "";
    const data = d.toDate ? d.toDate() : new Date(d);
    return data.toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" });
};

exports.listarUtilizadores = async (req, res) => {
    try {
        const r = await db.collection("usuarios").get();
        const users = r.docs.map((doc, i) => {
            const u = doc.data();
            return {
                id: doc.id,
                name: u.nome,
                email: u.email,
                initials: iniciais(u.nome),
                color: CORES[i % CORES.length],
                role: u.role || "student",
                plan: (u.role || "student") === "student" ? String(u.plano || "basic").toLowerCase() : null,
                active: u.estado !== "suspenso",
                created: dataCurta(u.criadoEm),
            };
        });
        res.json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};
