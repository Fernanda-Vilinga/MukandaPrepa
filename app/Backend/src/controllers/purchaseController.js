// Pedidos de upgrade de plano — o estudante escolhe um plano no PlanModal,
// isto cria um pedido pendente + a mensagem automática no chat Suporte;
// o admin confirma (ou rejeita) depois de verificar o comprovativo de
// pagamento, o que actualiza o plano e avisa o estudante (chat + email).
const { db } = require("../config/firebase");
const { enviarEmail } = require("../utils/email");
const tpl = require("../utils/emailTemplates");
const { _obterConfig } = require("./configController");

const PLANO_LABEL = { basic: "Basic", plus: "Plus", premium: "Premium" };
const PLANOS_VALIDOS = ["basic", "plus", "premium"];

// Fase gratuita (D11 + D-A3, 3 Ago 2026): na Fase 1 não há upgrades — todos
// os alunos estão no Basic e as maratonas são gratuitas. O interruptor é uma
// variável de ambiente para os planos voltarem sem deploy de código; por
// omissão está LIGADO, porque é o estado real desta fase. A app já não mostra
// os cartões de compra (src/config/fase.js) — isto garante o mesmo do lado do
// servidor, para pedidos feitos à mão contra a API.
const faseGratuita = () => String(process.env.FASE_GRATUITA ?? "true").toLowerCase() !== "false";

const conversaSuporteDe = async (estudanteId) => {
    const existentes = (await db.collection("conversas").where("estudanteId", "==", estudanteId).get())
        .docs.map((d) => ({ id: d.id, ...d.data() }));
    return existentes.find((c) => c.tipo === "suporte") || null;
};

const enviarMensagemSuporte = async (estudanteId, texto, from) => {
    const agora = new Date().toISOString();
    const conversa = await conversaSuporteDe(estudanteId);
    const novaMsg = { from, text: texto, criadaEm: agora };
    if (!conversa) {
        await db.collection("conversas").add({
            tipo: "suporte", estudanteId, mensagens: [novaMsg],
            naoLidasEstudante: from === "admin" ? 1 : 0,
            naoLidasAdmin: from === "estudante" ? 1 : 0,
            ultimaMensagem: texto, ultimaMensagemEm: agora, criadaEm: agora,
        });
        return;
    }
    const mensagens = [...(conversa.mensagens || []), novaMsg];
    const patch = { mensagens, ultimaMensagem: texto, ultimaMensagemEm: agora };
    if (from === "admin") patch.naoLidasEstudante = (conversa.naoLidasEstudante || 0) + 1;
    if (from === "estudante") patch.naoLidasAdmin = (conversa.naoLidasAdmin || 0) + 1;
    await db.collection("conversas").doc(conversa.id).update(patch);
};

