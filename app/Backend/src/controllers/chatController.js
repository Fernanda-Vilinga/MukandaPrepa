const { db } = require("../config/firebase");
const { decifrar } = require("../utils/crypto");

const CORES = ["var(--orange)", "var(--blue)", "var(--green)", "var(--dark)", "#9333EA"];
const iniciaisDe = (nome = "") => nome.trim().split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
const corDe = (id = "") => CORES[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % CORES.length];
const hora = (iso) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const haQuanto = (iso) => {
    const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return "agora";
    if (min < 60) return `há ${min} min`;
    if (min < 24 * 60) return `há ${Math.floor(min / 60)} h`;
    return new Date(iso).toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
};

const obterUsuario = async (id) => {
    const doc = await db.collection("usuarios").doc(id).get();
    return doc.exists ? { id, ...doc.data() } : null;
};

const minhasConversas = async (estudanteId) =>
    (await db.collection("conversas").where("estudanteId", "==", estudanteId).get())
        .docs.map((d) => ({ id: d.id, ...d.data() }));

// Contexto de uma maratona específica escolhida pelo estudante: quem é o
// professor dono e, se houver sessão activa dessa maratona, a questão em
// curso (referência automática só dentro da maratona já escolhida).
async function contextoMaratona(maratonaId, estudanteId) {
    const mDoc = await db.collection("maratonas").doc(maratonaId).get();
    if (!mDoc.exists) return null;
    const m = mDoc.data();

    const sessoes = (await db.collection("sessoes").where("usuarioId", "==", estudanteId).get())
        .docs.map((d) => d.data()).filter((s) => s.maratonaId === maratonaId);
    const activa = sessoes.find((s) => s.estado === "active");

    let referencia = m.titulo;
    if (activa) {
        const respondidas = Object.keys(activa.respostas || {}).length;
        const idx = Math.min(respondidas, Math.max((activa.questoes || []).length - 1, 0));
        referencia = `Questão ${idx + 1} — ${m.titulo}`;
    }
    return { professorId: m.professorId, titulo: m.titulo, icon: m.icon || "🎓", referencia };
}

const mensagemPublica = (msg) => ({ from: msg.from, text: msg.text, time: hora(msg.criadaEm) });

// ---------- ESTUDANTE — Dúvidas (escolha manual da maratona) ----------

