
import React from 'react';
import { Home, Bell, BookOpen, Image, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Início', path: '/', icon: Home },
    { label: 'Avisos', path: '/avisos', icon: Bell },
    { label: 'Devocional', path: '/devocional', icon: BookOpen },
    { label: 'Galeria', path: '/galeria', icon: Image },
    { label: 'Membro', path: '/membro', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center p-0 md:p-6 pointer-events-none">
      <nav className="w-full md:max-w-2xl bg-white/90 backdrop-blur-xl border-t md:border border-slate-200 px-2 md:px-6 py-1 md:py-3 md:rounded-3xl flex justify-around items-center shadow-lg pointer-events-auto transition-all duration-500">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 px-3 md:px-6 rounded-2xl transition-all duration-300 ${
                isActive ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon className={`w-5 h-5 md:w-6 md:h-6 ${isActive ? 'fill-blue-600/10' : ''}`} />
              <span className="text-[10px] md:text-xs mt-1 font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Navbar;