// POST /api/plans/upgrade-request  { planId, promoCode }  (estudante)
exports.solicitar = async (req, res) => {
    try {
        if (faseGratuita()) {
            return res.status(403).json({
                mensagem: "Nesta fase, as maratonas e as aulas online são gratuitas para todos — não há planos para comprar.",
            });
        }

        const planoNorm = String(req.body.planId || "").toLowerCase();
        if (!PLANOS_VALIDOS.includes(planoNorm)) {
            return res.status(400).json({ mensagem: "Plano inválido." });
        }

        const uDoc = await db.collection("usuarios").doc(req.usuario.id).get();
        if (!uDoc.exists) return res.status(404).json({ mensagem: "Utilizador não encontrado." });
        const u = uDoc.data();
        if (u.role !== "student") {
            return res.status(400).json({ mensagem: "Só estudantes podem pedir upgrade de plano." });
        }
        const planoActual = u.plano || "basic";
        if (planoActual === planoNorm) {
            return res.status(400).json({ mensagem: "Já tens este plano." });
        }

        // Pedido pendente já existente? evita duplicar enquanto não é tratado.
        const pendentes = (await db.collection("compras").where("estudanteId", "==", req.usuario.id).get())
            .docs.map((d) => d.data()).filter((c) => c.estado === "pendente");
        if (pendentes.length) {
            return res.status(400).json({ mensagem: "Já tens um pedido de upgrade a aguardar confirmação — acompanha no chat Suporte." });
        }

        // Código promocional: informativo (o desconto é aplicado manualmente
        // pelo admin ao confirmar); só validamos que existe e está activo.
        let promoValido = null;
        const codigoPedido = String(req.body.promoCode || "").trim().toUpperCase();
        if (codigoPedido) {
            const config = await _obterConfig();
            const achado = (config.promos || []).find((p) => p.code === codigoPedido && p.active);
            promoValido = achado ? achado.code : null;
        }

        const agora = new Date().toISOString();
        const compraRef = await db.collection("compras").add({
            estudanteId: req.usuario.id,
            planoActual, planoPedido: planoNorm, promoCode: promoValido,
            estado: "pendente", criadaEm: agora,
        });

        const texto = `Olá! Quero actualizar o meu plano ${PLANO_LABEL[planoActual]} para o plano ${PLANO_LABEL[planoNorm]}`
            + `${promoValido ? ` (código promocional ${promoValido})` : ""}. Podem dar seguimento à compra? — mensagem automática`;
        await enviarMensagemSuporte(req.usuario.id, texto, "estudante");

        // Notifica os administradores por email — não bloqueia a resposta.
        (async () => {
            const admins = (await db.collection("usuarios").where("role", "==", "admin").get()).docs.map((d) => d.data());
            const { subject, html } = tpl.pedidoDeUpgrade({
                nomeAluno: u.nome, emailAluno: u.email,
                planoActual: PLANO_LABEL[planoActual], planoPedido: PLANO_LABEL[planoNorm], promoCode: promoValido,
            });
            for (const admin of admins) {
                if (admin.email) await enviarEmail({ to: admin.email, subject, html });
            }
        })().catch(() => {});

        res.status(201).json({ ok: true, id: compraRef.id });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// GET /api/admin/purchases  (admin) — pedidos, mais recentes primeiro
exports.listarAdmin = async (req, res) => {
    try {
        const compras = (await db.collection("compras").get()).docs.map((d) => ({ id: d.id, ...d.data() }));
        compras.sort((a, b) => (b.criadaEm || "").localeCompare(a.criadaEm || ""));

        const lista = [];
        for (const c of compras) {
            const uDoc = await db.collection("usuarios").doc(c.estudanteId).get();
            lista.push({
                id: c.id, estudanteId: c.estudanteId,
                student: uDoc.exists ? uDoc.data().nome : "Estudante",
                email: uDoc.exists ? uDoc.data().email : null,
                planoActual: c.planoActual, planoPedido: c.planoPedido, promoCode: c.promoCode || null,
                estado: c.estado, criadaEm: c.criadaEm,
            });
        }
        res.json({ purchases: lista });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// POST /api/admin/purchases/:id/confirm  (admin)
exports.confirmar = async (req, res) => {
    try {
        const doc = await db.collection("compras").doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ mensagem: "Pedido não encontrado." });
        const c = doc.data();
        if (c.estado !== "pendente") {
            return res.status(400).json({ mensagem: "Este pedido já foi tratado." });
        }

        await db.collection("usuarios").doc(c.estudanteId).update({ plano: c.planoPedido });
        await db.collection("compras").doc(req.params.id).update({
            estado: "confirmada", confirmadaEm: new Date().toISOString(), confirmadaPor: req.usuario.id,
        });

        const texto = `✅ O teu plano ${PLANO_LABEL[c.planoPedido]} já está activo! Obrigado pela confiança — actualiza a página para veres as novas vantagens.`;
        await enviarMensagemSuporte(c.estudanteId, texto, "admin");

        (async () => {
            const uDoc = await db.collection("usuarios").doc(c.estudanteId).get();
            if (!uDoc.exists || !uDoc.data().email) return;
            const { subject, html } = tpl.planoConfirmado({ nomeAluno: uDoc.data().nome, planoPedido: PLANO_LABEL[c.planoPedido] });
            await enviarEmail({ to: uDoc.data().email, subject, html });
        })().catch(() => {});

        res.json({ ok: true, plan: c.planoPedido });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// POST /api/admin/purchases/:id/reject  { motivo }  (admin)
exports.rejeitar = async (req, res) => {
    try {
        const doc = await db.collection("compras").doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ mensagem: "Pedido não encontrado." });
        const c = doc.data();
        if (c.estado !== "pendente") {
            return res.status(400).json({ mensagem: "Este pedido já foi tratado." });
        }

        const motivo = String(req.body.motivo || "").trim();
        await db.collection("compras").doc(req.params.id).update({
            estado: "rejeitada", rejeitadaEm: new Date().toISOString(), rejeitadaPor: req.usuario.id, motivo,
        });

        const texto = `Ainda não foi possível confirmar o teu pedido de upgrade para ${PLANO_LABEL[c.planoPedido]}.`
            + `${motivo ? ` Motivo: ${motivo}` : ""} Fala connosco por aqui se precisares de ajuda.`;
        await enviarMensagemSuporte(c.estudanteId, texto, "admin");

        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};
