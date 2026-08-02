// Cifra reversível para a password de acesso da maratona — o "código de sala"
// que o professor comunica aos alunos, não uma senha de conta. É reversível de
// propósito: o professor tem de a poder rever e copiar. A verificação de
// entrada usa outra coisa (bcrypt, no campo senhaHash), que não é reversível.
//
// ┌──────────────────────────────────────────────────────────────────────┐
// │  A chave era derivada do JWT_SECRET, "para não criar mais uma        │
// │  variável de ambiente". Custou caro: quando foi preciso trocar o     │
// │  JWT_SECRET — porque tinha estado exposto nos registos — descobriu-se│
// │  que isso tornaria indecifráveis TODAS as passwords de maratona já   │
// │  guardadas, e o professor deixaria de as conseguir comunicar.        │
// │                                                                      │
// │  Passa a existir CRYPTO_SECRET, independente. Enquanto não for       │
// │  definida, usa-se o JWT_SECRET — para nada partir de um lado para o  │
// │  outro.                                                              │
// └──────────────────────────────────────────────────────────────────────┘
const crypto = require("crypto");

// Chaves candidatas, por ordem. A primeira é a que cifra; ao decifrar tentam-se
// todas, o que permite trocar de segredo sem perder o que já está guardado:
// basta manter o anterior na lista durante a transição.
function segredos() {
    const lista = [
        process.env.CRYPTO_SECRET,
        process.env.CRYPTO_SECRET_ANTERIOR,
        process.env.JWT_SECRET,
    ].filter((s) => s && String(s).trim());

    return [...new Set(lista)].map((s) =>
        crypto.createHash("sha256").update(String(s)).digest());
}

function cifrar(texto) {
    const [chave] = segredos();
    if (!chave) throw new Error("Nem CRYPTO_SECRET nem JWT_SECRET estão definidos.");

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", chave, iv);
    const ciphertext = Buffer.concat([cipher.update(String(texto), "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

// Devolve null se não conseguir decifrar com nenhuma das chaves — em vez de
// rebentar. Uma password de maratona que se perdeu não deve derrubar o pedido
// inteiro: quem chama mostra uma mensagem e o professor define outra.
function decifrar(base64) {
    if (!base64) return null;

    const buf = Buffer.from(base64, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);

    for (const chave of segredos()) {
        try {
            const decipher = crypto.createDecipheriv("aes-256-gcm", chave, iv);
            decipher.setAuthTag(tag);
            return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
        } catch {
            // Chave errada: o GCM detecta-o pela etiqueta de autenticação.
            // Tenta-se a seguinte.
        }
    }
    return null;
}

module.exports = { cifrar, decifrar };
