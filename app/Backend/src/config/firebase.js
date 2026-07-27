const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const { getApps, initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// Credenciais do Firebase.
//
// Em produção (Vercel e afins) NÃO existe ficheiro de chave: o código vem do
// git e a chave está no .gitignore, de propósito. Por isso a fonte principal
// passa a ser a variável de ambiente FIREBASE_SERVICE_ACCOUNT, que aceita o
// JSON da conta de serviço em texto ou em base64.
//
// Em desenvolvimento continua a funcionar como antes: se a variável não
// existir, procura-se o ficheiro .json da conta de serviço na pasta Backend.
function carregarCredenciais() {
    const bruto = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (bruto && bruto.trim()) {
        const texto = bruto.trim().startsWith("{")
            ? bruto
            : Buffer.from(bruto, "base64").toString("utf8");

        let conta;
        try {
            conta = JSON.parse(texto);
        } catch (e) {
            throw new Error(
                "FIREBASE_SERVICE_ACCOUNT existe mas não é JSON válido. " +
                "Colar o conteúdo integral do ficheiro da conta de serviço " +
                "(ou o mesmo em base64). Detalhe: " + e.message
            );
        }

        // Ao passar por variáveis de ambiente, os \n da chave privada ficam
        // muitas vezes escapados como texto — o SDK rejeita a chave assim.
        if (typeof conta.private_key === "string") {
            conta.private_key = conta.private_key.replace(/\\n/g, "\n");
        }
        return conta;
    }

    const pastaBackend = path.resolve(__dirname, "..", "..");
    const ficheiro = fs
        .readdirSync(pastaBackend)
        .find((f) => f.endsWith(".json") && f.includes("firebase-adminsdk"));

    if (ficheiro) {
        return JSON.parse(fs.readFileSync(path.join(pastaBackend, ficheiro), "utf8"));
    }

    throw new Error(
        "Credenciais do Firebase não encontradas. Definir a variável de ambiente " +
        "FIREBASE_SERVICE_ACCOUNT (JSON da conta de serviço, em texto ou base64) " +
        "ou colocar o ficheiro *firebase-adminsdk*.json na pasta Backend (só em dev)."
    );
}

// Em serverless o módulo pode ser reavaliado entre invocações: initializeApp
// duas vezes rebenta, por isso reutiliza-se a instância já existente.
// (getApps() vem da API modular; o antigo admin.apps deixou de existir no v13+.)
if (getApps().length === 0) {
    initializeApp({ credential: cert(carregarCredenciais()) });
}

const db = getFirestore();

module.exports = {
    admin,
    db,
    // Vem do módulo firebase-admin/firestore, não do espaço de nomes `admin`:
    // no firebase-admin v13+ `admin.firestore` deixou de existir (tal como
    // `admin.apps`). Usar `admin.firestore.FieldValue` rebenta em execução.
    FieldValue,
};
