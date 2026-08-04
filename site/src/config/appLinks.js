// Ligações do site institucional para a APP (Plataforma de Maratonas).
//
// O site não tem autenticação própria: todos os botões de entrar/inscrever
// levam a pessoa para a app, que é onde vive o backend. O endereço da app é
// configurável por variável de ambiente porque hoje é um domínio do Vercel e
// mais tarde passará a ser o domínio próprio — assim muda-se num sítio só.
//
// Definir VITE_APP_URL no .env (ou nas variáveis do projecto na hospedagem).
const base = String(import.meta.env.VITE_APP_URL || 'https://mukanda-prepa-app.vercel.app')
  .trim()
  .replace(/\/$/, '');

export const APP_URL = base;
export const APP_LOGIN = `${base}/login`;
export const APP_REGISTO = `${base}/registo`;

// Alguns cartões de plano passam o plano escolhido para a app.
export const appRegisto = (plano) =>
  plano ? `${APP_REGISTO}?plano=${encodeURIComponent(plano)}` : APP_REGISTO;

// Links para a app abrem sempre num separador novo: a pessoa está a ler o site
// e não deve perder o sítio onde estava ao ir criar conta. Links internos do
// site continuam a navegar normalmente, no mesmo separador.
export const ehLinkExterno = (href) => /^https?:\/\//i.test(String(href || ''));

// Espalhar sobre um <a>: <a href={x} {...propsLink(x)}>
export const propsLink = (href) =>
  ehLinkExterno(href) ? { target: '_blank', rel: 'noreferrer' } : {};
