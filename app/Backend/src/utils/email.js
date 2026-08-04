// Envio de emails transaccionais — modo duplo, igual ao config/firebase.js:
//  - Com EMAIL_HOST/EMAIL_USER/EMAIL_PASS no .env → envia mesmo via SMTP.
//  - Sem essas variáveis → "modo simulado": regista no terminal o que seria
//    enviado (destinatário, assunto, corpo em texto) e não falha nada. Isto
//    permite testar todo o fluxo localmente sem precisar de credenciais
//    reais de email.
// IMPORTANTE (serverless): o envio TEM de ser esperado com await ANTES de
// responder ao pedido. Em Vercel/Lambda a função é congelada assim que a
// resposta sai, e qualquer promessa ainda a decorrer nunca chega ao fim —
// nem envia, nem regista erro. O padrão antigo ("fire and forget", com
// .catch() e sem await) funcionava num servidor sempre a correr e deixou de
// funcionar silenciosamente ao passar para serverless.
//
// Para que um SMTP lento não estoire o tempo máximo da função, o envio tem
// limite de tempo próprio: se exceder, desiste e regista, sem quebrar o
// fluxo principal (registo, submissão, compra, etc.).
const nodemailer = require("nodemailer");

const configurado = !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);

let transporter = null;
if (configurado) {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT || 587),
        secure: String(process.env.EMAIL_SECURE || "false") === "true",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    console.log("✔ Email REAL ligado (SMTP configurado:", process.env.EMAIL_HOST + ")");
} else {
    console.log("⚠ MODO TESTE: emails simulados no terminal (sem EMAIL_HOST/EMAIL_USER/EMAIL_PASS)");
}

// Limite de tempo do envio. A função serverless tem orçamento próprio
// (10s no plano gratuito do Vercel); ficamos folgadamente abaixo.
const LIMITE_MS = Number(process.env.EMAIL_TIMEOUT_MS || 7000);

const remetente = process.env.EMAIL_FROM || "MUKANDA PREPA <no-reply@mukandaprepa.ao>";

// texto simples a partir do html (fallback para clientes sem HTML e para o log em modo simulado)
const paraTexto = (html) => html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim();

/**
 * Envia um email transaccional. Nunca lança — em caso de erro (SMTP em
 * baixo, credenciais inválidas, etc.) regista o erro e continua, para não
 * quebrar o fluxo principal (registo, validação, compra, etc.).
 */
async function enviarEmail({ to, subject, html, replyTo }) {
    const texto = paraTexto(html);
    if (!configurado) {
        console.log(`\n✉ [EMAIL SIMULADO] Para: ${to}\n  Assunto: ${subject}\n  ---\n  ${texto.replace(/\n/g, "\n  ")}\n  ---\n`);
        return { simulado: true };
    }
    try {
        // replyTo: usado pelo formulário de contacto do site, para que
        // "responder" no cliente de email vá para quem escreveu e não para
        // a própria conta institucional.
        const envio = transporter.sendMail({ from: remetente, to, subject, html, text: texto, ...(replyTo ? { replyTo } : {}) });
        const info = await Promise.race([
            envio,
            new Promise((_, rejeitar) =>
                setTimeout(() => rejeitar(new Error(`tempo esgotado (${LIMITE_MS}ms)`)), LIMITE_MS)
            ),
        ]);
        console.log(`✉ Email enviado para ${to} ("${subject}")`);
        return { simulado: false, messageId: info.messageId };
    } catch (e) {
        console.error(`✖ Falha ao enviar email para ${to} ("${subject}"):`, e.message);
        return { simulado: false, erro: e.message };
    }
}

module.exports = { enviarEmail, emailConfigurado: configurado };
