import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const DRIVE_URL = "https://drive.google.com/drive/folders/1rvTtzvidSVv-95O14-z90W6Foz1K9l7n?usp=sharing";

const Gallery: React.FC = () => {
  const navigate = useNavigate();

  const [featured, setFeatured]               = useState<string[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [slide, setSlide]                     = useState(0);
  const [slideDir, setSlideDir]               = useState<'next'|'prev'>('next');
  const [sliding, setSliding]                 = useState(false);
  const intervalRef                            = useRef<ReturnType<typeof setInterval>|null>(null);
  const touchStartRef                          = useRef<number|null>(null);

  useEffect(() => { fetchFeatured(); }, []);

  const fetchFeatured = async () => {
    setFeaturedLoading(true);
    try {
      const res = await fetch("/.netlify/functions/drive-fotos");
      const json = await res.json();
      const urls: string[] = (json.fotos ?? []).map((f: { url: string }) => f.url);
      setFeatured(urls.slice(0, 7));
    } catch {
      setFeatured([]);
    } finally {
      setFeaturedLoading(false);
    }
  };

  const goSlide = useCallback((dir: 'next'|'prev') => {
    if (sliding || featured.length < 2) return;
    setSliding(true);
    setSlideDir(dir);
    setSlide(prev =>
      dir === 'next'
        ? (prev + 1 >= featured.length ? 0 : prev + 1)
        : (prev - 1 < 0 ? featured.length - 1 : prev - 1)
    );
    setTimeout(() => setSliding(false), 480);
  }, [sliding, featured.length]);

  useEffect(() => {
    if (featured.length < 2) return;
    intervalRef.current = setInterval(() => goSlide('next'), 4500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [featured.length, goSlide]);

  const resetInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (featured.length < 2) return;
    intervalRef.current = setInterval(() => goSlide('next'), 4500);
  };

  const manualSlide = (dir: 'next'|'prev') => { resetInterval(); goSlide(dir); };
  const goToSlide = (i: number) => {
    if (i === slide) return;
    resetInterval();
    setSlideDir(i > slide ? 'next' : 'prev');
    setSliding(true);
    setSlide(i);
    setTimeout(() => setSliding(false), 480);
  };

  const onTouchStart = (e: React.TouchEvent) => { touchStartRef.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 44) manualSlide(diff > 0 ? 'next' : 'prev');
    touchStartRef.current = null;
  };

  return (
    <>
      <style>{`
        @keyframes glSlNext { from{opacity:0;transform:translateX(5%)} to{opacity:1;transform:translateX(0)} }
        @keyframes glSlPrev { from{opacity:0;transform:translateX(-5%)} to{opacity:1;transform:translateX(0)} }
        @keyframes glSpin   { to{transform:rotate(360deg)} }

        .gl-root { font-family:'Lato',sans-serif; min-height:100vh; background:#F0F4FF; }

        /* Hero */
        .gl-hero {
          background:linear-gradient(145deg,#1e3a8a,#1E40AF 60%,#1d4ed8);
          padding:40px 20px 52px; position:relative; overflow:hidden;
          border-radius:0 0 2rem 2rem;
        }
        .gl-hero::before { content:''; position:absolute; top:-70px; right:-50px; width:300px; height:300px; border-radius:50%; background:radial-gradient(circle,rgba(255,255,255,.07) 0%,transparent 70%); pointer-events:none; }
        .gl-hero-inner { position:relative; z-index:2; max-width:900px; margin:0 auto; display:flex; flex-direction:column; gap:12px; }
        .gl-hero-kicker { font-size:10px; letter-spacing:.26em; text-transform:uppercase; color:rgba(255,255,255,.65); font-weight:700; display:flex; align-items:center; gap:8px; }
        .gl-hero-kicker::before { content:''; width:28px; height:1px; background:rgba(255,255,255,.3); }
        .gl-hero-title { font-family:'Playfair Display',Georgia,serif; font-size:clamp(26px,7vw,40px); font-weight:700; color:#fff; margin:0; line-height:1.1; }
        .gl-hero-sub { font-family:'Playfair Display',Georgia,serif; font-size:clamp(13px,3.5vw,16px); color:rgba(255,255,255,.65); font-style:italic; margin:0; }
        .gl-back-btn { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.18); border-radius:999px; padding:6px 14px; font-size:11px; font-weight:700; color:rgba(255,255,255,.85); cursor:pointer; transition:background .18s; font-family:'Lato',sans-serif; margin-top:6px; }
        .gl-back-btn:hover { background:rgba(255,255,255,.2); }

        /* Barra âmbar */
        .gl-amber-bar { height:3px; background:linear-gradient(90deg,rgba(217,119,6,0.3),rgba(251,191,36,0.9) 40%,rgba(251,191,36,0.9) 60%,rgba(217,119,6,0.3)); }

        /* Carrossel */
        .gl-carousel-section { max-width:900px; margin:0 auto; padding:28px 0 0; }
        .gl-carousel-label { font-size:10px; letter-spacing:.22em; text-transform:uppercase; color:#1E40AF; font-weight:700; padding:0 16px; margin-bottom:14px; display:flex; align-items:center; gap:10px; }
        .gl-carousel-label::after { content:''; flex:1; height:1px; background:linear-gradient(90deg,#DDE3F0,transparent); }

        .gl-carousel-wrap {
          position:relative; overflow:hidden; border-radius:0;
          aspect-ratio:16/9; background:#0a1630;
        }
        @media(min-width:520px){ .gl-carousel-wrap { border-radius:20px; margin:0 14px; } }

        .gl-carousel-img {
          position:absolute; inset:0; width:100%; height:100%;
          object-fit:cover; display:block;
        }
        .gl-carousel-img-next { animation:glSlNext 480ms cubic-bezier(.16,1,.3,1) forwards; }
        .gl-carousel-img-prev { animation:glSlPrev 480ms cubic-bezier(.16,1,.3,1) forwards; }

        .gl-carousel-overlay {
          position:absolute; inset:0;
          background:linear-gradient(to top, rgba(10,22,48,.55) 0%, transparent 42%);
          pointer-events:none; z-index:2;
        }

        .gl-carousel-nav {
          position:absolute; top:50%; transform:translateY(-50%); z-index:10;
          width:38px; height:38px; border-radius:50%;
          background:rgba(0,0,0,.32); border:1px solid rgba(255,255,255,.18);
          color:#fff; display:grid; place-items:center; cursor:pointer; transition:background .18s;
        }
        .gl-carousel-nav:hover { background:rgba(0,0,0,.55); }
        .gl-carousel-nav-l { left:10px; }
        .gl-carousel-nav-r { right:10px; }

        .gl-carousel-dots {
          position:absolute; bottom:14px; left:50%; transform:translateX(-50%);
          display:flex; gap:7px; z-index:10;
        }
        .gl-carousel-dot {
          width:7px; height:7px; border-radius:50%;
          background:rgba(255,255,255,.4); border:none; padding:0; cursor:pointer;
          transition:background .22s, transform .22s;
        }
        .gl-carousel-dot-active { background:rgba(251,191,36,.95); transform:scale(1.3); }

        /* Loading spinner */
        .gl-spinner { width:32px; height:32px; border:2px solid #DDE3F0; border-top-color:#1E40AF; border-radius:50%; animation:glSpin .85s linear infinite; }

        /* Botão Drive */
        .gl-drive-section { max-width:900px; margin:0 auto; padding:20px 14px 40px; }
        .gl-drive-card {
          border-radius:18px;
          background:linear-gradient(130deg,#1e3a8a,#1E40AF);
          padding:22px; display:flex; align-items:center; gap:18px;
          border:1px solid rgba(255,255,255,.08);
          box-shadow:0 4px 24px rgba(30,64,175,.22);
        }
        .gl-drive-icon {
          width:52px; height:52px; border-radius:14px; flex-shrink:0;
          background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.18);
          display:grid; place-items:center;
        }
        .gl-drive-text { flex:1; }
        .gl-drive-label { font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:rgba(255,255,255,.6); font-weight:700; margin:0 0 4px; }
        .gl-drive-title { font-family:'Playfair Display',Georgia,serif; font-size:17px; font-weight:700; color:#fff; margin:0 0 3px; }
        .gl-drive-sub { font-size:12px; color:rgba(255,255,255,.65); margin:0; }
        .gl-drive-btn {
          display:inline-flex; align-items:center; gap:7px;
          background:rgba(251,191,36,.92); color:#1a0e00; border:none;
          border-radius:12px; padding:11px 18px; font-size:13px; font-weight:800;
          cursor:pointer; font-family:'Lato',sans-serif; transition:background .18s; white-space:nowrap;
          text-decoration:none;
        }
        .gl-drive-btn:hover { background:rgba(251,191,36,1); }
      `}</style>

      <div className="gl-root">

        <header className="gl-hero">
          <div className="gl-hero-inner">
            <p className="gl-hero-kicker">Memórias</p>
            <h1 className="gl-hero-title">Galeria do<br />Último Culto</h1>
            <p className="gl-hero-sub">Momentos especiais registrados para a glória de Deus.</p>
            <button className="gl-back-btn" onClick={() => navigate('/')}>← Voltar ao início</button>
          </div>
        </header>

        <div className="gl-amber-bar" />

        {/* Carrossel */}
        {!featuredLoading && featured.length > 0 && (
          <section className="gl-carousel-section">
            <p className="gl-carousel-label">Destaques da Semana</p>
            <div className="gl-carousel-wrap" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
              <img
                key={slide}
                src={featured[slide]}
                alt={`Destaque ${slide + 1}`}
                className={`gl-carousel-img ${slideDir === 'next' ? 'gl-carousel-img-next' : 'gl-carousel-img-prev'}`}
              />
              <div className="gl-carousel-overlay" />
              {featured.length > 1 && (
                <>
                  <button className="gl-carousel-nav gl-carousel-nav-l" onClick={() => manualSlide('prev')} aria-label="Anterior">
                    <ChevronLeft size={18} />
                  </button>
                  <button className="gl-carousel-nav gl-carousel-nav-r" onClick={() => manualSlide('next')} aria-label="Próximo">
                    <ChevronRight size={18} />
                  </button>
                  <div className="gl-carousel-dots">
                    {featured.map((_, i) => (
                      <button
                        key={i}
                        className={`gl-carousel-dot ${i === slide ? 'gl-carousel-dot-active' : ''}`}
                        onClick={() => goToSlide(i)}
                        aria-label={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {featuredLoading && (
          <div style={{display:'flex',justifyContent:'center',padding:'48px 0'}}>
            <div className="gl-spinner" />
          </div>
        )}

        {/* Botão Drive */}
        <div className="gl-drive-section">
          <div className="gl-drive-card">
            <div className="gl-drive-icon">
              <svg viewBox="0 0 87.3 78" fill="none" style={{width:28,height:28}}>
                <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="rgba(255,255,255,0.9)"/>
                <path d="M43.65 25L29.9 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5C.4 49.9 0 51.45 0 53h27.5z" fill="rgba(255,255,255,0.7)"/>
                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5c.8-1.4 1.2-2.95 1.2-4.5H59.8L73.55 76.8z" fill="rgba(255,255,255,0.9)"/>
                <path d="M43.65 25L57.4 0H29.9z" fill="rgba(255,255,255,0.5)"/>
                <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="rgba(255,255,255,0.8)"/>
                <path d="M87.3 53H59.8L43.65 25 29.9 0c1.35-.8 2.9-1.2 4.5-1.2h27.3c1.6 0 3.15.45 4.5 1.2z" fill="rgba(255,255,255,0.6)"/>
              </svg>
            </div>
            <div className="gl-drive-text">
              <p className="gl-drive-label">Álbum completo</p>
              <p className="gl-drive-title">Fotos do Culto</p>
              <p className="gl-drive-sub">Todas as fotos em alta qualidade</p>
            </div>
            <a href={DRIVE_URL} target="_blank" rel="noopener noreferrer" className="gl-drive-btn">
              <ExternalLink size={14} />
              Ver fotos
            </a>
          </div>
        </div>

      </div>
    </>
  );
};

export default Gallery;
