import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Notices from './pages/Notices';
import Devotional from './pages/Devotional';
import Gallery from './pages/Gallery';
import MemberArea from './pages/MemberArea';
import Admin from './pages/Admin';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import Ficha from './pages/Ficha';
import { trackPageView } from './lib/analytics';

// Nomes amigáveis para cada rota
const PAGE_TITLES: Record<string, string> = {
  '/':           'Home • AOGIM Conect',
  '/avisos':     'Avisos • AOGIM Conect',
  '/devocional': 'Devocional • AOGIM Conect',
  '/galeria':    'Galeria • AOGIM Conect',
  '/membro':     'Área do Membro • AOGIM Conect',
  '/admin':      'Admin • AOGIM Conect',
  '/cadastro':   'Cadastro • AOGIM Conect',
  '/login':      'Login • AOGIM Conect',
  '/ficha':      'Ficha • AOGIM Conect',
};

/** Componente interno que escuta mudanças de rota e envia page_view ao GA4 */
function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] ?? document.title;
    trackPageView(location.pathname, title);
  }, [location.pathname]);
  return null;
}

const App: React.FC = () => {
  return (
    <Router>
      <RouteTracker />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/avisos" element={<Notices />} />
          <Route path="/devocional" element={<Devotional />} />
          <Route path="/galeria" element={<Gallery />} />
          <Route path="/membro" element={<MemberArea />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/ficha" element={<Ficha />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;