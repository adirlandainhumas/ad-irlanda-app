import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { trackPixCopy, trackSocialClick } from "../lib/analytics";

const LOGO_FULL =
  "https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png";

const ADDRESS_LINE_1 = "Av. Maria José de Paula";
const ADDRESS_LINE_2 = "Setor Amélio Alves - Inhumas - GO";

const CHURCH_MAPS_LINK =
  "https://www.google.com/maps/search/?api=1&query=AOGIM%20-%20Assembleia%20de%20Deus%20Min.%20Irlanda%20Inhumas";
const CHURCH_DIRECTIONS_LINK =
  "https://www.google.com/maps/dir/?api=1&destination=AOGIM%20-%20Assembleia%20de%20Deus%20Min.%20Irlanda%20Inhumas";

const GALLERY_BUCKET = "galeria";
const GALLERY_PATH = "ultimo-culto";
const PASTOR_WHATSAPP_NUMBER = "5562984468270";

const INSTAGRAM_URL = "https://www.instagram.com/aogiminhumas/";
const YOUTUBE_URL = "https://www.youtube.com/@adirlandainhumas";
const TIKTOK_URL = "https://www.tiktok.com/@ad.irlanda.inhumas";

type Notice = {
  id: string;
  title: string;
  body: string;
  event_date?: string | null;
  created_at?: string | null;
  is_published?: boolean;
};

