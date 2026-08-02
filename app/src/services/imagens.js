// Preparação e envio de imagens.
//
// Porque é que a imagem não vai directamente como o utilizador a escolheu:
//
//  1. Uma fotografia tirada com um telemóvel actual tem 3 a 8 MB. A hospedagem
//     recusa pedidos acima de ~4,5 MB antes sequer de chegarem ao nosso código,
//     e a mensagem que devolve não explica nada a quem está do outro lado.
//  2. Um aluno numa maratona cronometrada, em dados móveis, não tem tempo para
//     enviar 6 MB. Reduzida, a mesma fotografia fica em 200-400 kB — segundos
//     em vez de minutos, e menos megabytes do saldo dele.
//  3. Ninguém precisa de 4000 px de largura para ler o enunciado ou a resolução
//     de um exercício.
//
// A redução é feita no browser, com um <canvas>. Reencodar em JPEG apaga
// também os metadados da fotografia (incluindo a localização de onde foi
// tirada), o que aqui é um efeito secundário bem-vindo.
import { API_BASE } from './api.js';

// 1200 px chega para ler contas escritas à mão num ecrã, e mantém o resultado
// bem abaixo do tecto do armazenamento actual (as imagens estão guardadas no
// Firestore, que recusa registos acima de 1 MB — ver Backend/src/utils/
// armazenamento.js). Quando houver armazenamento a sério, isto pode subir.
const LADO_MAXIMO = 1200;
const QUALIDADE = 0.78;
const ALVO = 800 * 1024;   // se ainda ficar acima disto, tenta-se de novo mais pequeno

// Máximo que o servidor aceita — tem de ser igual ao TAMANHO_MAXIMO em
// Backend/src/utils/armazenamento.js. Verificado aqui também para o utilizador
// saber logo o que se passa, em vez de receber um erro do servidor.
const MAXIMO_SERVIDOR = 900 * 1024;

/**
 * Reduz e recomprime uma imagem escolhida pelo utilizador. Devolve um Blob JPEG.
 *
 * Lança um erro com uma mensagem explicativa se não conseguir. Antes devolvia
 * em silêncio o ficheiro original quando falhava a converter — e o que o
 * utilizador via era "Não foi possível enviar a imagem", sem saber porquê nem
 * o que fazer a seguir. Era o caso das fotografias de iPhone (formato HEIC),
 * que nenhum browser além do Safari consegue ler.
 */
export async function comprimirImagem(ficheiro) {
  let bitmap;
  try {
    bitmap = await criarBitmap(ficheiro);
  } catch {
    const nome = (ficheiro.name || '').toLowerCase();
    if (/\.(heic|heif)$/.test(nome) || /hei[cf]/.test(ficheiro.type || '')) {
      throw new Error(
        'Este browser não consegue ler fotografias no formato HEIC do iPhone. ' +
        'Envia a partir do próprio iPhone, ou muda em Definições → Câmara → ' +
        'Formatos para "Mais compatível".'
      );
    }
    throw new Error('Não foi possível ler este ficheiro como imagem. Tenta uma fotografia em JPG ou PNG.');
  }

  // Uma fotografia de um caderno com pouca luz, cheia de grão, pode ficar
  // grande mesmo reduzida — o grão não comprime. Tenta-se progressivamente
  // mais pequeno até caber, em vez de deixar o envio falhar.
  let blob = null;
  for (const [lado, qualidade] of [[LADO_MAXIMO, QUALIDADE], [1000, 0.7], [800, 0.6], [640, 0.55]]) {
    blob = await desenhar(bitmap, lado, qualidade);
    if (blob && blob.size <= ALVO) break;
  }
  if (bitmap.close) bitmap.close();

  if (!blob) {
    throw new Error('Não foi possível preparar a imagem para envio. Tenta outra fotografia.');
  }
  if (blob.size > MAXIMO_SERVIDOR) {
    throw new Error(
      `Mesmo reduzida, esta imagem tem ${Math.round(blob.size / 1024)} kB e o máximo são 900 kB. ` +
      'Tenta fotografar com mais luz e mais perto da folha.'
    );
  }
  return blob;
}

function desenhar(bitmap, ladoMaximo, qualidade) {
  const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;

  const ctx = canvas.getContext('2d');
  // Fundo branco: um PNG com transparência ficaria com fundo preto ao passar
  // para JPEG, e uma questão digitalizada assim fica ilegível.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, largura, altura);
  ctx.drawImage(bitmap, 0, 0, largura, altura);

  return new Promise((r) => canvas.toBlob(r, 'image/jpeg', qualidade));
}

// createImageBitmap trata da orientação EXIF (fotografias tiradas de lado
// apareciam deitadas). Onde não existir, recorre-se ao <img> clássico.
function criarBitmap(ficheiro) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(ficheiro, { imageOrientation: 'from-image' })
      .catch(() => criarBitmapPorImg(ficheiro));
  }
  return criarBitmapPorImg(ficheiro);
}

function criarBitmapPorImg(ficheiro) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(ficheiro);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('imagem ilegível')); };
    img.src = url;
  });
}

// Envia o binário em bruto. O backend recebe-o com express.raw() — sem
// multipart e sem base64, que acrescentaria um terço ao tamanho.
async function enviar(caminho, blob) {
  const token = sessionStorage.getItem('mkp_token');

  let res;
  try {
    res = await fetch(`${API_BASE}${caminho}`, {
      method: 'POST',
      headers: {
        'Content-Type': blob.type || 'image/jpeg',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: blob,
    });
  } catch {
    throw new Error('Sem ligação ao servidor. Verifica a internet e tenta de novo.');
  }

  // Nem todas as respostas de erro são nossas: a hospedagem pode recusar o
  // pedido antes de chegar ao código e devolve HTML. Antes isso caía num
  // "Não foi possível enviar a imagem" que não dizia nada a ninguém — o
  // código de estado é a única pista que sobra, por isso vai na mensagem.
  const texto = await res.text().catch(() => '');
  let dados = {};
  try { dados = JSON.parse(texto); } catch { /* resposta não é JSON */ }

  if (!res.ok) {
    if (dados.mensagem) throw new Error(dados.mensagem);
    if (res.status === 413) {
      throw new Error('A imagem é demasiado grande para o servidor. Tenta fotografar com menos resolução.');
    }
    throw new Error(`Não foi possível enviar a imagem (erro ${res.status}).`);
  }
  return dados.url;
}

/** Professor: imagem de uma das 15 questões. Devolve o endereço da imagem. */
export async function uploadImagemQuestao(marathonId, slot, ficheiro) {
  const blob = await comprimirImagem(ficheiro);
  return enviar(`/uploads/questions/${marathonId}/${slot}`, blob);
}

/** Estudante: fotografia da resposta. Devolve o endereço da imagem. */
export async function uploadFotoResposta(sessionId, indiceQuestao, ficheiro) {
  const blob = await comprimirImagem(ficheiro);
  return enviar(`/uploads/answers/${sessionId}/${indiceQuestao}`, blob);
}
