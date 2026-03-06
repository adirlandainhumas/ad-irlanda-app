
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import { subscribeUserToPush } from '../lib/pushSubscription';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoError, setLogoError] = useState(false);

  // Solicita permissão de notificação push após 10s (somente se ainda não decidiu)
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    const timer = setTimeout(() => subscribeUserToPush(), 10_000);
    return () => clearTimeout(timer);
  }, []);
  // Logo com escrita escura — usada no cabeçalho (fundo claro)
  const logoUrl = "https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo-dark.png";

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-28 bg-slate-50">
      <header className="fixed top-0 left-0 right-0 h-16 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 max-w-7xl mx-auto w-full">
          {/* Logo + título clicável → volta para o início */}
          <Link to="/" className="flex items-center gap-3 no-underline group" aria-label="Ir para o início">
            {!logoError ? (
              <img
                src={logoUrl}
                alt="Logo AD Irlanda"
                className="h-8 md:h-10 w-auto object-contain transition-opacity group-hover:opacity-80"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-9 h-9 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity group-hover:opacity-80">
                <span className="text-white font-bold text-base tracking-tighter">AD</span>
              </div>
            )}
            <div className="flex flex-col justify-center">
              <h1 className="text-blue-900 font-black text-xs md:text-sm leading-none uppercase tracking-widest transition-colors group-hover:text-blue-600">Ministério Irlanda</h1>
              <p className="text-slate-400 text-[9px] md:text-[10px] uppercase font-bold tracking-tighter mt-0.5">Inhumas - GO</p>
            </div>
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto overflow-x-hidden pt-16">
        {children}
      </main>
      <Navbar />
    </div>
  );
};

export default Layout;
