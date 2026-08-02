const { db } = require("../config/firebase");
const { enviarEmail } = require("../utils/email");
const tpl = require("../utils/emailTemplates");
const { assinarUrl } = require("../utils/imagensAssinadas");
const { baseUrlDoPedido } = require("../utils/armazenamento");

// ---- helpers de apresentação ----
const CORES = ["var(--orange)", "var(--blue)", "var(--green)", "var(--dark)", "#9333EA"];
const iniciais = (nome = "") =>
    nome.trim().split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
const corDe = (id = "") => CORES[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % CORES.length];
const cap = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

const haQuanto = (iso) => {
    const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return "agora mesmo";
    if (min < 60) return `há ${min} min`;
    if (min < 24 * 60) return `há ${Math.floor(min / 60)} h`;
    return new Date(iso).toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
};

const LETRAS = ["A", "B", "C", "D"];

// ---- acesso ----
const maratonasDoProf = async (profId) => {
    const r = await db.collection("maratonas").where("professorId", "==", profId).get();
    const mapa = {};
    r.docs.forEach((d) => { mapa[d.id] = d.data(); });
    return mapa;
};

const sessoesSubmetidas = async () => {
    const [sub, val] = await Promise.all([
        db.collection("sessoes").where("estado", "==", "submitted").get(),
        db.collection("sessoes").where("estado", "==", "validated").get(),
    ]);
    return [...sub.docs, ...val.docs].map((d) => ({ id: d.id, ...d.data() }));
};

const nomeDoUtilizador = async (id) => {
    const doc = await db.collection("usuarios").doc(id).get();
    return doc.exists ? doc.data() : { nome: "Estudante", plano: "basic" };
};

// ---- professor ----

