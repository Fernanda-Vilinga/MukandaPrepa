// Armazenamento de imagens — ÚNICO sítio do projecto que sabe ONDE as imagens
// ficam guardadas.
//
// ┌──────────────────────────────────────────────────────────────────────┐
// │  SOLUÇÃO TEMPORÁRIA — as imagens vivem dentro do Firestore.          │
// │                                                                      │
// │  O destino natural seria o Firebase Storage, mas desde o final de    │
// │  2024 o Cloud Storage exige o plano Blaze (com cartão) em projectos   │
// │  novos, e este projecto está no plano gratuito.                      │
// │                                                                      │
// │  Guardar imagens numa base de dados não é o que se deve fazer: há um  │
// │  limite rígido de 1 MB por documento e cada leitura conta na quota.   │
// │  Aguenta os testes e a primeira maratona; não aguenta a plataforma a  │
// │  crescer.                                                            │
// │                                                                      │
// │  QUANDO HOUVER ARMAZENAMENTO A SÉRIO (Fluxo, Cloudinary, Blaze),     │
// │  reescreve-se ESTE ficheiro e mais nada. Os controllers e o frontend  │
// │  não sabem onde as imagens estão — só chamam estas funções.          │
// └──────────────────────────────────────────────────────────────────────┘
const crypto = require("crypto");
const { db } = require("../config/firebase");

const COLECCAO = "imagens";

// ── Limites ─────────────────────────────────────────────────────────────────
// O Firestore recusa documentos acima de 1 MiB, contando tudo: os bytes da
// imagem, os outros campos e o próprio nome do documento. 900 kB deixa folga
// suficiente e continua muito acima do que o browser envia depois de reduzir
// a imagem (150-350 kB).
//
// Nota: guarda-se o Buffer directamente (tipo Bytes do Firestore), não em
// base64 — o base64 acrescentaria um terço ao tamanho e roubaria essa folga.
const TAMANHO_MAXIMO = 900 * 1024;

