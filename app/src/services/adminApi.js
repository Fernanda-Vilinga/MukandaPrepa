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
// REAL — GET /api/admin/overview
export async function getAdminOverview() {
  return request('/admin/overview');
}

// GET /api/admin/users?role=&q=
// REAL — GET /api/admin/users
export async function getUsers() {
  const { users } = await request('/admin/users');
  return users;
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
// REAL — PATCH /api/admin/users/:id
// patch: { active } | { plan } | { resetPassword: true }
export async function updateUser(id, patch) {
  return request(`/admin/users/${id}`, { method: 'PATCH', body: patch });
}

// GET /api/admin/stats
// REAL — GET /api/admin/stats
export async function getGlobalStats() {
  const { stats } = await request('/admin/stats');
  return stats;
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
