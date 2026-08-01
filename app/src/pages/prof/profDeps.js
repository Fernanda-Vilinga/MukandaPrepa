import { request } from "../../services/api.js";


// Dashboard geral do professor.
//
// Compõe-se de dois endpoints que já existiam e estão testados:
//   GET /prof/marathons              → as maratonas do professor
//   GET /prof/marathons/overview/kpis → pendingValidations, connectedNow, unreadChats
//
// O endpoint /prof/dashboard que aqui estava consultava colecções que não
// existem nesta base de dados ("submissions", "chats"; o projecto usa
// "sessoes" e "conversas") e devolvia 500 — o que deixava o dashboard em
// branco. Ver ANALISE-ALTERACOES-FERNANDA.md.
export async function getProfOverview(){

    const [{ marathons }, kpis] = await Promise.all([
        request("/prof/marathons"),
        request("/prof/marathons/overview/kpis"),
    ]);

    return { marathons, ...kpis };

}


// Lista de submissões do professor
export async function getSubmissions(){

    const data = await request("/prof/submissions");

    return data.submissions || [];

}


// Detalhe de uma submissão
export async function getSubmission(id){

    const data = await request(`/prof/submissions/${id}`);

    return data.submission || data;

}


// Confirmar validação de submissão
export async function confirmValidation(id, body){

    const data = await request(`/prof/submissions/${id}/confirm`, {
        method: "POST",
        body
    });

    return data;

}


// Chats do professor
export async function getProfChats(){

    const data = await request("/prof/chats");

    return data.chats || [];

}


// Utilizador atual
export function currentUser(){

    const raw = sessionStorage.getItem("mkp_user");

    return raw
        ? JSON.parse(raw)
        : null;

}


// Buscar rascunho da maratona actual
export async function getDraft(){

    const data = await request("/prof/marathons/draft");

    return data.draft || null;

}


// Guardar uma questão
export async function saveQuestion(slot, question){

    const data = await request("/prof/questions", {
        method: "POST",
        body:{
            slot,
            question
        }
    });

    return data;

}


// Criar maratona
export async function saveMarathon(form, publish=false){

    const data = await request("/prof/marathons", {

        method:"POST",

        body:{
            titulo: form.title,
            disciplina: form.discipline,
            area: form.area,
            descricao: form.description,
            duracaoMinutos: Number(form.duration),
            questoesPorSessao: Number(form.perSession),
            inicio: form.start,
            fim: form.end,
            password: form.password,
            publicar: publish
        }

    });


    return data.marathon || data;

}


// Publicar maratona
export async function publishMarathon(){

    const data = await request("/prof/marathons/publish", {
        method:"POST"
    });

    return data;

}


// Sessões ao vivo
export async function getLiveSessions(){

    const data = await request("/prof/live-sessions");

    return data.sessions || [];

}


// Estatísticas da maratona
export async function getMarathonStats(id){

    const data = await request(`/prof/marathons/${id}/stats`);

    return data.stats || data;

}


// Exportar CSV
export async function exportMarathonCSV(
    id,
    filename = `maratona-${id}.csv`
){

    const token = sessionStorage.getItem("mkp_token");


    const base =
        import.meta.env.VITE_API_URL || "";


    const res = await fetch(
        `${base}/prof/marathons/${id}/export.csv`,
        {
            headers: token
                ? {
                    Authorization:`Bearer ${token}`
                }
                : {}
        }
    );


    if(!res.ok){

        const data = await res
            .json()
            .catch(() => ({}));


        throw new Error(
            data.mensagem ||
            data.message ||
            `Erro ao exportar (${res.status}).`
        );

    }


    const blob = await res.blob();


    const url = URL.createObjectURL(blob);


    const a = document.createElement("a");


    a.href = url;

    a.download = filename;


    document.body.appendChild(a);


    a.click();


    a.remove();


    URL.revokeObjectURL(url);

}
// Marcar conversa como lida
// Chamado quando o professor abre uma conversa
export async function markProfChatRead(conversaId){

    await request(`/prof/chats/${conversaId}/lida`, {
        method: "PUT"
    });

}
// Enviar mensagem no chat do professor
export async function sendProfChat(conversaId, text){

    const data = await request(`/prof/chats/${conversaId}`, {
        method: "POST",
        body:{
            text
        }
    });


    const message = data.message || data;


    return {
        from:"prof",
        text:message.text,
        time:message.time
    };

}
// Enviar password da maratona para o chat de dúvidas
// O backend envia a mensagem para os alunos ligados à maratona
export async function broadcastMarathonPassword(id){

    const data = await request(
        `/prof/marathons/${id}/broadcast-password`,
        {
            method:"POST"
        }
    );


    return data;

}
// Buscar password da maratona
// A password nunca fica guardada no frontend
export async function getMarathonPassword(id){

    const data = await request(
        `/prof/marathons/${id}/password`
    );


    return data.password || data;

}
// Limpar o rascunho actual da maratona
export function newDraft(){

    sessionStorage.removeItem("mkp_draft_id");

}
// Abrir um rascunho existente e guardar o id localmente
export function openDraft(id){

    sessionStorage.setItem(
        "mkp_draft_id",
        id
    );

}