// GET /api/prof/submissions — fila de validação (submetidas + já validadas)
exports.listar = async (req, res) => {
    try {
        const minhas = await maratonasDoProf(req.usuario.id);
        const sessoes = (await sessoesSubmetidas()).filter((s) => minhas[s.maratonaId]);

        const submissions = [];
        for (const s of sessoes) {
            const aluno = await nomeDoUtilizador(s.usuarioId);
            const tipos = { mcq: 0, text: 0, photo: 0 };
            (s.questoes || []).forEach((q) => { tipos[q.type] = (tipos[q.type] || 0) + 1; });
            submissions.push({
                id: s.id,
                student: aluno.nome,
                initials: iniciais(aluno.nome),
                color: corDe(s.usuarioId),
                marathonId: s.maratonaId,
                marathon: s.maratonaTitulo,
                attempt: s.tentativa || 1,
                plan: cap(String(aluno.plano || "basic")),
                submittedAgo: haQuanto(s.submetidaEm),
                auto: !!s.submissaoAutomatica,
                types: tipos,
                status: s.estado === "validated" ? "validated" : "pending",
            });
        }
        // mais recentes primeiro
        submissions.sort((a, b) => (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1));
        res.json({ submissions });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

const obterSessaoDoProf = async (req) => {
    const doc = await db.collection("sessoes").doc(req.params.id).get();
    if (!doc.exists) return null;
    const s = { id: doc.id, ...doc.data() };
    const minhas = await maratonasDoProf(req.usuario.id);
    return minhas[s.maratonaId] ? s : null;
};

// GET /api/prof/submissions/:id — detalhe com PRÉ-CORRECÇÃO automática das MCQ
exports.obter = async (req, res) => {
    try {
        const s = await obterSessaoDoProf(req);
        if (!s) return res.status(404).json({ mensagem: "Submissão não encontrada." });
        const aluno = await nomeDoUtilizador(s.usuarioId);
        const base_ = baseUrlDoPedido(req);

        const answers = (s.questoes || []).map((q, i) => {
            const resposta = (s.respostas || {})[q.id];
            // imageUrl é o ENUNCIADO — a imagem que o professor carregou. Sem
            // ela, quem valida vê a resposta do aluno sem saber a que pergunta
            // responde, e não tem como julgar se está certa.
            // Assinado no momento da entrega, para o professor que está a
            // corrigir. Ver utils/imagensAssinadas.js: o endereço gravado é só
            // o identificador, o que se entrega tem validade.
            const base = { n: i + 1, type: q.type, imageUrl: assinarUrl(q.image, base_, { tipo: "professor" }) };
            if (q.type === "mcq") {
                return {
                    ...base,
                    options: q.options,
                    selected: typeof resposta === "number" ? resposta : null,
                    correctIndex: q.correct,      // o professor PODE ver a correcta
                    autoCorrect: true,            // MCQ pré-corrigida automaticamente
                };
            }
            if (q.type === "text") {
                const texto = typeof resposta === "string" ? resposta : "";
                return { ...base, textAnswer: texto, chars: texto.length };
            }
            // photoUrl é o endereço da fotografia enviada pelo aluno. O campo
            // chamava-se photoName e guardava o nome do ficheiro no telemóvel
            // dele — o professor via "IMG_2043.jpg" e não tinha como corrigir.
            return { ...base, photoUrl: assinarUrl(resposta, base_, { tipo: "professor" }) };
        });

        const tipos = { mcq: 0, text: 0, photo: 0 };
        (s.questoes || []).forEach((q) => { tipos[q.type] = (tipos[q.type] || 0) + 1; });

        res.json({
            submission: {
                id: s.id,
                student: aluno.nome,
                initials: iniciais(aluno.nome),
                color: corDe(s.usuarioId),
                marathonId: s.maratonaId,
                marathon: s.maratonaTitulo,
                attempt: s.tentativa || 1,
                plan: cap(String(aluno.plano || "basic")),
                submittedAgo: haQuanto(s.submetidaEm),
                auto: !!s.submissaoAutomatica,
                types: tipos,
                status: s.estado === "validated" ? "validated" : "pending",
                answers,
                generalNote: (s.validacao || {}).generalNote || "",
            },
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// POST /api/prof/submissions/:id/validate
// { answers: [{ n, correct, feedback }], generalNote }
exports.validar = async (req, res) => {
    try {
        const s = await obterSessaoDoProf(req);
        if (!s) return res.status(404).json({ mensagem: "Submissão não encontrada." });
        if (s.estado === "validated") {
            return res.status(400).json({ mensagem: "Esta submissão já foi validada." });
        }
        if (s.estado !== "submitted") {
            return res.status(400).json({ mensagem: "A sessão ainda não foi submetida." });
        }

        const marcas = req.body.answers || [];
        const total = (s.questoes || []).length;
        if (marcas.length !== total) {
            return res.status(400).json({ mensagem: `A validação deve cobrir as ${total} questões.` });
        }

        const score = marcas.filter((a) => a.correct === true).length;
        const prof = await nomeDoUtilizador(req.usuario.id);

        await db.collection("sessoes").doc(s.id).update({
            estado: "validated",
            validacao: {
                answers: marcas.map((a) => ({ n: a.n, correct: !!a.correct, feedback: a.feedback || "" })),
                generalNote: req.body.generalNote || "",
                validadaPor: `Prof. ${prof.nome}`,
                validadaEm: new Date().toISOString(),
            },
            score,
            total,
            percent: total ? Math.round((score / total) * 100) : 0,
        });

        // Notifica o estudante ANTES de responder — em serverless, o que
        // ficasse depois do res.json() nunca chegava a correr.
        try {
            const aluno = await nomeDoUtilizador(s.usuarioId);
            if (aluno.email) {
                const minhas = await maratonasDoProf(req.usuario.id);
                const maratona = minhas[s.maratonaId];
                const percent = total ? Math.round((score / total) * 100) : 0;
                const { subject, html } = tpl.resultadoValidado({
                    nomeAluno: aluno.nome, maratona: maratona ? maratona.titulo : "a maratona",
                    score, total, percent,
                });
                await enviarEmail({ to: aluno.email, subject, html });
            }
        } catch (e) {
            // A validação já está gravada — um email falhado não a desfaz.
            console.error("Aviso de resultado ao estudante:", e.message);
        }

        res.json({ ok: true, score, total });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// ---- estudante ----

const formatarResposta = (q, resposta) => {
    if (q.type === "mcq") {
        return typeof resposta === "number"
            ? `${LETRAS[resposta]} — ${(q.options || [])[resposta] ?? ""}`
            : "Não respondida";
    }
    if (q.type === "text") {
        const t = typeof resposta === "string" ? resposta : "";
        if (!t) return "Não respondida";
        return t.length > 90 ? `«${t.slice(0, 90)}…» (${t.length} car.)` : `«${t}» (${t.length} car.)`;
    }
    return typeof resposta === "string" && resposta ? resposta : "Sem fotografia";
};

const paraResultado = (s, rank) => {
    const validada = s.estado === "validated";
    const v = s.validacao || {};
    return {
        id: s.id,
        marathonId: s.maratonaId,
        marathonTitle: s.maratonaTitulo,
        attempt: s.tentativa || 1,
        date: (s.submetidaEm || "").slice(0, 10),
        score: validada ? s.score : null,
        total: s.total || (s.questoes || []).length,
        percent: validada ? s.percent : null,
        rank: validada ? rank : null,
        status: validada ? "validated" : "pending",
        validatedBy: v.validadaPor || null,
        answers: validada
            ? (s.questoes || []).map((q, i) => {
                const marca = (v.answers || []).find((a) => a.n === i + 1) || {};
                return {
                    n: i + 1,
                    type: q.type,
                    answer: formatarResposta(q, (s.respostas || {})[q.id]),
                    correct: !!marca.correct,
                    feedback: marca.feedback || "",
                };
            })
            : [],
    };
};

// posição do estudante entre as sessões validadas da mesma maratona
const rankDe = (todas, s) => {
    if (s.estado !== "validated") return null;
    const validadas = todas.filter((x) => x.maratonaId === s.maratonaId && x.estado === "validated");
    return 1 + validadas.filter((x) => (x.percent || 0) > (s.percent || 0)).length;
};

// GET /api/students/me/results
exports.meusResultados = async (req, res) => {
    try {
        const todas = await sessoesSubmetidas();
        const minhas = todas.filter((s) => s.usuarioId === req.usuario.id);
        minhas.sort((a, b) => (b.submetidaEm || "").localeCompare(a.submetidaEm || ""));
        res.json({ results: minhas.map((s) => paraResultado(s, rankDe(todas, s))) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// GET /api/results/:id
exports.meuResultado = async (req, res) => {
    try {
        const doc = await db.collection("sessoes").doc(req.params.id).get();
        if (!doc.exists || doc.data().usuarioId !== req.usuario.id) {
            return res.status(404).json({ mensagem: "Resultado não encontrado." });
        }
        const s = { id: doc.id, ...doc.data() };
        const todas = await sessoesSubmetidas();
        res.json({ result: paraResultado(s, rankDe(todas, s)) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};
