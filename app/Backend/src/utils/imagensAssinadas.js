// Endereços de imagem assinados.
//
// ┌──────────────────────────────────────────────────────────────────────┐
// │  O PROBLEMA                                                          │
// │                                                                      │
// │  O endereço de leitura tem de ser aberto: uma etiqueta <img> não     │
// │  consegue enviar o cabeçalho de autenticação. A protecção era o      │
// │  identificador não ser adivinhável.                                  │
// │                                                                      │
// │  Só que a maratona tem uma janela de vários dias e as 15 questões    │
// │  são as mesmas para todos. Um aluno que fizesse a prova no primeiro  │
// │  dia podia copiar os endereços — botão direito, copiar endereço da   │
// │  imagem — e enviá-los por WhatsApp a quem a ia fazer depois.         │
// └──────────────────────────────────────────────────────────────────────┘
//
// ┌──────────────────────────────────────────────────────────────────────┐
// │  A REGRA QUE ISTO ESTABELECE                                         │
// │                                                                      │
// │  O que fica GRAVADO na base de dados é apenas o identificador da     │
// │  imagem. O endereço ENTREGUE a um browser é sempre assinado de novo, │
// │  no momento, com validade e com o contexto de quem o vai ver.        │
// │                                                                      │
// │  Consequência prática: nenhum endereço guardado em lado nenhum       │
// │  continua a funcionar mais tarde. Partilhar um só serve enquanto a   │
// │  sessão de quem o partilhou estiver a decorrer — e essa dura, no     │
// │  máximo, o tempo da prova.                                           │
// └──────────────────────────────────────────────────────────────────────┘
const crypto = require("crypto");

// Chave própria, independente do JWT_SECRET (ver utils/crypto.js para a lição
// que levou a esta separação). Com recurso às outras para nada partir.
function chave() {
    const segredo = process.env.IMAGENS_SECRET
        || process.env.CRYPTO_SECRET
        || process.env.JWT_SECRET
        || "";
    return crypto.createHash("sha256").update(String(segredo).trim()).digest();
}

function assinatura(id, contexto, expira) {
    return crypto.createHmac("sha256", chave())
        .update(`${id}|${contexto}|${expira}`)
        .digest("base64url")
        .slice(0, 32);
}

// Quanto tempo vale cada tipo de endereço.
const VALIDADES = {
    // A do aluno acompanha a prova: a sessão é fechada pelo servidor ao fim do
    // tempo, e a partir daí o endereço deixa de servir de qualquer maneira.
    sessao: 3 * 60 * 60 * 1000,
    // O professor a preparar ou a corrigir. Mais folgado — está autenticado
    // numa página que só ele abre — mas não eterno.
    professor: 12 * 60 * 60 * 1000,
    // O aluno a rever os seus próprios resultados depois da prova.
    aluno: 12 * 60 * 60 * 1000,
};

/**
 * Constrói o endereço assinado de uma imagem.
 *
 * @param {string} idOuUrl  identificador, ou um endereço de onde o extrair
 * @param {string} baseUrl  raiz pública da API
 * @param {object} opcoes   { tipo: 'sessao'|'professor'|'aluno', sessaoId }
 * @returns {string|null}
 */
function assinarUrl(idOuUrl, baseUrl, { tipo = "professor", sessaoId = null } = {}) {
    const id = extrairId(idOuUrl);
    if (!id) return null;

    const contexto = tipo === "sessao" && sessaoId ? `s:${sessaoId}` : tipo;
    const expira = Date.now() + (VALIDADES[tipo] || VALIDADES.professor);
    const t = assinatura(id, contexto, expira);

    const qs = new URLSearchParams({ e: String(expira), c: contexto, t });
    return `${baseUrl}/imagens/${id}?${qs.toString()}`;
}

/**
 * Verifica um pedido de leitura.
 * Devolve { ok: true, sessaoId } ou { ok: false, motivo }.
 */
function verificarUrl(id, query = {}) {
    const { e, c, t } = query;
    if (!e || !c || !t) return { ok: false, motivo: "sem assinatura" };

    const expira = Number(e);
    if (!Number.isFinite(expira)) return { ok: false, motivo: "validade inválida" };
    if (Date.now() > expira) return { ok: false, motivo: "expirado" };

    const esperada = assinatura(id, String(c), expira);
    // Comparação de tempo constante: comparar strings com === revela, pelo
    // tempo que demora, quantos caracteres iniciais estão certos.
    const a = Buffer.from(String(t));
    const b = Buffer.from(esperada);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return { ok: false, motivo: "assinatura inválida" };
    }

    const sessao = String(c).startsWith("s:") ? String(c).slice(2) : null;
    return { ok: true, sessaoId: sessao };
}

// Aceita tanto o identificador puro como qualquer endereço que o contenha —
// incluindo um já assinado, cuja assinatura antiga é simplesmente ignorada.
function extrairId(v) {
    const texto = String(v || "");
    if (/^[a-f0-9]{48}$/.test(texto)) return texto;
    const m = texto.match(/\/imagens\/([a-f0-9]{48})/);
    return m ? m[1] : null;
}

module.exports = { assinarUrl, verificarUrl, extrairId, VALIDADES };
