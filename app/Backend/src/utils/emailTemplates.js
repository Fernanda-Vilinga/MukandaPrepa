// Modelos HTML simples para os emails transaccionais — uma única moldura
// (base()) com a identidade da MUKANDA PREPA, para não repetir CSS em
// cada controller. Texto sempre em português de Angola, directo.
const ORANGE = "#FB6D1D";
const DARK = "#14161A";

const base = (titulo, corpoHtml, cta) => `
<div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: ${DARK};">
  <div style="background: ${ORANGE}; padding: 24px 32px; border-radius: 14px 14px 0 0;">
    <span style="color: #fff; font-weight: 800; font-size: 18px; letter-spacing: .3px;">MUKANDA PREPA</span>
  </div>
  <div style="border: 1px solid #EFEFF2; border-top: none; border-radius: 0 0 14px 14px; padding: 32px;">
    <h2 style="margin: 0 0 16px; font-size: 20px;">${titulo}</h2>
    <div style="font-size: 15px; line-height: 1.6; color: #333;">${corpoHtml}</div>
    ${cta ? `<div style="margin-top: 28px;"><a href="${cta.url}" style="background:${ORANGE};color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">${cta.label}</a></div>` : ""}
  </div>
  <div style="text-align:center; font-size:12px; color:#9A9AA5; padding: 16px 0;">
    Plataforma de Maratonas · MUKANDA PREPA
  </div>
</div>`;

const APP_URL = process.env.APP_URL || "http://localhost:5173";

const boasVindasProfessor = ({ nome, email, senhaTemporaria }) => ({
    subject: "Bem-vindo(a) à MUKANDA PREPA — a tua conta de professor",
    html: base(`Bem-vindo(a), Prof. ${nome} 👋`, `
    <p>A tua conta de professor na Plataforma de Maratonas MUKANDA PREPA foi criada. Estas são as tuas credenciais de acesso:</p>
    <p style="background:#F7F7F9;border-radius:10px;padding:14px 18px;font-family:monospace;font-size:14px;">
      Email: <b>${email}</b><br/>Senha temporária: <b>${senhaTemporaria}</b>
    </p>
    <p>Por segurança, no primeiro acesso vais ter de definir uma senha nova.</p>`,
        { url: APP_URL, label: "Entrar na plataforma" }),
});

const senhaRedefinida = ({ nome, email, senhaTemporaria }) => ({
    subject: "A tua senha foi redefinida — MUKANDA PREPA",
    html: base(`Olá, ${nome}`, `
    <p>Um administrador redefiniu a senha da tua conta (${email}). Usa a senha temporária abaixo para entrares — vais ter de definir uma nova de seguida.</p>
    <p style="background:#F7F7F9;border-radius:10px;padding:14px 18px;font-family:monospace;font-size:14px;">
      Senha temporária: <b>${senhaTemporaria}</b>
    </p>
    <p>Se não esperavas este email, contacta a administração o mais rápido possível.</p>`,
        { url: APP_URL, label: "Entrar na plataforma" }),
});

const planoAlteradoPeloAdmin = ({ nome, plano }) => ({
    subject: `O teu plano foi actualizado para ${plano} — MUKANDA PREPA`,
    html: base(`O teu plano mudou, ${nome}`, `
    <p>Um administrador actualizou o teu plano na MUKANDA PREPA para <b>${plano}</b>. Já podes aproveitar as novas vantagens — basta actualizar a página na plataforma.</p>`,
        { url: APP_URL, label: "Ver o meu dashboard" }),
});

const submissaoRecebida = ({ nomeProfessor, nomeAluno, maratona }) => ({
    subject: `Nova submissão para validar — ${maratona}`,
    html: base(`Nova submissão, Prof. ${nomeProfessor}`, `
    <p><b>${nomeAluno}</b> submeteu uma tentativa na maratona <b>${maratona}</b> e está à espera da tua validação.</p>`,
        { url: APP_URL, label: "Validar agora" }),
});

const resultadoValidado = ({ nomeAluno, maratona, score, total, percent }) => ({
    subject: `O teu resultado em "${maratona}" já está disponível`,
    html: base(`O teu resultado saiu, ${nomeAluno} 🎉`, `
    <p>A tua submissão na maratona <b>${maratona}</b> foi validada pelo professor.</p>
    <p style="background:#F7F7F9;border-radius:10px;padding:14px 18px;font-size:15px;">
      Nota: <b>${score}/${total}</b> (${percent}%)
    </p>
    <p>Consulta o detalhe completo, o feedback por questão e o teu ranking no dashboard.</p>`,
        { url: APP_URL, label: "Ver o meu resultado" }),
});

const pedidoDeUpgrade = ({ nomeAluno, emailAluno, planoActual, planoPedido, promoCode }) => ({
    subject: `Novo pedido de upgrade — ${nomeAluno} quer o plano ${planoPedido}`,
    html: base(`Novo pedido de upgrade de plano`, `
    <p><b>${nomeAluno}</b> (${emailAluno}) pediu para mudar do plano <b>${planoActual}</b> para o plano <b>${planoPedido}</b>${promoCode ? ` com o código promocional <b>${promoCode}</b>` : ""}.</p>
    <p>A conversa já está aberta no chat Suporte — dá seguimento por lá (dados de pagamento, confirmação do comprovativo e activação do plano).</p>`,
        { url: `${APP_URL}/admin/suporte`, label: "Abrir o chat Suporte" }),
});

const planoConfirmado = ({ nomeAluno, planoPedido }) => ({
    subject: `Plano ${planoPedido} activado — MUKANDA PREPA`,
    html: base(`O teu plano ${planoPedido} já está activo! 🎉`, `
    <p>Olá, ${nomeAluno}. Confirmámos o teu pagamento e o teu novo plano <b>${planoPedido}</b> já está activo na plataforma.</p>
    <p>Basta actualizar a página para veres as novas vantagens.</p>`,
        { url: APP_URL, label: "Ver o meu dashboard" }),
});

module.exports = {
    boasVindasProfessor, senhaRedefinida, planoAlteradoPeloAdmin,
    submissaoRecebida, resultadoValidado, pedidoDeUpgrade, planoConfirmado,
};
