
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import { subscribeUserToPush } from '../lib/pushSubscription';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    const timer = setTimeout(() => subscribeUserToPush(), 10_000);
    return () => clearTimeout(timer);
  }, []);

  const logoUrl = "https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo-dark.png.png";

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: 72, background: '#FAFAF8' }}>
      <header
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          height: 56,
          zIndex: 30,
          background: '#fff',
          borderBottom: '1px solid #E8E5E0',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', maxWidth: 900, margin: '0 auto', width: '100%' }}>
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
            aria-label="Ir para o início"
          >
            {!logoError ? (
              <img
                src={logoUrl}
                alt="Logo AD Irlanda"
                style={{ height: 32, width: 'auto', objectFit: 'contain' }}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div
                style={{
                  width: 32, height: 32,
                  background: '#166534',
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 13, letterSpacing: '-0.02em' }}>AD</span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span
                style={{
                  color: '#1C1917',
                  fontWeight: 900,
                  fontSize: 11,
                  lineHeight: 1,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontFamily: "'Lato', sans-serif",
                }}
              >
                Ministério Irlanda
              </span>
              <span
                style={{
                  color: '#A8A29E',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  marginTop: 2,
                  fontFamily: "'Lato', sans-serif",
                }}
              >
                Inhumas — GO
              </span>
            </div>
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, width: '100%', maxWidth: 900, margin: '0 auto', overflowX: 'hidden', paddingTop: 56 }}>
        {children}
      </main>

      <Navbar />
    </div>
  );
};

export default Layout;
