// ============================================================
// Dados mock — perfil PROFESSOR (substituir pela API real)
// ============================================================

export const PROF_USER = {
  id: 'p1',
  name: 'Nzinga Domingos',
  email: 'n.domingos@mukandaprepa.ao',
  role: 'professor',
  disciplines: ['Matemática', 'Física'],
};

// Maratonas do professor (inclui rascunho)
export const PROF_MARATHONS = [
  {
    id: 'm1', title: 'Matemática — Álgebra Linear', icon: '📐', status: 'active',
    durationMinutes: 60, questionsPerSession: 5, accessEnd: '19 Jul', participants: 23, connectedNow: 8,
  },
  {
    id: 'm2', title: 'Química — Orgânica II', icon: '🧪', status: 'active',
    durationMinutes: 45, questionsPerSession: 4, accessEnd: '16 Jul', participants: 17, connectedNow: 0,
  },
  {
    id: 'm5', title: 'Matemática — Funções', icon: '📈', status: 'draft',
    durationMinutes: 60, questionsPerSession: 5, accessEnd: null, participants: 0, connectedNow: 0,
    questionsUploaded: 12,
  },
];

// Fila de validação
export const SUBMISSIONS = [
  {
    id: 'sub1', student: 'Adilson Manuel', initials: 'AM', color: 'var(--orange)',
    marathonId: 'm1', marathon: 'Matemática — Álgebra Linear', attempt: 2, plan: 'Plus',
    submittedAgo: 'há 2 h', types: { mcq: 3, text: 1, photo: 1 }, status: 'pending',
    answers: [
      { n: 1, type: 'mcq', options: ['x = 2 e y = −1', 'x = 3 e y = 4', 'x = −3 e y = 2', 'O sistema é impossível'], selected: 1, correctIndex: 1, autoCorrect: true },
      { n: 2, type: 'mcq', options: ['det(A) = 7', 'det(A) = −7', 'det(A) = 0', 'A matriz não é quadrada'], selected: 0, correctIndex: 0, autoCorrect: true },
      { n: 3, type: 'text', textAnswer: 'A matriz é invertível porque o seu determinante é diferente de zero. Calculando det(A) = 2(4−1) − 1(2−3) = 6 + 1 = 7, logo det(A) = 7 ≠ 0…', chars: 142 },
      { n: 4, type: 'mcq', options: ['λ = 2', 'λ = 3', 'λ = −1', 'λ = 0'], selected: null, correctIndex: 0, autoCorrect: true },
      { n: 5, type: 'photo', photoName: 'resolucao_q5.jpg' },
    ],
  },
  { id: 'sub2', student: 'Luena Kiala', initials: 'LK', color: 'var(--blue)', marathonId: 'm1', marathon: 'Matemática — Álgebra Linear', attempt: 1, plan: 'Basic', submittedAgo: 'há 4 h', types: { mcq: 2, text: 2, photo: 1 }, status: 'pending', answers: [] },
  { id: 'sub3', student: 'Maria Teixeira', initials: 'MT', color: '#9333EA', marathonId: 'm1', marathon: 'Matemática — Álgebra Linear', attempt: 1, plan: 'Premium', submittedAgo: 'há 5 h', types: { mcq: 3, text: 2, photo: 0 }, status: 'pending', answers: [] },
  { id: 'sub4', student: 'José Bumba', initials: 'JB', color: 'var(--green)', marathonId: 'm2', marathon: 'Química — Orgânica II', attempt: 1, plan: 'Plus', submittedAgo: 'há 6 h', types: { mcq: 2, text: 1, photo: 2 }, status: 'pending', answers: [] },
  { id: 'sub5', student: 'Paulo Cassoma', initials: 'PC', color: 'var(--dark)', marathonId: 'm2', marathon: 'Química — Orgânica II', attempt: 3, plan: 'Premium', submittedAgo: 'ontem, 21:14', types: { mcq: 3, text: 1, photo: 1 }, status: 'pending', answers: [] },
];

// Sessões ao vivo (monitorização)
export const LIVE_SESSIONS = [
  { student: 'Adilson Manuel', initials: 'AM', color: 'var(--orange)', question: 'Q3 de 5 · MCQ', progress: 60, time: '21:42', state: 'A resolver' },
  { student: 'Luena Kiala', initials: 'LK', color: 'var(--blue)', question: 'Q5 de 5 · Foto', progress: 90, time: '38:15', state: 'A resolver' },
  { student: 'José Bumba', initials: 'JB', color: 'var(--green)', question: 'Revisão final', progress: 100, time: '44:03', state: 'A rever' },
  { student: 'Maria Teixeira', initials: 'MT', color: '#9333EA', question: 'Q2 de 5 · Texto', progress: 40, time: '12:56', state: 'A resolver' },
  { student: 'Paulo Cassoma', initials: 'PC', color: 'var(--dark)', question: 'Q1 de 5 · MCQ', progress: 20, time: '04:11', state: 'A resolver' },
];

// Estatísticas por maratona
export const MARATHON_STATS = {
  m1: {
    participants: 23, completionRate: 64, avgTime: '42m', avgScore: 71,
    errorByQuestion: [
      { q: 'Q7', pct: 68 }, { q: 'Q12', pct: 55 }, { q: 'Q3', pct: 41 },
      { q: 'Q9', pct: 34 }, { q: 'Q1', pct: 22 }, { q: 'Q5', pct: 18 }, { q: 'Q14', pct: 12 },
    ],
    worst: { q: 'Q7', type: 'MCQ', pct: 68, note: '14 de 21 alunos escolheram a opção C. Considera rever valores próprios na próxima aula.' },
    gradeDist: [
      { label: '5/5', pct: 17 }, { label: '4/5', pct: 35 }, { label: '3/5', pct: 26 },
      { label: '2/5', pct: 13 }, { label: '0-1', pct: 9 },
    ],
  },
};

// Chats do professor
export const AREAS_PROF = ['Engenharia e Tecnologia', 'Ciências Sociais'];
