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
      limit: 200,
      sortBy: { column: 'name', order: 'desc' },
    });
    if (data) {
      const urls = data
        .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))
        .map(f => STORAGE_BASE_URL + f.name);
      setFiles(urls);
    }
    setLoading(false);
  };

  const openLightbox  = (i: number) => { setDirection(null); setLightboxIndex(i); };
  const closeLightbox = () => setLightboxIndex(null);

  const changePhoto = useCallback((newIndex: number, dir: 'next' | 'prev') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(dir);
    setLightboxIndex(newIndex);
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
    const handler = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft')  prevPhoto();
      if (e.key === 'Escape')     closeLightbox();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, nextPhoto, prevPhoto]);

  const downloadImage = async (url: string, index: number) => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `AD-Irlanda-Culto-foto-${index + 1}.jpg`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch {
      window.open(url, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700;900&display=swap');
        * { box-sizing: border-box; }
        .gl-root { font-family:'Lato',sans-serif; min-height:100vh; background:#f0f4ff; }

        /* Hero */
        .gl-hero {
          background:linear-gradient(155deg,#060d20 0%,#0a1535 40%,#0e1d50 70%,#050f28 100%);
          padding:44px 20px 52px; position:relative; overflow:hidden;
          border-radius:0 0 2.5rem 2.5rem;
        }
        .gl-hero::before { content:''; position:absolute; top:-80px; right:-80px; width:340px; height:340px; border-radius:50%; background:radial-gradient(circle,rgba(0,120,255,.15) 0%,transparent 70%); pointer-events:none; }
        .gl-hero::after  { content:''; position:absolute; bottom:-60px; left:-60px; width:260px; height:260px; border-radius:50%; background:radial-gradient(circle,rgba(30,60,200,.11) 0%,transparent 70%); pointer-events:none; }
        .gl-hero-inner { position:relative; z-index:1; max-width:900px; margin:0 auto; display:flex; flex-direction:column; gap:13px; }
        .gl-hero-kicker { font-size:10px; letter-spacing:.24em; text-transform:uppercase; color:rgba(80,180,255,.65); font-weight:700; display:flex; align-items:center; gap:8px; }
        .gl-hero-kicker::before { content:''; width:24px; height:1px; background:rgba(80,180,255,.4); }
        .gl-hero-title { font-family:'Playfair Display',Georgia,serif; font-size:clamp(28px,7vw,42px); font-weight:700; color:#fff; margin:0; line-height:1.15; }
        .gl-hero-sub { font-family:'Playfair Display',Georgia,serif; font-size:clamp(14px,3.5vw,17px); color:rgba(160,200,255,.65); font-style:italic; margin:0; max-width:400px; }
        .gl-hero-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:4px; }
        .gl-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); border-radius:999px; padding:5px 13px; font-size:11px; font-weight:700; color:rgba(180,220,255,.75); }
        .gl-back-btn { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); border-radius:999px; padding:5px 14px; font-size:11px; font-weight:700; color:rgba(180,220,255,.8); cursor:pointer; transition:background .18s; font-family:'Lato',sans-serif; border:none; }
        .gl-back-btn:hover { background:rgba(255,255,255,.13); }

        /* Grid */
        .gl-content { max-width:900px; margin:0 auto; padding:28px 16px 80px; }
        .gl-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        @media(min-width:600px) { .gl-grid { gap:12px; } }

        @keyframes glFadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glSpin   { to{transform:rotate(360deg)} }

        .gl-item { position:relative; border-radius:16px; overflow:hidden; background:#dde6f5; cursor:pointer; aspect-ratio:1; animation:glFadeIn .4s ease forwards; opacity:0; }
        .gl-item:first-child { grid-column:span 2; grid-row:span 2; border-radius:22px; }
        .gl-img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .35s ease; }
        .gl-item:hover .gl-img { transform:scale(1.04); }
        .gl-overlay { position:absolute; inset:0; background:linear-gradient(180deg,transparent 40%,rgba(5,15,50,.65) 100%); opacity:0; transition:opacity .25s; display:flex; align-items:flex-end; justify-content:flex-end; padding:10px; }
        .gl-item:hover .gl-overlay { opacity:1; }
        .gl-overlay-icon { width:32px; height:32px; border-radius:50%; background:rgba(255,255,255,.15); backdrop-filter:blur(4px); display:grid; place-items:center; color:#fff; }

        /* Loading / Empty */
        .gl-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 0; gap:16px; }
        .gl-spinner { width:32px; height:32px; border:2px solid rgba(26,85,208,.15); border-top-color:rgba(26,85,208,.8); border-radius:50%; animation:glSpin .85s linear infinite; }
        .gl-loading-text { font-family:'Playfair Display',Georgia,serif; font-size:15px; font-style:italic; color:rgba(26,85,208,.45); }
        .gl-empty { text-align:center; padding:60px 24px; background:#fff; border-radius:24px; border:1px solid rgba(26,85,208,.07); }
        .gl-empty-icon { font-size:40px; margin-bottom:12px; }
        .gl-empty-text { font-family:'Playfair Display',Georgia,serif; font-size:16px; color:#7888aa; font-style:italic; margin:0 0 20px; }
        .gl-empty-btn { display:inline-flex; align-items:center; gap:7px; background:linear-gradient(130deg,#1a55d0,#0090ff); color:#fff; font-weight:800; font-size:14px; padding:12px 24px; border-radius:999px; border:none; cursor:pointer; font-family:'Lato',sans-serif; }

        /* Lightbox */
        @keyframes glLbIn   { from{opacity:0} to{opacity:1} }
        @keyframes glSlNext { from{opacity:0;transform:translateX(24px) scale(.97)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes glSlPrev { from{opacity:0;transform:translateX(-24px) scale(.97)} to{opacity:1;transform:translateX(0) scale(1)} }

        .gl-lb { position:fixed; inset:0; z-index:100; background:rgba(2,8,20,.93); backdrop-filter:blur(10px); display:flex; flex-direction:column; animation:glLbIn .2s ease; }
        .gl-lb-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; flex-shrink:0; }
        .gl-lb-label { font-family:'Playfair Display',Georgia,serif; font-size:13px; color:rgba(180,210,255,.55); font-style:italic; }
        .gl-lb-counter { font-size:12px; font-weight:700; color:rgba(180,210,255,.45); }
        .gl-lb-close { width:36px; height:36px; border-radius:50%; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.06); color:rgba(200,220,255,.8); display:grid; place-items:center; cursor:pointer; transition:background .18s; }
        .gl-lb-close:hover { background:rgba(255,255,255,.14); }

        .gl-lb-stage { flex:1; position:relative; display:flex; align-items:center; justify-content:center; overflow:hidden; padding:8px 56px; }
        .gl-lb-bg { position:absolute; inset:0; }
        .gl-lb-bg img { width:100%; height:100%; object-fit:cover; opacity:.06; filter:blur(60px); transform:scale(1.2); }

        .gl-lb-nav { position:absolute; top:50%; transform:translateY(-50%); z-index:10; width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1); color:rgba(200,220,255,.85); display:grid; place-items:center; cursor:pointer; transition:background .18s; }
        .gl-lb-nav:hover { background:rgba(255,255,255,.14); }
        .gl-lb-nav-prev { left:10px; }
        .gl-lb-nav-next { right:10px; }

        .gl-lb-img-wrap { position:relative; z-index:2; max-width:100%; max-height:100%; }
        .gl-lb-img-wrap-next { animation:glSlNext 320ms cubic-bezier(.16,1,.3,1) forwards; }
        .gl-lb-img-wrap-prev { animation:glSlPrev 320ms cubic-bezier(.16,1,.3,1) forwards; }
        .gl-lb-img { max-width:100%; max-height:calc(100vh - 180px); object-fit:contain; border-radius:14px; box-shadow:0 24px 80px rgba(0,0,0,.6); border:1px solid rgba(255,255,255,.05); display:block; }

        .gl-lb-footer { flex-shrink:0; padding:12px 20px 20px; display:flex; flex-direction:column; align-items:center; gap:12px; }
        .gl-lb-dots { display:flex; gap:5px; justify-content:center; }
        .gl-lb-dot { height:3px; border-radius:999px; transition:all .25s; background:rgba(255,255,255,.12); cursor:pointer; }
        .gl-lb-dot-active { background:rgba(80,160,255,.9); }

        .gl-lb-download { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(130deg,#1a55d0,#0090ff); color:#fff; font-weight:800; font-size:14px; padding:13px 28px; border-radius:999px; border:none; cursor:pointer; font-family:'Lato',sans-serif; box-shadow:0 6px 24px rgba(26,85,208,.4); transition:transform .18s,box-shadow .18s; }
        .gl-lb-download:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(26,85,208,.5); }
        .gl-lb-download:disabled { opacity:.5; cursor:not-allowed; transform:none; }
      `}</style>

      <div className="gl-root">
        <header className="gl-hero">
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
              <button className="gl-back-btn" onClick={() => navigate('/')}>
                ← Voltar ao início
              </button>
            </div>
          </div>
        </header>

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
              <p className="gl-empty-text">Nenhuma foto disponível do último culto no momento.</p>
              <button className="gl-empty-btn" onClick={() => navigate('/')}>← Voltar ao início</button>
            </div>
          )}

          {!loading && files.length > 0 && (
            <div className="gl-grid">
              {files.map((url, i) => (
                <div
                  key={url}
                  className="gl-item"
                  style={{ animationDelay: `${Math.min(i, 9) * 0.055}s` }}
                  onClick={() => openLightbox(i)}
                >
                  <img src={url} alt={`Foto ${i + 1}`} className="gl-img" loading="lazy" />
                  <div className="gl-overlay">
                    <div className="gl-overlay-icon">
                      <svg viewBox="0 0 16 16" fill="currentColor" style={{width:13,height:13}}>
                        <path d="M10.5 8.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                        <path d="M2 4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1.172a2 2 0 01-1.414-.586l-.828-.828A2 2 0 009.172 2H6.828a2 2 0 00-1.414.586l-.828.828A2 2 0 012.172 4H2zm.5 2a.5.5 0 110-1 .5.5 0 010 1zm9 2.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="gl-lb" onClick={closeLightbox}>
          <div className="gl-lb-header" onClick={e => e.stopPropagation()}>
            <span className="gl-lb-label">AD Ministério Irlanda · Galeria Oficial</span>
            <span className="gl-lb-counter">{lightboxIndex + 1} / {files.length}</span>
            <button className="gl-lb-close" onClick={closeLightbox}><X size={15} /></button>
          </div>

          <div className="gl-lb-stage" onClick={e => e.stopPropagation()}>
            <div className="gl-lb-bg"><img src={files[lightboxIndex]} alt="" /></div>
            <button className="gl-lb-nav gl-lb-nav-prev" onClick={prevPhoto} disabled={isAnimating}>
              <ChevronLeft size={20} />
            </button>
            <div
              key={lightboxIndex}
              className={`gl-lb-img-wrap ${
                direction === 'next' ? 'gl-lb-img-wrap-next' :
                direction === 'prev' ? 'gl-lb-img-wrap-prev' : ''
              }`}
            >
              <img src={files[lightboxIndex]} alt={`Foto ${lightboxIndex + 1}`} className="gl-lb-img" />
            </div>
            <button className="gl-lb-nav gl-lb-nav-next" onClick={nextPhoto} disabled={isAnimating}>
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="gl-lb-footer" onClick={e => e.stopPropagation()}>
            <div className="gl-lb-dots">
              {files.slice(0, 20).map((_, i) => (
                <div
                  key={i}
                  className={`gl-lb-dot ${i === lightboxIndex ? 'gl-lb-dot-active' : ''}`}
                  style={{ width: i === lightboxIndex ? 22 : 6 }}
                  onClick={() => {
                    if (i > lightboxIndex!) changePhoto(i, 'next');
                    else if (i < lightboxIndex!) changePhoto(i, 'prev');
                  }}
                />
              ))}
            </div>
            <button
              className="gl-lb-download"
              onClick={() => downloadImage(files[lightboxIndex], lightboxIndex)}
              disabled={downloading}
            >
              {downloading
                ? <Loader2 size={16} style={{ animation: 'glSpin .85s linear infinite' }} />
                : <Download size={16} />
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