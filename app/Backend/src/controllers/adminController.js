const { db } = require("../config/firebase");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { enviarEmail } = require("../utils/email");
const tpl = require("../utils/emailTemplates");
const val = require("../utils/validacao");

// POST /api/admin/professores  (protegido: só admin)
// Cria conta de professor com senha temporária — o professor deve
// trocá-la no 1º login (flag trocarSenha no documento e no login).
exports.criarProfessor = async (req, res) => {
    try {
        const { nome, email, contacto, area, disciplinas, senhaTemporaria } = req.body;

        if (!nome || !email || !area || !senhaTemporaria || !contacto) {
            return res.status(400).json({
                mensagem: "Campos obrigatórios: nome, email, contacto, área e senha temporária.",
            });
        }

        if (!val.contactoValido(contacto)) {
            return res.status(400).json({ mensagem: val.MENSAGEM_CONTACTO });
        }

        if (String(senhaTemporaria).length < 8) {
            return res.status(400).json({
                mensagem: "A senha temporária deve ter pelo menos 8 caracteres.",
            });
        }

        const emailNormalizado = val.normalizarEmail(email);
        const contactoFormatado = val.formatarContacto(contacto);

        // Mesmas regras do auto-registo de estudantes: nome, email e
        // contacto únicos em toda a plataforma.
        const duplicado = await val.procurarDuplicados(db, {
            nome, email: emailNormalizado, contacto: contactoFormatado,
        });
        if (duplicado) {
            return res.status(400).json({ mensagem: duplicado });
        }

        const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

        const novoProfessor = {
            nome: String(nome).trim().replace(/\s+/g, " "),
            email: emailNormalizado,
            senha: senhaHash,
            contacto: contactoFormatado,
            area,
            disciplinas: disciplinas || "",
            role: "professor",
            trocarSenha: true,          // obriga a trocar a senha no 1º login
            estado: "activo",
            criadoEm: new Date(),
            criadoPor: req.usuario.id,  // admin que criou a conta
        };

        const docRef = await db.collection("usuarios").add(novoProfessor);

        const { subject, html } = tpl.boasVindasProfessor({ nome, email: emailNormalizado, senhaTemporaria });
        await enviarEmail({ to: emailNormalizado, subject, html });

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

// PATCH /api/admin/users/:id  (protegido: só admin)
// Acções: { active: bool } · { plan: "basic"|"plus"|"premium" } · { resetPassword: true }
const PLANOS_VALIDOS = ["basic", "plus", "premium"];

exports.actualizarUtilizador = async (req, res) => {
    try {
        const { id } = req.params;
        const { active, plan, resetPassword } = req.body;

        if (active === undefined && plan === undefined && !resetPassword) {
            return res.status(400).json({ mensagem: "Nenhuma acção indicada." });
        }

        const doc = await db.collection("usuarios").doc(id).get();
        if (!doc.exists) return res.status(404).json({ mensagem: "Utilizador não encontrado." });
        const alvo = doc.data();

        // Um admin não pode suspender-se nem redefinir a própria senha por aqui
        // (evita bloquear-se a si próprio sem querer; usa /alterar-senha para isso)
        if (id === req.usuario.id && (active === false || resetPassword)) {
            return res.status(400).json({ mensagem: "Não podes aplicar esta acção à tua própria conta." });
        }

        const patch = {};
        let novaSenhaTemporaria = null;

        if (active !== undefined) {
            patch.estado = active ? "activo" : "suspenso";
        }

        if (plan !== undefined) {
            if (alvo.role !== "student") {
                return res.status(400).json({ mensagem: "Só é possível alterar o plano de estudantes." });
            }
            const planoNorm = String(plan).toLowerCase();
            if (!PLANOS_VALIDOS.includes(planoNorm)) {
                return res.status(400).json({ mensagem: "Plano inválido." });
            }
            patch.plano = planoNorm;
        }

        if (resetPassword) {
            novaSenhaTemporaria = `MKP-${crypto.randomInt(100000, 999999)}`;
            patch.senha = await bcrypt.hash(novaSenhaTemporaria, 10);
            patch.trocarSenha = true;   // o utilizador troca no próximo login
            // Um link de recuperação pendente deixaria de fazer sentido e
            // seria uma porta aberta — invalida-se aqui também.
            patch.resetTokenHash = null;
            patch.resetTokenExpira = null;
        }

        await db.collection("usuarios").doc(id).update(patch);

        if (novaSenhaTemporaria && alvo.email) {
            const { subject, html } = tpl.senhaRedefinida({ nome: alvo.nome, email: alvo.email, senhaTemporaria: novaSenhaTemporaria });
            await enviarEmail({ to: alvo.email, subject, html });
        }
        if (patch.plano && alvo.email) {
            const PLANO_LABEL = { basic: "Basic", plus: "Plus", premium: "Premium" };
            const { subject, html } = tpl.planoAlteradoPeloAdmin({ nome: alvo.nome, plano: PLANO_LABEL[patch.plano] || patch.plano });
            await enviarEmail({ to: alvo.email, subject, html });
        }

        res.json({
            ok: true,
            id,
            active: patch.estado ? patch.estado === "activo" : undefined,
            plan: patch.plano,
            temporaryPassword: novaSenhaTemporaria || undefined,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};
