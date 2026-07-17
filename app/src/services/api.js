// ============================================================
// Camada de API — MOCK
// Cada função imita um endpoint da Especificação Técnica v1.0.
// Para ligar ao backend real: substituir o corpo de cada função
// por fetch(`${API_BASE}/...`) mantendo as mesmas assinaturas.
// ============================================================
import {
  MARATHONS, QUESTIONS, RESULTS, CURRENT_USER,
  PLAN_ATTEMPTS, CHAT_THREADS,
} from '../data/mock.js';

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
// export const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://app.mukandaprepa.ao/api';

// --- Auth ------------------------------------------------------
// POST /api/auth/login
export async function login(email, _password) {
  await delay();
  if (!email.includes('@')) throw new Error('Email inválido.');
  // MOCK: emails que começam por "prof" entram como professor
  // (no real, o backend devolve o role no token JWT)
  const e = email.toLowerCase();
  const user = e.startsWith('admin')
    ? { id: 'a1', name: 'Henrique Catraio', email, role: 'admin' }
    : e.startsWith('prof')
      ? { id: 'p1', name: 'Nzinga Domingos', email, role: 'professor' }
      : { ...CURRENT_USER, email };
  localStorage.setItem('mkp_user', JSON.stringify(user));
  return user;
}

// POST /api/auth/register  (cria APENAS perfil de estudante — regra da spec)
export async function register(data) {
  await delay(400);
  // Regra de produto: toda a conta nova é criada no plano Basic (grátis).
  // O upgrade é feito depois, já dentro da app.
  const user = { ...CURRENT_USER, name: data.name, email: data.email, phone: data.phone, area: data.area, plan: 'basic', role: 'student' };
  localStorage.setItem('mkp_user', JSON.stringify(user));
  return user;
}

export function currentUser() {
  const raw = localStorage.getItem('mkp_user');
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  localStorage.removeItem('mkp_user');
}

// PUT /api/students/me — actualizar dados do perfil
// (a senha, no backend real, é alterada num endpoint próprio com
//  verificação da senha actual; aqui é mock)
export async function updateProfile(data) {
  await delay(350);
  const user = { ...currentUser(), ...data };
  localStorage.setItem('mkp_user', JSON.stringify(user));
  return user;
}

// --- Maratonas -------------------------------------------------
// GET /api/marathons
export async function getMarathons() {
  await delay();
  return MARATHONS;
}

// GET /api/marathons/:id
export async function getMarathon(id) {
  await delay();
  const m = MARATHONS.find((x) => x.id === id);
  if (!m) throw new Error('Maratona não encontrada.');
  return m;
}

// POST /api/marathons/:id/enter  { password }
export async function enterMarathon(id, password) {
  await delay(400);
  const m = await getMarathon(id);
  if (m.status !== 'active') throw new Error('A maratona não está activa.');
  if (password.toUpperCase() !== m.password) throw new Error('Password incorrecta. Confirma com o professor.');
  const max = PLAN_ATTEMPTS[currentUser()?.plan ?? 'basic'];
  if (m.attemptsUsed >= max) throw new Error('Atingiste o limite de tentativas do teu plano.');
  return { ok: true };
}

// POST /api/marathons/:id/sessions  → sorteia N questões do banco de 15
export async function startSession(id) {
  await delay(300);
  const m = await getMarathon(id);
  const bank = QUESTIONS[id] ?? QUESTIONS.m1;
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, m.questionsPerSession);
  const session = {
    id: `s_${Date.now()}`,
    marathonId: id,
    startedAt: Date.now(),
    durationSeconds: m.durationMinutes * 60,
    questions: picked,
  };
  localStorage.setItem('mkp_session', JSON.stringify(session));
  return session;
}

export function activeSession() {
  const raw = localStorage.getItem('mkp_session');
  return raw ? JSON.parse(raw) : null;
}

// PATCH /api/sessions/:id/answers — auto-save (a spec pede guardar automaticamente)
export function saveAnswers(answers) {
  localStorage.setItem('mkp_answers', JSON.stringify(answers));
}

export function savedAnswers() {
  const raw = localStorage.getItem('mkp_answers');
  return raw ? JSON.parse(raw) : {};
}

// POST /api/sessions/:id/submit — bloqueia respostas e notifica o professor por email
export async function submitSession() {
  await delay(500);
  localStorage.removeItem('mkp_session');
  localStorage.removeItem('mkp_answers');
  return { ok: true, submittedAt: new Date().toISOString() };
}

// --- Resultados ------------------------------------------------
// GET /api/students/me/results
export async function getResults() {
  await delay();
  return RESULTS;
}

// GET /api/results/:id
export async function getResult(id) {
  await delay();
  const r = RESULTS.find((x) => x.id === id);
  if (!r) throw new Error('Resultado não encontrado.');
  return r;
}

// --- Planos / upgrade -------------------------------------------
// POST /api/plans/upgrade-request  { plan }
// FLUXO DE COMPRA (regra de produto — importante para o backend):
// 1. Toda a compra de plano passa pelo CHAT SUPORTE (administradores).
// 2. Este endpoint cria a mensagem automática no chat e envia email de
//    notificação para a conta Gmail suporte da MUKANDA (os admins dão
//    seguimento à conversa). WhatsApp = contacto directo com os gestores
//    comerciais para esclarecimentos.
// 3. O estudante envia o comprovativo de pagamento pelo mesmo chat.
// 4. Confirmado o pagamento, o ADMIN actualiza o plano do estudante,
//    convida-o a actualizar a página, e o sistema envia email de
//    confirmação ao estudante.
export async function requestPlanUpgrade(planId) {
  await delay(300);
  return { ok: true, planId };
}

// --- Chat ------------------------------------------------------
// GET /api/chats/:channel  (real: WebSocket via Socket.io)
export async function getChat(channel) {
  await delay(150);
  return CHAT_THREADS[channel] ?? [];
}
