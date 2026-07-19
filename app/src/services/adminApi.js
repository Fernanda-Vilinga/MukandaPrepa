// ============================================================
// Camada de API MOCK — perfil ADMINISTRADOR
// ============================================================
import {
  ADMIN_KPIS, ACTIVITY_WEEKS, SYSTEM_ALERTS, USERS, GLOBAL_STATS,
  PLANS_CONFIG, PROMO_CODES, MARATHON_DATA, SUPPORT_CHATS,
} from '../data/adminMock.js';
import { request } from './api.js';

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

// GET /api/admin/overview
export async function getAdminOverview() {
  await delay();
  return { kpis: ADMIN_KPIS, activity: ACTIVITY_WEEKS, alerts: SYSTEM_ALERTS, recent: USERS.slice(0, 3) };
}

// GET /api/admin/users?role=&q=
export async function getUsers() {
  await delay();
  return USERS;
}

// POST /api/admin/professors  — endpoint PROTEGIDO (apenas token admin, regra da spec)
// → cria conta de professor + envia email de boas-vindas com senha temporária
// → force_password_change = true no primeiro login
// REAL — POST /api/admin/professores (token de admin obrigatório)
export async function registerProfessor(data) {
  const res = await request('/admin/professores', {
    method: 'POST',
    body: {
      nome: data.name,
      email: data.email,
      contacto: data.phone,
      area: data.area,
      disciplinas: data.disciplines,
      senhaTemporaria: data.tempPassword,
    },
  });
  return { ok: true, ...data, id: res.usuario.id };
}

// PATCH /api/admin/users/:id  (activar, suspender, alterar plano, redefinir senha)
export async function updateUser(id, patch) {
  await delay(300);
  const u = USERS.find((x) => x.id === id);
  if (u) Object.assign(u, patch);
  return { ok: true, id, ...patch };
}

// GET /api/admin/stats
export async function getGlobalStats() {
  await delay();
  return GLOBAL_STATS;
}

// GET /api/admin/plans · PUT /api/admin/plans
export async function getPlansConfig() {
  await delay();
  return { plans: PLANS_CONFIG, promos: PROMO_CODES };
}
export async function savePlansConfig(plans) {
  await delay(400);
  return { ok: true, plans };
}

// GET /api/admin/marathons/:id/data  (+ /export.csv)
export async function getMarathonData(id = 'm1') {
  await delay();
  return MARATHON_DATA[id] ?? MARATHON_DATA.m1;
}

// GET /api/admin/support-chats
export async function getSupportChats() {
  await delay(150);
  return SUPPORT_CHATS;
}
