const { db } = require("../config/firebase");

const AREA_LABEL = { "Engenharia e Tecnologia": "⚙️ Engenharia", "Ciências Sociais": "⚖️ Ciências Sociais" };
const LIMITE_PLANO = { basic: 2, plus: 5, premium: Infinity };
const LETRAS = ["A", "B", "C", "D"];
const CORES = ["var(--orange)", "var(--blue)", "var(--green)", "var(--dark)", "#9333EA"];

const dataDe = (v) => {
    if (!v) return null;
    const d = v.toDate ? v.toDate() : new Date(v);
    return isNaN(d.getTime()) ? null : d;
};
const iniciaisDe = (nome = "") => nome.trim().split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
const corDe = (id = "") => CORES[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % CORES.length];
const csvEsc = (v) => { const s = v == null ? "" : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

const iconPara = (disciplina = "") => {
    const d = disciplina.toLowerCase();
    if (d.includes("matem")) return "📐";
    if (d.includes("quím") || d.includes("quim")) return "🧪";
    if (d.includes("fís") || d.includes("fis")) return "⚡";
    if (d.includes("direito")) return "⚖️";
    if (d.includes("biol")) return "🧬";
    return "🎓";
};

const statusEfectivo = (m) => {
    if (m.status !== "published") return "draft";
    const agora = Date.now();
    if (m.acessoInicio && agora < new Date(m.acessoInicio).getTime()) return "soon";
    if (m.acessoFim && agora > new Date(m.acessoFim).getTime()) return "closed";
    return "active";
};

const todasSessoes = async () => (await db.collection("sessoes").get()).docs.map((d) => ({ id: d.id, ...d.data() }));
const todosUsuarios = async () => (await db.collection("usuarios").get()).docs.map((d) => ({ id: d.id, ...d.data() }));

// GET /api/admin/marathons  (só admin) — todas as maratonas, qualquer professor
exports.listarTodas = async (req, res) => {
    try {
        const [maratonas, usuarios] = await Promise.all([
            (await db.collection("maratonas").get()).docs.map((d) => ({ id: d.id, ...d.data() })),
            todosUsuarios(),
        ]);
        const nomeDoProf = {};
        usuarios.forEach((u) => { nomeDoProf[u.id] = u.nome; });

        const lista = maratonas.map((m) => ({
            id: m.id,
            title: m.titulo,
            icon: m.icon || iconPara(m.disciplina),
            status: statusEfectivo(m),
            professor: nomeDoProf[m.professorId] ? `Prof. ${nomeDoProf[m.professorId]}` : "—",
            durationMinutes: m.duracaoMinutos,
            questionsPerSession: m.questoesPorSessao,
            accessEnd: m.acessoFim ? new Date(m.acessoFim).toLocaleDateString("pt-PT", { day: "numeric", month: "short" }) : null,
            participants: m.participantes || 0,
        }));
        res.json({ marathons: lista });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// Agrega tudo o que MarathonData.jsx precisa para uma maratona
async function calcularDados(m, usuarios, sessoesDaMaratona) {
    const usuarioPorId = {};
    usuarios.forEach((u) => { usuarioPorId[u.id] = u; });

    // Classificação de estado por sessão (só terminadas: submitted/validated)
    const terminadas = sessoesDaMaratona.filter((s) => s.estado === "submitted" || s.estado === "validated");
    const classificar = (s) => (s.estado === "validated" ? "validated" : s.submissaoAutomatica ? "abandoned" : "pending");

    const participantes = new Set(sessoesDaMaratona.map((s) => s.usuarioId)).size;
    const attempts = sessoesDaMaratona.length;

    const validadas = sessoesDaMaratona.filter((s) => s.estado === "validated");
    const avgScoreNum = validadas.length ? validadas.reduce((a, s) => a + (s.score || 0), 0) / validadas.length : 0;
    const avgScore = validadas.length ? `${avgScoreNum.toFixed(1).replace(".", ",")}/${m.questoesPorSessao}` : "—";

    const tempos = terminadas
        .map((s) => { const f = dataDe(s.submetidaEm), i = dataDe(s.iniciadaEm); return f && i ? f.getTime() - i.getTime() : null; })
        .filter((t) => t != null && t > 0);
    const avgTime = tempos.length ? `${Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length / 60000)}m` : "—";

    // Erro por questão (banco, slot original)
    const porSlot = {};
    validadas.forEach((s) => {
        const marcas = (s.validacao && s.validacao.answers) || [];
        (s.questoes || []).forEach((q, i) => {
            const marca = marcas.find((a) => a.n === i + 1);
            if (!marca) return;
            porSlot[q.slot] = porSlot[q.slot] || { total: 0, erros: 0 };
            porSlot[q.slot].total++;
            if (!marca.correct) porSlot[q.slot].erros++;
        });
    });
    const errorTop = Object.entries(porSlot)
        .map(([slot, d]) => ({ q: `Q${slot}`, pct: d.total ? Math.round((d.erros / d.total) * 100) : 0 }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 5);
    const worstQ = errorTop[0] ? errorTop[0].q : "—";
    const worstPct = errorTop[0] ? errorTop[0].pct : 0;

    const completion = { done: 0, pending: 0, abandoned: 0 };
    terminadas.forEach((s) => { completion[classificar(s) === "validated" ? "done" : classificar(s)]++; });

    const rows = terminadas
        .sort((a, b) => (b.submetidaEm || "").localeCompare(a.submetidaEm || ""))
        .map((s) => {
            const u = usuarioPorId[s.usuarioId] || {};
            const plano = String(u.plano || "basic").toLowerCase();
            const limite = LIMITE_PLANO[plano] ?? LIMITE_PLANO.basic;
            const estado = classificar(s);
            const f = dataDe(s.submetidaEm), i = dataDe(s.iniciadaEm);
            const segundos = f && i ? Math.round((f.getTime() - i.getTime()) / 1000) : null;
            const tempoFmt = segundos != null ? `${String(Math.floor(segundos / 60)).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}` : "—";
            return {
                name: u.nome || "Desconhecido",
                initials: iniciaisDe(u.nome),
                color: corDe(s.usuarioId),
                plan: plano,
                attempt: `${s.tentativa || 1}ª de ${limite === Infinity ? "∞" : limite}`,
                score: estado === "validated" ? `${s.score}/${s.total} · ${s.percent}%` : "—",
                time: tempoFmt,
                state: estado,
            };
        });

    const fmtData = (v) => { const d = dataDe(v); return d ? d.toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" }) : "—"; };

    return {
        title: m.titulo,
        professor: usuarios.find((u) => u.id === m.professorId) ? `Prof. ${usuarios.find((u) => u.id === m.professorId).nome}` : "—",
        status: statusEfectivo(m),
        window: `${fmtData(m.acessoInicio)} – ${fmtData(m.acessoFim)}`,
        questions: (m.questoes || []).filter((q) => q && q.filled).length,
        perSession: m.questoesPorSessao,
        duration: m.duracaoMinutos,
        participants: participantes,
        attempts,
        avgScore, avgTime, worstQ, worstPct,
        completion, errorTop, rows,
    };
}

// GET /api/admin/marathons/:id  (só admin)
exports.obterDados = async (req, res) => {
    try {
        const doc = await db.collection("maratonas").doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ mensagem: "Maratona não encontrada." });
        const m = { id: doc.id, ...doc.data() };
        const [usuarios, todas] = await Promise.all([todosUsuarios(), todasSessoes()]);
        const dados = await calcularDados(m, usuarios, todas.filter((s) => s.maratonaId === m.id));
        res.json({ data: dados });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// GET /api/admin/marathons/:id/export.csv  (só admin) — qualquer maratona
exports.exportarCSV = async (req, res) => {
    try {
        const doc = await db.collection("maratonas").doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ mensagem: "Maratona não encontrada." });
        const m = { id: doc.id, ...doc.data() };

        const [usuarios, todas] = await Promise.all([todosUsuarios(), todasSessoes()]);
        const usuarioPorId = {};
        usuarios.forEach((u) => { usuarioPorId[u.id] = u; });

        const sessoes = todas
            .filter((s) => s.maratonaId === m.id && (s.estado === "submitted" || s.estado === "validated"))
            .sort((a, b) => (a.submetidaEm || "").localeCompare(b.submetidaEm || ""));

        const cabecalho = [
            "Aluno", "Email", "Plano", "Tentativa", "Estado",
            "Nota", "Total", "Percentagem", "TempoSessaoMin",
            "Submetida", "Validada", "FeedbackGeral",
            ...Array.from({ length: 15 }, (_, i) => `Q${i + 1}`),
        ];

        const linhas = [cabecalho];
        sessoes.forEach((s) => {
            const aluno = usuarioPorId[s.usuarioId] || {};
            const validada = s.estado === "validated";
            const marcas = (s.validacao && s.validacao.answers) || [];

            const porSlot = Array(15).fill("");
            (s.questoes || []).forEach((q, i) => {
                if (!validada) { porSlot[q.slot - 1] = "por validar"; return; }
                const marca = marcas.find((a) => a.n === i + 1);
                porSlot[q.slot - 1] = marca ? (marca.correct ? "certo" : "errado") : "";
            });

            const f = dataDe(s.submetidaEm), i2 = dataDe(s.iniciadaEm);
            const tempoMin = f && i2 ? Math.round((f.getTime() - i2.getTime()) / 60000) : "";

            linhas.push([
                aluno.nome || "Desconhecido", aluno.email || "",
                aluno.plano ? aluno.plano.charAt(0).toUpperCase() + aluno.plano.slice(1) : "",
                s.tentativa || 1, validada ? "Validada" : "Por validar",
                validada ? s.score : "", s.total || (s.questoes || []).length, validada ? s.percent : "",
                tempoMin, s.submetidaEm || "", validada ? s.validacao.validadaEm : "",
                validada ? (s.validacao.generalNote || "") : "",
                ...porSlot,
            ]);
        });

        const csv = linhas.map((linha) => linha.map(csvEsc).join(",")).join("\r\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="maratona-${m.id}.csv"`);
        res.send("﻿" + csv);
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};
