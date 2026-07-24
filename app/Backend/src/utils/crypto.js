// Cifra reversível para a password de acesso da maratona (código de sala,
// não uma senha de conta) — permite ao professor rever/copiar quando
// precisar. Continua também guardada com bcrypt (senhaHash) para a
// verificação de entrada. Chave derivada do JWT_SECRET (sem novo .env).
const crypto = require("crypto");

const chave = () => crypto.createHash("sha256").update(String(process.env.JWT_SECRET || "")).digest();

function cifrar(texto) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", chave(), iv);
    const ciphertext = Buffer.concat([cipher.update(String(texto), "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

function decifrar(base64) {
    const buf = Buffer.from(base64, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", chave(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

module.exports = { cifrar, decifrar };
