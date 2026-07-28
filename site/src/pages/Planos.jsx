import { useState } from 'react';
import './Planos.css';
import { appRegisto, propsLink } from '../config/appLinks';
import { whatsappCom } from '../config/contactos';

const PLANOS = [
  { key: 'basic', nome: 'Basic', preco: 'Grátis', destaque: false },
  { key: 'plus', nome: 'Plus', preco: '10.000 Kzs', destaque: true },
  { key: 'premium', nome: 'Premium', preco: '20.000 Kzs', destaque: false },
];

const FEATURES = [
  // As tentativas por maratona são o critério que mais distingue os planos —
  // ficam em primeiro lugar. Devem coincidir com os limites configurados no
  // painel de administração da app (Gestão de planos).
  { nome: 'Tentativas por maratona', basic: '2', plus: '5', premium: 'Ilimitadas' },
  { nome: 'Maratonas abertas', basic: true, plus: true, premium: true },
  { nome: 'Biblioteca de exames passados', basic: true, plus: true, premium: true },
  { nome: 'Comunidade de estudantes', basic: true, plus: true, premium: true },
  { nome: 'Conteúdos de orientação', basic: true, plus: true, premium: true },
  { nome: 'Maratonas temáticas por área', basic: false, plus: true, premium: true },
  { nome: 'Aulas online', basic: false, plus: '2/semana', premium: '4/semana' },
  { nome: 'Aulas gravadas', basic: false, plus: false, premium: true },
  { nome: 'Acompanhamento por tutor', basic: false, plus: false, premium: true },
  { nome: 'Maratonas por universidade', basic: false, plus: false, premium: true },
  { nome: 'Plano de estudo individualizado', basic: false, plus: false, premium: true },
];

// Conteúdo provisório — o Briefing pede "FAQ com 5 perguntas" mas não incluía o
// texto das perguntas. Substituir por conteúdo aprovado pela equipa.
const FAQS = [
  {
    pergunta: 'Posso mudar de plano depois de me inscrever?',
    resposta:
      'Sim. Podes fazer upgrade do teu plano a qualquer momento a partir do teu dashboard.',
  },
  {
    pergunta: 'O pagamento é mesmo único, sem mensalidades?',
    resposta:
      'Sim, os planos Plus e Premium são pagos uma única vez, sem cobranças recorrentes.',
  },
  {
    pergunta: 'Como funcionam as aulas ao vivo?',
    resposta:
      'Nos planos Plus e Premium tens aulas ao vivo semanais com professores especializados, com gravação disponível no Premium.',
  },
  {
    pergunta: 'Preciso de cartão para o plano Basic?',
    resposta: 'Não. O plano Basic é gratuito e não pede qualquer dado de pagamento.',
  },
  {
    pergunta: 'Não sei qual plano escolher, o que faço?',
    resposta:
      'Fala connosco pelo WhatsApp e ajudamos-te a escolher o plano certo para o teu percurso.',
  },
];

function FeatureValue({ value }) {
  if (value === true) {
    return <span className="feature-check" aria-label="Incluído">✓</span>;
  }
  if (value === false) {
    return <span className="feature-cross" aria-label="Não incluído">✕</span>;
  }
  return <span className="feature-text">{value}</span>;
}

export default function Planos() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <>
      <section className="planos-hero">
        <div className="container">
          <h1>Escolhe o teu plano</h1>
          <p>Pagamento único, sem mensalidades. Cancela quando quiseres continuar sozinho.</p>
        </div>
      </section>

      <section className="planos-cards">
        <div className="container planos-cards__grid">
          {PLANOS.map((plano) => (
            <div
              className={`plano-card-full ${plano.destaque ? 'plano-card-full--destaque' : ''}`}
              key={plano.key}
            >
              {plano.destaque && <span className="plano-card-full__badge">Popular</span>}
              <h3>{plano.nome}</h3>
              <p className="plano-card-full__preco">{plano.preco}</p>
              <p className="plano-card-full__pagamento">Pagamento único</p>

              <ul className="plano-card-full__features">
                {FEATURES.map((f) => (
                  <li key={f.nome}>
                    <FeatureValue value={f[plano.key]} />
                    <span>{f.nome}</span>
                  </li>
                ))}
              </ul>

              <a
                href={appRegisto(plano.nome)}
                {...propsLink(appRegisto(plano.nome))}
                className={`btn ${plano.destaque ? 'btn-primary' : 'btn-outline'} plano-card-full__cta`}
              >
                Escolher {plano.nome}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="planos-tabela">
        <div className="container">
          <h2>Compara os planos</h2>
          <div className="planos-tabela__scroll">
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Basic</th>
                  <th>Plus</th>
                  <th>Premium</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f) => (
                  <tr key={f.nome}>
                    <td>{f.nome}</td>
                    <td><FeatureValue value={f.basic} /></td>
                    <td><FeatureValue value={f.plus} /></td>
                    <td><FeatureValue value={f.premium} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="planos-faq">
        <div className="container">
          <h2>Perguntas frequentes</h2>
          <div className="planos-faq__list">
            {FAQS.map((faq, index) => (
              <div className="faq-item" key={faq.pergunta}>
                <button
                  className="faq-item__question"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  aria-expanded={openFaq === index}
                >
                  {faq.pergunta}
                  <span className="faq-item__icon">{openFaq === index ? '−' : '+'}</span>
                </button>
                {openFaq === index && <p className="faq-item__answer">{faq.resposta}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="planos-cta-final">
        <div className="container planos-cta-final__inner">
          <h2>Ainda tens dúvidas?</h2>
          <a
            href={whatsappCom('Olá! Tenho dúvidas sobre os planos da MUKANDA PREPA.')}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            Falar no WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
