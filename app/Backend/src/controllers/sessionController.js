const { db } = require("../config/firebase");
const { enviarEmail } = require("../utils/email");
const tpl = require("../utils/emailTemplates");

const { limiteDeTentativas } = require("../utils/planos");
const { temEnunciado } = require("../utils/questoes");

// ---- helpers ----
const agoraMs = () => Date.now();
const fimDe = (s) => new Date(s.iniciadaEm).getTime() + s.duracaoSegundos * 1000;
const expirada = (s) => agoraMs() > fimDe(s) + 30 * 1000; // 30s de tolerância de rede

// Questão SEM a resposta correcta — o estudante nunca a recebe
const questaoParaEstudante = (q) => ({
    id: q.id,
    slot: q.slot,
    type: q.type,
    imageUrl: q.image || null,
    options: q.type === "mcq" ? q.options : null,
});

const sessaoParaEstudante = (s) => ({
    id: s.id,
    marathonId: s.maratonaId,
    startedAt: new Date(s.iniciadaEm).getTime(),
    durationSeconds: s.duracaoSegundos,
    questions: (s.questoes || []).map(questaoParaEstudante),
    answers: s.respostas || {},
});

// Fecha uma sessão expirada com as respostas auto-guardadas (server-side,
// não confia no cliente). Em produção: reforçar com job Bull + Redis.
const fecharSeExpirada = async (s) => {
    if (s.estado === "active" && expirada(s)) {
        await db.collection("sessoes").doc(s.id).update({
            estado: "submitted",
            submetidaEm: new Date().toISOString(),
            submissaoAutomatica: true,
        });
        s.estado = "submitted";
        s.submissaoAutomatica = true;
    }
    return s;
};

const sessaoActivaDoUtilizador = async (usuarioId) => {
    const r = await db.collection("sessoes").where("usuarioId", "==", usuarioId).get();
    for (const d of r.docs) {
        const s = await fecharSeExpirada({ id: d.id, ...d.data() });
        if (s.estado === "active") return s;
    }
    return null;
};

// Varredura periódica: fecha sessões expiradas mesmo com o browser fechado
exports.varrerExpiradas = async () => {
    try {
        const r = await db.collection("sessoes").where("estado", "==", "active").get();
        for (const d of r.docs) await fecharSeExpirada({ id: d.id, ...d.data() });
    } catch (e) {
        console.error("Varredura de sessões:", e.message);
    }
};

