// Endereço da API do backend, usado pelo site apenas para o formulário de
// contacto. Mesma lógica do appLinks.js: variável de ambiente com valor por
// omissão, para mudar num sítio só quando vier o domínio próprio.
//
// Nota de CORS: o domínio do site tem de constar do CORS_ORIGINS do backend,
// senão o browser recusa a chamada (já aconteceu em Julho com domínios quase
// iguais — ver GUIA-DE-DEPLOY-VERCEL.md).
const base = String(import.meta.env.VITE_API_BASE || 'https://mukandaprepa-backend.vercel.app/api')
  .trim()
  .replace(/\/$/, '');

export const API_BASE = base;
