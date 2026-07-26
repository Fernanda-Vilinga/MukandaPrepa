import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Repõe a posição da página ao navegar.
//
// Numa aplicação de página única o browser não recarrega nada ao mudar de
// rota: só o conteúdo é trocado, e a barra de scroll fica exactamente onde
// estava. Por isso quem clicasse num link do rodapé — já no fundo da página —
// abria a página nova a meio, sem ver o título.
//
// Três casos, tratados de forma diferente:
//  - link com âncora (#calendario): deixa o browser saltar para o elemento;
//  - botões Voltar/Avançar: o browser repõe sozinho a posição anterior, que é
//    o que a pessoa espera ao voltar atrás;
//  - navegação normal: volta ao topo.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const tipoNavegacao = useNavigationType();

  useEffect(() => {
    if (hash) {
      const alvo = document.querySelector(hash);
      if (alvo) {
        alvo.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    if (tipoNavegacao === 'POP') return;   // Voltar/Avançar
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash, tipoNavegacao]);

  return null;
}
