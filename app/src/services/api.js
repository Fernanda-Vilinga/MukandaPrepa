// ============================================================
// Camada de API — AUTENTICAÇÃO REAL + restante MOCK
// login() e register() já consomem o backend real (Briefing v2.1,
// secção 4.0.1). As restantes funções continuam mock e serão
// substituídas módulo a módulo, mantendo as mesmas assinaturas.
// ============================================================
import {
  MARATHONS, QUESTIONS, RESULTS, CURRENT_USER,
  PLAN_ATTEMPTS,
} from '../data/mock.js';

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

// URL base da API — definir VITE_API_BASE no ficheiro .env
// (ex.: VITE_API_BASE=http://localhost:5000/api em dev,
//  ou o URL do deploy: VITE_API_BASE=https://<backend>.vercel.app/api)
export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:5000/api';

// Helper: pedido JSON com tratamento de erros do backend ({ mensagem })
export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = sessionStorage.getItem('mkp_token');
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Sem ligação ao servidor. Verifica a tua internet e tenta de novo.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.mensagem || `Erro do servidor (${res.status}).`);
  return data;
}

// Backend → formato de utilizador usado pela app
const mapUser = (u) => ({
  id: u.id,
  name: u.nome,
  email: u.email,
  phone: u.contacto || '',
  area: u.area || '',
  role: u.role || 'student',
  plan: (u.plano || 'basic').toLowerCase(),
  mustChangePassword: u.trocarSenha === true,
});

// Decisão de produto (19 Jul 2026): sessionStorage em vez de localStorage —
// fechar o browser termina a sessão e obriga a novo login (segurança em
// computadores partilhados). F5/refresh na mesma janela mantém a sessão.

// --- Auth (REAL) -----------------------------------------------
// POST /api/auth/login
export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, senha: password },
  });
  const user = mapUser(data.usuario);
  sessionStorage.setItem('mkp_token', data.token);
  sessionStorage.setItem('mkp_user', JSON.stringify(user));
  return user;
}

// POST /api/auth/register  (cria APENAS perfil de estudante — regra da spec;
// toda a conta nova entra no plano Basic grátis — o upgrade é feito depois)
export async function register(form) {
  const data = await request('/auth/register', {
    method: 'POST',
    auth: false,
    body: {
      nome: form.name,
      email: form.email,
      senha: form.password,
      contacto: form.phone,
      area: form.area,
    },
  });
  const user = mapUser(data.usuario);
  sessionStorage.setItem('mkp_token', data.token);
  sessionStorage.setItem('mkp_user', JSON.stringify(user));
  return user;
}

export function currentUser() {
  const raw = sessionStorage.getItem('mkp_user');
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  sessionStorage.removeItem('mkp_token');
  sessionStorage.removeItem('mkp_user');
}

// POST /api/auth/alterar-senha — troca a senha do próprio utilizador
// (também limpa a flag de senha temporária do professor)
export async function changePassword(currentPassword, newPassword) {
  await request('/auth/alterar-senha', {
    method: 'POST',
    body: { senhaActual: currentPassword, novaSenha: newPassword },
  });
  const u = currentUser();
  if (u) sessionStorage.setItem('mkp_user', JSON.stringify({ ...u, mustChangePassword: false }));
  return { ok: true };
}

// PUT /api/students/me — actualizar dados do perfil
// (a senha, no backend real, é alterada num endpoint próprio com
//  verificação da senha actual; aqui é mock)
export async function updateProfile(data) {
  await delay(350);
  const user = { ...currentUser(), ...data };
  sessionStorage.setItem('mkp_user', JSON.stringify(user));
  return user;
}

// --- Maratonas (REAL) ------------------------------------------
// GET /api/marathons — só publicadas; status e tentativas calculados no servidor
export async function getMarathons() {
  const { marathons } = await request('/marathons');
  return marathons;
}

// GET /api/marathons/:id
export async function getMarathon(id) {
  const { marathon } = await request(`/marathons/${id}`);
  return marathon;
}

// POST /api/marathons/:id/enter  { password }
// Janela, password (hash) e limite de tentativas validados no servidor.
export async function enterMarathon(id, password) {
  return request(`/marathons/${id}/enter`, { method: 'POST', body: { password } });
}

// POST /api/marathons/:id/sessions  → sorteia N questões do banco de 15
// POST /api/marathons/:id/sessions — o SORTEIO das 4–5 questões do banco
// de 15 é feito NO SERVIDOR; a resposta correcta nunca chega ao browser.
export async function startSession(id) {
  const data = await request(`/marathons/${id}/sessions`, { method: 'POST' });
  sessionStorage.setItem('mkp_session', JSON.stringify(data.session));
  sessionStorage.setItem('mkp_answers', JSON.stringify(data.session.answers || {}));
  return data.session;
}

