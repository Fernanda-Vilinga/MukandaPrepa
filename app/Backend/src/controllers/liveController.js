const { db } = require("../config/firebase");
const { sessoesDaMaratona, utilizadoresPorId } = require("../utils/consultas");

const TIPO_LABEL = { mcq: "MCQ", text: "Texto", photo: "Foto" };
const CORES = ["var(--orange)", "var(--blue)", "var(--green)", "var(--dark)", "#9333EA"];

const dataDe = (v) => {
    if (!v) return null;
    const d = v.toDate ? v.toDate() : new Date(v);
    return isNaN(d.getTime()) ? null : d;
};
const iniciaisDe = (nome = "") => nome.trim().split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
const corDe = (id = "") => CORES[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % CORES.length];
const fmtMMSS = (ms) => {
    const seg = Math.max(0, Math.round(ms / 1000));
    return `${String(Math.floor(seg / 60)).padStart(2, "0")}:${String(seg % 60).padStart(2, "0")}`;
};

// GET /api/prof/marathons/:id/live  (professor, dono) — sessões ao vivo.
// Sem WebSocket nesta fase: o frontend faz polling (refresh periódico).
exports.obterAoVivo = async (req, res) => {
    try {
        const doc = await db.collection("maratonas").doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ mensagem: "Maratona não encontrada." });
        const m = { id: doc.id, ...doc.data() };
        if (m.professorId !== req.usuario.id) {
            return res.status(403).json({ mensagem: "Esta maratona não é tua." });
        }

        // Esta rota é consultada de 6 em 6 segundos enquanto a maratona
        // decorre. Lia TODAS as sessões e TODOS os utilizadores da plataforma
        // para depois filtrar em memória — ver utils/consultas.js.
        const todas = await sessoesDaMaratona(m.id);

        const agora = Date.now();
        const ativas = todas.filter((s) => {
            if (s.estado !== "active") return false;
            const fimMs = new Date(s.iniciadaEm).getTime() + s.duracaoSegundos * 1000;
            return agora <= fimMs + 30 * 1000; // ainda dentro da tolerância — considerada "ao vivo"
        });

        // Só os nomes de quem está mesmo a fazer a prova. O custo passa a
        // crescer com os alunos ligados, e não com o total de contas.
        const usuarioPorId = await utilizadoresPorId(ativas.map((s) => s.usuarioId));

        const sessions = ativas.map((s) => {
            const u = usuarioPorId[s.usuarioId] || {};
            const total = (s.questoes || []).length;
            const respondidas = Object.keys(s.respostas || {}).length;
            const idx = Math.min(respondidas, Math.max(total - 1, 0));
            const q = (s.questoes || [])[idx];
            const inicioMs = new Date(s.iniciadaEm).getTime();
            const fimMs = inicioMs + s.duracaoSegundos * 1000;
            const restanteMs = fimMs - agora;
            return {
                student: u.nome || "Estudante",
                initials: iniciaisDe(u.nome),
                color: corDe(s.usuarioId),
                question: q ? `Q${idx + 1} de ${total} · ${TIPO_LABEL[q.type] || q.type}` : `0 de ${total}`,
                progress: total ? Math.round((respondidas / total) * 100) : 0,
                time: fmtMMSS(agora - inicioMs),
                state: restanteMs <= s.duracaoSegundos * 1000 * 0.2 ? "A rever" : "A resolver",
            };
        });

        const terminadas = todas.filter((s) => s.estado === "submitted" || s.estado === "validated");
        const abandoned = terminadas.filter((s) => s.submissaoAutomatica).length;
        const completed = terminadas.length - abandoned;
        const pendingValidation = todas.filter((s) => s.estado === "submitted").length;

        const tempos = terminadas
            .map((s) => { const f = dataDe(s.submetidaEm), i = dataDe(s.iniciadaEm); return f && i ? f.getTime() - i.getTime() : null; })
            .filter((t) => t != null && t > 0);
        const avgTime = tempos.length ? `${Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length / 60000)}m` : "—";

        const participantes = new Set(todas.map((s) => s.usuarioId)).size;

        let windowCloses = "—";
        if (m.acessoFim) {
            const restanteMs = new Date(m.acessoFim).getTime() - agora;
            if (restanteMs > 0) {
                const dias = Math.floor(restanteMs / 86400000);
                const horas = Math.floor((restanteMs % 86400000) / 3600000);
                windowCloses = dias > 0 ? `${dias}d ${horas}h` : `${horas}h`;
            } else {
                windowCloses = "encerrada";
            }
        }

        res.json({
            title: m.titulo,
            windowCloses,
            connected: sessions.length,
            participants: participantes,
            sessions,
            completed,
            abandoned,
            avgTime,
            pendingValidation,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};
