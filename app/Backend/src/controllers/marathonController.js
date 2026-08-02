const { db } = require("../config/firebase");
const bcrypt = require("bcrypt");
const { cifrar, decifrar } = require("../utils/crypto");

// Limites de tentativas por plano — validados SEMPRE no servidor (spec §4.3)
const { limiteDeTentativas } = require("../utils/planos");
const { enderecoDeImagem, temEnunciado, semEnunciado } = require("../utils/questoes");
const { apagarImagem, caminhoDoUrl } = require("../utils/armazenamento");

const AREAS = { eng: "Engenharia e Tecnologia", soc: "Ciências Sociais" };

const iconPara = (disciplina = "") => {
    const d = disciplina.toLowerCase();
    if (d.includes("matem")) return "📐";
    if (d.includes("quím") || d.includes("quim")) return "🧪";
    if (d.includes("fís") || d.includes("fis")) return "⚡";
    if (d.includes("direito")) return "⚖️";
    if (d.includes("biol")) return "🧬";
    return "🎓";
};

// Estado visível pelo estudante, calculado no servidor a partir da janela
const statusEfectivo = (m) => {
    if (m.status !== "published") return "draft";
    const agora = Date.now();
    if (m.acessoInicio && agora < new Date(m.acessoInicio).getTime()) return "soon";
    if (m.acessoFim && agora > new Date(m.acessoFim).getTime()) return "closed";
    return "active";
};

// Uma questão só conta se tiver enunciado — ver utils/questoes.js para o que
// isso quer dizer e porquê. Antes bastava estar "preenchida", pelo que era
// possível publicar uma maratona com 15 questões sem enunciado nenhum: o aluno
// abriria a prova e veria 15 rectângulos vazios, já com o cronómetro a contar.
const questoesPreenchidas = (m) => (m.questoes || []).filter(temEnunciado).length;

// Contadas à parte para poderem ser mostradas ao professor. Sem este número,
// nada na interface distingue uma maratona pronta de uma que abre em branco.
const questoesSemImagem = (m) => (m.questoes || []).filter(semEnunciado).length;

// → formato esperado pela lista do professor (PROF_MARATHONS)
const paraProfessor = (m, connectedNow = 0, hasAttempts = false) => ({
    id: m.id,
    title: m.titulo,
    icon: m.icon,
    status: m.status === "draft" ? "draft" : statusEfectivo(m),
    durationMinutes: m.duracaoMinutos,
    questionsPerSession: m.questoesPorSessao,
    accessEnd: m.acessoFim
        ? new Date(m.acessoFim).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })
        : null,
    participants: m.participantes || 0,
    connectedNow,
    questionsUploaded: questoesPreenchidas(m),
    questionsMissingImage: questoesSemImagem(m),
    // Decide o que a interface deixa editar. Vem do servidor porque é o
    // servidor que aplica a regra — a interface só a espelha, e as duas não
    // podem discordar.
    hasAttempts,
    // Campos crus, para o formulário de edição os poder preencher.
    edit: {
        title: m.titulo || "",
        discipline: m.disciplina || "",
        // Guardada por extenso ("Engenharia e Tecnologia"); o formulário
        // trabalha com o código ("eng"), que é o que o servidor aceita.
        area: Object.keys(AREAS).find((k) => AREAS[k] === m.area) || "",
        description: m.descricao || "",
        duration: m.duracaoMinutos || 60,
        perSession: m.questoesPorSessao || 5,
        start: m.acessoInicio || "",
        end: m.acessoFim || "",
    },
});

// → formato esperado pelo estudante (MARATHONS) — NUNCA inclui a senha.
// `attemptsMax` vai junto de propósito: é o servidor que aplica o limite, por
// isso é ele que o deve comunicar. Antes o frontend tinha a sua própria tabela
// de limites (PLAN_ATTEMPTS), que era a quinta cópia do mesmo número e podia
// mostrar ao aluno um limite diferente do que era realmente aplicado.
const paraEstudante = (m, attemptsUsed = 0, attemptsMax = null) => ({
    id: m.id,
    title: m.titulo,
    area: m.area,
    discipline: m.disciplina,
    durationMinutes: m.duracaoMinutos,
    questionsPerSession: m.questoesPorSessao,
    accessStart: m.acessoInicio,
    accessEnd: m.acessoFim,
    status: statusEfectivo(m),
    professor: m.professorNome,
    description: m.descricao,
    attemptsUsed,
    // null = ilimitadas
    attemptsMax: attemptsMax === Infinity ? null : attemptsMax,
    icon: m.icon,
});

