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

        res.json({
            stats: {
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
exports.estatisticasGlobais = async (req, res) => {
    try {
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

        res.json({
            stats: {
                users: usuarios.length,
                marathonsCreated: maratonas.length,
                completionRate,
                sessions: sessoes.length,
                byPlan,
                byMonth,
                byArea,
                topProfessors,
            },
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};
