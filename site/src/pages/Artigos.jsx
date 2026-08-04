import { useMemo, useState } from 'react';
import './Artigos.css';

const MATERIAS = ['Matemática', 'Física', 'Química', 'Biologia', 'Português', 'História'];
const NIVEIS = ['Básico', 'Intermédio', 'Avançado'];
const ITEMS_POR_PAGINA = 6;

// Conteúdo provisório — aguardava protótipo (Briefing v1.0, secção 2.1) e
// ainda não há CMS ligado (Briefing v2.0, secção 07). Substituir por
// artigos reais assim que o CMS estiver configurado.
const ARTIGOS = [
  { titulo: 'Como resolver equações do 2º grau sem erros', materia: 'Matemática', nivel: 'Básico', data: '02 Jul 2026' },
  { titulo: 'As leis de Newton explicadas com exemplos do dia-a-dia', materia: 'Física', nivel: 'Básico', data: '28 Jun 2026' },
  { titulo: 'Tabela periódica: truques para memorizar os elementos', materia: 'Química', nivel: 'Básico', data: '25 Jun 2026' },
  { titulo: 'Genética mendeliana: o que costuma cair no exame', materia: 'Biologia', nivel: 'Intermédio', data: '20 Jun 2026' },
  { titulo: 'Análise sintática: guia rápido para o exame de Português', materia: 'Português', nivel: 'Intermédio', data: '18 Jun 2026' },
  { titulo: 'Angola no período colonial: os pontos-chave', materia: 'História', nivel: 'Intermédio', data: '15 Jun 2026' },
  { titulo: 'Funções trigonométricas: do círculo ao gráfico', materia: 'Matemática', nivel: 'Avançado', data: '10 Jun 2026' },
  { titulo: 'Electromagnetismo: os erros mais comuns dos estudantes', materia: 'Física', nivel: 'Avançado', data: '05 Jun 2026' },
  { titulo: 'Estequiometria sem complicações', materia: 'Química', nivel: 'Intermédio', data: '01 Jun 2026' },
  { titulo: 'Sistema respiratório: resumo para a última semana de estudo', materia: 'Biologia', nivel: 'Básico', data: '28 Mai 2026' },
  { titulo: 'Figuras de estilo: como identificá-las rapidamente', materia: 'Português', nivel: 'Básico', data: '22 Mai 2026' },
  { titulo: 'Independências africanas: cronologia essencial', materia: 'História', nivel: 'Avançado', data: '18 Mai 2026' },
];

export default function Artigos() {
  const [materia, setMateria] = useState('');
  const [nivel, setNivel] = useState('');
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    return ARTIGOS.filter((a) => {
      if (materia && a.materia !== materia) return false;
      if (nivel && a.nivel !== nivel) return false;
      return true;
    });
  }, [materia, nivel]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITEMS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * ITEMS_POR_PAGINA;
  const artigosDaPagina = filtrados.slice(inicio, inicio + ITEMS_POR_PAGINA);

  const handleFiltroMateria = (e) => {
    setMateria(e.target.value);
    setPagina(1);
  };

  const handleFiltroNivel = (e) => {
    setNivel(e.target.value);
    setPagina(1);
  };

  return (
    <>
      <section className="artigos-hero">
        <div className="container">
          <h1>Artigos</h1>
          <p>Conteúdo pedagógico gratuito, organizado por matéria e nível.</p>
        </div>
      </section>

      <section className="artigos-conteudo">
        <div className="container">
          <div className="artigos-filtros">
            <label>
              Matéria
              <select value={materia} onChange={handleFiltroMateria}>
                <option value="">Todas as matérias</option>
                {MATERIAS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>

            <label>
              Nível
              <select value={nivel} onChange={handleFiltroNivel}>
                <option value="">Todos os níveis</option>
                {NIVEIS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>

          {artigosDaPagina.length === 0 ? (
            <p className="artigos-vazio">Sem artigos para este filtro.</p>
          ) : (
            <div className="artigos-grid">
              {artigosDaPagina.map((a) => (
                <article className="artigo-card" key={a.titulo}>
                  <div className="artigo-card__tags">
                    <span className="pill-materia">{a.materia}</span>
                    <span className="pill-nivel">{a.nivel}</span>
                  </div>
                  <h3>{a.titulo}</h3>
                  <time>{a.data}</time>
                </article>
              ))}
            </div>
          )}

          {totalPaginas > 1 && (
            <div className="artigos-paginacao">
              <button
                type="button"
                disabled={paginaAtual === 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span>Página {paginaAtual} de {totalPaginas}</span>
              <button
                type="button"
                disabled={paginaAtual === totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              >
                Seguinte
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
