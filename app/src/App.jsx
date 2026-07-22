import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { currentUser, refreshUser } from './services/api.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Marathons from './pages/Marathons.jsx';
import MarathonDetail from './pages/MarathonDetail.jsx';
import Countdown from './pages/Countdown.jsx';
import Session from './pages/Session.jsx';
import Submitted from './pages/Submitted.jsx';
import Results from './pages/Results.jsx';
import ResultDetail from './pages/ResultDetail.jsx';
import Terms from './pages/Terms.jsx';
import Profile from './pages/Profile.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import ProfDashboard from './pages/prof/Dashboard.jsx';
import CreateMarathon from './pages/prof/CreateMarathon.jsx';
import Questions from './pages/prof/Questions.jsx';
import Monitor from './pages/prof/Monitor.jsx';
import Queue from './pages/prof/Queue.jsx';
import Validate from './pages/prof/Validate.jsx';
import Stats from './pages/prof/Stats.jsx';
import ProfChats from './pages/prof/Chats.jsx';
import ProfMarathons from './pages/prof/Marathons.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import RegisterProfessor from './pages/admin/RegisterProfessor.jsx';
import Users from './pages/admin/Users.jsx';
import GlobalStats from './pages/admin/GlobalStats.jsx';
import Plans from './pages/admin/Plans.jsx';
import MarathonData from './pages/admin/MarathonData.jsx';
import AdminMarathons from './pages/admin/Marathons.jsx';
import Support from './pages/admin/Support.jsx';

function Private({ children }) {
  const user = currentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/alterar-senha" replace />;
  if (user.role === 'professor') return <Navigate to="/prof" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}

function PrivateAdmin({ children }) {
  const user = currentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/alterar-senha" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function PrivateProf({ children }) {
  const user = currentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/alterar-senha" replace />;
  if (user.role !== 'professor') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  // Re-sincroniza o utilizador com o backend uma vez ao carregar a app
  // (F5 inclusive) — sem isto, mudanças feitas pelo admin (plano,
  // suspensão) só apareciam depois de sair e voltar a entrar, mesmo
  // com a página actualizada, porque currentUser() só lia a fotografia
  // gravada no sessionStorage no momento do login.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    refreshUser().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--mut)' }}>A carregar…</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registo" element={<Register />} />
        <Route path="/termos" element={<Terms />} />
        <Route path="/recuperar-senha" element={<ForgotPassword />} />
        <Route path="/alterar-senha" element={<ChangePassword />} />
        <Route path="/" element={<Private><Dashboard /></Private>} />
        <Route path="/maratonas" element={<Private><Marathons /></Private>} />
        <Route path="/maratonas/:id" element={<Private><MarathonDetail /></Private>} />
        <Route path="/maratonas/:id/countdown" element={<Private><Countdown /></Private>} />
        <Route path="/maratonas/:id/sessao" element={<Private><Session /></Private>} />
        <Route path="/maratonas/:id/submetido" element={<Private><Submitted /></Private>} />
        <Route path="/perfil" element={<Private><Profile /></Private>} />
        <Route path="/resultados" element={<Private><Results /></Private>} />
        <Route path="/resultados/:id" element={<Private><ResultDetail /></Private>} />
        <Route path="/prof" element={<PrivateProf><ProfDashboard /></PrivateProf>} />
        <Route path="/prof/maratonas" element={<PrivateProf><ProfMarathons /></PrivateProf>} />
        <Route path="/prof/maratonas/nova" element={<PrivateProf><CreateMarathon /></PrivateProf>} />
        <Route path="/prof/maratonas/nova/questoes" element={<PrivateProf><Questions /></PrivateProf>} />
        <Route path="/prof/monitorizacao/:id" element={<PrivateProf><Monitor /></PrivateProf>} />
        <Route path="/prof/validacao" element={<PrivateProf><Queue /></PrivateProf>} />
        <Route path="/prof/validacao/:id" element={<PrivateProf><Validate /></PrivateProf>} />
        <Route path="/prof/estatisticas/:id" element={<PrivateProf><Stats /></PrivateProf>} />
        <Route path="/prof/chats" element={<PrivateProf><ProfChats /></PrivateProf>} />
        <Route path="/admin" element={<PrivateAdmin><AdminDashboard /></PrivateAdmin>} />
        <Route path="/admin/professores/novo" element={<PrivateAdmin><RegisterProfessor /></PrivateAdmin>} />
        <Route path="/admin/utilizadores" element={<PrivateAdmin><Users /></PrivateAdmin>} />
        <Route path="/admin/estatisticas" element={<PrivateAdmin><GlobalStats /></PrivateAdmin>} />
        <Route path="/admin/planos" element={<PrivateAdmin><Plans /></PrivateAdmin>} />
        <Route path="/admin/maratonas" element={<PrivateAdmin><AdminMarathons /></PrivateAdmin>} />
        <Route path="/admin/maratonas/:id" element={<PrivateAdmin><MarathonData /></PrivateAdmin>} />
        <Route path="/admin/suporte" element={<PrivateAdmin><Support /></PrivateAdmin>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
