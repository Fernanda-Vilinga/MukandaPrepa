// Pré-visualizar — passo 3/4: revê tudo antes de publicar (dados, janela
// de acesso e o banco de 15 questões), sem precisares de publicar às cegas.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDraft, publishMarathon } from './profDeps.js';
import { ProfTopbar, Steps, Pill } from '../../components/ProfUi.jsx';

const AREA_LABEL = { eng: '⚙️ Engenharia e Tecnologia', soc: '⚖️ Ciências Sociais' };
const pillKind = { mcq: 'mcq', text: 'txt', photo: 'foto' };
const pillLabel = { mcq: 'MCQ', text: 'Texto', photo: 'Foto' };

const formatarData = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function PreviewMarathon() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getDraft().then((d) => {
      if (!d) {
        navigate('/prof/maratonas/nova', { replace: true });
        return;
      }
      const preenchidas = (d.questions || []).filter((q) => q && q.filled).length;
      if (preenchidas < 15) {
        navigate('/prof/maratonas/nova/questoes', { replace: true });
        return;
      }
      setDraft(d);
    });
  }, [navigate]);

  if (!draft) {
    return (
      <>
        <ProfTopbar />
        <div className="wrap" style={{ maxWidth: 1000 }}>
          <div className="mut">A carregar…</div>
        </div>
      </>
    );
  }

  const questoes = draft.questions || [];
  const contagem = questoes.reduce((acc, q) => {
    if (q && q.filled) acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {});

  const publicar = async () => {
    setError('');
    setPublishing(true);
    try {
      await publishMarathon();
      navigate('/prof/maratonas');
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <ProfTopbar />
      <div className="wrap" style={{ maxWidth: 1000 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Pré-visualizar maratona</h1>
        <Steps current={3} />

        <div className="card" style={{ padding: 36 }}>
          <div className="sm mut" style={{ marginBottom: 4 }}>Título</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 22 }}>{draft.title}</h2>

          <div className="row" style={{ gap: 24, marginBottom: 22, flexWrap: 'wrap' }}>
            <div className="col field" style={{ marginBottom: 0, minWidth: 140 }}>
              <div className="sm mut">Disciplina</div>
              <div style={{ fontWeight: 600 }}>{draft.discipline || '—'}</div>
            </div>
            <div className="col field" style={{ marginBottom: 0, minWidth: 140 }}>
              <div className="sm mut">Área</div>
              <div style={{ fontWeight: 600 }}>{AREA_LABEL[draft.area] || draft.area}</div>
            </div>
            <div className="col field" style={{ marginBottom: 0, minWidth: 140 }}>
              <div className="sm mut">Duração</div>
              <div style={{ fontWeight: 600 }}>{draft.duration} minutos</div>
            </div>
            <div className="col field" style={{ marginBottom: 0, minWidth: 140 }}>
              <div className="sm mut">Questões por sessão</div>
              <div style={{ fontWeight: 600 }}>{draft.perSession}</div>
            </div>
          </div>

          {draft.description && (
            <div style={{ marginBottom: 22 }}>
              <div className="sm mut">Descrição (visível para os alunos)</div>
              <div style={{ marginTop: 4 }}>{draft.description}</div>
            </div>
          )}

          <div className="row" style={{ gap: 24, marginBottom: 8, flexWrap: 'wrap' }}>
            <div className="col field" style={{ marginBottom: 0, minWidth: 180 }}>
              <div className="sm mut">Início da janela de acesso</div>
              <div style={{ fontWeight: 600 }}>{formatarData(draft.start)}</div>
            </div>
            <div className="col field" style={{ marginBottom: 0, minWidth: 180 }}>
              <div className="sm mut">Fim da janela de acesso</div>
              <div style={{ fontWeight: 600 }}>{formatarData(draft.end)}</div>
            </div>
            <div className="col field" style={{ marginBottom: 0, minWidth: 140 }}>
              <div className="sm mut">Password</div>
              <div style={{ fontWeight: 600 }}>{draft.hasPassword ? '🔑 Definida' : '— Não definida'}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 36, marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Banco de questões</h3>
            <span className="sm mut">
              {['mcq', 'text', 'photo'].map((t) => (contagem[t] ? `${pillLabel[t]}: ${contagem[t]}` : null)).filter(Boolean).join(' · ')}
            </span>
          </div>
          <div className="grid-slots">
            {questoes.map((q, i) => (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: 12, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12,
                border: '1.5px solid var(--brd)', background: 'linear-gradient(135deg,#EEEEF0,#E2E2E6)', color: 'var(--dark)',
              }}>
                <b className="mont">{i + 1}</b>
                <Pill kind={pillKind[q?.type] || 'gray'}>{pillLabel[q?.type] || '?'}</Pill>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="sm" style={{ background: 'var(--red-l, #fdecec)', color: 'var(--red, #c0392b)', borderRadius: 10, padding: '12px 16px', marginTop: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, flexWrap: 'wrap', gap: 12 }}>
          <button className="btn ghost" onClick={() => navigate('/prof/maratonas/nova/questoes')}>← Voltar às questões</button>
          <button className="btn" disabled={publishing} onClick={publicar}>
            {publishing ? 'A publicar…' : 'Publicar maratona ✓'}
          </button>
        </div>
      </div>
    </>
  );
}