// Limite de tentativas do utilizador, a partir do plano guardado na conta.
const limiteDoUtilizador = async (usuarioId) => {
    const doc = await db.collection("usuarios").doc(usuarioId).get();
    const plano = doc.exists ? doc.data().plano : "basic";
    return limiteDeTentativas(plano);
};

const obterDoc = async (id) => {
    const doc = await db.collection("maratonas").doc(id).get();
    return doc.exists ? { id, ...doc.data() } : null;
};

// Usado só na CRIAÇÃO, onde faz sentido preencher tudo com valores por omissão.
const dadosDoBody = (b) => ({
    titulo: b.title || "",
    disciplina: b.discipline || "",
    area: AREAS[b.area] || b.area || "",
    descricao: b.description || "",
    duracaoMinutos: Number(b.duration) || 60,
    questoesPorSessao: Math.min(5, Math.max(4, Number(b.perSession) || 5)),
    acessoInicio: b.start ? new Date(b.start).toISOString() : null,
    acessoFim: b.end ? new Date(b.end).toISOString() : null,
});

// ─────────────────────────────────────────────────────────────────────────────
// Edição de uma maratona existente
//
// A actualização usava o dadosDoBody acima, que reconstrói o objecto inteiro
// com valores por omissão. Consequência: enviar só { password } apagava o
// título, punha as datas a null e repunha a duração em 60 minutos. Uma
// actualização parcial tem de tocar APENAS nos campos que recebe.
//
// Sobre o que é editável e quando — as regras vêm da justiça da prova, não da
// dificuldade técnica:
//
//   sempre .................. título, descrição, disciplina, password
//                             (não afectam nem a prova nem os resultados)
//   sem tentativas .......... tudo o resto: datas, duração, questões por
//                             sessão, área. Na prática ainda é um rascunho.
//   com tentativas .......... só a data de fim, e só para a ESTENDER.
//
// Porquê estas fronteiras: se o primeiro aluno teve 60 minutos e o segundo 45,
// os resultados deixam de ser comparáveis e não há como explicar isso a quem
// reclamar. Encurtar o prazo corta alunos a meio da prova. Estender é o que se
// vai mesmo precisar no dia, se houver problemas de rede.
// ─────────────────────────────────────────────────────────────────────────────
const CAMPOS = {
    title:       { campo: "titulo",            ler: (v) => String(v).trim() },
    discipline:  { campo: "disciplina",        ler: (v) => String(v).trim() },
    description: { campo: "descricao",         ler: (v) => String(v).trim() },
    area:        { campo: "area",              ler: (v) => AREAS[v] || v || "" },
    duration:    { campo: "duracaoMinutos",    ler: (v) => Number(v) || 60 },
    perSession:  { campo: "questoesPorSessao", ler: (v) => Math.min(5, Math.max(4, Number(v) || 5)) },
    start:       { campo: "acessoInicio",      ler: (v) => (v ? new Date(v).toISOString() : null) },
    end:         { campo: "acessoFim",         ler: (v) => (v ? new Date(v).toISOString() : null) },
};

const SEMPRE = ["title", "discipline", "description"];
const SO_SEM_TENTATIVAS = ["area", "duration", "perSession", "start"];

const ROTULOS = {
    title: "título", discipline: "disciplina", description: "descrição",
    area: "área", duration: "duração", perSession: "questões por sessão",
    start: "data de início", end: "data de fim",
};

