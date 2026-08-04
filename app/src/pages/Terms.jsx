// Termos e Condições — versão validada pela área jurídica (Ago 2026).
// Alterações a este texto devem passar pela equipa de Gestão e Administração
// (decisão D16) antes de entrar no código.
import { useNavigate } from 'react-router-dom';
import { Brand } from '../components/Ui.jsx';

const SECTIONS = [
  ['1. Objecto', 'Os presentes termos regulam o acesso e a utilização da plataforma de maratonas educativas da MUKANDA PREPA. Ao criar conta, o utilizador declara ter lido, compreendido e aceite estas condições.'],
  ['2. Conta de estudante', 'O auto-registo é exclusivo para estudantes e gratuito. O utilizador é responsável pela veracidade dos dados fornecidos e pela confidencialidade das suas credenciais. Contas de professor são criadas exclusivamente pela administração da MUKANDA PREPA.'],
  ['3. Plano Gratuito', 'Nesta fase, a plataforma disponibiliza um único plano — Gratuito — que inclui as maratonas e as aulas online MUKANDA PREPA 2026, sem qualquer custo. O número de tentativas por maratona é definido pela administração e está visível na conta do estudante; é igual para todos os estudantes. A eventual introdução futura de planos pagos será comunicada na plataforma, com preços e condições, antes de qualquer compra.'],
  ['4. Maratonas e avaliação', 'As maratonas são sessões cronometradas com questões preparadas pelos professores. As respostas são validadas manualmente e o resultado é comunicado por email e no dashboard. A MUKANDA PREPA não garante prazos exactos de validação, embora o objectivo seja até 48 horas.'],
  ['5. Conduta do utilizador', 'É proibida a partilha de passwords de maratonas, a publicação de conteúdo das questões fora da plataforma e qualquer tentativa de fraude ou manipulação de resultados. O incumprimento pode levar à suspensão da conta.'],
  ['6. Dados pessoais', 'Os dados recolhidos (nome, email, contacto e área de conhecimento) destinam-se exclusivamente à gestão da conta, à organização das maratonas e aulas online e à comunicação de resultados. A MUKANDA PREPA não partilha dados com terceiros sem consentimento, salvo obrigação legal.'],
  ['7. Propriedade intelectual', 'Todo o conteúdo da plataforma — questões, marca, design e software — é propriedade da MUKANDA PREPA ou dos seus licenciantes e está protegido por lei.'],
  ['8. Alterações', 'A MUKANDA PREPA pode actualizar estes termos, notificando os utilizadores por email ou na plataforma. A utilização continuada após alterações constitui aceitação.'],
  ['9. Contacto', 'Para questões sobre estes termos: mukandaprepasuporte@gmail.com · Luanda, Angola.'],
];

export default function Terms() {
  const navigate = useNavigate();

  // Os termos abrem num separador NOVO a partir do registo — o formulário
  // preenchido fica no separador de origem. "Voltar" não deve navegar este
  // separador para um registo vazio: deve FECHÁ-LO, revelando o registo
  // original tal como estava.
  //
  // A distinção faz-se pelo ?origem=registo que o link do registo acrescenta:
  // sem ele (alguém abriu /termos directamente), NÃO se tenta fechar — o
  // browser fecha qualquer separador com uma só entrada no histórico, e o
  // aluno ficava sem janela nenhuma. Nesse caso navega-se normalmente.
  const veioDoRegisto = new URLSearchParams(window.location.search).get('origem') === 'registo';
  const voltarAoRegisto = () => {
    if (veioDoRegisto) {
      window.close();
      setTimeout(() => navigate('/registo'), 150);   // rede de segurança
    } else {
      navigate('/registo');
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <header className="topbar">
        <Brand />
        <span style={{ flex: 1 }} />
        <button className="btn sm ghost" onClick={voltarAoRegisto}>← Voltar ao registo</button>
      </header>
      <div className="wrap" style={{ maxWidth: 860 }}>
        <div className="card" style={{ padding: 48 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Termos e Condições</h1>
          <p className="mut sm" style={{ margin: '8px 0 32px' }}>
            MUKANDA PREPA · Plataforma de Maratonas
          </p>
          {SECTIONS.map(([title, body]) => (
            <section key={title} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
              <p className="mut" style={{ fontSize: 14.5 }}>{body}</p>
            </section>
          ))}
          <div className="xs mut" style={{ borderTop: '1px solid var(--brd)', paddingTop: 16 }}>
            Última actualização: Agosto de 2026
          </div>
        </div>
      </div>
    </div>
  );
}
