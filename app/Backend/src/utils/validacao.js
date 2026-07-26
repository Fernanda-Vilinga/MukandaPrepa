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
 * Procura contas já existentes com o mesmo nome, email ou contacto.
 *
 * Percorre a colecção em memória em vez de usar where(): o Firestore não
 * faz comparações sem distinguir maiúsculas nem OR entre campos, e a base
 * de utilizadores desta plataforma é pequena. Se um dia crescer muito,
 * passar a guardar campos normalizados (nomeNormalizado, contactoDigitos)
 * e indexá-los.
 *
 * @param {string} [excluirId] conta a ignorar (ao editar a própria conta)
 * @returns {string|null} mensagem de erro, ou null se estiver livre
 */
async function procurarDuplicados(db, { nome, email, contacto }, excluirId = null) {
    const nomeAlvo = normalizarNome(nome);
    const emailAlvo = normalizarEmail(email);
    const contactoAlvo = normalizarContacto(contacto);

    const todos = await db.collection("usuarios").get();

    for (const doc of todos.docs) {
        if (excluirId && doc.id === excluirId) continue;
        const u = doc.data();

        if (emailAlvo && normalizarEmail(u.email) === emailAlvo) {
            return "Este email já está registado.";
        }
        if (contactoAlvo && normalizarContacto(u.contacto) === contactoAlvo) {
            return "Este contacto já está registado noutra conta.";
        }
        if (nomeAlvo && normalizarNome(u.nome) === nomeAlvo) {
            return "Já existe uma conta com este nome.";
        }
    }
    return null;
}

module.exports = {
    normalizarContacto,
    contactoValido,
    formatarContacto,
    normalizarNome,
    normalizarEmail,
    procurarDuplicados,
    MENSAGEM_CONTACTO: "O contacto deve ter o formato 9XX XXX XXX (nove dígitos começados por 9).",
};
