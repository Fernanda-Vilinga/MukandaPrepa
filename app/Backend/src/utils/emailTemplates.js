// Modelos HTML simples para os emails transaccionais — uma única moldura
// (base()) com a identidade da MUKANDA PREPA, para não repetir CSS em
// cada controller. Texto sempre em português de Angola, directo.
const APP_URL = process.env.APP_URL || "http://localhost:5173";

const ORANGE = "#FB6D1D";
const DARK = "#14161A";

// Logótipo do cabeçalho. Tem de ser um endereço público e absoluto: o email
// é lido fora da aplicação, portanto caminhos relativos não resolvem. Usa-se
// a versão branca, sobre o laranja da marca.
//
// O nome em texto continua ao lado de propósito — a maioria dos clientes de
// email bloqueia imagens externas por omissão, e sem isso o cabeçalho ficaria
// vazio até a pessoa autorizar o carregamento.
const LOGO_URL = process.env.EMAIL_LOGO_URL || `${APP_URL}/logo-icon-branco.png`;

const base = (titulo, corpoHtml, cta) => `
<div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: ${DARK};">
  <div style="background: ${ORANGE}; padding: 24px 32px; border-radius: 14px 14px 0 0;">
    <img src="${LOGO_URL}" alt="" width="28" height="28" style="vertical-align: middle; margin-right: 10px; border: 0;" />
    <span style="color: #fff; font-weight: 800; font-size: 18px; letter-spacing: .3px; vertical-align: middle;">MUKANDA PREPA</span>
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

const boasVindasEstudante = ({ nome }) => ({
    subject: "Bem-vindo(a) à MUKANDA PREPA 🎓",
    html: base(`Bem-vindo(a), ${nome} 👋`, `
    <p>A tua conta de estudante na Plataforma de Maratonas MUKANDA PREPA está criada. Já podes entrar e começar a preparar-te.</p>
    <p>O que te espera:</p>
    <ul style="padding-left:18px;margin:8px 0;">
      <li>Maratonas cronometradas, por área e por universidade</li>
      <li>Correcção pelos professores e resultados no teu dashboard</li>
      <li>Chat de dúvidas com o professor de cada maratona</li>
    </ul>
    <p>Entraste no plano <b>Basic</b>, que é gratuito. Podes mudar de plano a qualquer momento a partir da app.</p>`,
        { url: APP_URL, label: "Entrar na plataforma" }),
});

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

const recuperarSenha = ({ nome, url }) => ({
    subject: "Recuperar a tua senha — MUKANDA PREPA",
    // O link vai também em texto simples (não só no botão): o modo simulado
    // desta app mostra o email como texto puro no terminal (sem HTML), por
    // isso o link tem de estar visível fora do botão para ser utilizável
    // em teste local sem SMTP configurado.
    html: base(`Olá, ${nome}`, `
    <p>Pediste para recuperar o acesso à tua conta na MUKANDA PREPA. Clica no botão abaixo (ou usa o link) para definires uma nova senha — válido por 1 hora.</p>
    <p style="word-break:break-all;font-family:monospace;font-size:13px;background:#F7F7F9;border-radius:10px;padding:14px 18px;">${url}</p>
    <p>Se não foste tu a pedir, ignora este email; a tua senha actual continua válida.</p>`,
        { url, label: "Definir nova senha" }),
});

module.exports = {
    boasVindasEstudante, boasVindasProfessor, senhaRedefinida, planoAlteradoPeloAdmin,
    submissaoRecebida, resultadoValidado, pedidoDeUpgrade, planoConfirmado,
    recuperarSenha,
};
