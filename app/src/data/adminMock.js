// ============================================================
// Dados mock — perfil ADMINISTRADOR (substituir pela API real)
// ============================================================

export const ADMIN_USER = {
  id: 'a1', name: 'Henrique Catraio', email: 'admin@mukandaprepa.ao', role: 'admin',
};

export const ADMIN_KPIS = {
  totalUsers: 247, newThisWeek: 18, professors: 12, newProfsMonth: 2,
  activeMarathons: 6, soonMarathons: 4, pendingValidations: 18, pendingProfessors: 4,
};

export const ACTIVITY_WEEKS = [
  { label: 'Abr', v: 35 }, { label: '', v: 48 }, { label: '', v: 42 },
  { label: 'Mai', v: 60 }, { label: '', v: 55 }, { label: '', v: 72 },
  { label: 'Jun', v: 68 }, { label: '', v: 84 }, { label: '', v: 78 },
  { label: 'Jul', v: 95 }, { label: '', v: 88 }, { label: '', v: 100 },
];

export const SYSTEM_ALERTS = [
  { level: 'red', text: 'Validação em atraso: 5 submissões há mais de 48 h (Prof. Vunge).' },
  { level: 'amber', text: 'Maratona sem questões: "Física — Óptica" publicada para 17 Jul com 9/15 questões.' },
  { level: 'blue', text: 'Pico de registos: 14 novos estudantes nas últimas 24 h.' },
];

export const USERS = [
  { id: 'u1', name: 'Adilson Manuel', email: 'adilson.manuel@gmail.com', initials: 'AM', color: 'var(--orange)', role: 'student', plan: 'plus', active: true, created: 'hoje, 09:12' },
  { id: 'u2', name: 'Luena Kiala', email: 'luena.k@gmail.com', initials: 'LK', color: 'var(--blue)', role: 'student', plan: 'basic', active: true, created: '12 Jul' },
  { id: 'p1', name: 'Nzinga Domingos', email: 'n.domingos@mukandaprepa.ao', initials: 'ND', color: 'var(--blue)', role: 'professor', plan: null, active: true, created: 'Mar 2026' },
  { id: 'u3', name: 'Maria Teixeira', email: 'mteixeira@outlook.com', initials: 'MT', color: '#9333EA', role: 'student', plan: 'premium', active: true, created: '08 Jul' },
  { id: 'u4', name: 'Paulo Cassoma', email: 'p.cassoma@gmail.com', initials: 'PC', color: 'var(--dark)', role: 'student', plan: 'premium', active: false, created: '02 Jul' },
  { id: 'u5', name: 'José Bumba', email: 'jbumba@gmail.com', initials: 'JB', color: 'var(--green)', role: 'student', plan: 'plus', active: true, created: '28 Jun' },
  { id: 'p2', name: 'Ana Quissanga', email: 'a.quissanga@mukandaprepa.ao', initials: 'AQ', color: 'var(--green)', role: 'professor', plan: null, active: true, created: 'Abr 2026' },
  { id: 'a1', name: 'Henrique Catraio', email: 'admin@mukandaprepa.ao', initials: 'HC', color: 'var(--dark)', role: 'admin', plan: null, active: true, created: 'Jan 2026' },
];

export const GLOBAL_STATS = {
  users: 247, marathonsCreated: 42, completionRate: 78, sessions: 1108,
  byPlan: { basic: 153, plus: 67, premium: 27 },
  // 12 meses do ano corrente (Ago–Dez ainda sem dados = 0)
  byMonth: [
    { label: 'Jan', v: 45 }, { label: 'Fev', v: 38 }, { label: 'Mar', v: 62 }, { label: 'Abr', v: 58 },
    { label: 'Mai', v: 80 }, { label: 'Jun', v: 74 }, { label: 'Jul', v: 92 }, { label: 'Ago', v: 0 },
    { label: 'Set', v: 0 }, { label: 'Out', v: 0 }, { label: 'Nov', v: 0 }, { label: 'Dez', v: 0 },
  ],
  byArea: [
    { label: '⚙️ Engenharia', pct: 81, color: 'var(--orange)' },
    { label: '⚖️ Ciências Sociais', pct: 72, color: 'var(--blue)' },
  ],
  topProfessors: [
    { name: 'Nzinga Domingos', marathons: 8, avgValidation: '14 h', ok: true },
    { name: 'Ana Quissanga', marathons: 6, avgValidation: '9 h', ok: true },
    { name: 'Mário Vunge', marathons: 4, avgValidation: '51 h', ok: false },
  ],
};

// Dados completos de uma maratona (visão admin)
export const MARATHON_DATA = {
  m1: {
    title: 'Matemática — Álgebra Linear', professor: 'Prof. Nzinga Domingos', status: 'active',
    window: '12–19 Jul 2026', questions: 15, perSession: 5, duration: 60,
    participants: 23, attempts: 31, avgScore: '3,6/5', avgTime: '42m', worstQ: 'Q7', worstPct: 68,
    completion: { done: 26, pending: 5, abandoned: 3 },
    errorTop: [{ q: 'Q7', pct: 68 }, { q: 'Q12', pct: 55 }, { q: 'Q3', pct: 41 }],
    rows: [
      { name: 'Adilson Manuel', initials: 'AM', color: 'var(--orange)', plan: 'plus', attempt: '2ª de 5', score: '4/5 · 80%', time: '44:03', state: 'validated' },
      { name: 'Luena Kiala', initials: 'LK', color: 'var(--blue)', plan: 'basic', attempt: '1ª de 2', score: '3/5 · 60%', time: '51:22', state: 'validated' },
      { name: 'Maria Teixeira', initials: 'MT', color: '#9333EA', plan: 'premium', attempt: '4ª de ∞', score: '5/5 · 100%', time: '38:15', state: 'validated' },
      { name: 'José Bumba', initials: 'JB', color: 'var(--green)', plan: 'plus', attempt: '1ª de 5', score: '—', time: '46:40', state: 'pending' },
      { name: 'Paulo Cassoma', initials: 'PC', color: 'var(--dark)', plan: 'premium', attempt: '1ª de ∞', score: '—', time: '12:08', state: 'abandoned' },
    ],
  },
};

// Chat Suporte (admins) — inclui pedidos de compra de planos
