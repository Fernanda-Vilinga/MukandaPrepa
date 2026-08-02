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

export function useMaxAttempts(plano) {
  const [max, setMax] = useState(undefined);

  useEffect(() => {
    let vivo = true;
    getPlanAttempts()
      .then((porPlano) => { if (vivo) setMax(porPlano[plano || 'basic']); })
      .catch(() => { if (vivo) setMax(null); });   // null = não foi possível saber
    return () => { vivo = false; };
  }, [plano]);

  return max;
}
