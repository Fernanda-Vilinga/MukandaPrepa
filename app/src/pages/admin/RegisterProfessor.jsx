// Registar professor — formulário EXCLUSIVO do admin (spec: sem auto-registo).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerProfessor } from '../../services/adminApi.js';
import { AdminTopbar } from '../../components/AdminUi.jsx';
import { AREAS } from '../../data/mock.js';

const genPassword = () => `MKP-2026-tmp${Math.floor(1000 + Math.random() * 9000)}`;

export default function RegisterProfessor() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', area: '', disciplines: '', tempPassword: genPassword() });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const complete = form.name && form.email && form.area;

  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await registerProfessor(form);
      // Sucesso → abre a gestão de utilizadores para o admin confirmar o registo
      navigate('/admin/utilizadores');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AdminTopbar />
      <div className="wrap" style={{ maxWidth: 980 }}>
        <div className="sm mut" style={{ marginBottom: 16 }}>
          <Link to="/admin/utilizadores" style={{ textDecoration: 'none' }}>Utilizadores</Link> → <b style={{ color: 'var(--dark)' }}>Registar novo professor</b>
        </div>
        <div className="row">
          <div className="col" style={{ flex: 1.5 }}>
            <form className="card" style={{ padding: 36 }} onSubmit={submit}>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Registar novo professor</h1>
              <p className="mut sm" style={{ marginBottom: 28 }}>
                Formulário exclusivo da administração. Não existe auto-registo de professores na interface pública.
              </p>
              <div className="field">
                <label className="label">Nome completo</label>
                <input className="input" required value={form.name} onChange={set('name')} placeholder="Nome do professor" />
              </div>
              <div className="row" style={{ gap: 16 }}>
                <div className="col field">
                  <label className="label">Email institucional</label>
                  <input className="input" type="email" required value={form.email} onChange={set('email')} placeholder="nome@mukandaprepa.ao" />
                </div>
                <div className="col field">
                  <label className="label">Telefone</label>
                  <input className="input" value={form.phone} onChange={set('phone')} placeholder="+244 9XX XXX XXX" />
                </div>
              </div>
              <div className="row" style={{ gap: 16 }}>
                <div className="col field">
                  <label className="label">Área</label>
                  <select className="input" style={{ appearance: 'auto' }} required value={form.area} onChange={set('area')}>
                    <option value="" disabled>Escolher…</option>
                    {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="col field">
                  <label className="label">Disciplinas</label>
                  <input className="input" value={form.disciplines} onChange={set('disciplines')} placeholder="Ex.: Física, Matemática" />
                </div>
              </div>
              <div className="row" style={{ gap: 16, marginBottom: 24 }}>
                <div className="col field" style={{ marginBottom: 0 }}>
                  <label className="label">Senha temporária</label>
                  <input className="input" style={{ fontWeight: 600, letterSpacing: '.05em' }} value={form.tempPassword} onChange={set('tempPassword')} />
                </div>
                <div className="col field" style={{ marginBottom: 0 }}>
                  <label className="label">&nbsp;</label>
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ width: '100%', padding: '14px 16px' }}
                    onClick={() => setForm((f) => ({ ...f, tempPassword: genPassword() }))}
                  >
                    🎲 Gerar automaticamente
                  </button>
                </div>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'var(--blue-l)', color: 'var(--blue)' }}>Perfil: Professor</span>
                <span className="sm mut">Perfil bloqueado — os administradores só podem criar contas de professor por aqui.</span>
              </div>
              {error && (
                <div className="sm" style={{ background: 'var(--red-l, #fdecec)', color: 'var(--red, #c0392b)', borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
                  {error}
                </div>
              )}
              {done && (
                <div className="sm" style={{ background: 'var(--green-l)', color: 'var(--green)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                  ✓ Professor registado. Email de boas-vindas enviado com as credenciais.
                  <button type="button" className="btn sm ghost" style={{ marginLeft: 12 }} onClick={() => navigate('/admin/utilizadores')}>Ver utilizadores</button>
                </div>
              )}
              <button className="btn" style={{ width: '100%' }} disabled={!complete || busy}>
                {busy ? 'A registar…' : 'Registar e enviar email de boas-vindas'}
              </button>
              <div className="xs mut" style={{ textAlign: 'center', marginTop: 12 }}>
                O professor recebe as credenciais e é obrigado a alterar a senha no primeiro login.
              </div>
            </form>
          </div>

          <div className="col">
            <div className="card" style={{ background: 'var(--dark)', color: '#fff' }}>
              <div className="mont" style={{ fontWeight: 700, marginBottom: 12 }}>📧 Email automático</div>
              <div className="sm" style={{ color: '#B9BAC6', background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: 16 }}>
                <b style={{ color: '#fff' }}>Bem-vindo à MUKANDA PREPA</b><br /><br />
                Olá {form.name.split(' ')[0] || '—'}, a tua conta de professor foi criada.<br /><br />
                Email: {form.email || '—'}<br />
                Senha temporária: MKP-••••<br /><br />
                Entra em app.mukandaprepa.ao e define a tua nova senha.
              </div>
            </div>
            <div className="card" style={{ marginTop: 20 }}>
              <div className="mont" style={{ fontWeight: 700, marginBottom: 10 }}>O professor poderá:</div>
              <div className="sm mut" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>✓ Criar e publicar maratonas</div>
                <div>✓ Carregar bancos de 15 questões</div>
                <div>✓ Validar submissões</div>
                <div>✓ Monitorizar alunos ao vivo</div>
                <div>✓ Gerir o chat de dúvidas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