// ── Assinaturas de ficheiro ─────────────────────────────────────────────────
// Não se confia no Content-Type enviado pelo browser: é escrito pelo cliente e
// pode mentir. Um ficheiro HTML enviado como "image/jpeg" ficaria guardado e
// depois devolvido pelo nosso próprio servidor — é assim que se monta um
// ataque a partir de um endereço que parece de confiança. Verificam-se os
// primeiros bytes, que o formato obriga a ter.
const ASSINATURAS = [
    { tipo: "image/jpeg", ext: "jpg",  bytes: [0xff, 0xd8, 0xff] },
    { tipo: "image/png",  ext: "png",  bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
    // WEBP: "RIFF" .... "WEBP" — o tamanho fica entre os dois, daí o salto.
    { tipo: "image/webp", ext: "webp", bytes: [0x52, 0x49, 0x46, 0x46], bytesEm8: [0x57, 0x45, 0x42, 0x50] },
];

function reconhecerImagem(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;

    for (const a of ASSINATURAS) {
        const inicioBate = a.bytes.every((b, i) => buffer[i] === b);
        if (!inicioBate) continue;
        if (a.bytesEm8 && !a.bytesEm8.every((b, i) => buffer[8 + i] === b)) continue;
        return { tipo: a.tipo, ext: a.ext };
    }
    return null;
}

/**
 * Valida o que chegou. Devolve { ok: true, tipo, ext } ou { ok: false, mensagem }.
 * A mensagem é para ser mostrada ao utilizador tal como está.
 */
function validarImagem(buffer) {
    if (!buffer || !buffer.length) {
        return { ok: false, mensagem: "Nenhuma imagem recebida." };
    }
    if (buffer.length > TAMANHO_MAXIMO) {
        const kb = Math.round(buffer.length / 1024);
        return {
            ok: false,
            mensagem: `A imagem tem ${kb} kB e o máximo são 900 kB. Tenta uma fotografia com menos resolução.`,
        };
    }

    const reconhecida = reconhecerImagem(buffer);
    if (!reconhecida) {
        return { ok: false, mensagem: "O ficheiro não é uma imagem JPG, PNG ou WEBP." };
    }
    return { ok: true, ...reconhecida };
}

/**
 * Guarda a imagem e devolve o endereço por onde é servida.
 *
 * O identificador é aleatório e longo de propósito. O endereço de leitura tem
 * de ser aberto — uma etiqueta <img> não consegue enviar o cabeçalho de
 * autenticação — por isso a protecção é ele não ser adivinhável, tal como os
 * "tokens de transferência" que o Firebase usa para o mesmo efeito.
 *
 * @param {Buffer} buffer   conteúdo do ficheiro
 * @param {string} pasta    ex.: "maratonas/abc123" — só para saber a origem
 * @param {string} nome     ex.: "q3"
 * @param {string} baseUrl  raiz pública da API, ex.: "https://api.exemplo.app/api"
 * @returns {Promise<{url: string, caminho: string}>}
 */
async function guardarImagem(buffer, pasta, nome, baseUrl) {
    const validacao = validarImagem(buffer);
    if (!validacao.ok) {
        const erro = new Error(validacao.mensagem);
        erro.utilizador = true;   // erro para mostrar, não para registar como falha
        throw erro;
    }

    const id = crypto.randomBytes(24).toString("hex");   // 48 caracteres

    await db.collection(COLECCAO).doc(id).set({
        dados: buffer,                 // tipo Bytes do Firestore
        tipo: validacao.tipo,
        tamanho: buffer.length,
        origem: `${pasta}/${nome}`,    // para saber a que maratona/sessão pertence
        criadoEm: new Date().toISOString(),
    });

    return { url: `${baseUrl}/imagens/${id}`, caminho: id };
}

/**
 * Lê uma imagem. Devolve { buffer, tipo } ou null se não existir.
 */
async function lerImagem(id) {
    if (!/^[a-f0-9]{48}$/.test(String(id || ""))) return null;

    const doc = await db.collection(COLECCAO).doc(id).get();
    if (!doc.exists) return null;

    const d = doc.data();
    // O SDK devolve os campos Bytes já como Buffer.
    return { buffer: Buffer.from(d.dados), tipo: d.tipo || "image/jpeg" };
}

/**
 * Apaga uma imagem. Nunca rebenta: apagar é sempre secundário ao que estava a
 * ser feito (substituir uma questão, remover uma maratona), e falhar aqui não
 * deve fazer falhar essa operação. Deixa um registo órfão, que ninguém lê.
 */
async function apagarImagem(caminho) {
    if (!caminho) return false;
    try {
        await db.collection(COLECCAO).doc(caminho).delete();
        return true;
    } catch (e) {
        console.warn("Não foi possível apagar a imagem", caminho, "—", e.message);
        return false;
    }
}

/**
 * Extrai o identificador a partir de um endereço devolvido por guardarImagem.
 * Devolve null se o endereço não for deste armazenamento.
 */
function caminhoDoUrl(url) {
    const m = String(url || "").match(/\/imagens\/([a-f0-9]{48})(?:[?#]|$)/);
    return m ? m[1] : null;
}

/**
 * Raiz pública da API, deduzida do próprio pedido.
 *
 * Evita mais uma variável de ambiente para configurar (e para esquecer de
 * configurar). Em produção force-se https: o Vercel termina o TLS antes de
 * chegar aqui, pelo que req.protocol diria "http" e as imagens seriam
 * bloqueadas pelo browser por conteúdo misto.
 */
function baseUrlDoPedido(req) {
    if (process.env.API_PUBLIC_URL) return process.env.API_PUBLIC_URL.replace(/\/$/, "");

    // req.get existe sempre no Express, mas ler o cabeçalho directamente é
    // equivalente e evita que um pedido construído de outra forma — um teste,
    // um handler interno — derrube o servidor a servir uma imagem.
    const host = (req.get ? req.get("host") : null) || req.headers?.host || "localhost";
    const protocolo = /^localhost|^127\.|^\[::1\]/.test(host) ? "http" : "https";
    // req.baseUrl é "/api" ou "" — a API está montada nos dois (ver app.js).
    return `${protocolo}://${host}/api`;
}

module.exports = {
    guardarImagem,
    lerImagem,
    apagarImagem,
    validarImagem,
    caminhoDoUrl,
    baseUrlDoPedido,
    TAMANHO_MAXIMO,
};
