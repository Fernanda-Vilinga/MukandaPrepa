import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.css';
import { loginUsuario } from "../services/authService";


const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export default function Login() {


  const [form, setForm] = useState({
    identifier: '',
    password: ''
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


    if (!form.identifier.trim()) {

      return 'Preenche o teu email ou telefone.';

    }


    if (
      form.identifier.includes('@') &&
      !EMAIL_REGEX.test(form.identifier)
    ) {

      return 'Introduz um email válido.';

    }


    if (!form.password) {

      return 'Preenche a tua senha.';

    }


    if (form.password.length < 8) {

      return 'A senha deve ter no mínimo 8 caracteres.';

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



      const resposta = await loginUsuario({

        email: form.identifier,
        senha: form.password

      });



      console.log(
        "Login sucesso:",
        resposta
      );



      localStorage.setItem(
        "token",
        resposta.token
      );



      localStorage.setItem(
        "usuario",
        JSON.stringify(resposta.usuario)
      );



      setSuccess(
        "Login realizado com sucesso! Bem-vindo ao MukandaPrepa."
      );
setForm({
  identifier:"",
  password:""
});

    } catch(error) {


      console.log(error);



      setError(
        error.response?.data?.mensagem ||
        "Erro ao iniciar sessão."
      );



    } finally {


      setLoading(false);


    }


  };



  return (
    <section className="login-page">

      <div className="login-card">

        <Link to="/">
          <img 
            src="/01.png" 
            alt="MUKANDA PREPA" 
            className="login-card__logo" 
          />
        </Link>


        <div className="login-card__header">

          <h1>Bem-vindo de volta</h1>

          <p>
            Entra na tua conta para continuares a tua preparação.
          </p>

        </div>



        <form 
          className="login-card__form" 
          onSubmit={handleSubmit}
          noValidate
        >


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

            Senha

            <input
              type="password"
              name="password"
              placeholder="A tua senha"
              value={form.password}
              onChange={handleChange}
            />

          </label>



          {error && (
            <p className="login-card__error">
              {error}
            </p>
          )}



          {success && (
            <p className="login-card__success">
              {success}
            </p>
          )}



          <button
            type="submit"
            className="btn btn-primary login-card__submit"
            disabled={loading}
          >

            {loading ? "A entrar..." : "Entrar"}

          </button>



        </form>



        <div className="login-card__links">

          <a href="#">
            Esqueci a senha
          </a>


          <Link to="/registo">
            Regista-te
          </Link>


        </div>


      </div>

    </section>
  );

}