// POST /api/marathons/:id/sessions — SORTEIO NO SERVIDOR (spec §4.3)
exports.iniciar = async (req, res) => {
    try {
        const doc = await db.collection("maratonas").doc(req.params.id).get();
        if (!doc.exists || doc.data().status !== "published") {
            return res.status(404).json({ mensagem: "Maratona não encontrada." });
        }
        const m = { id: doc.id, ...doc.data() };

        // janela de acesso validada de novo (não confiar no fluxo do cliente)
        const agora = agoraMs();
        if (agora < new Date(m.acessoInicio).getTime() || agora > new Date(m.acessoFim).getTime()) {
            return res.status(400).json({ mensagem: "A maratona não está activa." });
        }

        // retomar sessão activa desta maratona (não queima nova tentativa)
        const activa = await sessaoActivaDoUtilizador(req.usuario.id);
        if (activa) {
            if (activa.maratonaId === m.id) {
                return res.json({ session: sessaoParaEstudante(activa), resumed: true });
            }
            return res.status(400).json({ mensagem: "Tens uma sessão activa noutra maratona. Termina-a primeiro." });
        }

        // limite de tentativas do plano — no servidor
        const userDoc = await db.collection("usuarios").doc(req.usuario.id).get();
        const plano = userDoc.exists ? String(userDoc.data().plano || "basic").toLowerCase() : "basic";
        const limite = await limiteDeTentativas(plano);
        const minhas = await db.collection("sessoes").where("usuarioId", "==", req.usuario.id).get();
        const usadas = minhas.docs.filter((d) => d.data().maratonaId === m.id).length;
        if (usadas >= limite) {
            return res.status(403).json({ mensagem: "Atingiste o limite de tentativas do teu plano." });
        }

        // SORTEIO server-side de 4–5 questões do banco de 15 (Fisher–Yates)
        //
        // Exige-se enunciado e não só `filled`: as questões gravadas antes de
        // existir upload real estão marcadas como preenchidas mas não têm
        // imagem — ou têm apenas o nome de um ficheiro do computador do
        // professor. Sem esta verificação o aluno entrava, o cronómetro
        // arrancava, e ele ficava a olhar para rectângulos vazios.
        //
        // Recusar aqui não gasta tentativa — a sessão só é criada mais abaixo.
        const banco = (m.questoes || []).filter(temEnunciado);
        if (banco.length < m.questoesPorSessao) {
            return res.status(400).json({
                mensagem: "Esta maratona ainda não está pronta: faltam enunciados. Avisa o professor — não perdeste nenhuma tentativa.",
            });
        }
        const baralhado = [...banco];
        for (let i = baralhado.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [baralhado[i], baralhado[j]] = [baralhado[j], baralhado[i]];
        }
        const sorteadas = baralhado.slice(0, m.questoesPorSessao).map((q) => ({
            ...q,
            id: `${m.id}q${q.slot}`,
        }));

        const nova = {
            maratonaId: m.id,
            maratonaTitulo: m.titulo,
            usuarioId: req.usuario.id,
            questoes: sorteadas,          // inclui a correcta — só no servidor
            respostas: {},
            iniciadaEm: new Date().toISOString(),
            duracaoSegundos: Math.round(m.duracaoMinutos * 60),
            estado: "active",
            tentativa: usadas + 1,
        };
        const ref = await db.collection("sessoes").add(nova);
        await db.collection("maratonas").doc(m.id).update({ participantes: (m.participantes || 0) + 1 });

        res.status(201).json({ session: sessaoParaEstudante({ id: ref.id, ...nova }) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// GET /api/sessions/active — retomar após refresh/reabertura
exports.activa = async (req, res) => {
    try {
        const s = await sessaoActivaDoUtilizador(req.usuario.id);
        res.json({ session: s ? sessaoParaEstudante(s) : null });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

const obterMinha = async (req) => {
    const doc = await db.collection("sessoes").doc(req.params.id).get();
    if (!doc.exists) return null;
    const s = { id: doc.id, ...doc.data() };
    return s.usuarioId === req.usuario.id ? s : null;
};

// PATCH /api/sessions/:id/answers — auto-save
exports.guardarRespostas = async (req, res) => {
    try {
        let s = await obterMinha(req);
        if (!s) return res.status(404).json({ mensagem: "Sessão não encontrada." });
        s = await fecharSeExpirada(s);
        if (s.estado !== "active") {
            return res.status(400).json({ mensagem: "A sessão já foi submetida.", submitted: true });
        }
        const respostas = req.body.answers || {};
        await db.collection("sessoes").doc(s.id).update({ respostas });
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// POST /api/sessions/:id/submit — bloqueia respostas
exports.submeter = async (req, res) => {
    try {
        let s = await obterMinha(req);
        if (!s) return res.status(404).json({ mensagem: "Sessão não encontrada." });
        s = await fecharSeExpirada(s);
        if (s.estado !== "active") {
            // já fechada (ex.: pelo timeout server-side) — devolve ok idempotente
            return res.json({ ok: true, submittedAt: s.submetidaEm, auto: !!s.submissaoAutomatica });
        }
        const patch = {
            estado: "submitted",
            submetidaEm: new Date().toISOString(),
            submissaoAutomatica: false,
        };
        if (req.body && req.body.answers) patch.respostas = req.body.answers;
        await db.collection("sessoes").doc(s.id).update(patch);
        // Notifica o professor dono da maratona ANTES de responder: em
        // serverless, tudo o que ficasse para depois do res.json() nunca
        // chegava a correr (ver nota em utils/email.js). Era por isso que o
        // professor nunca era avisado das submissões.
        try {
            const [mDoc, uDoc] = await Promise.all([
                db.collection("maratonas").doc(s.maratonaId).get(),
                db.collection("usuarios").doc(s.usuarioId).get(),
            ]);
            if (mDoc.exists) {
                const m = mDoc.data();
                const prof = await db.collection("usuarios").doc(m.professorId).get();
                if (prof.exists && prof.data().email) {
                    const { subject, html } = tpl.submissaoRecebida({
                        nomeProfessor: prof.data().nome,
                        nomeAluno: uDoc.exists ? uDoc.data().nome : "Um estudante",
                        maratona: m.titulo,
                    });
                    await enviarEmail({ to: prof.data().email, subject, html });
                }
            }
        } catch (e) {
            // A submissão do aluno já está guardada — um email falhado não a
            // pode pôr em causa.
            console.error("Aviso de submissão ao professor:", e.message);
        }

        res.json({ ok: true, submittedAt: patch.submetidaEm, auto: false });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};
