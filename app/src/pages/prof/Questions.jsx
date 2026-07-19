// Banco de questões — passo 2/4: grid de 15 slots + editor por questão.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveQuestion, publishMarathon, getDraft } from './profDeps.js';
import { ProfTopbar, Steps, Pill } from '../../components/ProfUi.jsx';

const TYPES = [
  ['mcq', '☑ MCQ'],
  ['text', '📝 Texto'],
  ['photo', '📷 Foto'],
];

const initialSlots = () =>
  Array.from({ length: 15 }, (_, i) => ({
    slot: i + 1, filled: false, type: 'mcq', image: null, options: ['', '', '', ''], correct: 0,
  }));

export default function Questions() {
  const navigate = useNavigate();
  const [slots, setSlots] = useState(initialSlots);
  const [cur, setCur] = useState(0); // começa na questão 1

  // Recarrega as questões já guardadas no rascunho
  useEffect(() => {
    getDraft().then((d) => {
      if (!d || !d.questions) return;
      setSlots((all) => all.map((slot, i) => {
        const q = d.questions[i];
        return q && q.filled
          ? { slot: i + 1, filled: true, type: q.type, image: q.image, options: q.options.length ? q.options : ['', '', '', ''], correct: q.correct }
          : slot;
      }));
    });
  }, []);
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const q = slots[cur];
  const filled = slots.filter((s) => s.filled).length;

  const update = (patch) => setSlots((all) => all.map((s, i) => (i === cur ? { ...s, ...patch } : s)));

  const save = async () => {
    setError('');
    try {
      await saveQuestion(q.slot, q);
      update({ filled: true });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
      if (cur < 14) setCur(cur + 1); // passa automaticamente à questão seguinte
    } catch (err) {
      setError(err.message);
    }
  };

  const pillKind = { mcq: 'mcq', text: 'txt', photo: 'foto' };
  const pillLabel = { mcq: 'MCQ', text: 'Texto', photo: 'Foto' };

  return (
    <>
      <ProfTopbar />
      <div className="wrap" style={{ maxWidth: 1160 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Banco de questões</h1>
        <Steps current={2} />
        <div className="row">
          <div className="col" style={{ flex: 1.4 }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>15 slots · carrega uma imagem por questão</h3>
                <span className="sm mut"><b style={{ color: 'var(--dark)' }}>{filled}/15</b> carregadas</span>
              </div>
              <div className="prog" style={{ height: 8, marginBottom: 20 }}>
                <div style={{ width: `${(filled / 15) * 100}%` }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                {slots.map((s, i) => (
                  <button
                    key={s.slot}
                    onClick={() => setCur(i)}
                    style={{
                      aspectRatio: '1', borderRadius: 12, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12,
                      border: i === cur ? '2px solid var(--orange)' : s.filled ? '1.5px solid var(--brd)' : '1.5px dashed #C9C9D2',
                      background: i === cur ? 'var(--orange-l)' : s.filled ? 'linear-gradient(135deg,#EEEEF0,#E2E2E6)' : '#fff',
                      color: s.filled ? 'var(--dark)' : 'var(--mut)',
                    }}
                  >
                    <b className="mont">{s.slot}</b>
                    {s.filled ? <>🖼 <Pill kind={pillKind[s.type]}>{pillLabel[s.type]}</Pill></> : '+ imagem'}
                  </button>
                ))}
              </div>
            </div>
            <div className="card" style={{ marginTop: 20 }}>
              <div className="sm mut">Distribuição recomendada:</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Pill kind="mcq">☑ MCQ ~50% (8)</Pill>
                <Pill kind="txt">📝 Texto ~30% (4)</Pill>
                <Pill kind="foto">📷 Foto ~20% (3)</Pill>
              </div>
            </div>
          </div>

          <div className="col">
            <div className="card" style={{ borderTop: '4px solid var(--orange)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Questão {q.slot}</h3>

              {/* TODO: upload real da imagem (Cloudinary/S3 na spec) */}
              {q.image ? (
                <div className="ph" style={{ height: 150, marginBottom: 8 }}>
                  <div style={{ fontSize: 28 }}>🖼</div>
                  <div className="xs">{q.image}</div>
                </div>
              ) : (
                <label className="ph" style={{ height: 150, marginBottom: 8, cursor: 'pointer', borderColor: 'var(--orange)' }}>
                  <div style={{ fontSize: 28 }}>＋</div>
                  <div className="xs">Carregar imagem da questão</div>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && update({ image: e.target.files[0].name })} />
                </label>
              )}
              {q.image && (
                <button className="btn sm ghost" style={{ marginBottom: 16 }} onClick={() => update({ image: null })}>Substituir imagem</button>
              )}

              <label className="label">Tipo de questão</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {TYPES.map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => update({ type: id })}
                    style={{
                      flex: 1, borderRadius: 10, padding: 10, textAlign: 'center', fontSize: 13, fontWeight: 600,
                      border: q.type === id ? '2px solid var(--blue)' : '1.5px solid var(--brd)',
                      background: q.type === id ? 'var(--blue-l)' : '#fff',
                      color: q.type === id ? 'var(--dark)' : 'var(--mut)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {q.type === 'mcq' && (
                <>
                  <label className="label">Opções (marca a correcta)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {q.options.map((opt, i) => (
                      <div key={i} className={`opt ${q.correct === i ? 'sel' : ''}`} style={{ padding: '8px 12px', gap: 10 }}>
                        <button className="k" style={{ border: 'none', cursor: 'pointer' }} title="Marcar como correcta" onClick={() => update({ correct: i })}>
                          {'ABCD'[i]}
                        </button>
                        <input
                          className="sm"
                          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Poppins' }}
                          value={opt}
                          placeholder={`Opção ${'ABCD'[i]}`}
                          onChange={(e) => update({ options: q.options.map((o, j) => (j === i ? e.target.value : o)) })}
                        />
                        {q.correct === i && <b className="xs" style={{ color: 'var(--orange)' }}>✓ correcta</b>}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {q.type === 'text' && (
                <div className="sm mut" style={{ background: 'var(--bg)', borderRadius: 12, padding: 14, marginBottom: 20 }}>
                  📝 O aluno responde num campo de texto livre (máx. 2000 caracteres). Correcção manual.
                </div>
              )}
              {q.type === 'photo' && (
                <div className="sm mut" style={{ background: 'var(--bg)', borderRadius: 12, padding: 14, marginBottom: 20 }}>
                  📷 O aluno fotografa a resolução em papel e faz upload. Correcção manual.
                </div>
              )}

              {savedMsg && <div className="sm" style={{ background: 'var(--green-l)', color: 'var(--green)', borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>✓ Questão guardada.</div>}
              <button className="btn sm" style={{ width: '100%' }} onClick={save}>Guardar questão {q.slot}</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn ghost" onClick={() => navigate('/prof/maratonas/nova')}>← Dados da maratona</button>
            <button className="btn ghost" onClick={() => navigate('/prof/maratonas')} title="As questões guardadas ficam no rascunho">
              Guardar rascunho ({filled}/15)
            </button>
          </div>
          <button
            className="btn"
            disabled={filled < 15 || publishing}
            title={filled < 15 ? `Faltam ${15 - filled} questões` : ''}
            onClick={async () => {
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
            }}
          >
            {filled < 15 ? `Publicar (faltam ${15 - filled} questões)` : publishing ? 'A publicar…' : 'Publicar maratona ✓'}
          </button>
        </div>
        {error && (
          <div className="sm" style={{ background: 'var(--red-l, #fdecec)', color: 'var(--red, #c0392b)', borderRadius: 10, padding: '12px 16px', marginTop: 12 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'none' }}>
        </div>
      </div>
    </>
  );
}
