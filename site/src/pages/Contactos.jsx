import { useState } from 'react';
import './Contactos.css';
import { CONTACTO } from '../config/contactos';
import { API_BASE } from '../config/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contactos() {
  const [form, setForm] = useState({ nome: '', email: '', assunto: '', mensagem: '' });
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!form.nome.trim()) return 'Preenche o teu nome.';
    if (!form.email.trim() || !EMAIL_REGEX.test(form.email)) return 'Introduz um email válido.';
    if (!form.mensagem.trim()) return 'Escreve a tua mensagem.';
    return '';
  };

  // Entrega a mensagem ao backend (POST /contacto), que a envia por email
  // para a caixa de suporte. Só se mostra "enviada" com resposta positiva —
  // a versão anterior confirmava sucesso sem enviar nada.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    setError(validationError);
    if (validationError) return;

    setAEnviar(true);
    try {
      const resposta = await fetch(`${API_BASE}/contacto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        setError(dados.mensagem || 'Não foi possível enviar a mensagem. Tenta de novo.');
        return;
      }
      setEnviado(true);
    } catch {
      setError('Sem ligação. Verifica a internet e tenta de novo.');
    } finally {
      setAEnviar(false);
    }
  };

  return (
    <>
      <section className="contactos-hero">
        <div className="container">
          <h1>Contacta-nos</h1>
          <p>Tens dúvidas sobre os planos, as maratonas ou as aulas? Fala connosco.</p>
        </div>
      </section>

      <section className="contactos-conteudo">
        <div className="container contactos-conteudo__grid">
          <div className="contactos-form-card">
            {enviado ? (
              <div className="contactos-form-card__sucesso">
                <h2>Mensagem enviada</h2>
                <p>Obrigado pelo contacto. Vamos responder-te em breve.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <label>
                  Nome
                  <input
                    type="text"
                    name="nome"
                    placeholder="O teu nome"
                    value={form.nome}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    placeholder="teu@email.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Assunto
                  <input
                    type="text"
                    name="assunto"
                    placeholder="Sobre o que é a tua mensagem?"
                    value={form.assunto}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Mensagem
                  <textarea
                    name="mensagem"
                    placeholder="Escreve aqui a tua mensagem"
                    rows={5}
                    value={form.mensagem}
                    onChange={handleChange}
                  />
                </label>

                {error && <p className="contactos-form-card__error">{error}</p>}

                <button
                  type="submit"
                  className="btn btn-primary contactos-form-card__submit"
                  disabled={aEnviar}
                >
                  {aEnviar ? 'A enviar…' : 'Enviar mensagem'}
                </button>
              </form>
            )}
          </div>

          <div className="contactos-info">
            <div className="contactos-info__card">
              <h3>Morada</h3>
              <p>Luanda, Angola</p>
            </div>
            <div className="contactos-info__card">
              <h3>Email</h3>
              <a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a>
            </div>
            <div className="contactos-info__card">
              <h3>Telefone</h3>
              <a href={CONTACTO.telefoneLink}>{CONTACTO.telefoneLegivel}</a>
            </div>
            <div className="contactos-info__card">
              <h3>WhatsApp</h3>
              <a href={CONTACTO.whatsappLink} target="_blank" rel="noreferrer">
                {CONTACTO.telefoneLegivel}
              </a>
            </div>

            <div className="contactos-mapa">
              <iframe
                title="Localização MUKANDA PREPA"
                src="https://www.google.com/maps?q=Luanda,Angola&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