// POST /api/prof/marathons  (professor) — cria rascunho
exports.criar = async (req, res) => {
    try {
        const b = req.body;
        if (!b.title) {
            return res.status(400).json({ mensagem: "O título da maratona é obrigatório." });
        }

        const profDoc = await db.collection("usuarios").doc(req.usuario.id).get();
        const professorNome = profDoc.exists ? profDoc.data().nome : "Professor";

        const nova = {
            ...dadosDoBody(b),
            senhaHash: b.password
                ? await bcrypt.hash(String(b.password).trim().toUpperCase(), 10)
                : null,
            senhaCifrada: b.password ? cifrar(String(b.password).trim().toUpperCase()) : null,
            status: "draft",
            icon: iconPara(b.discipline),
            professorId: req.usuario.id,
            professorNome: `Prof. ${professorNome}`,
            questoes: [],
            participantes: 0,
            criadoEm: new Date(),
        };

        const ref = await db.collection("maratonas").add(nova);
        res.status(201).json({ ok: true, id: ref.id, status: "draft" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// PUT /api/prof/marathons/:id  (professor dono) — actualização PARCIAL
exports.actualizar = async (req, res) => {
    try {
        const m = await obterDoc(req.params.id);
        if (!m) return res.status(404).json({ mensagem: "Maratona não encontrada." });
        if (m.professorId !== req.usuario.id) {
            return res.status(403).json({ mensagem: "Esta maratona não é tua." });
        }

        const b = req.body || {};
        const enviados = Object.keys(CAMPOS).filter((k) => b[k] !== undefined);

        const sessoes = await db.collection("sessoes").where("maratonaId", "==", m.id).get();
        const temTentativas = !sessoes.empty;

        // Rascunho continua totalmente editável, tenha ou não sessões (não pode ter).
        const rascunho = m.status === "draft";

        // Um campo que está VAZIO pode ser preenchido mesmo havendo tentativas.
        //
        // A regra existe para proteger um valor com que os alunos já contaram —
        // e não há nada a proteger onde não há valor. Uma maratona sem data de
        // início nem área está partida: ninguém consegue entrar nela, e impedir
        // a reparação só a mantém partida.
        //
        // Deixou de ser hipotético: houve uma versão do endpoint que apagava
        // estes campos ao gravar só a password, e as maratonas afectadas
        // ficaram sem forma de serem consertadas.
        const estaVazio = (chave) => {
            const v = m[CAMPOS[chave].campo];
            return v === null || v === undefined || v === "";
        };

        const permitidos = new Set(
            rascunho || !temTentativas
                ? [...SEMPRE, ...SO_SEM_TENTATIVAS, "end"]
                : [...SEMPRE, "end", ...SO_SEM_TENTATIVAS.filter(estaVazio)],
        );

        const recusados = enviados.filter((k) => !permitidos.has(k));
        if (recusados.length) {
            return res.status(409).json({
                mensagem: `Esta maratona já tem tentativas de alunos: não é possível alterar ${recusados.map((k) => ROTULOS[k]).join(", ")}. `
                    + "Mudar isso agora tornaria os resultados dos alunos incomparáveis entre si.",
            });
        }

        const patch = {};
        for (const k of enviados) patch[CAMPOS[k].campo] = CAMPOS[k].ler(b[k]);

        // O título é obrigatório — não pode ser esvaziado por engano.
        if ("titulo" in patch && !patch.titulo) {
            return res.status(400).json({ mensagem: "O título da maratona não pode ficar vazio." });
        }

        // Com tentativas, a data de fim só pode andar para a frente — a menos
        // que não exista nenhuma, caso em que definir uma é reparar, não mudar.
        if (temTentativas && !rascunho && "acessoFim" in patch && m.acessoFim) {
            const antes = new Date(m.acessoFim).getTime();
            const depois = patch.acessoFim ? new Date(patch.acessoFim).getTime() : 0;
            if (!depois || depois < antes) {
                return res.status(409).json({
                    mensagem: "Com alunos já inscritos, a data de fim só pode ser adiada — encurtá-la interromperia provas a decorrer.",
                });
            }
        }

        // A janela tem de continuar coerente depois da alteração.
        const inicioFinal = "acessoInicio" in patch ? patch.acessoInicio : m.acessoInicio;
        const fimFinal = "acessoFim" in patch ? patch.acessoFim : m.acessoFim;
        if (inicioFinal && fimFinal && new Date(fimFinal) <= new Date(inicioFinal)) {
            return res.status(400).json({ mensagem: "O fim da janela tem de ser depois do início." });
        }

        if (b.password) {
            const senhaNorm = String(b.password).trim().toUpperCase();
            patch.senhaHash = await bcrypt.hash(senhaNorm, 10);
            patch.senhaCifrada = cifrar(senhaNorm);
        }

        // O ícone é derivado da disciplina — só muda quando ela muda.
        if (b.discipline !== undefined) patch.icon = iconPara(b.discipline);

        if (!Object.keys(patch).length) {
            return res.status(400).json({ mensagem: "Nada para actualizar." });
        }

        await db.collection("maratonas").doc(m.id).update(patch);
        res.json({ ok: true, id: m.id, status: m.status });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// PUT /api/prof/marathons/:id/questions/:slot  (professor)
// Guarda uma questão do banco de 15. (Upload real de imagens: fase posterior.)
exports.guardarQuestao = async (req, res) => {
    try {
        const slot = Number(req.params.slot);
        if (!(slot >= 1 && slot <= 15)) {
            return res.status(400).json({ mensagem: "Slot inválido (1–15)." });
        }

        const m = await obterDoc(req.params.id);
        if (!m) return res.status(404).json({ mensagem: "Maratona não encontrada." });
        if (m.professorId !== req.usuario.id) {
            return res.status(403).json({ mensagem: "Esta maratona não é tua." });
        }

        const { type, options, correct, image } = req.body;
        const tipo = ["mcq", "text", "photo"].includes(type) ? type : "mcq";

        // A imagem é o enunciado — sem ela não há questão. Aceita-se apenas um
        // endereço do nosso armazenamento: antes do upload real, aqui chegava
        // o nome do ficheiro escolhido no computador do professor ("ex1.png"),
        // que é texto sem qualquer utilidade para quem vai fazer a prova.
        if (!enderecoDeImagem(image)) {
            return res.status(400).json({ mensagem: "Carrega a imagem da questão antes de guardar." });
        }

        // MCQ exige uma opção correcta explícita (0–3) — o professor tem de escolher
        // (atenção: Number(null) === 0, por isso null/undefined/"" → NaN explícito)
        const idxCorrecta = correct === null || correct === undefined || correct === "" ? NaN : Number(correct);
        if (tipo === "mcq" && !(Number.isInteger(idxCorrecta) && idxCorrecta >= 0 && idxCorrecta <= 3)) {
            return res.status(400).json({ mensagem: "Marca a opção correcta antes de guardar a questão." });
        }

        const questoes = m.questoes || [];
        questoes[slot - 1] = {
            slot,
            type: tipo,
            options: Array.isArray(options) ? options.slice(0, 4) : [],
            correct: tipo === "mcq" ? idxCorrecta : null,
            image,   // endereço no armazenamento (ver utils/armazenamento.js)
            filled: true,
        };

        await db.collection("maratonas").doc(m.id).update({ questoes });
        res.json({ ok: true, slot, questionsUploaded: questoes.filter((q) => q && q.filled).length });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// POST /api/prof/marathons/:id/publish  (professor)
exports.publicar = async (req, res) => {
    try {
        const m = await obterDoc(req.params.id);
        if (!m) return res.status(404).json({ mensagem: "Maratona não encontrada." });
        if (m.professorId !== req.usuario.id) {
            return res.status(403).json({ mensagem: "Esta maratona não é tua." });
        }

        const falta = [];
        if (!m.titulo) falta.push("título");
        if (!m.acessoInicio || !m.acessoFim) falta.push("janela de acesso");
        if (!m.senhaHash) falta.push("password de acesso");
        if (questoesPreenchidas(m) < 15) falta.push(`banco de 15 questões (tem ${questoesPreenchidas(m)})`);
        if (falta.length) {
            return res.status(400).json({ mensagem: `Antes de publicar falta: ${falta.join(", ")}.` });
        }
        if (new Date(m.acessoFim) <= new Date(m.acessoInicio)) {
            return res.status(400).json({ mensagem: "O fim da janela tem de ser depois do início." });
        }

        await db.collection("maratonas").doc(m.id).update({ status: "published", publicadoEm: new Date() });
        res.json({ ok: true, id: m.id, status: "published" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// GET /api/prof/marathons/:id  (professor) — dados completos para editar o rascunho
exports.obterDoProfessor = async (req, res) => {
    try {
        const m = await obterDoc(req.params.id);
        if (!m) return res.status(404).json({ mensagem: "Maratona não encontrada." });
        if (m.professorId !== req.usuario.id) {
            return res.status(403).json({ mensagem: "Esta maratona não é tua." });
        }

        const codigoArea = Object.keys(AREAS).find((k) => AREAS[k] === m.area) || m.area;
        res.json({
            marathon: {
                id: m.id,
                title: m.titulo,
                discipline: m.disciplina,
                area: codigoArea,
                description: m.descricao,
                duration: m.duracaoMinutos,
                perSession: m.questoesPorSessao,
                start: m.acessoInicio || "",
                end: m.acessoFim || "",
                hasPassword: !!m.senhaHash,   // a senha em si nunca é devolvida
                status: m.status,
                questions: m.questoes || [],
            },
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// DELETE /api/prof/marathons/:id  (professor, dono)
//
// Existe porque passou a haver maratonas impossíveis de recuperar: as que foram
// criadas antes do upload real de imagens ficaram com 15 questões sem enunciado
// e nenhum aluno consegue entrar nelas. Sem esta rota, ficavam para sempre na
// lista do professor a dar um aviso vermelho que ele não podia resolver.
//
// A regra que protege o essencial: uma maratona em que algum aluno já tentou
// NÃO pode ser apagada. Apagá-la levaria com ela as submissões, as notas e o
// histórico desse aluno — e a tentativa que ele gastou não voltaria atrás.
exports.apagar = async (req, res) => {
    try {
        const m = await obterDoc(req.params.id);
        if (!m) return res.status(404).json({ mensagem: "Maratona não encontrada." });
        if (m.professorId !== req.usuario.id) {
            return res.status(403).json({ mensagem: "Esta maratona não é tua." });
        }

        const sessoes = await db.collection("sessoes").where("maratonaId", "==", m.id).get();
        if (!sessoes.empty) {
            return res.status(409).json({
                mensagem: `Esta maratona já tem ${sessoes.size} ${sessoes.size === 1 ? "tentativa" : "tentativas"} de alunos. `
                    + "Apagá-la eliminaria as submissões e as notas — se as questões estão sem enunciado, carrega as imagens em falta.",
            });
        }

        // As imagens das questões ocupam espaço na base de dados e mais ninguém
        // lhes vai chegar. Apagadas primeiro: se algo falhar aqui, a maratona
        // continua a existir e a operação pode ser repetida sem perder nada.
        for (const q of m.questoes || []) {
            if (q && q.image) await apagarImagem(caminhoDoUrl(q.image));
        }

        // Conversas de Dúvidas desta maratona: sem maratona não têm assunto.
        const conversas = await db.collection("conversas").where("maratonaId", "==", m.id).get();
        await Promise.all(conversas.docs.map((d) => db.collection("conversas").doc(d.id).delete()));

        await db.collection("maratonas").doc(m.id).delete();

        res.json({ ok: true, id: m.id });
    } catch (e) {
        console.error("apagar maratona:", e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// GET /api/prof/marathons/:id/password  (professor, dono) — revela a
// password de acesso para o professor a poder comunicar aos alunos
exports.obterPassword = async (req, res) => {
    try {
        const m = await obterDoc(req.params.id);
        if (!m) return res.status(404).json({ mensagem: "Maratona não encontrada." });
        if (m.professorId !== req.usuario.id) {
            return res.status(403).json({ mensagem: "Esta maratona não é tua." });
        }
        if (!m.senhaCifrada) {
            return res.status(404).json({ mensagem: "Esta maratona ainda não tem password definida." });
        }
        const password = decifrar(m.senhaCifrada);
        if (password === null) {
            // Acontece se o segredo de cifra tiver sido trocado sem manter o
            // anterior em CRYPTO_SECRET_ANTERIOR. A password guardada deixa de
            // ser legível; a entrada dos alunos continua a funcionar (usa
            // bcrypt, à parte), mas o professor tem de definir uma nova.
            return res.status(409).json({
                mensagem: "Não foi possível ler a password guardada desta maratona. Edita a maratona e define uma password nova.",
            });
        }
        res.json({ password });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// GET /api/prof/marathons  (professor) — as suas maratonas
exports.listarDoProfessor = async (req, res) => {
    try {
        const r = await db.collection("maratonas").where("professorId", "==", req.usuario.id).get();
        const maratonas = r.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Conectados agora, por maratona: sessões activas dentro da tolerância
        // (mesma regra do liveController/visaoGeralProfessor).
        const todasSessoes = (await db.collection("sessoes").get()).docs.map((d) => d.data());
        const agora = Date.now();
        const conectadosPorMaratona = {};
        // Já temos todas as sessões em mãos: saber quais maratonas foram
        // tentadas sai de graça, e é o que decide o que pode ser editado.
        const comTentativas = new Set(todasSessoes.map((s) => s.maratonaId));
        todasSessoes.forEach((s) => {
            if (s.estado !== "active") return;
            const fimMs = new Date(s.iniciadaEm).getTime() + s.duracaoSegundos * 1000;
            if (agora <= fimMs + 30 * 1000) {
                conectadosPorMaratona[s.maratonaId] = (conectadosPorMaratona[s.maratonaId] || 0) + 1;
            }
        });

        const lista = maratonas.map((m) =>
            paraProfessor(m, conectadosPorMaratona[m.id] || 0, comTentativas.has(m.id)));
        res.json({ marathons: lista });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// tentativas usadas pelo estudante, por maratona (colecção sessoes — fase 2)
const tentativasDe = async (usuarioId) => {
    const r = await db.collection("sessoes").where("usuarioId", "==", usuarioId).get();
    const porMaratona = {};
    r.docs.forEach((d) => {
        const mid = d.data().maratonaId;
        porMaratona[mid] = (porMaratona[mid] || 0) + 1;
    });
    return porMaratona;
};

// GET /api/marathons  (autenticado) — só publicadas
exports.listar = async (req, res) => {
    try {
        const r = await db.collection("maratonas").where("status", "==", "published").get();
        const tentativas = await tentativasDe(req.usuario.id);
        const limite = await limiteDoUtilizador(req.usuario.id);
        const lista = r.docs.map((d) => {
            const m = { id: d.id, ...d.data() };
            return paraEstudante(m, tentativas[m.id] || 0, limite);
        });
        res.json({ marathons: lista });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// GET /api/marathons/:id  (autenticado)
exports.obter = async (req, res) => {
    try {
        const m = await obterDoc(req.params.id);
        if (!m || m.status !== "published") {
            return res.status(404).json({ mensagem: "Maratona não encontrada." });
        }
        const tentativas = await tentativasDe(req.usuario.id);
        res.json({ marathon: paraEstudante(m, tentativas[m.id] || 0, await limiteDoUtilizador(req.usuario.id)) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// POST /api/marathons/:id/enter  { password }  (autenticado)
exports.entrar = async (req, res) => {
    try {
        const m = await obterDoc(req.params.id);
        if (!m || m.status !== "published") {
            return res.status(404).json({ mensagem: "Maratona não encontrada." });
        }
        if (statusEfectivo(m) !== "active") {
            return res.status(400).json({ mensagem: "A maratona não está activa." });
        }

        const senha = String(req.body.password || "").trim().toUpperCase();
        const ok = m.senhaHash && (await bcrypt.compare(senha, m.senhaHash));
        if (!ok) {
            return res.status(401).json({ mensagem: "Password incorrecta. Confirma com o professor." });
        }

        // limite de tentativas do plano — validado no servidor
        const userDoc = await db.collection("usuarios").doc(req.usuario.id).get();
        const plano = userDoc.exists ? String(userDoc.data().plano || "basic").toLowerCase() : "basic";
        const limite = await limiteDeTentativas(plano);
        const tentativas = await tentativasDe(req.usuario.id);
        if ((tentativas[m.id] || 0) >= limite) {
            return res.status(403).json({ mensagem: "Atingiste o limite de tentativas do teu plano." });
        }

        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};
