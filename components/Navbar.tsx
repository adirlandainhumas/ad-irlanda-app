
import React from 'react';
import { Home, Bell, BookOpen, Image, User, HeartHandshake } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Início',      path: '/',          icon: Home },
    { label: 'Avisos',      path: '/avisos',     icon: Bell },
    { label: 'Devocional',  path: '/devocional', icon: BookOpen },
    { label: 'Galeria',     path: '/galeria',    icon: Image },
    { label: 'Oração',      path: '/oracao',     icon: HeartHandshake },
    { label: 'Membro',      path: '/membro',     icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <nav
        style={{
          background: '#fff',
          borderTop: '1px solid #E8E5E0',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '4px 8px',
        }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px 10px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? '#166534' : '#A8A29E',
                transition: 'color 0.15s',
                minWidth: 44,
              }}
            >
              <item.icon
                style={{ width: 20, height: 20 }}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                style={{
                  fontSize: 10,
                  marginTop: 3,
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: "'Lato', sans-serif",
                  letterSpacing: '0.01em',
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Navbar;
