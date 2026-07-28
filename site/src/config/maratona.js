// Data da próxima Maratona MUKANDA, usada pelo contador da página inicial
// e da página Maratonas.
//
// Está aqui, num sítio só, para não voltar a andar escrita dentro de um
// componente. Enquanto o site não consultar o servidor, é aqui que se muda.
//
// O fuso horário é indicado de propósito (+01:00, hora de Angola): sem ele,
// a data seria interpretada no fuso de quem visita, e um estudante fora do
// país veria uma contagem diferente da real.
export const DATA_PROXIMA_MARATONA = new Date('2026-08-17T12:00:00+01:00');

// Como aparece escrito, para não haver duas versões da mesma informação.
export const DATA_PROXIMA_MARATONA_LEGIVEL = '17 de Agosto de 2026';
