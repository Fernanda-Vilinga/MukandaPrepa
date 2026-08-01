// Dependências das páginas do professor.
//
// Este ficheiro é apenas um ponto de entrada: a implementação vive toda em
// services/profApi.js. Chegou a ter aqui uma segunda cópia das 19 funções,
// escrita contra endpoints que o backend nunca expôs (POST /prof/questions,
// /prof/marathons/draft, /prof/marathons/publish, /prof/submissions/:id/confirm,
// /prof/live-sessions) — o que partiu gravar questões, publicar, validar e
// monitorizar. Ver ANALISE-ALTERACOES-FERNANDA.md.
//
// Uma implementação só. Se for preciso mudar a camada de API do professor,
// muda-se em services/profApi.js.
export { currentUser } from '../../services/api.js';
export * from '../../services/profApi.js';
