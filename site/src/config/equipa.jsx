// Equipa MUKANDA PREPA — fonte única.
//
// A página Sobre mostra apenas os fundadores; a página A Nossa Equipa mostra
// tudo. Ter os dados aqui evita que as duas páginas digam coisas diferentes
// sobre as mesmas pessoas, que foi o que aconteceu com as datas da maratona.

export const FUNDADORES = [
  { nome: 'Henrique Catraio', cargo: 'CEO & Fundador' },
  { nome: 'Walter Sampaio', cargo: 'Co-fundador e Gestor de Redes Sociais' },
];

// Directores — sem menção a co-fundador, por decisão da direcção (27 Jul 2026).
export const DIRECTORES = [
  { nome: 'Armando Baptista', cargo: 'Director Administrativo' },
  { nome: 'Tadeu Mandavela', cargo: 'Director de Marketing e Publicidade' },
];

export const EQUIPAS = [
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
];

// Corpo docente por disciplina, em vez de lugares individuais: cada disciplina
// terá vários professores, e o número não está fechado.
// Os ícones seguem o traço dos pilares da página inicial (24x24, contorno laranja).
export const DISCIPLINAS = [
  {
    disciplina: 'Matemática',
    // Esquadro e régua
    icone: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 20 20 4M4 20h16" stroke="#FB6D1D" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 20v-3M13 20v-3M17 20v-3" stroke="#FB6D1D" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    disciplina: 'Língua Portuguesa',
    // Livro aberto
    icone: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 6.5S10 5 6.5 5H3v13h3.5C10 18 12 19.5 12 19.5m0-13S14 5 17.5 5H21v13h-3.5C14 18 12 19.5 12 19.5m0-13v13"
          stroke="#FB6D1D" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    disciplina: 'Física',
    // Átomo
    icone: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="2" fill="#FB6D1D" />
        <ellipse cx="12" cy="12" rx="9.5" ry="4" stroke="#FB6D1D" strokeWidth="1.8" />
        <ellipse cx="12" cy="12" rx="9.5" ry="4" stroke="#FB6D1D" strokeWidth="1.8" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="9.5" ry="4" stroke="#FB6D1D" strokeWidth="1.8" transform="rotate(120 12 12)" />
      </svg>
    ),
  },
  {
    disciplina: 'Química',
    // Balão de erlenmeyer
    icone: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 3h4M11 3v6.2L5.4 18.4A1.5 1.5 0 0 0 6.7 20.7h10.6a1.5 1.5 0 0 0 1.3-2.3L13 9.2V3"
          stroke="#FB6D1D" strokeWidth="2" strokeLinejoin="round" />
        <path d="M8.2 14.5h7.6" stroke="#FB6D1D" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];
