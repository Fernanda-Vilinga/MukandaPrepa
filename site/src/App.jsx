import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ScrollToTop from './components/ScrollToTop';
import Homepage from './pages/Homepage';
import Planos from './pages/Planos';
import Maratonas from './pages/Maratonas';
import AulasOnline from './pages/AulasOnline';
import Sobre from './pages/Sobre';
import Contactos from './pages/Contactos';
import Noticias from './pages/Noticias';
import Artigos from './pages/Artigos';
import Blog from './pages/Blog';
import Missao from './pages/Missao';
import Equipa from './pages/Equipa';
import Recursos from './pages/Recursos';
import IdentidadeVisual from './pages/IdentidadeVisual';
import PaginaNaoEncontrada from './pages/PaginaNaoEncontrada';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/planos" element={<Planos />} />
          <Route path="/maratonas" element={<Maratonas />} />
          <Route path="/aulas-online" element={<AulasOnline />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/contactos" element={<Contactos />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/artigos" element={<Artigos />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/missao" element={<Missao />} />
          <Route path="/equipa" element={<Equipa />} />
          <Route path="/recursos" element={<Recursos />} />
          <Route path="/identidade-visual" element={<IdentidadeVisual />} />
          <Route path="*" element={<PaginaNaoEncontrada />} />
        </Route>
      </Routes>
    </>
  );
}