function formatDateBR(dateStr?: string | null) {
  if (!dateStr) return "";
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function todayLabel() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700;900&display=swap');

  :root {
    --ink:           #1C1917;
    --ink-2:         #57534E;
    --ink-3:         #A8A29E;
    --bg:            #FAFAF8;
    --surface:       #FFFFFF;
    --border:        #E8E5E0;
    --green:         #166534;
    --green-hover:   #15803d;
    --green-light:   #f0fdf4;
    --green-border:  #bbf7d0;
    --amber:         #92400E;
    --amber-light:   #fffbeb;
    --amber-border:  #fde68a;
  }

  * { box-sizing: border-box; }

  .hm-root {
    font-family: 'Lato', sans-serif;
    background: var(--bg);
    min-height: 100vh;
    color: var(--ink);
  }

  /* ── Hero ── */
  .hm-hero {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 40px 24px 32px;
    text-align: center;
  }

  .hm-logo {
    width: clamp(100px, 30vw, 150px);
    margin: 0 auto 18px;
    display: block;
  }

  .hm-hero-date {
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ink-3);
    font-weight: 700;
    margin-bottom: 14px;
  }

  .hm-tagline {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: clamp(13px, 3.2vw, 16px);
    color: var(--ink-2);
    line-height: 1.7;
    margin: 0 auto 26px;
    max-width: 340px;
    font-style: italic;
  }

  .hm-hero-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-bottom: 22px;
  }

  .hm-btn-primary {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--green);
    color: #fff; font-weight: 700; font-size: 13px;
    padding: 10px 20px; border-radius: 8px;
    text-decoration: none; transition: background 0.15s;
    letter-spacing: 0.01em;
  }
  .hm-btn-primary:hover { background: var(--green-hover); }

  .hm-btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--ink-2); font-weight: 700; font-size: 13px;
    padding: 10px 20px; border-radius: 8px;
    text-decoration: none; transition: border-color 0.15s, color 0.15s;
  }
  .hm-btn-ghost:hover { border-color: var(--ink-3); color: var(--ink); }

  .hm-social-icons {
    display: flex;
    gap: 8px;
    justify-content: center;
  }
  .hm-social-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px; height: 36px;
    border-radius: 8px;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--ink-3);
    text-decoration: none;
    transition: border-color 0.15s, color 0.15s;
    flex-shrink: 0;
  }
  .hm-social-icon:hover {
    border-color: var(--ink-3);
    color: var(--ink-2);
  }

  /* ── Conteúdo ── */
  .hm-content {
    max-width: 900px;
    margin: 0 auto;
    padding: 36px 16px 80px;
    display: flex;
    flex-direction: column;
    gap: 36px;
  }

  /* ── Cabeçalho de seção ── */
  .hm-section-header {
    display: flex; align-items: flex-end; justify-content: space-between;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
  }

  .hm-section-label {
    font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--green); font-weight: 700; margin-bottom: 4px;
  }

  .hm-section-title {
    font-size: clamp(18px, 4vw, 22px);
    font-weight: 900; color: var(--ink); line-height: 1.2; margin: 0;
    letter-spacing: -0.01em;
  }

  .hm-see-all {
    font-size: 12px; font-weight: 700; color: var(--green);
    text-decoration: none; white-space: nowrap;
    transition: color 0.15s;
  }
  .hm-see-all:hover { color: var(--green-hover); }

  /* ── Banner Devocional ── */
  .hm-devo-banner {
    background: var(--green);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  @media (min-width: 560px) {
    .hm-devo-banner { flex-direction: row; align-items: center; justify-content: space-between; }
  }

  .hm-devo-banner-kicker {
    font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(255,255,255,0.55); font-weight: 700; margin-bottom: 6px;
  }
  .hm-devo-banner-title {
    font-size: clamp(16px, 3.8vw, 20px); color: #fff; font-weight: 900;
    margin: 0; line-height: 1.3; letter-spacing: -0.01em;
  }
  .hm-devo-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: #fff; color: var(--green);
    font-weight: 800; font-size: 13px;
    padding: 10px 20px; border-radius: 8px;
    text-decoration: none; white-space: nowrap;
    transition: opacity 0.15s;
    flex-shrink: 0;
    align-self: flex-start;
  }
  .hm-devo-btn:hover { opacity: 0.9; }

  /* ── Cards de avisos ── */
  .hm-notices-grid { display: grid; gap: 10px; grid-template-columns: 1fr; }
  @media (min-width: 600px) { .hm-notices-grid { grid-template-columns: 1fr 1fr; } }

  .hm-notice-card {
    display: block; text-decoration: none;
    background: var(--surface);
    border-radius: 10px;
    padding: 18px 20px;
    border: 1px solid var(--border);
    border-left: 3px solid var(--amber-accent);
    transition: box-shadow 0.15s;
  }
  .hm-notice-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }

  .hm-notice-date {
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
    color: var(--green); margin-bottom: 7px;
    text-transform: uppercase;
  }

  .hm-notice-title {
    font-size: 15px; font-weight: 900; color: var(--ink);
    line-height: 1.35; margin: 0 0 6px;
    letter-spacing: -0.01em;
  }

  .hm-notice-body {
    font-size: 13px; color: var(--ink-2); line-height: 1.6;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden; margin: 0;
  }

  .hm-notice-cta {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 12px; font-weight: 700; color: var(--green);
    margin-top: 10px;
  }

  /* ── Galeria ── */
  .hm-gallery-grid {
    display: grid;
    gap: 6px;
    grid-template-columns: repeat(3, 1fr);
  }
  .hm-gallery-item {
    display: block; text-decoration: none;
    border-radius: 8px; overflow: hidden;
    background: var(--border);
    position: relative;
    aspect-ratio: 1;
  }
  .hm-gallery-item:first-child {
    grid-column: span 2;
    grid-row: span 2;
    border-radius: 10px;
  }
  .hm-gallery-img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.3s ease;
    display: block;
  }
  .hm-gallery-item:hover .hm-gallery-img { transform: scale(1.03); }
  .hm-gallery-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.25) 100%);
    opacity: 0; transition: opacity 0.2s;
  }
  .hm-gallery-item:hover .hm-gallery-overlay { opacity: 1; }

  /* ── Localização ── */
  .hm-location {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 26px 22px;
  }

  .hm-location-title {
    font-size: clamp(17px, 4vw, 20px); font-weight: 900;
    color: var(--ink); margin: 0 0 18px;
    letter-spacing: -0.01em;
  }

  .hm-address-card {
    display: block; text-decoration: none;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px; padding: 14px 16px;
    transition: border-color 0.15s;
    margin-bottom: 14px;
  }
  .hm-address-card:hover { border-color: var(--green); }

  .hm-address-label {
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--ink-3); font-weight: 700; margin-bottom: 7px;
  }
  .hm-address-text {
    font-size: 14px; font-weight: 700; color: var(--ink); line-height: 1.55;
  }
  .hm-address-hint {
    font-size: 11px; color: var(--ink-3); margin-top: 7px;
    display: flex; align-items: center; gap: 4px;
  }

  .hm-loc-btns { display: flex; flex-wrap: wrap; gap: 8px; }

  .hm-loc-btn-green {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--green); color: #fff;
    font-weight: 700; font-size: 13px;
    padding: 10px 18px; border-radius: 8px;
    text-decoration: none; transition: background 0.15s;
    flex: 1; min-width: 140px; justify-content: center;
  }
  .hm-loc-btn-green:hover { background: var(--green-hover); }

  .hm-loc-btn-outline {
    display: inline-flex; align-items: center; gap: 8px;
    border: 1px solid var(--border);
    color: var(--ink-2);
    font-weight: 700; font-size: 13px;
    padding: 10px 18px; border-radius: 8px;
    text-decoration: none; transition: border-color 0.15s, color 0.15s;
    flex: 1; min-width: 140px; justify-content: center;
  }
  .hm-loc-btn-outline:hover { border-color: var(--green); color: var(--green); }

  /* ── PIX ── */
  .hm-pix-card {
    background: var(--amber-light);
    border: 1px solid var(--amber-border);
    border-radius: 12px;
    padding: 26px 22px;
  }

  .hm-pix-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(146,64,14,0.09);
    border: 1px solid rgba(146,64,14,0.22);
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 10px; font-weight: 900; letter-spacing: 0.2em;
    color: var(--amber); text-transform: uppercase;
    margin-bottom: 12px;
  }

  .hm-pix-title {
    font-size: clamp(17px, 4vw, 20px); font-weight: 900;
    color: var(--ink); margin: 0 0 8px;
    letter-spacing: -0.01em;
  }

  .hm-pix-verse {
    font-family: 'Playfair Display', Georgia, serif;
    font-style: italic; font-size: 13px; line-height: 1.7;
    color: var(--ink-2);
    margin: 0 0 18px;
  }

  .hm-pix-steps {
    display: flex; flex-direction: column; gap: 8px;
    margin-bottom: 18px;
  }
  .hm-pix-step {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13px; color: var(--ink-2); line-height: 1.5;
  }
  .hm-pix-step-num {
    display: inline-flex; align-items: center; justify-content: center;
    width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
    background: rgba(146,64,14,0.12);
    font-size: 10px; font-weight: 800;
    color: var(--amber);
    margin-top: 1px;
  }

  .hm-pix-key-box {
    background: #fff;
    border: 1px solid var(--amber-border);
    border-radius: 8px; padding: 14px 16px;
    margin-bottom: 12px;
  }
  .hm-pix-key-label {
    display: flex; align-items: center; gap: 5px;
    font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--ink-3); font-weight: 700; margin-bottom: 6px;
  }
  .hm-pix-key-value {
    display: block; font-size: 14px; font-weight: 700;
    color: var(--ink); word-break: break-all;
  }

  .hm-pix-copy-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%;
    background: var(--amber);
    color: #fff; font-weight: 800; font-size: 14px;
    padding: 12px 24px; border-radius: 8px;
    border: none; cursor: pointer;
    transition: opacity 0.15s;
  }
  .hm-pix-copy-btn:hover { opacity: 0.9; }
  .hm-pix-copy-btn.copied { background: var(--green); }

  /* ── Estados vazios ── */
  .hm-empty {
    background: var(--surface); border-radius: 8px;
    border: 1px solid var(--border);
    padding: 28px 24px; text-align: center;
    color: var(--ink-3); font-size: 14px;
  }

  /* ── Mobile ── */
  @media (max-width: 480px) {
    .hm-hero { padding: 32px 20px 28px; }
    .hm-hero-btns { flex-direction: column; align-items: stretch; }
    .hm-btn-primary, .hm-btn-ghost { justify-content: center; width: 100%; }
    .hm-content { padding: 28px 14px 80px; gap: 28px; }
  }
