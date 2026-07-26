// Contactos oficiais do MUKANDA PREPA, num sítio só.
//
// Estavam espalhados por Footer, Contactos e Planos — e com dois números
// diferentes, o que obrigava a caçar ocorrências sempre que mudavam. Alterar
// aqui muda em todo o site.

// Formato internacional, só dígitos (usado em links wa.me e tel:)
const TELEFONE_DIGITOS = '244945370874';

export const CONTACTO = {
  // Como aparece escrito ao visitante
  telefoneLegivel: '+244 945 370 874',
  // Para o atributo href="tel:"
  telefoneLink: `tel:+${TELEFONE_DIGITOS}`,
  // Conversa de WhatsApp
  whatsappLink: `https://wa.me/${TELEFONE_DIGITOS}`,
  email: 'geral@mukandaprepa.ao',
};

// WhatsApp com mensagem já preenchida — para os botões de "falar connosco".
export const whatsappCom = (mensagem) =>
  mensagem
    ? `${CONTACTO.whatsappLink}?text=${encodeURIComponent(mensagem)}`
    : CONTACTO.whatsappLink;
