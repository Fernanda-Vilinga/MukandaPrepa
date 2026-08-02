// Upload de imagens.
//
// Dois caminhos, com donos diferentes:
//   professor → imagem da questão (as 15 questões SÃO imagens)
//   estudante → fotografia da resposta, nas questões do tipo "photo"
//
// O corpo do pedido é o ficheiro binário em bruto (express.raw), não um
// formulário multipart nem base64. Sem dependências novas, e sem os 33% de
// peso extra que o base64 acrescenta — o que numa ligação móvel angolana, a
// meio de uma prova cronometrada, é a diferença que interessa.
const { db } = require("../config/firebase");
const {
    guardarImagem, lerImagem, apagarImagem, caminhoDoUrl, baseUrlDoPedido,
} = require("../utils/armazenamento");
const { assinarUrl, verificarUrl } = require("../utils/imagensAssinadas");

// Estado da sessão, com cache curta.
//
// Cada questão aberta pede a sua imagem, e sem cache seriam 15 leituras por
// aluno só para confirmar o que não muda de segundo a segundo. Trinta segundos
// é o atraso máximo entre submeter e as imagens deixarem de responder — sem
// consequência nenhuma, porque quem submeteu já não está a olhar para elas.
const CACHE_SESSAO_MS = 30000;
const sessoesConhecidas = new Map();

async function sessaoActiva(id) {
    const agora = Date.now();
    const guardada = sessoesConhecidas.get(id);
    if (guardada && agora < guardada.expiraEm) return guardada.activa;

    const doc = await db.collection("sessoes").doc(id).get();
    const activa = doc.exists && doc.data().estado === "active";

    sessoesConhecidas.set(id, { activa, expiraEm: agora + CACHE_SESSAO_MS });
    if (sessoesConhecidas.size > 500) {
        for (const [k, v] of sessoesConhecidas) if (agora >= v.expiraEm) sessoesConhecidas.delete(k);
    }
    return activa;
}

// Um erro marcado com .utilizador é culpa do ficheiro enviado, não do
// servidor: mostra-se a mensagem e devolve-se 400, sem registar como falha.
function responderErro(res, e, contexto) {
    if (e && e.utilizador) {
        return res.status(400).json({ mensagem: e.message });
    }
    console.error(contexto, e);
    return res.status(500).json({ mensagem: "Não foi possível guardar a imagem. Tenta de novo." });
}

// POST /api/uploads/questions/:id/:slot   (professor dono da maratona)
// Corpo: a imagem em bruto. Devolve { url }.
exports.imagemDaQuestao = async (req, res) => {
    try {
        const slot = Number(req.params.slot);
        if (!(slot >= 1 && slot <= 15)) {
            return res.status(400).json({ mensagem: "Slot inválido (1–15)." });
        }

        const doc = await db.collection("maratonas").doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ mensagem: "Maratona não encontrada." });

        const m = { id: doc.id, ...doc.data() };
        if (m.professorId !== req.usuario.id) {
            return res.status(403).json({ mensagem: "Esta maratona não é tua." });
        }

        const { url } = await guardarImagem(req.body, `maratonas/${m.id}`, `q${slot}`, baseUrlDoPedido(req));

        // ── Duas coisas erradas aqui antes ──────────────────────────────────
        //
        // 1. Apagava-se logo a imagem GRAVADA na questão. Mas enviar não é
        //    guardar: se o professor carregasse uma substituição e depois não
        //    guardasse a questão — ou fechasse a página — a questão continuava
        //    a apontar para uma imagem que já não existia. Numa maratona
        //    publicada, isso é um enunciado em branco no dia da prova.
        //    A imagem gravada só se apaga quando a questão for mesmo guardada
        //    com outra (ver marathonController.guardarQuestao).
        //
        // 2. Nada apagava as imagens enviadas e nunca guardadas. Carregar
        //    cinco imagens no mesmo slot à procura da melhor deixava quatro
        //    registos a ocupar espaço para sempre, sem ninguém lhes chegar.
        //    Guarda-se agora qual é a "pendente" de cada slot: ao chegar outra,
        //    a anterior vai-se — a menos que seja a que está gravada.
        const pendentes = m.imagensPendentes || {};
        const pendenteAnterior = pendentes[String(slot)];
        const gravada = (m.questoes || [])[slot - 1]?.image;

        if (pendenteAnterior && pendenteAnterior !== url && pendenteAnterior !== gravada) {
            await apagarImagem(caminhoDoUrl(pendenteAnterior));
        }

        await db.collection("maratonas").doc(m.id).update({ [`imagensPendentes.${slot}`]: url });

        // Guarda-se o endereço simples; devolve-se o assinado, para o professor
        // poder ver a imagem que acabou de enviar. Ver utils/imagensAssinadas.js.
        res.json({ ok: true, url: assinarUrl(url, baseUrlDoPedido(req), { tipo: "professor" }) });
    } catch (e) {
        responderErro(res, e, "upload da imagem da questão:");
    }
};