`;

export default function Home() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [galleryPreview, setGalleryPreview] = useState<string[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("is_published", true)
        .order("event_date", { ascending: true });
      if (!error && data) setNotices(data as Notice[]);
      setLoadingNotices(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.storage
        .from(GALLERY_BUCKET)
        .list(GALLERY_PATH, { limit: 30, sortBy: { column: "created_at", order: "desc" } });
      if (!error && data) {
        const urls = data
          .filter((f) => !!f.name && !f.name.startsWith("."))
          .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f.name))
          .slice(0, 6)
          .map((f) => supabase.storage.from(GALLERY_BUCKET).getPublicUrl(`${GALLERY_PATH}/${f.name}`).data.publicUrl);
        setGalleryPreview(urls);
      }
      setLoadingGallery(false);
    })();
  }, []);

  const pastorWhatsUrl = `https://wa.me/${PASTOR_WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá, pastor! Gostaria de falar com o senhor.")}`;
  const shareLocationWhatsUrl = `https://wa.me/?text=${encodeURIComponent(`Localização da igreja:\n${CHURCH_MAPS_LINK}\n\nEndereço:\n${ADDRESS_LINE_1}\n${ADDRESS_LINE_2}`)}`;

  return (
    <>
      <style>{CSS}</style>

      <div className="hm-root">

        {/* ─── HERO ─── */}
        <section className="hm-hero">
          <img src={LOGO_FULL} alt="AD Ministério Irlanda" className="hm-logo" />

          <p className="hm-hero-date">{todayLabel()}</p>

          <p className="hm-tagline">
            Uma família de fé que cresce unida, servindo a Deus e cuidando de pessoas.
          </p>

          <div className="hm-hero-btns">
            <Link to="/avisos" className="hm-btn-primary">
              Ver Avisos
            </Link>
            <Link to="/devocional" className="hm-btn-ghost">
              Devocional de Hoje
            </Link>
            <Link to="/galeria" className="hm-btn-ghost">
              Galeria
            </Link>
          </div>

          <div className="hm-social-icons">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hm-social-icon" aria-label="Instagram" onClick={() => trackSocialClick("instagram")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="hm-social-icon" aria-label="YouTube" onClick={() => trackSocialClick("youtube")}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" className="hm-social-icon" aria-label="TikTok" onClick={() => trackSocialClick("tiktok")}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 17, height: 17 }}>
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z"/>
              </svg>
            </a>
          </div>
        </section>

        {/* ─── CONTEÚDO ─── */}
        <div className="hm-content">

          {/* Banner Devocional */}
          <div className="hm-devo-banner">
            <div>
              <p className="hm-devo-banner-kicker">Palavra do dia</p>
              <h2 className="hm-devo-banner-title">O devocional de hoje está te esperando</h2>
            </div>
            <Link to="/devocional" className="hm-devo-btn">
              Ler agora →
            </Link>
          </div>

          {/* Avisos */}
          <div>
            <div className="hm-section-header">
              <div>
                <p className="hm-section-label">Fique por dentro</p>
                <h2 className="hm-section-title">Próximos Avisos</h2>
              </div>
              <Link to="/avisos" className="hm-see-all">Ver todos →</Link>
            </div>

            {loadingNotices ? (
              <div className="hm-empty">Carregando avisos…</div>
            ) : notices.length === 0 ? (
              <div className="hm-empty">Nenhum aviso publicado no momento.</div>
            ) : (
              <div className="hm-notices-grid">
                {notices.map((notice) => (
                  <Link key={notice.id} to="/avisos" className="hm-notice-card">
                    <div className="hm-notice-date">
                      {formatDateBR(notice.event_date ?? notice.created_at)}
                    </div>
                    <h3 className="hm-notice-title">{notice.title}</h3>
                    <p className="hm-notice-body">{notice.body}</p>
                    <span className="hm-notice-cta">
                      Ver detalhes
                      <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 11, height: 11 }}>
                        <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06L7.28 11.78a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
                      </svg>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Galeria */}
          <div>
            <div className="hm-section-header">
              <div>
                <p className="hm-section-label">Memórias</p>
                <h2 className="hm-section-title">Fotos do Último Culto</h2>
              </div>
              <Link to="/galeria" className="hm-see-all">Ver todas →</Link>
            </div>

            {loadingGallery ? (
              <div className="hm-empty">Carregando fotos…</div>
            ) : galleryPreview.length === 0 ? (
              <div className="hm-empty">As fotos do último culto aparecerão aqui assim que forem publicadas.</div>
            ) : (
              <div className="hm-gallery-grid">
                {galleryPreview.map((url) => (
                  <Link key={url} to="/galeria" className="hm-gallery-item">
                    <img src={url} alt="Foto do culto" className="hm-gallery-img" loading="lazy" />
                    <div className="hm-gallery-overlay" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Localização */}
          <div className="hm-location">
            <h3 className="hm-location-title">Venha nos visitar</h3>

            <a href={CHURCH_DIRECTIONS_LINK} target="_blank" rel="noopener noreferrer" className="hm-address-card">
              <p className="hm-address-label">Endereço</p>
              <p className="hm-address-text">
                {ADDRESS_LINE_1}<br />
                {ADDRESS_LINE_2}
              </p>
              <p className="hm-address-hint">
                Toque para abrir rota no Google Maps
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 11, height: 11 }}>
                  <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06L7.28 11.78a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
                </svg>
              </p>
            </a>

            <div className="hm-loc-btns">
              <a href={shareLocationWhatsUrl} target="_blank" rel="noopener noreferrer" className="hm-loc-btn-green">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.123 1.528 5.854L0 24l6.335-1.508A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 01-5.031-1.388l-.361-.214-3.741.981.999-3.648-.235-.374A9.794 9.794 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                </svg>
                Enviar localização
              </a>

              <a href={pastorWhatsUrl} target="_blank" rel="noopener noreferrer" className="hm-loc-btn-outline">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.123 1.528 5.854L0 24l6.335-1.508A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 01-5.031-1.388l-.361-.214-3.741.981.999-3.648-.235-.374A9.794 9.794 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                </svg>
                Falar com o Pastor
              </a>
            </div>
          </div>

          {/* Dízimos & Ofertas */}
          <div className="hm-pix-card">
            <div className="hm-pix-badge">PIX</div>

            <h3 className="hm-pix-title">Dízimos &amp; Ofertas</h3>
            <p className="hm-pix-verse">
              "Cada um contribua segundo propôs no coração, não com tristeza nem por constrangimento; porque Deus ama ao que dá com alegria." — 2 Co 9:7
            </p>

            <div className="hm-pix-steps">
              <div className="hm-pix-step">
                <span className="hm-pix-step-num">1</span>
                Copie a chave PIX abaixo
              </div>
              <div className="hm-pix-step">
                <span className="hm-pix-step-num">2</span>
                Abra o aplicativo do seu banco e acesse a área PIX
              </div>
              <div className="hm-pix-step">
                <span className="hm-pix-step-num">3</span>
                Escolha "Pagar", cole a chave e confirme o valor desejado
              </div>
            </div>

            <div className="hm-pix-key-box">
              <span className="hm-pix-key-label">
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 11, height: 11 }}>
                  <path d="M2.5 3A1.5 1.5 0 001 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0115 5.293V4.5A1.5 1.5 0 0013.5 3h-11z"/>
                  <path d="M15 6.954L8.978 9.86a2.25 2.25 0 01-1.956 0L1 6.954V11.5A1.5 1.5 0 002.5 13h11a1.5 1.5 0 001.5-1.5V6.954z"/>
                </svg>
                Chave PIX — E-mail
              </span>
              <span className="hm-pix-key-value">aogiminhumas@gmail.com</span>
            </div>

            <button
              className={`hm-pix-copy-btn${copied ? " copied" : ""}`}
              onClick={() => {
                navigator.clipboard.writeText("aogiminhumas@gmail.com");
                setCopied(true);
                trackPixCopy();
                setTimeout(() => setCopied(false), 2500);
              }}
            >
              {copied ? (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/>
                  </svg>
                  Chave copiada!
                </>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
                    <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z"/>
                    <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z"/>
                  </svg>
                  Copiar chave PIX
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