// GET /api/sessions/active — retomar sessão após fechar/reabrir o browser
export async function resumeSession() {
  const { session } = await request('/sessions/active');
  if (session) {
    sessionStorage.setItem('mkp_session', JSON.stringify(session));
    sessionStorage.setItem('mkp_answers', JSON.stringify(session.answers || {}));
  } else {
    sessionStorage.removeItem('mkp_session');
    sessionStorage.removeItem('mkp_answers');
  }
  return session;
}

export function activeSession() {
  const raw = sessionStorage.getItem('mkp_session');
  return raw ? JSON.parse(raw) : null;
}

// PATCH /api/sessions/:id/answers — auto-save local imediato + servidor
export function saveAnswers(answers) {
  sessionStorage.setItem('mkp_answers', JSON.stringify(answers));
  const sess = activeSession();
  if (sess) {
    request(`/sessions/${sess.id}/answers`, { method: 'PATCH', body: { answers } })
      .catch(() => {}); // sem rede: o auto-save local mantém; o servidor recebe no próximo
  }
}

export function savedAnswers() {
  const raw = sessionStorage.getItem('mkp_answers');
  return raw ? JSON.parse(raw) : {};
}

// POST /api/sessions/:id/submit — bloqueia respostas no servidor
// (o timeout também submete automaticamente do lado do servidor)
export async function submitSession() {
  const sess = activeSession();
  const answers = savedAnswers();
  let out = { ok: true };
  if (sess) {
    out = await request(`/sessions/${sess.id}/submit`, { method: 'POST', body: { answers } });
  }
  sessionStorage.removeItem('mkp_session');
  sessionStorage.removeItem('mkp_answers');
  return out;
}

// --- Resultados ------------------------------------------------
// GET /api/students/me/results
// REAL — GET /api/students/me/results
export async function getResults() {
  const { results } = await request('/students/me/results');
  return results;
}

// GET /api/results/:id
// REAL — GET /api/results/:id
export async function getResult(id) {
  const { result } = await request(`/results/${id}`);
  return result;
}

// --- Planos / upgrade -------------------------------------------
// REAL — GET /api/plans (planos activos, promoções activas, dados de
// pagamento configurados pelo admin em admin/Plans.jsx)
export async function getPlans() {
  return request('/plans');
}

// REAL — POST /api/plans/upgrade-request  { planId, promoCode }
// FLUXO DE COMPRA:
// 1. Cria um pedido pendente e a mensagem automática no chat Suporte;
//    os administradores são notificados por email.
// 2. O estudante envia o comprovativo de pagamento pelo mesmo chat.
// 3. Confirmado o pagamento, o ADMIN confirma o pedido (Suporte →
//    "Confirmar e actualizar plano"): o plano é actualizado, o
//    estudante recebe uma mensagem no chat e um email de confirmação.
export async function requestPlanUpgrade(planId, promoCode) {
  return request('/plans/upgrade-request', { method: 'POST', body: { planId, promoCode } });
}

// --- Chat --------------------------------------------------------
// "Tempo real" aproximado por polling (sem WebSocket/Socket.io nesta
// fase — decisão pragmática, igual à monitorização ao vivo do professor).

const mapMsgs = (messages = []) => messages.map((m) => ({
  from: m.from === 'estudante' ? 'me' : 'prof',
  text: m.text,
  time: m.time,
}));

// REAL — GET /api/chats/duvidas — conversas de Dúvidas já iniciadas pelo
// estudante (uma por maratona escolhida). A escolha da maratona é manual;
// usa getMarathons() para listar as activas e abrir uma nova conversa.
export async function getDuvidasThreads() {
  const { threads } = await request('/chats/duvidas');
  return threads;
}

// REAL — GET /api/chats/duvidas/:maratonaId
export async function getDuvidasThread(maratonaId) {
  const data = await request(`/chats/duvidas/${maratonaId}`);
  return {
    messages: mapMsgs(data.messages),
    ref: data.ref ?? null,
    title: data.title ?? null,
    professorName: data.professorName ?? null,
  };
}

// REAL — POST /api/chats/duvidas/:maratonaId { text }
export async function sendDuvidas(maratonaId, text) {
  const { message } = await request(`/chats/duvidas/${maratonaId}`, { method: 'POST', body: { text } });
  return { from: 'me', text: message.text, time: message.time };
}

// REAL — GET /api/chats/suporte
export async function getSuporte() {
  const data = await request('/chats/suporte');
  return { messages: mapMsgs(data.messages) };
}

// REAL — POST /api/chats/suporte { text }
export async function sendSuporte(text) {
  const { message } = await request('/chats/suporte', { method: 'POST', body: { text } });
  return { from: 'me', text: message.text, time: message.time };
}
