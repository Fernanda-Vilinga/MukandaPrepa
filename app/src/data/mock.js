// ============================================================
// Dados mock — substituir pela API real (ver services/api.js)
// ============================================================

export const CURRENT_USER = {
  id: 'u1',
  name: 'Adilson Manuel',
  email: 'adilson.manuel@gmail.com',
  role: 'student',
  plan: 'plus', // basic | plus | premium
  area: 'Engenharia e Tecnologia',
  phone: '+244 923 000 000',
};

// APENAS PARA APRESENTAÇÃO, e apenas onde não há uma maratona em mão.
//
// Quem aplica o limite é o servidor, que o lê da Gestão de planos. As páginas
// que mostram uma maratona usam o `attemptsMax` que vem com ela — este mapa
// serve só ao Perfil e ao detalhe do resultado, que falam do plano em
// abstracto.
//
// Se estes números forem alterados na Gestão de planos, actualizar aqui
// também — senão o aluno vê um limite e o servidor aplica outro.
// TODO: substituir por uma leitura de /api/plans, eliminando a última cópia.
// PLAN_ATTEMPTS foi removido a 2 de Agosto de 2026. Era a última cópia de um
// número que o administrador pode mudar na Gestão de planos, e ficava a mentir
// ao aluno sempre que isso acontecia. O valor vem agora de /api/plans, através
// do hook useMaxAttempts — não voltar a acrescentar uma tabela aqui.
export const PLAN_LABEL = { basic: 'Basic', plus: 'Plus', premium: 'Premium' };

// Áreas de conhecimento (registo)
export const AREAS = [
  'Engenharia e Tecnologia',
  'Ciências Sociais',
  'Ciências da Saúde',
  'Ciências Económicas e Gestão',
  'Direito',
  'Educação e Humanidades',
  'Outra',
];

export const MARATHONS = [
  {
    id: 'm1',
    title: 'Maratona de Matemática — Álgebra Linear',
    area: 'Engenharia',
    discipline: 'Matemática',
    durationMinutes: 60,
    questionsPerSession: 5,
    accessStart: '2026-07-12T08:00:00Z',
    accessEnd: '2026-07-19T23:59:00Z',
    status: 'active', // active | soon | closed
    professor: 'Prof. Nzinga Domingos',
    description:
      'Sessão cronometrada com 5 questões sorteadas aleatoriamente de um banco de 15, preparadas pelo Prof. Nzinga Domingos. Podes navegar entre questões e rever antes de submeter. As respostas são validadas manualmente.',
    password: 'MAT26X', // no backend real: hash verificado no servidor
    attemptsUsed: 1,
    icon: '📐',
  },
  {
    id: 'm2',
    title: 'Maratona de Química — Orgânica II',
    area: 'Engenharia',
    discipline: 'Química',
    durationMinutes: 45,
    questionsPerSession: 4,
    accessStart: '2026-07-10T08:00:00Z',
    accessEnd: '2026-07-16T20:00:00Z',
    status: 'active',
    professor: 'Prof.ª Ana Quissanga',
    description: 'Reacções de substituição e eliminação. 4 questões aleatórias de um banco de 15.',
    password: 'QUI26A',
    attemptsUsed: 0,
    icon: '🧪',
  },
  {
    id: 'm3',
    title: 'Maratona de Direito Constitucional',
    area: 'Ciências Sociais',
    discipline: 'Direito',
    durationMinutes: 90,
    questionsPerSession: 5,
    accessStart: '2026-07-17T08:00:00Z',
    accessEnd: '2026-07-24T23:59:00Z',
    status: 'soon',
    professor: 'Prof. Mário Vunge',
    description: 'Princípios fundamentais da Constituição angolana.',
    password: 'DIR26C',
    attemptsUsed: 0,
    icon: '⚖️',
  },
  {
    id: 'm4',
    title: 'Maratona de Física — Cinemática',
    area: 'Engenharia',
    discipline: 'Física',
    durationMinutes: 60,
    questionsPerSession: 5,
    accessStart: '2026-06-25T08:00:00Z',
    accessEnd: '2026-07-02T23:59:00Z',
    status: 'closed',
    professor: 'Prof. Nzinga Domingos',
    description: 'Movimento rectilíneo uniforme e uniformemente variado.',
    password: 'FIS26K',
    attemptsUsed: 1,
    icon: '📊',
  },
];

// Banco de questões (por maratona) — imagens: placeholders até serem fornecidas
export const QUESTIONS = {
  m1: Array.from({ length: 15 }, (_, i) => {
    const n = i + 1;
    const type = n % 3 === 0 ? 'text' : n % 5 === 0 ? 'photo' : 'mcq';
    return {
      id: `m1q${n}`,
      slot: n,
      type, // mcq | text | photo
      imageUrl: null, // TODO: URL da imagem da questão (fornecida pelo professor)
      options:
        type === 'mcq'
          ? ['x = 2 e y = −1', 'x = 3 e y = 4', 'x = −3 e y = 2', 'O sistema é impossível']
          : null,
    };
  }),
};

// Resultados já validados (histórico)
export const RESULTS = [
  {
    id: 'r1',
    marathonId: 'm4',
    marathonTitle: 'Física — Cinemática',
    attempt: 1,
    date: '2026-07-02',
    score: 4,
    total: 5,
    percent: 80,
    rank: 3,
    status: 'validated',
    validatedBy: 'Prof. Nzinga Domingos',
    answers: [
      { n: 1, type: 'mcq', answer: 'B — v = 12 m/s', correct: true, feedback: 'Resolução perfeita.' },
      { n: 2, type: 'mcq', answer: 'D — a = 0', correct: true, feedback: 'Correcto.' },
      { n: 3, type: 'text', answer: '«O movimento é uniforme porque…» (128 car.)', correct: true, feedback: 'Boa justificação.' },
      { n: 4, type: 'mcq', answer: 'Não respondida', correct: false, feedback: 'Questão em branco. Revê a matéria.' },
      { n: 5, type: 'photo', answer: 'resolucao_q5.jpg', correct: true, feedback: 'Resolução clara e legível.' },
    ],
  },
  {
    id: 'r2',
    marathonId: 'm1',
    marathonTitle: 'Matemática — Álgebra Linear',
    attempt: 1,
    date: '2026-07-13',
    score: null,
    total: 5,
    percent: null,
    rank: null,
    status: 'pending', // aguarda validação do professor
    validatedBy: null,
    answers: [],
  },
];

