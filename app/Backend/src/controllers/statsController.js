const { db } = require("../config/firebase");

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const LETRAS = ["A", "B", "C", "D"];
const TIPO_LABEL = { mcq: "MCQ", text: "Texto", photo: "Foto" };
const AREA_LABEL = { "Engenharia e Tecnologia": "⚙️ Engenharia", "Ciências Sociais": "⚖️ Ciências Sociais" };
const AREA_COR = ["var(--orange)", "var(--blue)", "var(--green)", "#9333EA"];

const dataDe = (v) => {
    if (!v) return null;
    const d = v.toDate ? v.toDate() : new Date(v);
    return isNaN(d.getTime()) ? null : d;
};

const todasSessoes = async () => (await db.collection("sessoes").get()).docs.map((d) => ({ id: d.id, ...d.data() }));
const todasMaratonas = async () => (await db.collection("maratonas").get()).docs.map((d) => ({ id: d.id, ...d.data() }));
const todosUsuarios = async () => (await db.collection("usuarios").get()).docs.map((d) => ({ id: d.id, ...d.data() }));

// CSV: escapar campo (aspas duplicadas, envolver se tiver , " ou quebra de linha)
const csvEsc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const fmtDuracao = (ms) => (ms < 60000 ? `${Math.round(ms / 1000)}s` : `${Math.round(ms / 60000)}m`);

