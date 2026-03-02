import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
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

const App: React.FC = () => {
  return (
    <Router>
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