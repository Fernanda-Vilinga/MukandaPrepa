# MUKANDA PREPA — Plataforma de Maratonas (frontend)

SPA em **React 18+ / Vite** conforme a Especificação Técnica v1.0. Perfil **Estudante** completo com dados mock; Professor e Admin seguem-se.

## Arranque

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # produção → dist/
```

Login (mock):
- **Estudante**: qualquer email + password. Password da maratona de teste: **MAT26X**.
- **Professor**: email a começar por `prof` (ex.: `prof@mukandaprepa.ao`) + qualquer password → dashboard do professor.
- **Administrador**: email a começar por `admin` (ex.: `admin@mukandaprepa.ao`) + qualquer password → painel de administração.

## Estrutura

```
src/
  components/   Ui.jsx (design system) · Chat.jsx
  pages/        Login · Register · ForgotPassword · Terms · Dashboard · Marathons
                MarathonDetail · Countdown · Session (questões+revisão) · Submitted
                Results · ResultDetail · Profile
  pages/prof/   Dashboard · Marathons (lista) · CreateMarathon (passo 1) · Questions
                (passo 2, 15 slots) · Monitor (ao vivo) · Queue (fila) · Validate
                Stats · Chats (só Dúvidas — o Suporte é dos admins)
  pages/admin/  Dashboard · RegisterProfessor · Users · GlobalStats · Plans
                MarathonData · Support (chat exclusivo: compras de planos + acessos)
  services/     api.js — camada MOCK que imita os endpoints da spec.
                Para ligar ao backend real, substituir o corpo das funções
                por fetch(), mantendo as assinaturas.
  data/         mock.js — dados de exemplo
  index.css     tokens do Manual de Identidade Visual (#FB6D1D, #1742E7, #14141F)
```

## Espaços reservados (a preencher)

- **Logotipo**: componente `Logo` em `src/components/Ui.jsx` — substituir pelo SVG oficial em `/public`.
- **Favicon**: comentário TODO em `index.html`.
- **Imagens das questões**: `imageUrl: null` em `src/data/mock.js`; o componente `ImagePh` renderiza o placeholder até existir URL.

## Regras da spec implementadas

Countdown global único com submissão automática no timeout · auto-save de respostas ·
navegação livre entre questões + revisão final · password por maratona · tentativas
limitadas por plano (Basic 1 / Plus 3 / Premium ∞) · auto-registo apenas de estudantes ·
dois chats (Dúvidas / Suporte).