// POST /api/uploads/answers/:id/:questao   (estudante dono da sessão)
// :id é a sessão; :questao é o índice da questão dentro dela.
// Devolve { url } — o frontend grava-o na resposta como qualquer outra.
exports.fotografiaDaResposta = async (req, res) => {
    try {
        const doc = await db.collection("sessoes").doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ mensagem: "Sessão não encontrada." });

        const s = { id: doc.id, ...doc.data() };
        if (s.usuarioId !== req.usuario.id) {
            // Mesma resposta que "não existe": não se confirma a existência de
            // sessões de outros a quem anda a experimentar identificadores.
            return res.status(404).json({ mensagem: "Sessão não encontrada." });
        }

        // Sem isto, dava para continuar a enviar fotografias depois de a prova
        // ter sido submetida — ou seja, responder fora do tempo.
        if (s.estado !== "active") {
            return res.status(400).json({ mensagem: "A sessão já foi submetida.", submitted: true });
        }

        const indice = Number(req.params.questao);
        const questoes = s.questoes || [];
        if (!Number.isInteger(indice) || indice < 0 || indice >= questoes.length) {
            return res.status(400).json({ mensagem: "Questão inválida." });
        }
        if (questoes[indice].type !== "photo") {
            return res.status(400).json({ mensagem: "Esta questão não é de resposta por fotografia." });
        }

        const { url } = await guardarImagem(req.body, `respostas/${s.id}`, `q${indice}`, baseUrlDoPedido(req));

        // Aqui a regra é diferente da das questões, de propósito.
        //
        // A fotografia gravada É apagada logo, porque o aluno vê o resultado no
        // ecrã e volta a enviar se algo correr mal — ao contrário do enunciado
        // de uma prova publicada, onde um erro só se descobre no dia. E porque
        // a resposta é gravada um segundo depois do envio, deixar a anterior
        // para trás significaria uma imagem órfã por cada substituição.
        //
        // A pendente é apagada pela mesma razão que nas questões: o aluno pode
        // fotografar três vezes seguidas antes de a resposta chegar ao servidor.
        const gravada = (s.respostas || {})[questoes[indice].id];
        const pendenteAnterior = (s.imagensPendentes || {})[String(indice)];

        for (const antiga of new Set([gravada, pendenteAnterior])) {
            if (antiga && antiga !== url) await apagarImagem(caminhoDoUrl(antiga));
        }

        await db.collection("sessoes").doc(s.id).update({ [`imagensPendentes.${indice}`]: url });

        // Assinado para esta sessão: o aluno vê a fotografia que enviou, e o
        // endereço morre quando a prova fechar.
        res.json({ ok: true, url: assinarUrl(url, baseUrlDoPedido(req), { tipo: "sessao", sessaoId: s.id }) });
    } catch (e) {
        responderErro(res, e, "upload da fotografia da resposta:");
    }
};

// GET /api/imagens/:id?e=…&c=…&t=…   (sem token, mas assinado)
//
// Uma etiqueta <img> não consegue enviar o cabeçalho de autenticação, por isso
// este endereço tem de ser acessível sem sessão. A protecção deixou de ser
// apenas o identificador não se adivinhar: agora exige-se uma assinatura com
// validade, e — quando foi emitida para um aluno — que a sessão dele ainda
// esteja a decorrer.
//
// O que isto muda na prática: copiar o endereço de uma questão e passá-lo a um
// colega só serve enquanto a prova de quem o copiou estiver a decorrer. Antes
// servia durante os vários dias da janela de acesso. Ver utils/imagensAssinadas.js.
exports.servirImagem = async (req, res) => {
    try {
        const permissao = verificarUrl(req.params.id, req.query);
        if (!permissao.ok) {
            return res.status(403).json({
                mensagem: permissao.motivo === "expirado"
                    ? "Esta imagem expirou. Actualiza a página."
                    : "Endereço de imagem inválido.",
            });
        }

        // Assinatura de aluno: vale enquanto a sessão estiver aberta. Depois de
        // submeter — ou de o tempo esgotar — deixa de valer, mesmo dentro do
        // prazo da assinatura.
        if (permissao.sessaoId && !(await sessaoActiva(permissao.sessaoId))) {
            return res.status(403).json({ mensagem: "Esta imagem já não está disponível." });
        }

        const imagem = await lerImagem(req.params.id);
        if (!imagem) return res.status(404).json({ mensagem: "Imagem não encontrada." });

        // Guardar no browser é o que evita que cada questão aberta seja uma
        // leitura nova à base de dados. Mas deixou de poder ser "para sempre e
        // para toda a gente": `private` impede que um intermediário guarde a
        // imagem e a sirva a outra pessoa, e uma hora chega para a prova sem
        // manter viva uma imagem cujo acesso foi entretanto revogado.
        res.set("Cache-Control", "private, max-age=3600");
        res.set("Content-Type", imagem.tipo);
        res.set("Content-Length", imagem.buffer.length);
        res.send(imagem.buffer);
    } catch (e) {
        console.error("leitura da imagem:", e);
        res.status(500).json({ mensagem: "Erro ao carregar a imagem." });
    }
};
