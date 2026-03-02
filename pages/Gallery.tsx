import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, STORAGE_BASE_URL } from '../lib/supabase';
import { Loader2, Download, ChevronLeft, ChevronRight, X } from 'lucide-react';

const Gallery: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles]                 = useState<string[]>([]);
  const [loading, setLoading]             = useState(true);
  const [downloading, setDownloading]     = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [direction, setDirection]         = useState<'next' | 'prev' | null>(null);
  const [isAnimating, setIsAnimating]     = useState(false);

  useEffect(() => { fetchGallery(); }, []);

  const fetchGallery = async () => {
    setLoading(true);
    const { data } = await supabase.storage.from('galeria').list('ultimo-culto', {
      limit: 200, sortBy: { column: 'name', order: 'desc' },
    });
    if (data) {
      setFiles(data
        .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))
        .map(f => STORAGE_BASE_URL + f.name));
    }
    setLoading(false);
  };

  const openLightbox  = (i: number) => { setDirection(null); setLightboxIndex(i); };
  const closeLightbox = () => setLightboxIndex(null);

  const changePhoto = useCallback((newIndex: number, dir: 'next' | 'prev') => {
    if (isAnimating) return;
    setIsAnimating(true); setDirection(dir); setLightboxIndex(newIndex);
    setTimeout(() => setIsAnimating(false), 320);
  }, [isAnimating]);

  const nextPhoto = useCallback(() => {
    if (lightboxIndex === null || files.length <= 1) return;
    changePhoto(lightboxIndex + 1 >= files.length ? 0 : lightboxIndex + 1, 'next');
  }, [lightboxIndex, files.length, changePhoto]);

  const prevPhoto = useCallback(() => {
    if (lightboxIndex === null || files.length <= 1) return;
    changePhoto(lightboxIndex - 1 < 0 ? files.length - 1 : lightboxIndex - 1, 'prev');
  }, [lightboxIndex, files.length, changePhoto]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft')  prevPhoto();
      if (e.key === 'Escape')     closeLightbox();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [lightboxIndex, nextPhoto, prevPhoto]);

  const downloadImage = async (url: string, index: number) => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl; a.download = `AD-Irlanda-foto-${index + 1}.jpg`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch { window.open(url, '_blank'); }
    finally { setDownloading(false); }
  };

  // Distribui fotos em 3 colunas para masonry
  const columns: string[][] = [[], [], []];
  files.forEach((url, i) => columns[i % 3].push(url));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700;900&display=swap');
        * { box-sizing: border-box; }
        .gl-root { font-family:'Lato',sans-serif; min-height:100vh; background:#f0f4ff; }

        /* ── Hero ── */
        .gl-hero {
          background:linear-gradient(155deg,#060d20 0%,#0a1535 35%,#0e1d50 65%,#050f28 100%);
          padding:48px 20px 60px; position:relative; overflow:hidden;
          border-radius:0 0 3rem 3rem;
        }
        .gl-hero::before { content:''; position:absolute; top:-100px; right:-80px; width:400px; height:400px; border-radius:50%; background:radial-gradient(circle,rgba(0,120,255,.16) 0%,transparent 70%); pointer-events:none; }
        .gl-hero::after  { content:''; position:absolute; bottom:-60px; left:-60px; width:280px; height:280px; border-radius:50%; background:radial-gradient(circle,rgba(30,60,200,.12) 0%,transparent 70%); pointer-events:none; }

        /* Partículas */
        @keyframes glFloat { 0%{transform:translateY(0) rotate(0);opacity:0} 10%{opacity:1} 90%{opacity:.5} 100%{transform:translateY(-110vh) rotate(360deg);opacity:0} }
        .gl-particle { position:absolute; border-radius:50%; animation:glFloat linear infinite; pointer-events:none; }

        .gl-hero-inner { position:relative; z-index:2; max-width:900px; margin:0 auto; display:flex; flex-direction:column; gap:14px; }
        .gl-hero-kicker { font-size:10px; letter-spacing:.26em; text-transform:uppercase; color:rgba(80,180,255,.65); font-weight:700; display:flex; align-items:center; gap:8px; }
        .gl-hero-kicker::before { content:''; width:28px; height:1px; background:rgba(80,180,255,.4); }
        .gl-hero-title { font-family:'Playfair Display',Georgia,serif; font-size:clamp(30px,7vw,46px); font-weight:700; color:#fff; margin:0; line-height:1.1; }
        .gl-hero-sub { font-family:'Playfair Display',Georgia,serif; font-size:clamp(14px,3.5vw,18px); color:rgba(160,200,255,.6); font-style:italic; margin:0; max-width:420px; }
        .gl-hero-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:6px; }

        .gl-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); border-radius:999px; padding:6px 14px; font-size:11px; font-weight:700; color:rgba(180,220,255,.75); }
        .gl-back-btn { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); border-radius:999px; padding:6px 14px; font-size:11px; font-weight:700; color:rgba(180,220,255,.8); cursor:pointer; transition:background .18s,transform .18s; font-family:'Lato',sans-serif; }
        .gl-back-btn:hover { background:rgba(255,255,255,.14); transform:translateY(-1px); }

        /* ── Masonry grid ── */
        .gl-content { max-width:900px; margin:0 auto; padding:28px 14px 20px; }
        .gl-masonry { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; align-items:start; }
        @media(max-width:500px) { .gl-masonry { grid-template-columns:repeat(2,1fr); } }

        @keyframes glFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glSpin   { to{transform:rotate(360deg)} }

        .gl-col { display:flex; flex-direction:column; gap:10px; }

        .gl-item {
          position:relative; border-radius:16px; overflow:hidden;
          background:#c8d8f0; cursor:pointer;
          animation:glFadeUp .45s ease forwards; opacity:0;
          box-shadow:0 4px 20px rgba(10,20,60,.08);
          transition:transform .25s, box-shadow .25s;
        }
        .gl-item:hover { transform:translateY(-4px) scale(1.01); box-shadow:0 12px 40px rgba(10,20,60,.18); }

        /* Altura variada: 0,3,6,9... → tall; resto → normal */
        .gl-item-tall .gl-img { aspect-ratio: 3/4; }
        .gl-item-normal .gl-img { aspect-ratio: 4/3; }
        .gl-item-square .gl-img { aspect-ratio: 1; }

        .gl-img { width:100%; object-fit:cover; display:block; transition:transform .4s ease; }
        .gl-item:hover .gl-img { transform:scale(1.06); }

        /* Overlay com número */
        .gl-overlay {
          position:absolute; inset:0;
          background:linear-gradient(160deg,rgba(5,12,40,.0) 40%,rgba(5,12,40,.75) 100%);
          opacity:0; transition:opacity .28s;
          display:flex; flex-direction:column;
          justify-content:flex-end; padding:14px;
        }
        .gl-item:hover .gl-overlay { opacity:1; }
        .gl-overlay-num {
          font-family:'Playfair Display',Georgia,serif;
          font-size:11px; font-style:italic;
          color:rgba(180,220,255,.7); font-weight:400;
          letter-spacing:.06em;
        }
        .gl-overlay-cta {
          font-size:11px; font-weight:700; color:#fff;
          display:flex; align-items:center; gap:5px; margin-top:3px;
        }

        /* Borda brilhante no hover */
        .gl-item::after {
          content:''; position:absolute; inset:0; border-radius:16px;
          border:1.5px solid rgba(80,160,255,.0);
          transition:border-color .25s; pointer-events:none;
        }
        .gl-item:hover::after { border-color:rgba(80,160,255,.35); }

        /* ── Loading / Empty ── */
        .gl-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 0; gap:16px; }
        .gl-spinner { width:32px; height:32px; border:2px solid rgba(26,85,208,.12); border-top-color:rgba(26,85,208,.75); border-radius:50%; animation:glSpin .85s linear infinite; }
        .gl-loading-text { font-family:'Playfair Display',Georgia,serif; font-size:15px; font-style:italic; color:rgba(26,85,208,.4); }
        .gl-empty { text-align:center; padding:60px 24px; background:#fff; border-radius:24px; border:1px solid rgba(26,85,208,.07); }
        .gl-empty-icon { font-size:40px; margin-bottom:12px; }
        .gl-empty-text { font-family:'Playfair Display',Georgia,serif; font-size:16px; color:#7888aa; font-style:italic; margin:0 0 20px; }
        .gl-empty-btn { display:inline-flex; align-items:center; gap:7px; background:linear-gradient(130deg,#1a55d0,#0090ff); color:#fff; font-weight:800; font-size:14px; padding:12px 24px; border-radius:999px; border:none; cursor:pointer; font-family:'Lato',sans-serif; }

        /* ── Rodapé ── */
        .gl-footer {
          max-width:900px; margin:32px auto 0; padding:0 14px 60px;
        }
        .gl-footer-card {
          background:linear-gradient(135deg,#060d20,#0a1535);
          border-radius:24px; padding:24px 22px;
          display:flex; flex-direction:column; gap:16px;
          position:relative; overflow:hidden;
        }
        .gl-footer-card::before { content:''; position:absolute; top:-40px; right:-40px; width:180px; height:180px; border-radius:50%; background:radial-gradient(circle,rgba(0,120,255,.12) 0%,transparent 70%); pointer-events:none; }
        .gl-footer-label { font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:rgba(80,180,255,.55); font-weight:700; margin:0 0 6px; }
        .gl-footer-address { font-size:14px; color:rgba(200,220,255,.85); font-weight:600; line-height:1.6; margin:0; }
        .gl-footer-divider { height:1px; background:rgba(255,255,255,.07); }
        .gl-footer-social { display:flex; align-items:center; gap:10px; flex-wrap:wrap; position:relative; z-index:1; }
        .gl-footer-social-label { font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:rgba(80,180,255,.55); font-weight:700; flex:1; }

        .gl-social-btn {
          display:inline-flex; align-items:center; gap:7px;
          font-weight:700; font-size:12px; padding:8px 14px;
          border-radius:999px; text-decoration:none; border:none;
          transition:transform .18s, box-shadow .18s; cursor:pointer;
        }
        .gl-social-btn:hover { transform:translateY(-2px); }
        .gl-social-ig { background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045); color:#fff; box-shadow:0 4px 14px rgba(130,50,180,.3); }
        .gl-social-yt { background:#FF0000; color:#fff; box-shadow:0 4px 14px rgba(255,0,0,.25); }

        /* ── Lightbox cinematográfico ── */
        @keyframes glLbIn   { from{opacity:0} to{opacity:1} }
        @keyframes glSlNext { from{opacity:0;transform:translateX(30px) scale(.96)} to{opacity:1;transform:none} }
        @keyframes glSlPrev { from{opacity:0;transform:translateX(-30px) scale(.96)} to{opacity:1;transform:none} }

        .gl-lb { position:fixed; inset:0; z-index:200; display:flex; flex-direction:column; background:rgba(1,5,18,.96); backdrop-filter:blur(12px); animation:glLbIn .22s ease; }

        .gl-lb-bar { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; flex-shrink:0; border-bottom:1px solid rgba(255,255,255,.05); }
        .gl-lb-bar-left { display:flex; flex-direction:column; gap:2px; }
        .gl-lb-brand { font-family:'Playfair Display',Georgia,serif; font-size:12px; color:rgba(150,200,255,.5); font-style:italic; }
        .gl-lb-counter { font-size:18px; font-weight:900; color:rgba(255,255,255,.85); line-height:1; }
        .gl-lb-counter span { font-size:12px; font-weight:400; color:rgba(255,255,255,.3); }
        .gl-lb-close { width:36px; height:36px; border-radius:50%; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.05); color:rgba(200,220,255,.75); display:grid; place-items:center; cursor:pointer; transition:background .18s; }
        .gl-lb-close:hover { background:rgba(255,255,255,.12); }

        .gl-lb-main { flex:1; display:flex; overflow:hidden; min-height:0; }

        /* Área central da imagem */
        .gl-lb-stage { flex:1; position:relative; display:flex; align-items:center; justify-content:center; padding:12px 52px; overflow:hidden; }
        .gl-lb-bg { position:absolute; inset:0; }
        .gl-lb-bg img { width:100%; height:100%; object-fit:cover; opacity:.05; filter:blur(50px); transform:scale(1.3); }

        .gl-lb-nav { position:absolute; top:50%; transform:translateY(-50%); z-index:10; width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); color:rgba(200,220,255,.8); display:grid; place-items:center; cursor:pointer; transition:background .18s; }
        .gl-lb-nav:hover { background:rgba(255,255,255,.13); }
        .gl-lb-nav-l { left:8px; }
        .gl-lb-nav-r { right:8px; }

        .gl-lb-img-wrap { position:relative; z-index:2; max-width:100%; max-height:100%; display:flex; align-items:center; justify-content:center; }
        .gl-lb-img-wrap-next { animation:glSlNext 320ms cubic-bezier(.16,1,.3,1) forwards; }
        .gl-lb-img-wrap-prev { animation:glSlPrev 320ms cubic-bezier(.16,1,.3,1) forwards; }
        .gl-lb-img { max-width:100%; max-height:calc(100vh - 200px); object-fit:contain; border-radius:12px; box-shadow:0 32px 80px rgba(0,0,0,.7); display:block; }

        /* Painel de miniaturas lateral (desktop) */
        .gl-lb-thumbs { width:90px; flex-shrink:0; overflow-y:auto; padding:10px 8px; display:flex; flex-direction:column; gap:6px; border-left:1px solid rgba(255,255,255,.05); scrollbar-width:none; }
        .gl-lb-thumbs::-webkit-scrollbar { display:none; }
        @media(max-width:600px) { .gl-lb-thumbs { display:none; } }

        .gl-lb-thumb { width:100%; aspect-ratio:1; border-radius:8px; overflow:hidden; cursor:pointer; opacity:.4; transition:opacity .2s, transform .2s; border:1.5px solid transparent; flex-shrink:0; }
        .gl-lb-thumb:hover { opacity:.75; transform:scale(1.04); }
        .gl-lb-thumb-active { opacity:1 !important; border-color:rgba(80,160,255,.7); }
        .gl-lb-thumb img { width:100%; height:100%; object-fit:cover; display:block; }

        /* Footer do lightbox */
        .gl-lb-foot { flex-shrink:0; padding:12px 18px 16px; border-top:1px solid rgba(255,255,255,.05); display:flex; align-items:center; justify-content:center; }
        .gl-lb-download { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(130deg,#1a55d0,#0090ff); color:#fff; font-weight:800; font-size:14px; padding:12px 28px; border-radius:999px; border:none; cursor:pointer; font-family:'Lato',sans-serif; box-shadow:0 6px 24px rgba(26,85,208,.4); transition:transform .18s,box-shadow .18s; }
        .gl-lb-download:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(26,85,208,.5); }
        .gl-lb-download:disabled { opacity:.5; cursor:not-allowed; transform:none; }
      `}</style>

      <div className="gl-root">

        {/* Hero com partículas */}
        <header className="gl-hero">
          {[...Array(20)].map((_, i) => {
            const size  = Math.random() * 3 + 1;
            const left  = Math.random() * 100;
            const delay = Math.random() * 8;
            const dur   = Math.random() * 10 + 12;
            return (
              <div key={i} className="gl-particle" style={{
                width: size, height: size,
                left: `${left}%`, bottom: -10,
                background: `hsl(${200 + Math.random()*40},80%,${70 + Math.random()*30}%)`,
                opacity: Math.random() * 0.4 + 0.1,
                animationDuration: `${dur}s`,
                animationDelay: `${delay}s`,
              }} />
            );
          })}
          <div className="gl-hero-inner">
            <p className="gl-hero-kicker">Memórias</p>
            <h1 className="gl-hero-title">Galeria do<br />Último Culto</h1>
            <p className="gl-hero-sub">Momentos especiais registrados para a glória de Deus.</p>
            <div className="gl-hero-row">
              {!loading && files.length > 0 && (
                <span className="gl-pill">
                  <svg viewBox="0 0 16 16" fill="currentColor" style={{width:11,height:11}}>
                    <path d="M10.5 8.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                    <path d="M2 4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1.172a2 2 0 01-1.414-.586l-.828-.828A2 2 0 009.172 2H6.828a2 2 0 00-1.414.586l-.828.828A2 2 0 012.172 4H2zm.5 2a.5.5 0 110-1 .5.5 0 010 1zm9 2.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z"/>
                  </svg>
                  {files.length} {files.length === 1 ? 'foto' : 'fotos'}
                </span>
              )}
              <button className="gl-back-btn" onClick={() => navigate('/')}>← Voltar ao início</button>
            </div>
          </div>
        </header>

        {/* Grid masonry */}
        <div className="gl-content">
          {loading && (
            <div className="gl-loading">
              <div className="gl-spinner" />
              <p className="gl-loading-text">Carregando galeria…</p>
            </div>
          )}

          {!loading && files.length === 0 && (
            <div className="gl-empty">
              <div className="gl-empty-icon">🖼</div>
              <p className="gl-empty-text">Nenhuma foto disponível no momento.</p>
              <button className="gl-empty-btn" onClick={() => navigate('/')}>← Voltar ao início</button>
            </div>
          )}

          {!loading && files.length > 0 && (
            <div className="gl-masonry">
              {columns.map((col, ci) => (
                <div key={ci} className="gl-col">
                  {col.map((url, ri) => {
                    const globalIdx = ci + ri * 3;
                    // Padrão de alturas: tall → normal → square → tall...
                    const pattern = (ri % 3 === 0) ? 'tall' : (ri % 3 === 1) ? 'normal' : 'square';
                    return (
                      <div
                        key={url}
                        className={`gl-item gl-item-${pattern}`}
                        style={{ animationDelay: `${Math.min(globalIdx, 9) * 0.06}s` }}
                        onClick={() => openLightbox(globalIdx)}
                      >
                        <img src={url} alt={`Foto ${globalIdx + 1}`} className="gl-img" loading="lazy" />
                        <div className="gl-overlay">
                          <span className="gl-overlay-num">foto {globalIdx + 1} de {files.length}</span>
                          <span className="gl-overlay-cta">
                            <svg viewBox="0 0 16 16" fill="currentColor" style={{width:11,height:11}}>
                              <path d="M10.5 8.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                              <path d="M2 4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1.172a2 2 0 01-1.414-.586l-.828-.828A2 2 0 009.172 2H6.828a2 2 0 00-1.414.586l-.828.828A2 2 0 012.172 4H2zm.5 2a.5.5 0 110-1 .5.5 0 010 1zm9 2.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z"/>
                            </svg>
                            Ver foto
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="gl-footer">
          <div className="gl-footer-card">
            <div style={{position:'relative',zIndex:1}}>
              <p className="gl-footer-label">📍 Nossa localização</p>
              <p className="gl-footer-address">Av. Maria José de Paula<br />Setor Amélio Alves — Inhumas, GO</p>
            </div>
            <div className="gl-footer-divider" />
            <div className="gl-footer-social">
              <p className="gl-footer-social-label">Siga-nos</p>
              <a href="https://www.instagram.com/aogiminhumas" target="_blank" rel="noopener noreferrer" className="gl-social-btn gl-social-ig">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{width:14,height:14}}>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                @aogiminhumas
              </a>
              <a href="https://www.youtube.com/channel/UCZSKJY1tWNQHyEE3vO0y4wQ" target="_blank" rel="noopener noreferrer" className="gl-social-btn gl-social-yt">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{width:14,height:14}}>
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YouTube
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox cinematográfico */}
      {lightboxIndex !== null && (
        <div className="gl-lb" onClick={closeLightbox}>

          <div className="gl-lb-bar" onClick={e => e.stopPropagation()}>
            <div className="gl-lb-bar-left">
              <span className="gl-lb-brand">AD Ministério Irlanda · Galeria Oficial</span>
              <span className="gl-lb-counter">
                {String(lightboxIndex + 1).padStart(2,'0')}
                <span> / {String(files.length).padStart(2,'0')}</span>
              </span>
            </div>
            <button className="gl-lb-close" onClick={closeLightbox}><X size={15} /></button>
          </div>

          <div className="gl-lb-main" onClick={e => e.stopPropagation()}>

            {/* Imagem central */}
            <div className="gl-lb-stage">
              <div className="gl-lb-bg"><img src={files[lightboxIndex]} alt="" /></div>
              <button className="gl-lb-nav gl-lb-nav-l" onClick={prevPhoto} disabled={isAnimating}><ChevronLeft size={20}/></button>
              <div
                key={lightboxIndex}
                className={`gl-lb-img-wrap ${direction==='next'?'gl-lb-img-wrap-next':direction==='prev'?'gl-lb-img-wrap-prev':''}`}
              >
                <img src={files[lightboxIndex]} alt={`Foto ${lightboxIndex+1}`} className="gl-lb-img" />
              </div>
              <button className="gl-lb-nav gl-lb-nav-r" onClick={nextPhoto} disabled={isAnimating}><ChevronRight size={20}/></button>
            </div>

            {/* Miniaturas laterais (desktop) */}
            <div className="gl-lb-thumbs">
              {files.map((url, i) => (
                <div
                  key={i}
                  className={`gl-lb-thumb ${i === lightboxIndex ? 'gl-lb-thumb-active' : ''}`}
                  onClick={() => i > lightboxIndex! ? changePhoto(i,'next') : i < lightboxIndex! ? changePhoto(i,'prev') : null}
                >
                  <img src={url} alt={`Miniatura ${i+1}`} loading="lazy" />
                </div>
              ))}
            </div>
          </div>

          <div className="gl-lb-foot" onClick={e => e.stopPropagation()}>
            <button
              className="gl-lb-download"
              onClick={() => downloadImage(files[lightboxIndex], lightboxIndex)}
              disabled={downloading}
            >
              {downloading
                ? <Loader2 size={16} style={{animation:'glSpin .85s linear infinite'}}/>
                : <Download size={16}/>
              }
              Baixar foto
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery;