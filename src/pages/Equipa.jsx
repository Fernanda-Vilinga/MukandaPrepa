import './Equipa.css';

function iniciais(nome) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

const FUNDADORES = [
  { nome: 'Henrique Catraio', cargo: 'CEO & Fundador' },
  { nome: 'Walter Sampaio', cargo: 'Co-fundador e Gestor de Redes Sociais' },
  { nome: 'Armando Baptista', cargo: 'Co-fundador e Director Administrativo' },
  { nome: 'Tadeu Mandavela', cargo: 'Co-fundador e Director de Marketing e Publicidade' },
];

const EQUIPAS = [
  {
    titulo: 'Equipa de Gestão e Administração',
    membros: [
      { nome: 'Kassia António', cargo: 'Gestora Comercial' },
      { nome: 'Dorivaldo Morais', cargo: 'Gestor Administrativo' },
    ],
  },
  {
    titulo: 'Equipa de Suporte Informático',
    membros: [
      { nome: 'Fernanda Vilinga', cargo: 'Programadora' },
      { nome: 'Waldemar D’Orey', cargo: 'Designer de Maratonas' },
    ],
  },
  {
    titulo: 'Equipa de Marketing e Publicidade',
    membros: [
      { nome: 'Anilde Aristóteles', cargo: 'Criadora de Conteúdos' },
      { nome: 'Leonel Macaia', cargo: 'Designer' },
      { nome: 'Sebastião Paulo', cargo: 'Designer' },
    ],
  },
  {
    titulo: 'Equipa de Professores',
    membros: [
      { cargo: 'Professor de Matemática', vaga: true },
      { cargo: 'Professor de Física', vaga: true },
      { cargo: 'Professora de Química', vaga: true },
      { cargo: 'Professora de Língua Portuguesa', vaga: true },
    ],
  },
];

export default function Equipa() {
  return (
    <>
      <section className="equipa-hero">
        <div className="container">
          <h1>A Nossa Equipa</h1>
          <p>As pessoas por trás da MUKANDA PREPA.</p>
        </div>
      </section>

      <section className="equipa-fundadores">
        <div className="container">
          <h2>Fundadores</h2>
          <div className="equipa-grid equipa-grid--fundadores">
            {FUNDADORES.map((f) => (
              <div className="membro-card" key={f.nome}>
                <div className="membro-card__avatar">{iniciais(f.nome)}</div>
                <h3>{f.nome}</h3>
                <p>{f.cargo}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {EQUIPAS.map((eq) => (
        <section className="equipa-secao" key={eq.titulo}>
          <div className="container">
            <h2>{eq.titulo}</h2>
            <div className="equipa-grid">
              {eq.membros.map((m) => (
                <div
                  className={`membro-card ${m.vaga ? 'membro-card--vaga' : ''}`}
                  key={m.nome || m.cargo}
                >
                  <div className="membro-card__avatar">
                    {m.vaga ? '?' : iniciais(m.nome)}
                  </div>
                  {m.vaga ? (
                    <>
                      <h3 className="membro-card__vaga-label">Vaga em aberto</h3>
                      <p>{m.cargo}</p>
                    </>
                  ) : (
                    <>
                      <h3>{m.nome}</h3>
                      <p>{m.cargo}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
