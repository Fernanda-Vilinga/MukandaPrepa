import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Registo.css';
import { registrarUsuario } from "../services/authService";


const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLANOS = ['Basic', 'Plus', 'Premium'];


export default function Registo() {

  const [searchParams] = useSearchParams();

  const planoFromUrl = searchParams.get('plano');

  const planoInicial = PLANOS.includes(planoFromUrl) 
    ? planoFromUrl 
    : '';



  const [form, setForm] = useState({
    nome: '',
    identifier: '',
    plano: planoInicial,
    password: '',
    confirmPassword: '',
  });


  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  const [loading, setLoading] = useState(false);



  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

  };



  const validate = () => {

    if (!form.nome.trim()) {
      return 'Preenche o teu nome.';
    }

    if (!form.identifier.trim()) {
      return 'Preenche o teu email ou telefone.';
    }

    if (
      form.identifier.includes('@') &&
      !EMAIL_REGEX.test(form.identifier)
    ) {
      return 'Introduz um email válido.';
    }

    if (!form.plano) {
      return 'Escolhe o teu tipo de plano.';
    }

    if (!form.password) {
      return 'Preenche uma senha.';
    }

    if (form.password.length < 8) {
      return 'A senha deve ter no mínimo 8 caracteres.';
    }

    if (form.password !== form.confirmPassword) {
      return 'As senhas não coincidem.';
    }

    return '';

  };



  const handleSubmit = async (e) => {

    e.preventDefault();


    const validationError = validate();


    setError(validationError);

    setSuccess('');



    if (validationError) return;



    try {

      setLoading(true);



      const resposta = await registrarUsuario({

        nome: form.nome,

        email: form.identifier,

        senha: form.password,

        plano: form.plano

      });



      console.log(
        "Conta criada:",
        resposta
      );



      setSuccess(
        "Conta criada com sucesso! Já podes iniciar sessão."
      );



      setForm({

        nome: '',
        identifier: '',
        plano: '',
        password: '',
        confirmPassword: '',

      });



    } catch(error) {


      console.log(error);


      setError(
        error.response?.data?.mensagem ||
        "Erro ao criar conta."
      );



    } finally {

      setLoading(false);

    }

  };



  return (
    <section className="registo-page">

      <div className="registo-card">

        <Link to="/">

          <img 
            src="/01.png" 
            alt="MUKANDA PREPA" 
            className="registo-card__logo" 
          />

        </Link>



        <div className="registo-card__header">

          <h1>Cria a tua conta</h1>

          <p>
            É rápido, grátis e começas já a preparar-te.
          </p>

        </div>



        <form 
          className="registo-card__form" 
          onSubmit={handleSubmit} 
          noValidate
        >


          <label>

            Nome

            <input
              type="text"
              name="nome"
              placeholder="O teu nome completo"
              value={form.nome}
              onChange={handleChange}
            />

          </label>



          <label>

            Email ou Telefone

            <input
              type="text"
              name="identifier"
              placeholder="teu@email.com"
              value={form.identifier}
              onChange={handleChange}
            />

          </label>



          <label>

            Tipo de Plano

            <select 
              name="plano" 
              value={form.plano} 
              onChange={handleChange}
            >

              <option value="">
                Escolhe um plano
              </option>


              {PLANOS.map((plano) => (

                <option key={plano} value={plano}>

                  {plano}

                </option>

              ))}

            </select>

          </label>



          <label>

            Senha

            <input
              type="password"
              name="password"
              placeholder="Cria uma senha"
              value={form.password}
              onChange={handleChange}
            />

          </label>



          <label>

            Confirmar Senha

            <input
              type="password"
              name="confirmPassword"
              placeholder="Repete a senha"
              value={form.confirmPassword}
              onChange={handleChange}
            />

          </label>




          {error && (
            <p className="registo-card__error">
              {error}
            </p>
          )}



          {success && (
            <p className="registo-card__success">
              {success}
            </p>
          )}




          <button 
            type="submit" 
            className="btn btn-primary registo-card__submit" 
            disabled={loading}
          >

            {loading 
              ? 'A criar conta...' 
              : 'Criar Conta'
            }

          </button>


        </form>



        <div className="registo-card__links">

          <span>
            Já tens conta?
          </span>

          <Link to="/login">
            Entrar
          </Link>

        </div>


      </div>

    </section>
  );
}