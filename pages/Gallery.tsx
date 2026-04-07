import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, STORAGE_BASE_URL } from '../lib/supabase';
import { Loader2, Download, ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';

const DRIVE_URL = "https://drive.google.com/drive/folders/1rvTtzvidSVv-95O14-z90W6Foz1K9l7n?usp=sharing";

const Gallery: React.FC = () => {
  const navigate = useNavigate();

  // ── Carrossel destaque (galeria/destaque/) ──────────────────────────────────
  const [featured, setFeatured]             = useState<string[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [slide, setSlide]                   = useState(0);
  const [slideDir, setSlideDir]             = useState<'next'|'prev'>('next');
  const [sliding, setSliding]               = useState(false);
  const intervalRef                          = useRef<ReturnType<typeof setInterval>|null>(null);
  const touchStartRef                        = useRef<number|null>(null);

  // ── Masonry (galeria/ultimo-culto/) ────────────────────────────────────────
  const [files, setFiles]                   = useState<string[]>([]);
  const [loading, setLoading]               = useState(true);
  const [downloading, setDownloading]       = useState(false);
  const [lightboxIndex, setLightboxIndex]   = useState<number | null>(null);
  const [direction, setDirection]           = useState<'next' | 'prev' | null>(null);
  const [isAnimating, setIsAnimating]       = useState(false);

  useEffect(() => {
    fetchFeatured();
    fetchGallery();
  }, []);

  const fetchFeatured = async () => {
    setFeaturedLoading(true);
    // Tenta carregar da pasta destaque/ primeiro
    const { data: destaqueData } = await supabase.storage.from('galeria').list('destaque', {
      limit: 7, sortBy: { column: 'name', order: 'asc' },
    });
    const destaquePhotos = (destaqueData ?? [])
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f.name))
      .map(f => `https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/galeria/destaque/${encodeURIComponent(f.name)}`);

    if (destaquePhotos.length >= 3) {
      setFeatured(destaquePhotos);
      setFeaturedLoading(false);
      return;
    }

    // Fallback: usa as fotos mais recentes de ultimo-culto/
    const { data: cultoData } = await supabase.storage.from('galeria').list('ultimo-culto', {
      limit: 7, sortBy: { column: 'name', order: 'desc' },
    });
    const cultoPhotos = (cultoData ?? [])
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f.name))
      .map(f => `https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/galeria/ultimo-culto/${encodeURIComponent(f.name)}`);

    setFeatured([...destaquePhotos, ...cultoPhotos].slice(0, 7));
    setFeaturedLoading(false);
  };

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

  // ── Carrossel auto-advance ─────────────────────────────────────────────────
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

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => { touchStartRef.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 44) manualSlide(diff > 0 ? 'next' : 'prev');
    touchStartRef.current = null;
  };

  // ── Lightbox ───────────────────────────────────────────────────────────────
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

  const columns: string[][] = [[], [], []];
  files.forEach((url, i) => columns[i % 3].push(url));

  return (
    <>
      <style>{`
        .gl-root { font-family:'Lato',sans-serif; min-height:100vh; background:#F6F8FF; }

        /* ── Hero ── */
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
        .gl-hero-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:4px; }
        .gl-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.2); border-radius:999px; padding:6px 14px; font-size:11px; font-weight:700; color:rgba(255,255,255,.85); }
        .gl-back-btn { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.18); border-radius:999px; padding:6px 14px; font-size:11px; font-weight:700; color:rgba(255,255,255,.85); cursor:pointer; transition:background .18s; font-family:'Lato',sans-serif; }
        .gl-back-btn:hover { background:rgba(255,255,255,.2); }

        /* ── Carrossel Destaque ── */
        .gl-carousel-section { max-width:900px; margin:0 auto; padding:28px 0 0; }
        .gl-carousel-label { font-size:10px; letter-spacing:.22em; text-transform:uppercase; color:#1E40AF; font-weight:700; padding:0 16px; margin-bottom:14px; display:flex; align-items:center; gap:10px; }
        .gl-carousel-label::after { content:''; flex:1; height:1px; background:linear-gradient(90deg,#DDE3F0,transparent); }

        .gl-carousel-wrap {
          position:relative; overflow:hidden; border-radius:0;
          aspect-ratio:16/9;
          background:#0a1630;
        }
        @media(min-width:520px){ .gl-carousel-wrap { border-radius:20px; margin:0 14px; } }

        @keyframes glSlNext { from{opacity:0;transform:translateX(5%)} to{opacity:1;transform:translateX(0)} }
        @keyframes glSlPrev { from{opacity:0;transform:translateX(-5%)} to{opacity:1;transform:translateX(0)} }
        @keyframes glCarouselIn { from{opacity:0;transform:scale(1.02)} to{opacity:1;transform:scale(1)} }

        .gl-carousel-img {
          position:absolute; inset:0; width:100%; height:100%;
          object-fit:cover; display:block;
        }
        .gl-carousel-img-next { animation:glSlNext 480ms cubic-bezier(.16,1,.3,1) forwards; }
        .gl-carousel-img-prev { animation:glSlPrev 480ms cubic-bezier(.16,1,.3,1) forwards; }

        /* Overlay gradiente sutil embaixo */
        .gl-carousel-overlay {
          position:absolute; inset:0;
          background:linear-gradient(to top, rgba(10,22,48,.55) 0%, transparent 42%);
          pointer-events:none; z-index:2;
        }

        /* Botões nav */
        .gl-carousel-nav {
          position:absolute; top:50%; transform:translateY(-50%); z-index:10;
          width:38px; height:38px; border-radius:50%;
          background:rgba(0,0,0,.32); border:1px solid rgba(255,255,255,.18);
          color:#fff; display:grid; place-items:center; cursor:pointer;
          transition:background .18s;
        }
        .gl-carousel-nav:hover { background:rgba(0,0,0,.55); }
        .gl-carousel-nav-l { left:10px; }
        .gl-carousel-nav-r { right:10px; }

        /* Dots */
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

        /* ── Botão Drive ── */
        .gl-drive-section { max-width:900px; margin:0 auto; padding:20px 14px 0; }
        .gl-drive-card {
          border-radius:18px;
          background:linear-gradient(130deg,#1e3a8a,#1E40AF);
          padding:22px 22px 22px;
          display:flex; align-items:center; gap:18px;
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

        /* ── Masonry grid ── */
        .gl-content { max-width:900px; margin:0 auto; padding:28px 14px 20px; }
        .gl-masonry { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; align-items:start; }
        @media(max-width:500px) { .gl-masonry { grid-template-columns:repeat(2,1fr); } }

        @keyframes glFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glSpin   { to{transform:rotate(360deg)} }

        .gl-col { display:flex; flex-direction:column; gap:10px; }
        .gl-item {
          position:relative; border-radius:16px; overflow:hidden;
          background:#DDE3F0; cursor:pointer;
          animation:glFadeUp .45s ease forwards; opacity:0;
          box-shadow:0 2px 10px rgba(30,64,175,.08);
          transition:transform .25s, box-shadow .25s;
        }
        .gl-item:hover { transform:translateY(-4px) scale(1.01); box-shadow:0 10px 32px rgba(30,64,175,.16); }
        .gl-item-tall .gl-img { aspect-ratio: 3/4; }
        .gl-item-normal .gl-img { aspect-ratio: 4/3; }
        .gl-item-square .gl-img { aspect-ratio: 1; }
        .gl-img { width:100%; object-fit:cover; display:block; transition:transform .4s ease; }
        .gl-item:hover .gl-img { transform:scale(1.06); }
        .gl-overlay {
          position:absolute; inset:0;
          background:linear-gradient(160deg,rgba(5,12,40,.0) 40%,rgba(5,12,40,.75) 100%);
          opacity:0; transition:opacity .28s;
          display:flex; flex-direction:column; justify-content:flex-end; padding:14px;
        }
        .gl-item:hover .gl-overlay { opacity:1; }
        .gl-overlay-num { font-family:'Playfair Display',Georgia,serif; font-size:11px; font-style:italic; color:rgba(180,220,255,.7); font-weight:400; letter-spacing:.06em; }
        .gl-overlay-cta { font-size:11px; font-weight:700; color:#fff; display:flex; align-items:center; gap:5px; margin-top:3px; }
        .gl-item::after { content:''; position:absolute; inset:0; border-radius:16px; border:1.5px solid rgba(30,64,175,.0); transition:border-color .25s; pointer-events:none; }
        .gl-item:hover::after { border-color:rgba(30,64,175,.25); }

        /* ── Loading / Empty ── */
        .gl-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 0; gap:16px; }
        .gl-spinner { width:32px; height:32px; border:2px solid #DDE3F0; border-top-color:#1E40AF; border-radius:50%; animation:glSpin .85s linear infinite; }
        .gl-loading-text { font-family:'Playfair Display',Georgia,serif; font-size:15px; font-style:italic; color:#94A3B8; }
        .gl-empty { text-align:center; padding:60px 24px; background:#fff; border-radius:20px; border:1px solid #DDE3F0; }
        .gl-empty-icon { font-size:40px; margin-bottom:12px; }
        .gl-empty-text { font-family:'Playfair Display',Georgia,serif; font-size:16px; color:#94A3B8; font-style:italic; margin:0 0 20px; }
        .gl-empty-btn { display:inline-flex; align-items:center; gap:7px; background:#1E40AF; color:#fff; font-weight:800; font-size:14px; padding:12px 24px; border-radius:999px; border:none; cursor:pointer; font-family:'Lato',sans-serif; }

        /* ── Rodapé ── */
        .gl-footer { max-width:900px; margin:32px auto 0; padding:0 14px 60px; }
        .gl-footer-card { background:linear-gradient(145deg,#1e3a8a,#1E40AF); border-radius:20px; padding:24px 22px; display:flex; flex-direction:column; gap:16px; }
        .gl-footer-label { font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:rgba(255,255,255,.6); font-weight:700; margin:0 0 6px; }
        .gl-footer-address { font-size:14px; color:rgba(255,255,255,.9); font-weight:600; line-height:1.6; margin:0; }
        .gl-footer-divider { height:1px; background:rgba(255,255,255,.15); }
        .gl-footer-social { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .gl-footer-social-label { font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:rgba(255,255,255,.6); font-weight:700; flex:1; }
        .gl-social-btn { display:inline-flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:50%; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.2); color:rgba(255,255,255,.9); text-decoration:none; transition:background .18s; flex-shrink:0; }
        .gl-social-btn:hover { background:rgba(255,255,255,.22); }

        /* ── Lightbox ── */
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
        .gl-lb-thumbs { width:90px; flex-shrink:0; overflow-y:auto; padding:10px 8px; display:flex; flex-direction:column; gap:6px; border-left:1px solid rgba(255,255,255,.05); scrollbar-width:none; }
        .gl-lb-thumbs::-webkit-scrollbar { display:none; }
        @media(max-width:600px) { .gl-lb-thumbs { display:none; } }
        .gl-lb-thumb { width:100%; aspect-ratio:1; border-radius:8px; overflow:hidden; cursor:pointer; opacity:.4; transition:opacity .2s, transform .2s; border:1.5px solid transparent; flex-shrink:0; }
        .gl-lb-thumb:hover { opacity:.75; transform:scale(1.04); }
        .gl-lb-thumb-active { opacity:1 !important; border-color:rgba(30,64,175,.8); }
        .gl-lb-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
        .gl-lb-foot { flex-shrink:0; padding:12px 18px 16px; border-top:1px solid rgba(255,255,255,.05); display:flex; align-items:center; justify-content:center; }
        .gl-lb-download { display:inline-flex; align-items:center; gap:8px; background:#1E40AF; color:#fff; font-weight:800; font-size:14px; padding:12px 28px; border-radius:999px; border:none; cursor:pointer; font-family:'Lato',sans-serif; transition:background .18s; }
        .gl-lb-download:hover { background:#1D4ED8; }
        .gl-lb-download:disabled { opacity:.5; cursor:not-allowed; }

        /* Amber accent bar on carousel */
        .gl-amber-bar { height:3px; background:linear-gradient(90deg,rgba(217,119,6,0.3),rgba(251,191,36,0.9) 40%,rgba(251,191,36,0.9) 60%,rgba(217,119,6,0.3)); }
      `}</style>

      <div className="gl-root">

        {/* Hero */}
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
              <button className="gl-back-btn" onClick={() => navigate('/')}>← Voltar ao início</button>
            </div>
          </div>
        </header>

        {/* Barra âmbar assinatura */}
        <div className="gl-amber-bar" />

        {/* ── Carrossel Destaque ── */}
        {!featuredLoading && featured.length > 0 && (
          <section className="gl-carousel-section">
            <p className="gl-carousel-label">Destaques da Semana</p>
            <div
              className="gl-carousel-wrap"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
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
          <div style={{display:'flex',justifyContent:'center',padding:'32px 0'}}>
            <div className="gl-spinner" />
          </div>
        )}

        {/* ── Botão Ver Fotos do Culto ── */}
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
            <a
              href={DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="gl-drive-btn"
            >
              <ExternalLink size={14} />
              Ver fotos
            </a>
          </div>
        </div>

        {/* ── Masonry Grid ── */}
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
            <>
              <p style={{fontSize:10,letterSpacing:'.22em',textTransform:'uppercase',color:'#1E40AF',fontWeight:700,marginBottom:16,display:'flex',alignItems:'center',gap:10}}>
                Último Culto
                <span style={{flex:1,height:1,background:'linear-gradient(90deg,#DDE3F0,transparent)'}}/>
              </p>
              <div className="gl-masonry">
                {columns.map((col, ci) => (
                  <div key={ci} className="gl-col">
                    {col.map((url, ri) => {
                      const globalIdx = ci + ri * 3;
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
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className="gl-footer">
          <div className="gl-footer-card">
            <div>
              <p className="gl-footer-label">📍 Nossa localização</p>
              <p className="gl-footer-address">Av. Maria José de Paula<br />Setor Amélio Alves — Inhumas, GO</p>
            </div>
            <div className="gl-footer-divider" />
            <div className="gl-footer-social">
              <p className="gl-footer-social-label">Siga-nos</p>
              <a href="https://www.instagram.com/aogiminhumas" target="_blank" rel="noopener noreferrer" className="gl-social-btn" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:17,height:17}}>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              <a href="https://www.youtube.com/channel/UCZSKJY1tWNQHyEE3vO0y4wQ" target="_blank" rel="noopener noreferrer" className="gl-social-btn" aria-label="YouTube">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{width:17,height:17}}>
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="https://www.tiktok.com/@ad.irlanda.inhumas" target="_blank" rel="noopener noreferrer" className="gl-social-btn" aria-label="TikTok">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16}}>
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
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
            <div className="gl-lb-stage">
              <div className="gl-lb-bg"><img src={files[lightboxIndex]} alt="" /></div>
              <button className="gl-lb-nav gl-lb-nav-l" onClick={prevPhoto} disabled={isAnimating}><ChevronLeft size={20}/></button>
              <div key={lightboxIndex} className={`gl-lb-img-wrap ${direction==='next'?'gl-lb-img-wrap-next':direction==='prev'?'gl-lb-img-wrap-prev':''}`}>
                <img src={files[lightboxIndex]} alt={`Foto ${lightboxIndex+1}`} className="gl-lb-img" />
              </div>
              <button className="gl-lb-nav gl-lb-nav-r" onClick={nextPhoto} disabled={isAnimating}><ChevronRight size={20}/></button>
            </div>
            <div className="gl-lb-thumbs">
              {files.map((url, i) => (
                <div key={i} className={`gl-lb-thumb ${i === lightboxIndex ? 'gl-lb-thumb-active' : ''}`}
                  onClick={() => i > lightboxIndex! ? changePhoto(i,'next') : i < lightboxIndex! ? changePhoto(i,'prev') : null}>
                  <img src={url} alt={`Miniatura ${i+1}`} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
          <div className="gl-lb-foot" onClick={e => e.stopPropagation()}>
            <button className="gl-lb-download" onClick={() => downloadImage(files[lightboxIndex], lightboxIndex)} disabled={downloading}>
              {downloading ? <Loader2 size={16} style={{animation:'glSpin .85s linear infinite'}}/> : <Download size={16}/>}
              Baixar foto
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery;
