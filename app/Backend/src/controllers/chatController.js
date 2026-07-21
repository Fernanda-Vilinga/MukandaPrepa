const { db } = require("../config/firebase");

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

// Determina o professor "de referência" para o canal Dúvidas: o da
// maratona mais recente do estudante (sessão activa dá prioridade),
// com referência automática à questão em curso, se houver.
async function contextoDuvidas(estudanteId) {
    const sessoes = (await db.collection("sessoes").where("usuarioId", "==", estudanteId).get()).docs
        .map((d) => ({ id: d.id, ...d.data() }));
    if (!sessoes.length) return null;

    sessoes.sort((a, b) => (b.iniciadaEm || "").localeCompare(a.iniciadaEm || ""));
    const activa = sessoes.find((s) => s.estado === "active");
    const sessao = activa || sessoes[0];

    const mDoc = await db.collection("maratonas").doc(sessao.maratonaId).get();
    if (!mDoc.exists) return null;
    const m = mDoc.data();

    let referencia = m.titulo;
    if (sessao.estado === "active") {
        const respondidas = Object.keys(sessao.respostas || {}).length;
        const idx = Math.min(respondidas, Math.max((sessao.questoes || []).length - 1, 0));
        referencia = `Questão ${idx + 1} — ${m.titulo}`;
    }
    return { professorId: m.professorId, referencia };
}

const mensagemPublica = (msg) => ({ from: msg.from, text: msg.text, time: hora(msg.criadaEm) });

// ---------- ESTUDANTE ----------

// GET /api/chats/:channel  (duvidas | suporte)
exports.estudanteObterThread = async (req, res) => {
    try {
        const { channel } = req.params;
        if (!["duvidas", "suporte"].includes(channel)) {
            return res.status(400).json({ mensagem: "Canal inválido." });
        }

        if (channel === "duvidas") {
            const ctx = await contextoDuvidas(req.usuario.id);
            if (!ctx) return res.json({ messages: [], ref: null, available: false });

            const existentes = await db.collection("conversas")
                .where("estudanteId", "==", req.usuario.id).get();
            const conversa = existentes.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .find((c) => c.tipo === "duvidas" && c.professorId === ctx.professorId);

            if (!conversa) return res.json({ messages: [], ref: ctx.referencia, available: true });

            await db.collection("conversas").doc(conversa.id).update({ naoLidasEstudante: 0 });
            return res.json({ messages: (conversa.mensagens || []).map(mensagemPublica), ref: ctx.referencia, available: true });
        }

        // suporte: uma conversa por estudante, partilhada por todos os admins
        const existentes = await db.collection("conversas").where("estudanteId", "==", req.usuario.id).get();
        const conversa = existentes.docs.map((d) => ({ id: d.id, ...d.data() })).find((c) => c.tipo === "suporte");
        if (!conversa) return res.json({ messages: [], available: true });

        await db.collection("conversas").doc(conversa.id).update({ naoLidasEstudante: 0 });
        res.json({ messages: (conversa.mensagens || []).map(mensagemPublica), available: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// POST /api/chats/:channel  { text }
exports.estudanteEnviar = async (req, res) => {
    try {
        const { channel } = req.params;
        const texto = String(req.body.text || "").trim();
        if (!texto) return res.status(400).json({ mensagem: "A mensagem não pode estar vazia." });
        if (!["duvidas", "suporte"].includes(channel)) {
            return res.status(400).json({ mensagem: "Canal inválido." });
        }

        const existentes = (await db.collection("conversas").where("estudanteId", "==", req.usuario.id).get())
            .docs.map((d) => ({ id: d.id, ...d.data() }));

        const novaMsg = { from: "estudante", text: texto, criadaEm: new Date().toISOString() };

        if (channel === "duvidas") {
            const ctx = await contextoDuvidas(req.usuario.id);
            if (!ctx) return res.status(400).json({ mensagem: "Ainda não tens nenhuma maratona para tirar dúvidas com um professor." });

            let conversa = existentes.find((c) => c.tipo === "duvidas" && c.professorId === ctx.professorId);
            if (!conversa) {
                const ref = await db.collection("conversas").add({
                    tipo: "duvidas", estudanteId: req.usuario.id, professorId: ctx.professorId,
                    referencia: ctx.referencia, mensagens: [], naoLidasEstudante: 0, naoLidasProfessor: 0,
                    criadaEm: new Date().toISOString(),
                });
                conversa = { id: ref.id, mensagens: [] };
            }
            const mensagens = [...(conversa.mensagens || []), novaMsg];
            await db.collection("conversas").doc(conversa.id).update({
                mensagens, referencia: ctx.referencia,
                naoLidasProfessor: (conversa.naoLidasProfessor || 0) + 1,
                ultimaMensagem: texto, ultimaMensagemEm: novaMsg.criadaEm,
            });
            return res.status(201).json({ ok: true, message: mensagemPublica(novaMsg) });
        }

        // suporte
        let conversa = existentes.find((c) => c.tipo === "suporte");
        if (!conversa) {
            const ref = await db.collection("conversas").add({
                tipo: "suporte", estudanteId: req.usuario.id, mensagens: [],
                naoLidasEstudante: 0, naoLidasAdmin: 0, criadaEm: new Date().toISOString(),
            });
            conversa = { id: ref.id, mensagens: [] };
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

// ---------- ADMIN (Suporte) ----------

// GET /api/admin/chats
exports.adminListar = async (req, res) => {
    try {
        const conversas = (await db.collection("conversas").get()).docs
            .map((d) => ({ id: d.id, ...d.data() })).filter((c) => c.tipo === "suporte");

        const lista = [];
        for (const c of conversas) {
            const aluno = await obterUsuario(c.estudanteId);
            lista.push({
                id: c.id,
                student: aluno ? aluno.nome : "Estudante",
                initials: iniciaisDe(aluno ? aluno.nome : ""),
                color: corDe(c.estudanteId),
                unread: c.naoLidasAdmin || 0,
                plan: aluno ? String(aluno.plano || "basic").toLowerCase() : "basic",
                topic: "🎧 Suporte geral",
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
