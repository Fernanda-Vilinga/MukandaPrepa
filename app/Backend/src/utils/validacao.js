// Validação e normalização de dados de utilizador.
//
// Existe para que as mesmas regras valham em todos os caminhos que criam
// contas: o auto-registo de estudantes e a criação de professores pelo
// admin. Antes cada um validava o que se lembrava, e o contacto não era
// validado em lado nenhum do servidor.

// Contacto angolano: 9 dígitos começados por 9. Aceita o que a pessoa
// escrever (espaços, +244, hífens) e reduz ao essencial antes de validar.
const soDigitos = (v) => String(v || "").replace(/\D/g, "");

const normalizarContacto = (v) => {
    let d = soDigitos(v);
    if (d.startsWith("244")) d = d.slice(3);   // indicativo de Angola
    return d;
};

const contactoValido = (v) => /^9\d{8}$/.test(normalizarContacto(v));

// Formato único em toda a plataforma: 9XX XXX XXX
const formatarContacto = (v) => {
    const d = normalizarContacto(v);
    return contactoValido(d) ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : d;
};

// Nome: para comparar duplicados ignora maiúsculas, acentos e espaços a mais.
// "  Henrique  CATRAIO " e "henrique catraio" são a mesma pessoa.
const normalizarNome = (v) =>
    String(v || "")
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .trim().replace(/\s+/g, " ")
        .toLowerCase();

const normalizarEmail = (v) => String(v || "").trim().toLowerCase();

/**
 * Campos normalizados a gravar JUNTO com a conta.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  Porque existem                                                      │
 * │                                                                      │
 * │  A procura de duplicados percorria TODOS os utilizadores e comparava │
 * │  em memória — porque o Firestore não compara ignorando maiúsculas    │
 * │  nem acentos. Com a base pequena era irrelevante.                    │
 * │                                                                      │
 * │  No dia do lançamento deixa de o ser: cada registo lê a base inteira,│
 * │  e a base cresce a cada registo. Quinhentos alunos a inscreverem-se  │
 * │  dão cerca de 125 000 leituras só nisto — mais do dobro da quota     │
 * │  diária do plano gratuito.                                           │
 * │                                                                      │
 * │  Guardando a forma normalizada, a comparação passa a ser uma         │
 * │  igualdade exacta, que o Firestore resolve com um índice: três       │
 * │  consultas que devolvem zero ou um documento, em vez de N.           │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Devolve os campos a juntar ao documento do utilizador.
 */
const camposNormalizados = ({ nome, email, contacto }) => {
    const campos = {};
    if (nome !== undefined) campos.nomeNormalizado = normalizarNome(nome);
    if (email !== undefined) campos.emailNormalizado = normalizarEmail(email);
    if (contacto !== undefined) campos.contactoDigitos = normalizarContacto(contacto);
    return campos;
};

/**
 * Procura contas já existentes com o mesmo nome, email ou contacto.
 *
 * @param {string} [excluirId] conta a ignorar (ao editar a própria conta)
 * @returns {string|null} mensagem de erro, ou null se estiver livre
 */
async function procurarDuplicados(db, { nome, email, contacto }, excluirId = null) {
    const alvos = [
        ["emailNormalizado", normalizarEmail(email), "Este email já está registado."],
        ["contactoDigitos", normalizarContacto(contacto), "Este contacto já está registado noutra conta."],
        ["nomeNormalizado", normalizarNome(nome), "Já existe uma conta com este nome."],
    ].filter(([, valor]) => valor);

    for (const [campo, valor, mensagem] of alvos) {
        const r = await db.collection("usuarios").where(campo, "==", valor).limit(2).get();
        const colide = r.docs.some((d) => d.id !== excluirId);
        if (colide) return mensagem;
    }
    return null;
}

/**
 * Preenche os campos normalizados nas contas que ainda não os têm.
 *
 * Sem isto, as contas criadas antes desta mudança seriam invisíveis à procura
 * de duplicados — alguém podia registar-se com um nome ou contacto já em uso e
 * passar despercebido. Corre uma vez, a pedido do administrador.
 *
 * @returns {Promise<{total: number, actualizados: number}>}
 */
async function preencherNormalizados(db) {
    const todos = await db.collection("usuarios").get();
    let actualizados = 0;

    for (const doc of todos.docs) {
        const u = doc.data();
        const esperado = camposNormalizados({ nome: u.nome, email: u.email, contacto: u.contacto });

        const emFalta = Object.entries(esperado)
            .filter(([campo, valor]) => u[campo] !== valor);

        if (emFalta.length) {
            await db.collection("usuarios").doc(doc.id).update(Object.fromEntries(emFalta));
            actualizados += 1;
        }
    }
    return { total: todos.docs.length, actualizados };
}

module.exports = {
    normalizarContacto,
    contactoValido,
    formatarContacto,
    normalizarNome,
    normalizarEmail,
    camposNormalizados,
    procurarDuplicados,
    preencherNormalizados,
    MENSAGEM_CONTACTO: "O contacto deve ter o formato 9XX XXX XXX (nove dígitos começados por 9).",
};
