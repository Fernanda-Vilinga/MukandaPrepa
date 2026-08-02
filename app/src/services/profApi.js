// ============================================================
// Camada de API MOCK — perfil PROFESSOR
// Assinaturas alinhadas com os endpoints da spec; o backender
// substitui os corpos por fetch() reais.
// ============================================================
import {
  PROF_MARATHONS, SUBMISSIONS, LIVE_SESSIONS, MARATHON_STATS,
} from '../data/profMock.js';
import { request, API_BASE } from './api.js';
import { uploadImagemQuestao } from './imagens.js';

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

// REAL — GET /api/prof/marathons + /api/prof/marathons/overview/kpis
export async function getProfOverview() {
  const { marathons } = await request('/prof/marathons');
  const kpis = await request('/prof/marathons/overview/kpis');
  return { marathons, ...kpis };
}

// GET /api/prof/submissions?status=pending
// REAL — GET /api/prof/submissions (fila: pendentes + validadas)
export async function getSubmissions() {
  const { submissions } = await request('/prof/submissions');
  return submissions;
}

// GET /api/prof/submissions/:id
// REAL — GET /api/prof/submissions/:id (MCQ pré-corrigidas pelo servidor)
export async function getSubmission(id) {
  const { submission } = await request(`/prof/submissions/${id}`);
  return submission;
}

// POST /api/prof/submissions/:id/validate
// { answers: [{ n, correct, feedback }], generalNote }
// → backend: calcula nota, envia email ao aluno, afixa no dashboard
export async function confirmValidation(id, payload) {
  // REAL — calcula a nota no servidor; email ao aluno na fase de emails
  return request(`/prof/submissions/${id}/validate`, { method: 'POST', body: payload });
}

// GET /api/prof/marathons/:id/live  (real: WebSocket / polling)
// REAL — GET /api/prof/marathons/:id/live (sem WebSocket: a página
// faz polling periódico chamando esta função de novo)
export async function getLiveSessions(id) {
  return request(`/prof/marathons/${id}/live`);
}

// GET /api/prof/marathons/:id/stats
// REAL — GET /api/prof/marathons/:id/stats
export async function getMarathonStats(id) {
  const { stats } = await request(`/prof/marathons/${id}/stats`);
  return stats;
}

// POST /api/prof/marathons  (rascunho ou publicar)
// Gestão do rascunho actual (id guardado até publicar)
export function openDraft(id) { sessionStorage.setItem('mkp_draft_id', id); }
// REAL — GET /api/prof/marathons/:id/export.csv (download)
// fetch manual: o link de download normal não envia o token JWT guardado
// em sessionStorage, por isso pedimos o ficheiro e disparamos o download
// nós próprios a partir da resposta.
export async function exportMarathonCSV(id, filename = `maratona-${id}.csv`) {
  const token = sessionStorage.getItem('mkp_token');
  const res = await fetch(`${API_BASE}/prof/marathons/${id}/export.csv`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || `Erro ao exportar (${res.status}).`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// REAL — GET /api/prof/marathons/:id/password (a app nunca guarda a
// password em claro; só é pedida ao servidor quando o professor clica)
export async function getMarathonPassword(id) {
  const { password } = await request(`/prof/marathons/${id}/password`);
  return password;
}

// REAL — POST /api/prof/marathons/:id/broadcast-password
// Envia a password como mensagem no chat Dúvidas a todos os alunos ligados
// a esta maratona (quem já conversou + quem já tem sessão/tentativa nela).
export async function broadcastMarathonPassword(id) {
  return request(`/prof/marathons/${id}/broadcast-password`, { method: 'POST' });
}

export function newDraft() { sessionStorage.removeItem('mkp_draft_id'); }

// REAL — carrega o rascunho actual (null se não houver)
export async function getDraft() {
  const draftId = sessionStorage.getItem('mkp_draft_id');
  if (!draftId) return null;
  try {
    const { marathon } = await request(`/prof/marathons/${draftId}`);
    return marathon;
  } catch {
    sessionStorage.removeItem('mkp_draft_id');
    return null;
  }
}

// REAL — cria/actualiza o rascunho; o id fica guardado até publicar
export async function saveMarathon(data, publish = false) {
  const draftId = sessionStorage.getItem('mkp_draft_id');
  const res = draftId
    ? await request(`/prof/marathons/${draftId}`, { method: 'PUT', body: data })
    : await request('/prof/marathons', { method: 'POST', body: data });
  sessionStorage.setItem('mkp_draft_id', res.id);
  if (publish) return publishMarathon(res.id);
  return res;
}

// REAL — POST /api/prof/marathons/:id/publish (valida 15 questões no servidor)
export async function publishMarathon(id = sessionStorage.getItem('mkp_draft_id')) {
  const res = await request(`/prof/marathons/${id}/publish`, { method: 'POST' });
  sessionStorage.removeItem('mkp_draft_id');
  return res;
}

// PUT /api/prof/marathons/:id/questions/:slot
// { imageFile, type, options, correctIndex }
// REAL — guarda a questão no rascunho actual
export async function saveQuestion(slot, data) {
  const draftId = sessionStorage.getItem('mkp_draft_id');
  if (!draftId) throw new Error('Guarda primeiro os dados da maratona (passo 1).');
  return request(`/prof/marathons/${draftId}/questions/${slot}`, {
    method: 'PUT',
    body: { type: data.type, options: data.options, correct: data.correct, image: data.image },
  });
}

// REAL — PUT /api/prof/marathons/:id  { password }
// Define uma password nova numa maratona já publicada. Existe porque só havia
// forma de definir a password ao criar o rascunho: se ela se perdesse — por
// esquecimento ou por troca do segredo de cifra — a maratona ficava inutilizada
// sem qualquer saída pela interface.
export async function resetMarathonPassword(id, password) {
  return request(`/prof/marathons/${id}`, { method: 'PUT', body: { password } });
}

// REAL — DELETE /api/prof/marathons/:id
// O servidor recusa (409) se algum aluno já tiver tentado a maratona.
export async function deleteMarathon(id) {
  return request(`/prof/marathons/${id}`, { method: 'DELETE' });
}

// REAL — POST /api/uploads/questions/:id/:slot
// Envia a imagem da questão e devolve o endereço onde ficou guardada. Esse
// endereço é depois gravado com a questão pelo saveQuestion acima — enviar a
// imagem não guarda a questão, são dois passos.
export async function uploadQuestionImage(slot, ficheiro) {
  const draftId = sessionStorage.getItem('mkp_draft_id');
  if (!draftId) throw new Error('Guarda primeiro os dados da maratona (passo 1).');
  return uploadImagemQuestao(draftId, slot, ficheiro);
}

// REAL — GET /api/prof/chats (inbox de Dúvidas do professor)
export async function getProfChats() {
  const { chats } = await request('/prof/chats');
  return chats.map((c) => ({
    ...c,
    messages: c.messages.map((m) => ({ ...m, from: m.from === 'professor' ? 'prof' : 'student' })),
  }));
}

// REAL — POST /api/prof/chats/:id { text }
export async function sendProfChat(conversaId, text) {
  const { message } = await request(`/prof/chats/${conversaId}`, { method: 'POST', body: { text } });
  return { from: 'prof', text: message.text, time: message.time };
}

// REAL — PUT /api/prof/chats/:id/lida
// Chamado ao ABRIR a conversa. Sem isto o contador de não lidas só zerava
// quando o professor respondia, e o polling trazia-o de volta a cada ciclo.
export async function markProfChatRead(conversaId) {
  await request(`/prof/chats/${conversaId}/lida`, { method: 'PUT' });
}