// GET /api/chats/duvidas — conversas já iniciadas pelo estudante (uma por maratona)
exports.duvidasListar = async (req, res) => {
    try {
        const conversas = (await minhasConversas(req.usuario.id)).filter((c) => c.tipo === "duvidas");
        const lista = [];
        for (const c of conversas) {
            const prof = await obterUsuario(c.professorId);
            lista.push({
                maratonaId: c.maratonaId,
                title: c.maratonaTitulo || null,
                icon: c.maratonaIcon || "🎓",
                professorName: prof ? prof.nome : "Professor",
                ref: c.referencia || null,
                last: c.ultimaMensagemEm ? haQuanto(c.ultimaMensagemEm) : "",
                lastMessage: c.ultimaMensagem || null,
                unread: c.naoLidasEstudante || 0,
            });
        }
        lista.sort((a, b) => (b.lastMessage ? 1 : 0) - (a.lastMessage ? 1 : 0));
        res.json({ threads: lista });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// GET /api/chats/duvidas/:maratonaId — abre/consulta a conversa com o
// professor dessa maratona específica (escolhida pelo estudante)
exports.duvidasObter = async (req, res) => {
    try {
        const { maratonaId } = req.params;
        const ctx = await contextoMaratona(maratonaId, req.usuario.id);
        if (!ctx) return res.status(404).json({ mensagem: "Maratona não encontrada." });
        const prof = await obterUsuario(ctx.professorId);

        const conversa = (await minhasConversas(req.usuario.id))
            .find((c) => c.tipo === "duvidas" && c.maratonaId === maratonaId);

        const base = { ref: ctx.referencia, title: ctx.titulo, professorName: prof ? prof.nome : "Professor" };
        if (!conversa) return res.json({ ...base, messages: [] });

        await db.collection("conversas").doc(conversa.id).update({ naoLidasEstudante: 0 });
        res.json({ ...base, messages: (conversa.mensagens || []).map(mensagemPublica) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// POST /api/chats/duvidas/:maratonaId  { text }
exports.duvidasEnviar = async (req, res) => {
    try {
        const { maratonaId } = req.params;
        const texto = String(req.body.text || "").trim();
        if (!texto) return res.status(400).json({ mensagem: "A mensagem não pode estar vazia." });

        const ctx = await contextoMaratona(maratonaId, req.usuario.id);
        if (!ctx) return res.status(404).json({ mensagem: "Maratona não encontrada." });

        let conversa = (await minhasConversas(req.usuario.id))
            .find((c) => c.tipo === "duvidas" && c.maratonaId === maratonaId);

        const novaMsg = { from: "estudante", text: texto, criadaEm: new Date().toISOString() };

        if (!conversa) {
            const ref = await db.collection("conversas").add({
                tipo: "duvidas", estudanteId: req.usuario.id, maratonaId, professorId: ctx.professorId,
                maratonaTitulo: ctx.titulo, maratonaIcon: ctx.icon,
                referencia: ctx.referencia, mensagens: [], naoLidasEstudante: 0, naoLidasProfessor: 0,
                criadaEm: new Date().toISOString(),
            });
            conversa = { id: ref.id, mensagens: [], naoLidasProfessor: 0 };
        }

        const mensagens = [...(conversa.mensagens || []), novaMsg];
        await db.collection("conversas").doc(conversa.id).update({
            mensagens, referencia: ctx.referencia,
            naoLidasProfessor: (conversa.naoLidasProfessor || 0) + 1,
            ultimaMensagem: texto, ultimaMensagemEm: novaMsg.criadaEm,
        });
        res.status(201).json({ ok: true, message: mensagemPublica(novaMsg) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// ---------- ESTUDANTE — Suporte (um único canal com a administração) ----------

// GET /api/chats/suporte
exports.suporteObter = async (req, res) => {
    try {
        const conversa = (await minhasConversas(req.usuario.id)).find((c) => c.tipo === "suporte");
        if (!conversa) return res.json({ messages: [] });

        await db.collection("conversas").doc(conversa.id).update({ naoLidasEstudante: 0 });
        res.json({ messages: (conversa.mensagens || []).map(mensagemPublica) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// POST /api/chats/suporte  { text }
exports.suporteEnviar = async (req, res) => {
    try {
        const texto = String(req.body.text || "").trim();
        if (!texto) return res.status(400).json({ mensagem: "A mensagem não pode estar vazia." });

        let conversa = (await minhasConversas(req.usuario.id)).find((c) => c.tipo === "suporte");
        const novaMsg = { from: "estudante", text: texto, criadaEm: new Date().toISOString() };

        if (!conversa) {
            const ref = await db.collection("conversas").add({
                tipo: "suporte", estudanteId: req.usuario.id, mensagens: [],
                naoLidasEstudante: 0, naoLidasAdmin: 0, criadaEm: new Date().toISOString(),
            });
            conversa = { id: ref.id, mensagens: [], naoLidasAdmin: 0 };
        }

        const mensagens = [...(conversa.mensagens || []), novaMsg];
        await db.collection("conversas").doc(conversa.id).update({
            mensagens,
            naoLidasAdmin: (conversa.naoLidasAdmin || 0) + 1,
            ultimaMensagem: texto, ultimaMensagemEm: novaMsg.criadaEm,
        });
        res.status(201).json({ ok: true, message: mensagemPublica(novaMsg) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// ---------- PROFESSOR (Dúvidas) ----------

// GET /api/prof/chats
exports.profListar = async (req, res) => {
    try {
        const conversas = (await db.collection("conversas").where("professorId", "==", req.usuario.id).get())
            .docs.map((d) => ({ id: d.id, ...d.data() })).filter((c) => c.tipo === "duvidas");

        const lista = [];
        for (const c of conversas) {
            const aluno = await obterUsuario(c.estudanteId);
            lista.push({
                id: c.id,
                student: aluno ? aluno.nome : "Estudante",
                initials: iniciaisDe(aluno ? aluno.nome : ""),
                color: corDe(c.estudanteId),
                unread: c.naoLidasProfessor || 0,
                ref: c.referencia || null,
                maratonaId: c.maratonaId || null,
                maratonaTitle: c.maratonaTitulo || null,
                maratonaIcon: c.maratonaIcon || "🎓",
                plan: aluno ? String(aluno.plano || "basic").toLowerCase() : "basic",
                online: false,
                last: c.ultimaMensagemEm ? haQuanto(c.ultimaMensagemEm) : "",
                messages: (c.mensagens || []).map(mensagemPublica),
            });
        }
        lista.sort((a, b) => (b.messages.length ? 1 : 0) - (a.messages.length ? 1 : 0));
        res.json({ chats: lista });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

const obterConversaDoProf = async (req) => {
    const doc = await db.collection("conversas").doc(req.params.id).get();
    if (!doc.exists) return null;
    const c = { id: doc.id, ...doc.data() };
    return c.tipo === "duvidas" && c.professorId === req.usuario.id ? c : null;
};

// POST /api/prof/chats/:id  { text }
exports.profEnviar = async (req, res) => {
    try {
        const c = await obterConversaDoProf(req);
        if (!c) return res.status(404).json({ mensagem: "Conversa não encontrada." });
        const texto = String(req.body.text || "").trim();
        if (!texto) return res.status(400).json({ mensagem: "A mensagem não pode estar vazia." });

        const novaMsg = { from: "professor", text: texto, criadaEm: new Date().toISOString() };
        const mensagens = [...(c.mensagens || []), novaMsg];
        await db.collection("conversas").doc(c.id).update({
            mensagens, naoLidasEstudante: (c.naoLidasEstudante || 0) + 1, naoLidasProfessor: 0,
            ultimaMensagem: texto, ultimaMensagemEm: novaMsg.criadaEm,
        });
        res.status(201).json({ ok: true, message: mensagemPublica(novaMsg) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// POST /api/prof/marathons/:id/broadcast-password — envia a password (já
// revelável na página de maratonas) como mensagem no chat Dúvidas a todos
// os alunos ligados a esta maratona: quem já conversou sobre ela e quem já
// tem uma sessão/tentativa registada mas ainda não abriu conversa.
exports.broadcastPassword = async (req, res) => {
    try {
        const maratonaId = req.params.id;
        const mDoc = await db.collection("maratonas").doc(maratonaId).get();
        if (!mDoc.exists) return res.status(404).json({ mensagem: "Maratona não encontrada." });
        const m = mDoc.data();
        if (m.professorId !== req.usuario.id) {
            return res.status(403).json({ mensagem: "Esta maratona não é tua." });
        }
        if (!m.senhaCifrada) {
            return res.status(404).json({ mensagem: "Esta maratona ainda não tem password definida." });
        }

        const password = decifrar(m.senhaCifrada);
        const texto = `🔑 Password de acesso à maratona "${m.titulo}": ${password}`;
        const agora = new Date().toISOString();

        const conversasExistentes = (await db.collection("conversas").get()).docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((c) => c.tipo === "duvidas" && c.maratonaId === maratonaId && c.professorId === req.usuario.id);
        const idsComConversa = new Set(conversasExistentes.map((c) => c.estudanteId));

        const idsComSessao = new Set(
            (await db.collection("sessoes").get()).docs.map((d) => d.data())
                .filter((s) => s.maratonaId === maratonaId).map((s) => s.usuarioId)
        );
        const idsSemConversa = [...idsComSessao].filter((id) => !idsComConversa.has(id));

        let enviados = 0;
        for (const c of conversasExistentes) {
            const msg = { from: "professor", text: texto, criadaEm: agora };
            const mensagens = [...(c.mensagens || []), msg];
            await db.collection("conversas").doc(c.id).update({
                mensagens, naoLidasEstudante: (c.naoLidasEstudante || 0) + 1,
                ultimaMensagem: texto, ultimaMensagemEm: agora,
            });
            enviados++;
        }
        for (const estudanteId of idsSemConversa) {
            const msg = { from: "professor", text: texto, criadaEm: agora };
            await db.collection("conversas").add({
                tipo: "duvidas", estudanteId, maratonaId, professorId: req.usuario.id,
                maratonaTitulo: m.titulo, maratonaIcon: m.icon || "🎓",
                referencia: m.titulo, mensagens: [msg],
                naoLidasEstudante: 1, naoLidasProfessor: 0,
                ultimaMensagem: texto, ultimaMensagemEm: agora, criadaEm: agora,
            });
            enviados++;
        }

        res.json({ ok: true, enviados });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// ---------- ADMIN (Suporte) ----------

// GET /api/admin/chats
exports.adminListar = async (req, res) => {
    try {
        const conversas = (await db.collection("conversas").get()).docs
            .map((d) => ({ id: d.id, ...d.data() })).filter((c) => c.tipo === "suporte");

        // Pedidos de upgrade pendentes, por estudante — ligam o botão de
        // acção do chat Suporte ao pedido real (ver purchaseController).
        const comprasPendentes = (await db.collection("compras").where("estado", "==", "pendente").get())
            .docs.map((d) => ({ id: d.id, ...d.data() }));
        const compraPorEstudante = {};
        comprasPendentes.forEach((c) => { compraPorEstudante[c.estudanteId] = c; });

        const lista = [];
        for (const c of conversas) {
            const aluno = await obterUsuario(c.estudanteId);
            const pendente = compraPorEstudante[c.estudanteId];
            lista.push({
                id: c.id,
                student: aluno ? aluno.nome : "Estudante",
                initials: iniciaisDe(aluno ? aluno.nome : ""),
                color: corDe(c.estudanteId),
                unread: c.naoLidasAdmin || 0,
                plan: aluno ? String(aluno.plano || "basic").toLowerCase() : "basic",
                topic: pendente ? "💳 Upgrade de plano" : "🎧 Suporte geral",
                pendingPurchase: pendente
                    ? { id: pendente.id, planoActual: pendente.planoActual, planoPedido: pendente.planoPedido, promoCode: pendente.promoCode || null }
                    : null,
                last: c.ultimaMensagemEm ? haQuanto(c.ultimaMensagemEm) : "",
                messages: (c.mensagens || []).map(mensagemPublica),
            });
        }
        res.json({ chats: lista });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

const obterConversaSuporte = async (id) => {
    const doc = await db.collection("conversas").doc(id).get();
    if (!doc.exists) return null;
    const c = { id: doc.id, ...doc.data() };
    return c.tipo === "suporte" ? c : null;
};

// POST /api/admin/chats/:id  { text }
exports.adminEnviar = async (req, res) => {
    try {
        const c = await obterConversaSuporte(req.params.id);
        if (!c) return res.status(404).json({ mensagem: "Conversa não encontrada." });
        const texto = String(req.body.text || "").trim();
        if (!texto) return res.status(400).json({ mensagem: "A mensagem não pode estar vazia." });

        const novaMsg = { from: "admin", text: texto, criadaEm: new Date().toISOString() };
        const mensagens = [...(c.mensagens || []), novaMsg];
        await db.collection("conversas").doc(c.id).update({
            mensagens, naoLidasEstudante: (c.naoLidasEstudante || 0) + 1, naoLidasAdmin: 0,
            ultimaMensagem: texto, ultimaMensagemEm: novaMsg.criadaEm,
        });
        res.status(201).json({ ok: true, message: mensagemPublica(novaMsg) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};