// GET /api/prof/marathons/:id/stats  (professor, dono da maratona)
exports.estatisticasMaratona = async (req, res) => {
    try {
        const doc = await db.collection("maratonas").doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ mensagem: "Maratona não encontrada." });
        const m = { id: doc.id, ...doc.data() };
        if (m.professorId !== req.usuario.id) {
            return res.status(403).json({ mensagem: "Esta maratona não é tua." });
        }

        const sessoes = (await todasSessoes()).filter((s) => s.maratonaId === m.id);
        const participantes = new Set(sessoes.map((s) => s.usuarioId)).size;
        const concluidas = sessoes.filter((s) => s.estado === "submitted" || s.estado === "validated");
        const validadas = sessoes.filter((s) => s.estado === "validated");

        const completionRate = sessoes.length ? Math.round((concluidas.length / sessoes.length) * 100) : 0;

        const tempos = concluidas
            .map((s) => {
                const fim = dataDe(s.submetidaEm), inicio = dataDe(s.iniciadaEm);
                return fim && inicio ? fim.getTime() - inicio.getTime() : null;
            })
            .filter((t) => t != null && t > 0);
        const avgTime = tempos.length ? fmtDuracao(tempos.reduce((a, b) => a + b, 0) / tempos.length) : "—";

        const avgScore = validadas.length
            ? Math.round(validadas.reduce((a, s) => a + (s.percent || 0), 0) / validadas.length)
            : 0;

        // Erro por questão do banco (slot original, não a posição sorteada)
        const porSlot = {};
        validadas.forEach((s) => {
            const marcas = (s.validacao && s.validacao.answers) || [];
            (s.questoes || []).forEach((q, i) => {
                const marca = marcas.find((a) => a.n === i + 1);
                if (!marca) return;
                porSlot[q.slot] = porSlot[q.slot] || { tipo: q.type, total: 0, erros: 0, erradas: {} };
                porSlot[q.slot].total++;
                if (!marca.correct) {
                    porSlot[q.slot].erros++;
                    if (q.type === "mcq") {
                        const resp = (s.respostas || {})[q.id];
                        if (typeof resp === "number") {
                            porSlot[q.slot].erradas[resp] = (porSlot[q.slot].erradas[resp] || 0) + 1;
                        }
                    }
                }
            });
        });

        const errorByQuestion = Object.entries(porSlot)
            .map(([slot, d]) => ({ q: `Q${slot}`, pct: d.total ? Math.round((d.erros / d.total) * 100) : 0, _slot: slot, _d: d }))
            .sort((a, b) => b.pct - a.pct)
            .slice(0, 7);

        let worst = { q: "—", type: "—", pct: 0, note: "Ainda não há submissões validadas suficientes." };
        if (errorByQuestion.length) {
            const top = errorByQuestion[0], d = top._d;
            let note;
            if (d.tipo === "mcq" && Object.keys(d.erradas).length) {
                const [opcao, n] = Object.entries(d.erradas).sort((a, b) => b[1] - a[1])[0];
                note = `${n} de ${d.total} alunos escolheram a opção ${LETRAS[opcao] || opcao} (errada). Considera rever esta matéria na próxima aula.`;
            } else {
                note = `${d.erros} de ${d.total} alunos erraram esta questão. Considera rever a matéria antes da próxima maratona.`;
            }
            worst = { q: top.q, type: TIPO_LABEL[d.tipo] || d.tipo, pct: top.pct, note };
        }

        // Distribuição de notas — buckets dinâmicos conforme questões por sessão
        const total = m.questoesPorSessao || 5;
        const buckets = [];
        for (let sc = total; sc >= 2; sc--) buckets.push({ min: sc, max: sc, label: `${sc}/${total}` });
        buckets.push({ min: 0, max: 1, label: "0-1" });
        const gradeDist = buckets.map((b) => {
            const n = validadas.filter((s) => (s.score ?? -1) >= b.min && (s.score ?? -1) <= b.max).length;
            return { label: b.label, pct: validadas.length ? Math.round((n / validadas.length) * 100) : 0 };
        });

        const fmtData = (v) => {
            const d = dataDe(v);
            return d ? d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" }) : "—";
        };

        res.json({
            stats: {
                title: m.titulo,
                window: `${fmtData(m.acessoInicio)} – ${fmtData(m.acessoFim)}`,
                totalQuestions: (m.questoes || []).filter((q) => q && q.filled).length,
                questionsPerSession: m.questoesPorSessao,
                participants: participantes,
                completionRate,
                avgTime,
                avgScore,
                errorByQuestion: errorByQuestion.map(({ q, pct }) => ({ q, pct })),
                worst,
                gradeDist,
            },
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// GET /api/admin/stats  (só admin)
async function calcularStatsGlobais() {
    {
        const [sessoes, maratonas, usuarios] = await Promise.all([todasSessoes(), todasMaratonas(), todosUsuarios()]);
        const estudantes = usuarios.filter((u) => (u.role || "student") === "student");
        const professores = usuarios.filter((u) => u.role === "professor");

        const concluidas = sessoes.filter((s) => s.estado === "submitted" || s.estado === "validated");
        const completionRate = sessoes.length ? Math.round((concluidas.length / sessoes.length) * 100) : 0;

        const byPlan = { basic: 0, plus: 0, premium: 0 };
        estudantes.forEach((u) => {
            const p = String(u.plano || "basic").toLowerCase();
            if (byPlan[p] !== undefined) byPlan[p]++;
        });

        // Maratonas criadas por mês, ano corrente
        const anoActual = new Date().getFullYear();
        const contagemMes = Array(12).fill(0);
        maratonas.forEach((m) => {
            const d = dataDe(m.criadoEm);
            if (d && d.getFullYear() === anoActual) contagemMes[d.getMonth()]++;
        });
        const byMonth = MESES.map((label, i) => ({ label, v: contagemMes[i] }));

        // Taxa de conclusão por área
        const areaDe = {};
        maratonas.forEach((m) => { areaDe[m.id] = m.area; });
        const porArea = {};
        sessoes.forEach((s) => {
            const area = areaDe[s.maratonaId] || "Outra";
            porArea[area] = porArea[area] || { total: 0, concluidas: 0 };
            porArea[area].total++;
            if (s.estado === "submitted" || s.estado === "validated") porArea[area].concluidas++;
        });
        const byArea = Object.entries(porArea).map(([area, d], i) => ({
            label: AREA_LABEL[area] || `🎓 ${area}`,
            pct: d.total ? Math.round((d.concluidas / d.total) * 100) : 0,
            color: AREA_COR[i % AREA_COR.length],
        }));

        // Professores mais activos: nº de maratonas publicadas + tempo médio de validação
        const maratonasPorProf = {};
        maratonas.forEach((m) => {
            if (m.status === "published") (maratonasPorProf[m.professorId] = maratonasPorProf[m.professorId] || []).push(m);
        });
        const horasPorProf = {};
        sessoes.filter((s) => s.estado === "validated" && s.validacao).forEach((s) => {
            const m = maratonas.find((x) => x.id === s.maratonaId);
            if (!m) return;
            const fim = dataDe(s.validacao.validadaEm), inicio = dataDe(s.submetidaEm);
            if (!fim || !inicio) return;
            const horas = (fim.getTime() - inicio.getTime()) / 3600000;
            (horasPorProf[m.professorId] = horasPorProf[m.professorId] || []).push(horas);
        });
        const topProfessors = professores
            .map((p) => {
                const marathons = (maratonasPorProf[p.id] || []).length;
                const horas = horasPorProf[p.id] || [];
                const media = horas.length ? horas.reduce((a, b) => a + b, 0) / horas.length : null;
                return {
                    name: p.nome,
                    marathons,
                    avgValidation: media == null ? "—" : media < 1 ? `${Math.round(media * 60)} min` : `${Math.round(media)} h`,
                    ok: media == null ? true : media <= 24,
                    _marathons: marathons,
                };
            })
            .sort((a, b) => b._marathons - a._marathons)
            .slice(0, 5)
            .map(({ _marathons, ...rest }) => rest);

        return {
            users: usuarios.length,
            marathonsCreated: maratonas.length,
            completionRate,
            sessions: sessoes.length,
            byPlan,
            byMonth,
            byArea,
            topProfessors,
        };
    }
}

// GET /api/admin/stats  (só admin)
exports.estatisticasGlobais = async (req, res) => {
    try {
        const stats = await calcularStatsGlobais();
        res.json({ stats });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// CSV: escapar campo
const csvEscG = (v) => { const s = v == null ? "" : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csvLinha = (campos) => campos.map(csvEscG).join(",");

// GET /api/admin/stats/export.csv  (só admin) — relatório global em secções
exports.exportarRelatorioGlobal = async (req, res) => {
    try {
        const s = await calcularStatsGlobais();
        const linhas = [];

        linhas.push(csvLinha(["Resumo", ""]));
        linhas.push(csvLinha(["Utilizadores", s.users]));
        linhas.push(csvLinha(["Maratonas criadas", s.marathonsCreated]));
        linhas.push(csvLinha(["Sessões realizadas", s.sessions]));
        linhas.push(csvLinha(["Taxa de conclusão média (%)", s.completionRate]));
        linhas.push("");

        linhas.push(csvLinha(["Utilizadores por plano", ""]));
        linhas.push(csvLinha(["Plano", "Utilizadores"]));
        linhas.push(csvLinha(["Basic", s.byPlan.basic]));
        linhas.push(csvLinha(["Plus", s.byPlan.plus]));
        linhas.push(csvLinha(["Premium", s.byPlan.premium]));
        linhas.push("");

        linhas.push(csvLinha(["Maratonas criadas por mês (ano corrente)", ""]));
        linhas.push(csvLinha(["Mês", "Maratonas"]));
        s.byMonth.forEach((m) => linhas.push(csvLinha([m.label, m.v])));
        linhas.push("");

        linhas.push(csvLinha(["Taxa de conclusão por área", ""]));
        linhas.push(csvLinha(["Área", "Percentagem (%)"]));
        s.byArea.forEach((a) => linhas.push(csvLinha([a.label.replace(/^\S+\s/, ""), a.pct])));
        linhas.push("");

        linhas.push(csvLinha(["Professores mais activos", ""]));
        linhas.push(csvLinha(["Professor", "Maratonas publicadas", "Validação média", "Dentro do prazo (<=24h)"]));
        s.topProfessors.forEach((p) => linhas.push(csvLinha([p.name, p.marathons, p.avgValidation, p.ok ? "Sim" : "Não"])));

        const csv = linhas.join("\r\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="relatorio-global-${new Date().toISOString().slice(0, 10)}.csv"`);
        res.send("﻿" + csv);
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// GET /api/prof/marathons/:id/export.csv  (professor, dono)
// Uma linha por submissão (submetida ou validada); Q1..Q15 = acerto/erro
// por slot do banco (em branco se essa questão não foi sorteada na sessão).
exports.exportarCSV = async (req, res) => {
    try {
        const doc = await db.collection("maratonas").doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ mensagem: "Maratona não encontrada." });
        const m = { id: doc.id, ...doc.data() };
        if (m.professorId !== req.usuario.id) {
            return res.status(403).json({ mensagem: "Esta maratona não é tua." });
        }

        const usuarios = await todosUsuarios();
        const usuarioPorId = {};
        usuarios.forEach((u) => { usuarioPorId[u.id] = u; });

        const sessoes = (await todasSessoes())
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

            const fimMs = dataDe(s.submetidaEm), inicioMs = dataDe(s.iniciadaEm);
            const tempoMin = fimMs && inicioMs ? Math.round((fimMs.getTime() - inicioMs.getTime()) / 60000) : "";

            linhas.push([
                aluno.nome || "Desconhecido",
                aluno.email || "",
                aluno.plano ? aluno.plano.charAt(0).toUpperCase() + aluno.plano.slice(1) : "",
                s.tentativa || 1,
                validada ? "Validada" : "Por validar",
                validada ? s.score : "",
                s.total || (s.questoes || []).length,
                validada ? s.percent : "",
                tempoMin,
                s.submetidaEm || "",
                validada ? s.validacao.validadaEm : "",
                validada ? (s.validacao.generalNote || "") : "",
                ...porSlot,
            ]);
        });

        const csv = linhas.map((linha) => linha.map(csvEsc).join(",")).join("\r\n");
        const nomeFicheiro = `maratona-${m.id}.csv`;

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${nomeFicheiro}"`);
        res.send("\uFEFF" + csv); // BOM — acentos correctos ao abrir no Excel
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// GET /api/admin/overview  (só admin) — KPIs, actividade semanal, alertas
// e últimos registos do dashboard principal. Alertas são heurísticas
// calculadas a partir de dados reais (não texto inventado) — ver notas
// em cada bloco; ajusta os limiares conforme a operação real da equipa.
exports.visaoGeralAdmin = async (req, res) => {
    try {
        const [sessoes, maratonas, usuarios] = await Promise.all([todasSessoes(), todasMaratonas(), todosUsuarios()]);
        const estudantes = usuarios.filter((u) => (u.role || "student") === "student");
        const professores = usuarios.filter((u) => u.role === "professor");

        const criadoEmMs = (u) => { const d = dataDe(u.criadoEm); return d ? d.getTime() : null; };
        const agora = Date.now();
        const semanaAtras = agora - 7 * 24 * 3600 * 1000;
        const mesAtras = agora - 30 * 24 * 3600 * 1000;
        const diaAtras = agora - 24 * 3600 * 1000;

        const totalUsers = usuarios.length;
        const newThisWeek = usuarios.filter((u) => (criadoEmMs(u) || 0) >= semanaAtras).length;
        const newProfsMonth = professores.filter((u) => (criadoEmMs(u) || 0) >= mesAtras).length;

        const activeMarathons = maratonas.filter((m) => {
            if (m.status !== "published" || !m.acessoInicio || !m.acessoFim) return false;
            return agora >= new Date(m.acessoInicio).getTime() && agora <= new Date(m.acessoFim).getTime();
        }).length;
        const soonMarathons = maratonas.filter((m) => m.status === "published" && m.acessoInicio && agora < new Date(m.acessoInicio).getTime()).length;

        const pendentes = sessoes.filter((s) => s.estado === "submitted");
        const maratonaPorId = {};
        maratonas.forEach((m) => { maratonaPorId[m.id] = m; });
        const profsComPendentes = new Set(
            pendentes.map((s) => maratonaPorId[s.maratonaId] && maratonaPorId[s.maratonaId].professorId).filter(Boolean)
        );

        const kpis = {
            totalUsers, newThisWeek,
            professors: professores.length, newProfsMonth,
            activeMarathons, soonMarathons,
            pendingValidations: pendentes.length, pendingProfessors: profsComPendentes.size,
        };

        // Actividade: sessões de maratona iniciadas por semana (9 últimas semanas)
        const activity = [];
        for (let i = 8; i >= 0; i--) {
            const fim = agora - i * 7 * 24 * 3600 * 1000;
            const inicio = fim - 7 * 24 * 3600 * 1000;
            const n = sessoes.filter((s) => {
                const d = dataDe(s.iniciadaEm);
                return d && d.getTime() >= inicio && d.getTime() < fim;
            }).length;
            activity.push({ n, i });
        }
        const maxActividade = Math.max(1, ...activity.map((a) => a.n));
        const activityOut = activity.map(({ n, i }) => ({
            label: i % 3 === 0 ? MESES[new Date(agora - i * 7 * 24 * 3600 * 1000).getMonth()] : "",
            v: Math.round((n / maxActividade) * 100),
        }));

        // Alertas — heurísticas sobre dados reais (sem texto inventado)
        const alerts = [];
        const porProfessorAtraso = {};
        pendentes.forEach((s) => {
            const m = maratonaPorId[s.maratonaId];
            if (!m) return;
            const d = dataDe(s.submetidaEm);
            const horas = d ? (agora - d.getTime()) / 3600000 : 0;
            if (horas > 48) {
                porProfessorAtraso[m.professorId] = porProfessorAtraso[m.professorId] || { nome: null, n: 0 };
                porProfessorAtraso[m.professorId].n++;
            }
        });
        for (const profId of Object.keys(porProfessorAtraso)) {
            const prof = usuarios.find((u) => u.id === profId);
            const info = porProfessorAtraso[profId];
            alerts.push({ level: "red", text: `Validação em atraso: ${info.n} submissõ${info.n === 1 ? "" : "es"} há mais de 48 h (${prof ? "Prof. " + prof.nome : "professor"}).` });
        }

        const novos24h = usuarios.filter((u) => (criadoEmMs(u) || 0) >= diaAtras).length;
        if (novos24h >= 3) {
            alerts.push({ level: "blue", text: `Pico de registos: ${novos24h} novos utilizadores nas últimas 24 h.` });
        }

        maratonas.forEach((m) => {
            if (m.status !== "published" || !m.acessoInicio) return;
            const inicioMs = new Date(m.acessoInicio).getTime();
            const jaComecou = agora >= inicioMs;
            const temParticipantes = sessoes.some((s) => s.maratonaId === m.id);
            if (jaComecou && !temParticipantes && agora <= new Date(m.acessoFim).getTime()) {
                alerts.push({ level: "amber", text: `Maratona sem inscrições: "${m.titulo}" já está activa e ainda não tem nenhuma tentativa registada.` });
            }
        });

        // Últimos registos (qualquer role), mais recente primeiro
        const CORES2 = ["var(--orange)", "var(--blue)", "var(--green)", "var(--dark)", "#9333EA"];
        const iniciaisDe = (nome = "") => nome.trim().split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
        const recent = [...usuarios]
            .sort((a, b) => (criadoEmMs(b) || 0) - (criadoEmMs(a) || 0))
            .slice(0, 3)
            .map((u, i) => ({
                id: u.id,
                name: u.nome,
                initials: iniciaisDe(u.nome),
                color: CORES2[i % CORES2.length],
                role: u.role || "student",
                plan: (u.role || "student") === "student" ? String(u.plano || "basic").toLowerCase() : null,
                created: dataDe(u.criadoEm) ? dataDe(u.criadoEm).toLocaleDateString("pt-PT", { day: "numeric", month: "short" }) : "—",
            }));

        res.json({ kpis, activity: activityOut, alerts, recent });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};
