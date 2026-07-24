// Criar maratona — passo 1/4: dados. (Rascunho ou continuar para questões.)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveMarathon, getDraft } from './profDeps.js';
import { ProfTopbar, Steps } from '../../components/ProfUi.jsx';

// ISO UTC → formato do input datetime-local, na hora local do professor
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const AREAS = [
  ['eng', '⚙️ Engenharia', 'Engenharia e Tecnologia'],
  ['soc', '⚖️ Ciências Sociais', 'Ciências Sociais'],
];

export default function CreateMarathon() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', discipline: '', area: 'eng', description: '',
    duration: 60, perSession: 5, start: '', end: '', password: '',
  });
  const [saved, setSaved] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Janela de acesso inválida (vazia ou fim <= início) — avisar já aqui, em vez
  // de só descobrir no fim das 15 questões ao tentar publicar.
  const janelaIncompleta = !form.start || !form.end;
  const janelaInvalida = !janelaIncompleta && new Date(form.end) <= new Date(form.start);

  // Recarrega o rascunho em curso (se existir) ao abrir a página
  useEffect(() => {
    getDraft().then((d) => {
      if (!d) return;
      setForm({
        title: d.title, discipline: d.discipline, area: d.area, description: d.description,
        duration: d.duration, perSession: d.perSession, start: toLocalInput(d.start), end: toLocalInput(d.end), password: '',
      });
      setHasPassword(d.hasPassword);
    });
  }, []);

  // Guardar rascunho → volta à lista de maratonas
  const draft = async () => {
    await saveMarathon(form, false);
    navigate('/prof/maratonas');
  };

  const next = async () => {
    await saveMarathon(form, false);
    navigate('/prof/maratonas/nova/questoes');
  };

  return (
    <>
      <ProfTopbar />
      <div className="wrap" style={{ maxWidth: 1000 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Nova maratona</h1>
        <Steps current={1} />
        <div className="card" style={{ padding: 36 }}>
          <div className="row" style={{ gap: 16 }}>
            <div className="col field" style={{ flex: 2 }}>
              <label className="label">Título da maratona</label>
              <input className="input" value={form.title} onChange={set('title')} placeholder="Ex.: Maratona de Matemática — Álgebra Linear" />
            </div>
            <div className="col field">
              <label className="label">Disciplina</label>
              <input className="input" value={form.discipline} onChange={set('discipline')} placeholder="Ex.: Matemática" />
            </div>
          </div>

          <label className="label">Área</label>
          <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
            {AREAS.map(([id, label]) => (
              <button
                key={id} type="button"
                onClick={() => setForm((f) => ({ ...f, area: id }))}
                style={{
                  border: form.area === id ? '2px solid var(--orange)' : '1.5px solid var(--brd)',
                  background: form.area === id ? 'var(--orange-l)' : '#fff',
                  borderRadius: 12, padding: '12px 24px', fontWeight: 600,
                  color: form.area === id ? 'var(--dark)' : 'var(--mut)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="field">
            <label className="label">Descrição (visível para os alunos)</label>
            <textarea className="input" style={{ height: 90, resize: 'vertical' }} value={form.description} onChange={set('description')} placeholder="O que os alunos devem esperar e levar para a sessão…" />
          </div>

          <div className="row" style={{ gap: 16 }}>
            <div className="col field">
              <label className="label">Duração da sessão (45–90 min)</label>
              <select className="input" style={{ appearance: 'auto' }} value={form.duration} onChange={set('duration')}>
                {[45, 60, 75, 90].map((d) => <option key={d} value={d}>{d} minutos</option>)}
              </select>
            </div>
            <div className="col field">
              <label className="label">Questões por sessão</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[4, 5].map((n) => (
                  <button
                    key={n} type="button"
                    onClick={() => setForm((f) => ({ ...f, perSession: n }))}
                    style={{
                      flex: 1, borderRadius: 12, padding: 13, textAlign: 'center', fontWeight: 600,
                      border: form.perSession === n ? '2px solid var(--orange)' : '1.5px solid var(--brd)',
                      background: form.perSession === n ? 'var(--orange-l)' : '#fff',
                      color: form.perSession === n ? 'var(--dark)' : 'var(--mut)',
                    }}
                  >
                    {n} questões
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="row" style={{ gap: 16 }}>
            <div className="col field">
              <label className="label">Início da janela de acesso</label>
              <input className="input" type="datetime-local" value={form.start} onChange={set('start')} />
            </div>
            <div className="col field">
              <label className="label">Fim da janela de acesso</label>
              <input className="input" type="datetime-local" value={form.end} onChange={set('end')} style={janelaInvalida ? { borderColor: 'var(--red, #c0392b)' } : undefined} />
            </div>
          </div>
          {janelaInvalida && (
            <div className="sm" style={{ background: 'var(--red-l, #fdecec)', color: 'var(--red, #c0392b)', borderRadius: 10, padding: '10px 14px', marginTop: -8, marginBottom: 20 }}>
              O fim da janela tem de ser depois do início — corrige antes de continuar.
            </div>
          )}

          <div className="row" style={{ gap: 16, alignItems: 'flex-end' }}>
            <div className="col field" style={{ marginBottom: 0 }}>
              <label className="label">🔑 Password da maratona</label>
              <input className="input" style={{ fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase' }} maxLength={6} value={form.password} onChange={set('password')} placeholder={hasPassword ? 'definida — escreve para alterar' : '6 caracteres'} />
            </div>
            <div className="col sm mut" style={{ paddingBottom: 12 }}>
              Partilha esta password com os alunos. Sem ela ninguém entra, mesmo com conta.
            </div>
          </div>

          {saved && <div className="sm" style={{ background: 'var(--green-l)', color: 'var(--green)', borderRadius: 10, padding: '10px 14px', marginTop: 20 }}>✓ Rascunho guardado.</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, flexWrap: 'wrap', gap: 12 }}>
            <button className="btn ghost" onClick={draft}>Guardar rascunho</button>
            <button className="btn" onClick={next} disabled={!form.title || !form.discipline || (!hasPassword && form.password.length < 4) || janelaIncompleta || janelaInvalida}>
              Continuar → Banco de questões
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
