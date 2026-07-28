import './Equipa.css';
import { FUNDADORES, DIRECTORES, EQUIPAS, DISCIPLINAS } from '../config/equipa.jsx';

function iniciais(nome) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function MembroCard({ membro }) {
  return (
    <div className={`membro-card ${membro.vaga ? 'membro-card--vaga' : ''}`}>
      <div className="membro-card__avatar">
        {membro.vaga ? '?' : iniciais(membro.nome)}
      </div>
      {membro.vaga ? (
        <>
          <h3 className="membro-card__vaga-label">Vaga em aberto</h3>
          <p>{membro.cargo}</p>
        </>
      ) : (
        <>
          <h3>{membro.nome}</h3>
          <p>{membro.cargo}</p>
        </>
      )}
    </div>
  );
}

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
            {FUNDADORES.map((f) => <MembroCard key={f.nome} membro={f} />)}
          </div>
        </div>
      </section>

      <section className="equipa-secao">
        <div className="container">
          <h2>Direcção</h2>
          <div className="equipa-grid equipa-grid--fundadores">
            {DIRECTORES.map((d) => <MembroCard key={d.nome} membro={d} />)}
          </div>
        </div>
      </section>

      {EQUIPAS.map((eq) => (
        <section className="equipa-secao" key={eq.titulo}>
          <div className="container">
            <h2>{eq.titulo}</h2>
            <div className="equipa-grid">
              {eq.membros.map((m) => <MembroCard key={m.nome || m.cargo} membro={m} />)}
            </div>
          </div>
        </section>
      ))}

      {/*
        O corpo docente passa a ser apresentado por disciplina em vez de por
        pessoa: cada disciplina terá vários professores e o número não está
        fechado, portanto listar quatro nomes dava uma ideia errada da escala.
      */}
      <section className="equipa-secao equipa-docentes">
        <div className="container">
          <h2>Corpo Docente</h2>
          <p className="equipa-docentes__nota">
            Professores especializados por disciplina, seleccionados pela
            experiência com os exames de acesso às universidades angolanas.
          </p>
          <div className="equipa-grid equipa-grid--disciplinas">
            {DISCIPLINAS.map((d) => (
              <div className="disciplina-card" key={d.disciplina}>
                <div className="disciplina-card__icone" aria-hidden="true">{d.icone}</div>
                <h3>Professores de {d.disciplina}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
