// Consultas ao Firestore que não lêem colecções inteiras.
//
// ┌──────────────────────────────────────────────────────────────────────┐
// │  O PROBLEMA                                                          │
// │                                                                      │
// │  Havia quinze sítios a fazer `collection("sessoes").get()` — trazer  │
// │  TODAS as sessões da plataforma para memória — e a filtrar depois em │
// │  JavaScript. O mesmo com os utilizadores.                            │
// │                                                                      │
// │  Com 50 utilizadores é irrelevante. Com 200 alunos numa maratona e o │
// │  professor na monitorização ao vivo — que consulta o servidor de 6   │
// │  em 6 segundos — cada consulta lê todas as sessões e todos os        │
// │  utilizadores. Meia hora disso ultrapassa sozinha as 50 000 leituras │
// │  diárias do plano gratuito, e quando a quota acaba a plataforma pára │
// │  a meio da prova.                                                    │
// └──────────────────────────────────────────────────────────────────────┘
//
// Nota sobre índices: o Firestore serve consultas com vários filtros de
// IGUALDADE sem índice composto — combina os índices de campo único. Só a
// mistura de igualdade com desigualdade ou ordenação noutro campo é que exige
// um índice criado à mão. Nada aqui faz isso.
const { db } = require("../config/firebase");

// O `in` do Firestore aceita no máximo 30 valores por consulta.
const LOTE = 30;

const emLotes = (lista, n = LOTE) => {
    const lotes = [];
    for (let i = 0; i < lista.length; i += n) lotes.push(lista.slice(i, i + n));
    return lotes;
};

const comId = (d) => ({ id: d.id, ...d.data() });

/** Sessões de UMA maratona. */
async function sessoesDaMaratona(maratonaId) {
    const r = await db.collection("sessoes").where("maratonaId", "==", maratonaId).get();
    return r.docs.map(comId);
}

/**
 * Sessões de várias maratonas — as do professor, tipicamente.
 * Divide em lotes de 30 porque é o limite do operador `in`.
 */
async function sessoesDasMaratonas(ids) {
    if (!ids || !ids.length) return [];
    const lotes = await Promise.all(
        emLotes([...new Set(ids)]).map((lote) =>
            db.collection("sessoes").where("maratonaId", "in", lote).get()),
    );
    return lotes.flatMap((r) => r.docs.map(comId));
}

/**
 * Utilizadores por identificador, buscando SÓ os pedidos.
 *
 * Substitui o padrão de ler a colecção inteira para depois procurar meia dúzia
 * de nomes: o custo passa a crescer com o número de alunos numa prova, e não
 * com o número de contas que a plataforma tem.
 */
async function utilizadoresPorId(ids) {
    const unicos = [...new Set((ids || []).filter(Boolean))];
    if (!unicos.length) return {};

    const lotes = await Promise.all(
        emLotes(unicos).map((lote) =>
            db.collection("usuarios").where("__name__", "in", lote).get()),
    );

    const porId = {};
    for (const r of lotes) for (const d of r.docs) porId[d.id] = comId(d);
    return porId;
}

module.exports = { sessoesDaMaratona, sessoesDasMaratonas, utilizadoresPorId, emLotes };
