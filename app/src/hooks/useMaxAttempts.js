// Quantas tentativas o plano do utilizador dá por maratona.
//
// Devolve `undefined` enquanto carrega — de propósito, para as páginas não
// mostrarem um número errado durante um instante. Quem usa isto deve esconder o
// texto até haver valor, em vez de assumir um valor por omissão: mostrar "2
// tentativas" e corrigir para "ilimitadas" meio segundo depois é pior do que
// não mostrar nada.
//
// Infinity = ilimitadas.
import { useEffect, useState } from 'react';
import { getPlanAttempts } from '../services/api.js';
import { FASE_GRATUITA } from '../config/fase.js';

export function useMaxAttempts(plano) {
  const [max, setMax] = useState(undefined);

  useEffect(() => {
    let vivo = true;
    // Fase gratuita: todos os alunos têm o limite do BASIC, seja qual for o
    // plano gravado na conta — a mesma regra que o servidor aplica em
    // Backend/src/utils/planos.js. O servidor devolve os limites já
    // uniformizados; forçar aqui também mantém o número certo mesmo que a
    // app fale com um backend ainda por actualizar.
    const id = FASE_GRATUITA ? 'basic' : (plano || 'basic');
    getPlanAttempts()
      .then((porPlano) => { if (vivo) setMax(porPlano[id]); })
      .catch(() => { if (vivo) setMax(null); });   // null = não foi possível saber
    return () => { vivo = false; };
  }, [plano]);

  return max;
}
