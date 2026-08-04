// Formulário de contacto do site institucional.
//
// Decisão da equipa (D7, 3 Ago 2026): as mensagens vão para a caixa de
// suporte. O endereço fica em variável de ambiente para mudar sem deploy;
// o valor por omissão é o decidido pela equipa.
//
// Não grava nada na base de dados: a caixa de email É o arquivo. Se um dia
// for preciso histórico ou estado (respondida/pendente), grava-se aí uma
// colecção `contactos` — mas só nesse dia.
const { enviarEmail, emailConfigurado } = require("../utils/email");

const DESTINO = process.env.CONTACTO_EMAIL || "mukandaprepasuporte@gmail.com";

// Limites de tamanho: generosos para uso legítimo, curtos para abuso.
const MAX = { nome: 100, email: 160, assunto: 150, mensagem: 3000 };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// O conteúdo vem de quem quiser escrever no site — entra no HTML do email
// apenas escapado, nunca em bruto.
const esc = (v) =>
    String(v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

async function enviarContacto(req, res) {
    const nome = String(req.body?.nome || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const assunto = String(req.body?.assunto || "").trim();
    const mensagem = String(req.body?.mensagem || "").trim();

    if (!nome) return res.status(400).json({ mensagem: "Preenche o teu nome." });
    if (!email || !EMAIL_REGEX.test(email)) return res.status(400).json({ mensagem: "Introduz um email válido." });
    if (!mensagem) return res.status(400).json({ mensagem: "Escreve a tua mensagem." });
    if (nome.length > MAX.nome || email.length > MAX.email || assunto.length > MAX.assunto || mensagem.length > MAX.mensagem) {
        return res.status(400).json({ mensagem: "A mensagem é demasiado longa." });
    }

    const html = [
        `<p><strong>Nova mensagem do formulário de contacto do site.</strong></p>`,
        `<p><strong>Nome:</strong> ${esc(nome)}<br/>`,
        `<strong>Email:</strong> ${esc(email)}<br/>`,
        `<strong>Assunto:</strong> ${esc(assunto || "(sem assunto)")}</p>`,
        `<p>${esc(mensagem).replace(/\n/g, "<br/>")}</p>`,
    ].join("");

    const resultado = await enviarEmail({
        to: DESTINO,
        subject: `[Site] ${assunto || "Contacto"} — ${nome}`,
        html,
        replyTo: `${nome} <${email}>`,
    });

    // Só se confirma o que aconteceu de verdade: se o SMTP está configurado
    // e falhou, o site NÃO pode dizer "mensagem enviada" — era exactamente
    // o defeito que este endpoint veio corrigir.
    if (emailConfigurado && resultado.erro) {
        return res.status(502).json({
            mensagem: "Não foi possível enviar a mensagem. Tenta de novo, ou escreve directamente para " + DESTINO + ".",
        });
    }

    return res.json({ ok: true, mensagem: "Mensagem enviada. Vamos responder-te em breve." });
}

module.exports = { enviarContacto };
