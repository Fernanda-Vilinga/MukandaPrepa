// Termos e Condições — TEXTOS PROVISÓRIOS.
// TODO: substituir pelo texto jurídico definitivo validado pela liderança.
import { Link } from 'react-router-dom';
import { Brand } from '../components/Ui.jsx';

const SECTIONS = [
  ['1. Objecto', 'Os presentes termos regulam o acesso e a utilização da plataforma de maratonas educativas da MUKANDA PREPA, disponível em app.mukandaprepa.ao. Ao criar conta, o utilizador declara ter lido, compreendido e aceite estas condições. [Texto provisório — a validar pela liderança.]'],
  ['2. Conta de estudante', 'O auto-registo é exclusivo para estudantes e gratuito no plano Basic. O utilizador é responsável pela veracidade dos dados fornecidos e pela confidencialidade das suas credenciais. Contas de professor são criadas exclusivamente pela administração da MUKANDA PREPA. [Texto provisório.]'],
  ['3. Planos e pagamentos', 'A plataforma disponibiliza os planos Basic (gratuito), Plus e Premium, que diferem no número de tentativas por maratona e em funcionalidades adicionais. Os preços, condições de pagamento e política de reembolso serão comunicados na página de planos antes de qualquer compra. [Texto provisório.]'],
  ['4. Maratonas e avaliação', 'As maratonas são sessões cronometradas com questões preparadas pelos professores. As respostas são validadas manualmente e o resultado é comunicado por email e no dashboard. A MUKANDA PREPA não garante prazos exactos de validação, embora o objectivo seja até 48 horas. [Texto provisório.]'],
  ['5. Conduta do utilizador', 'É proibida a partilha de passwords de maratonas, a publicação de conteúdo das questões fora da plataforma e qualquer tentativa de fraude ou manipulação de resultados. O incumprimento pode levar à suspensão da conta. [Texto provisório.]'],
  ['6. Dados pessoais', 'Os dados recolhidos (nome, email, contacto) destinam-se exclusivamente à gestão da conta, comunicação de maratonas e resultados. A MUKANDA PREPA não partilha dados com terceiros sem consentimento, salvo obrigação legal. [Texto provisório — alinhar com a política de privacidade definitiva.]'],
  ['7. Propriedade intelectual', 'Todo o conteúdo da plataforma — questões, marca, design e software — é propriedade da MUKANDA PREPA ou dos seus licenciantes e está protegido por lei. [Texto provisório.]'],
  ['8. Alterações', 'A MUKANDA PREPA pode actualizar estes termos, notificando os utilizadores por email ou na plataforma. A utilização continuada após alterações constitui aceitação. [Texto provisório.]'],
  ['9. Contacto', 'Para questões sobre estes termos: suporte@mukandaprepa.ao · Luanda, Angola. [Texto provisório.]'],
];

export default function Terms() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="topbar">
        <Brand />
        <span style={{ flex: 1 }} />
        <Link to="/registo" className="btn sm ghost" style={{ textDecoration: 'none' }}>← Voltar ao registo</Link>
      </header>
      <div className="wrap" style={{ maxWidth: 860 }}>
        <div className="card" style={{ padding: 48 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Termos e Condições</h1>
          <p className="mut sm" style={{ margin: '8px 0 8px' }}>
            MUKANDA PREPA · Plataforma de Maratonas · app.mukandaprepa.ao
          </p>
          <div className="sm" style={{ background: 'var(--amber-l)', borderRadius: 12, padding: '12px 16px', margin: '16px 0 32px' }}>
            ⚠️ Versão provisória para desenvolvimento. Este texto será substituído pela versão jurídica definitiva antes do lançamento.
          </div>
          {SECTIONS.map(([title, body]) => (
            <section key={title} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
              <p className="mut" style={{ fontSize: 14.5 }}>{body}</p>
            </section>
          ))}
          <div className="xs mut" style={{ borderTop: '1px solid var(--brd)', paddingTop: 16 }}>
            Última actualização: Julho de 2026 · Documento provisório
          </div>
        </div>
      </div>
    </div>
  );
}
