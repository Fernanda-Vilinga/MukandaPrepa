// ============================================================
// Camada de API MOCK — perfil PROFESSOR
// Assinaturas alinhadas com os endpoints da spec; o backender
// substitui os corpos por fetch() reais.
// ============================================================
import {
  PROF_MARATHONS, SUBMISSIONS, LIVE_SESSIONS, MARATHON_STATS, PROF_CHATS,
} from '../data/profMock.js';

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

// GET /api/prof/overview
export async function getProfOverview() {
  await delay();
  return {
    marathons: PROF_MARATHONS,
    pendingValidations: SUBMISSIONS.filter((s) => s.status === 'pending').length,
    connectedNow: PROF_MARATHONS.reduce((n, m) => n + m.connectedNow, 0),
    unreadChats: PROF_CHATS.reduce((n, c) => n + c.unread, 0),
  };
}

// GET /api/prof/submissions?status=pending
export async function getSubmissions() {
  await delay();
  return SUBMISSIONS;
}

// GET /api/prof/submissions/:id
export async function getSubmission(id) {
  await delay();
  const s = SUBMISSIONS.find((x) => x.id === id);
  if (!s) throw new Error('Submissão não encontrada.');
  // As submissões sem respostas detalhadas (mock) usam as do sub1
  return s.answers.length ? s : { ...s, answers: SUBMISSIONS[0].answers };
}

// POST /api/prof/submissions/:id/validate
// { answers: [{ n, correct, feedback }], generalNote }
// → backend: calcula nota, envia email ao aluno, afixa no dashboard
export async function confirmValidation(id, payload) {
  await delay(500);
  const s = SUBMISSIONS.find((x) => x.id === id);
  if (s) s.status = 'validated';
  return { ok: true, id, ...payload };
}

// GET /api/prof/marathons/:id/live  (real: WebSocket / polling)
export async function getLiveSessions() {
  await delay();
  return {
    sessions: LIVE_SESSIONS,
    completed: 15, abandoned: 2, avgTime: '41m',
    pendingValidation: 5, connected: LIVE_SESSIONS.length + 3, participants: 23,
  };
}

// GET /api/prof/marathons/:id/stats
export async function getMarathonStats(id = 'm1') {
  await delay();
  return MARATHON_STATS[id] ?? MARATHON_STATS.m1;
}

// POST /api/prof/marathons  (rascunho ou publicar)
export async function saveMarathon(data, publish = false) {
  await delay(400);
  return { ok: true, id: 'm_novo', status: publish ? 'published' : 'draft', ...data };
}

// PUT /api/prof/marathons/:id/questions/:slot
// { imageFile, type, options, correctIndex }
export async function saveQuestion(slot, data) {
  await delay(200);
  return { ok: true, slot, ...data };
}

// GET /api/prof/chats
export async function getProfChats() {
  await delay(150);
  return PROF_CHATS;
}
