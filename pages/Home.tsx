import React, { useEffect, useRef, useState } from "react";
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
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

// Componente de partícula flutuante
function Particles() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {Array.from({ length: 28 }).map((_, i) => {
        const size = Math.random() * 3 + 1;
        const left = Math.random() * 100;
        const delay = Math.random() * 8;
        const dur = Math.random() * 10 + 12;
        const opacity = Math.random() * 0.4 + 0.1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              bottom: "-10px",
              left: `${left}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: `hsl(${200 + Math.random() * 40}, 80%, ${70 + Math.random() * 30}%)`,
              opacity,
              animation: `hmFloat ${dur}s ${delay}s linear infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function Home() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [galleryPreview, setGalleryPreview] = useState<string[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 50, y: 35 });
  const [copied, setCopied] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

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
  const shareLocationWhatsUrl = `https://wa.me/?text=${encodeURIComponent(`📍 Localização da igreja:\n${CHURCH_MAPS_LINK}\n\nEndereço:\n${ADDRESS_LINE_1}\n${ADDRESS_LINE_2}`)}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700;900&display=swap');

        * { box-sizing: border-box; }

        .hm-root {
          font-family: 'Lato', sans-serif;
          background: #f0f4ff;
          min-height: 100vh;
        }

        /* ── Partículas ── */
        @keyframes hmFloat {
          0%   { transform: translateY(0)   rotate(0deg);   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
        }

        /* ── Hero ── */
        .hm-hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: linear-gradient(155deg, #060d20 0%, #0a1535 35%, #0e1d50 60%, #050f28 100%);
          border-radius: 0 0 3rem 3rem;
        }

        .hm-hero-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          transition: left 0.15s ease, top 0.15s ease;
        }

        .hm-hero-inner { position: relative; z-index: 2; text-align: center; width: 100%; max-width: 680px; padding: 0 24px; }

        .hm-logo {
          width: clamp(140px, 35vw, 280px);
          filter: drop-shadow(0 20px 60px rgba(60,140,255,0.35));
          animation: hmLogoFloat 6s ease-in-out infinite;
        }
        @keyframes hmLogoFloat {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-10px); }
        }

        .hm-tagline {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(15px, 4vw, 20px);
          color: rgba(180,210,255,0.78);
          line-height: 1.65;
          margin: 24px auto 0;
          max-width: 480px;
          font-style: italic;
        }

        .hm-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(60,140,255,0.12);
          border: 1px solid rgba(60,140,255,0.25);
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 11px;
          letter-spacing: 0.18em;
          color: rgba(120,190,255,0.75);
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 20px;
        }

        /* ── Botões hero ── */
        .hm-hero-btns {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin-top: 36px;
        }

        .hm-btn-primary {
          display: inline-flex; align-items: center; gap: 7px;
          background: linear-gradient(130deg, #1a55d0, #0090ff);
          color: #fff; font-weight: 800; font-size: 14px;
          padding: 13px 26px; border-radius: 999px;
          box-shadow: 0 8px 32px rgba(0,100,255,0.35);
          text-decoration: none; transition: transform 0.18s, box-shadow 0.18s;
          letter-spacing: 0.02em;
        }
        .hm-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(0,100,255,0.45); }

        .hm-btn-ghost {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(200,225,255,0.85); font-weight: 700; font-size: 14px;
          padding: 13px 24px; border-radius: 999px;
          text-decoration: none; transition: background 0.18s, transform 0.18s;
        }
        .hm-btn-ghost:hover { background: rgba(255,255,255,0.12); transform: translateY(-2px); }

        /* ── Mobile: hero e botões ── */
        @media (max-width: 480px) {
          .hm-hero {
            min-height: 100svh;
            align-items: flex-start;
            padding-top: 7vh;
            border-radius: 0 0 2rem 2rem;
          }
          .hm-hero-inner {
            padding-bottom: 60px;
          }
          .hm-logo {
            width: clamp(120px, 45vw, 200px);
          }
          .hm-tagline {
            margin-top: 16px;
            font-size: 15px;
          }
          .hm-hero-btns {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 0 8px;
            margin-top: 24px;
          }
          .hm-btn-primary, .hm-btn-ghost {
            justify-content: center;
            width: 100%;
          }
          .hm-social-icons {
            margin-top: 18px;
          }
        }

        /* ── Ícones sociais ── */
        .hm-social-icons {
          display: flex;
          gap: 14px;
          justify-content: center;
          margin-top: 22px;
        }
        .hm-social-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.16);
          color: rgba(200,225,255,0.85);
          text-decoration: none;
          transition: background 0.2s, transform 0.18s, border-color 0.2s;
          flex-shrink: 0;
        }
        .hm-social-icon:hover {
          background: rgba(255,255,255,0.16);
          border-color: rgba(255,255,255,0.3);
          transform: translateY(-2px);
        }

        /* ── Scroll indicator ── */
        @keyframes hmBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }
        .hm-scroll-hint {
          position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          color: rgba(120,180,255,0.45); font-size: 11px; letter-spacing: 0.12em;
          text-transform: uppercase; z-index: 2;
        }
        .hm-scroll-arrow { animation: hmBounce 1.8s ease-in-out infinite; }

        /* ── Seções de conteúdo ── */
        .hm-content { max-width: 900px; margin: 0 auto; padding: 56px 16px 80px; }

        .hm-section-label {
          font-size: 10px; letter-spacing: 0.26em; text-transform: uppercase;
          color: rgba(30,100,220,0.55); font-weight: 700; margin-bottom: 6px;
        }
        .hm-section-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(22px, 5vw, 30px);
          font-weight: 700; color: #0a1535; line-height: 1.2; margin: 0;
        }
        .hm-section-header {
          display: flex; align-items: flex-end; justify-content: space-between; gap: 12px;
          margin-bottom: 22px;
        }
        .hm-see-all {
          font-size: 13px; font-weight: 700; color: #1a55d0;
          text-decoration: none; white-space: nowrap;
          transition: color 0.15s;
        }
        .hm-see-all:hover { color: #0040b0; }

        /* ── Cards de avisos ── */
        .hm-notices-grid { display: grid; gap: 14px; grid-template-columns: 1fr; }
        @media (min-width: 600px) { .hm-notices-grid { grid-template-columns: 1fr 1fr; } }

        .hm-notice-card {
          display: block; text-decoration: none;
          background: #fff;
          border-radius: 20px;
          padding: 20px 22px;
          border: 1px solid rgba(30,80,200,0.08);
          box-shadow: 0 2px 16px rgba(30,80,200,0.06);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }
        .hm-notice-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #1a55d0, #0090ff);
          border-radius: 20px 20px 0 0;
        }
        .hm-notice-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(30,80,200,0.13); }

        .hm-notice-date {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
          color: #1a55d0; background: rgba(26,85,208,0.08);
          border-radius: 999px; padding: 3px 10px; margin-bottom: 10px;
        }

        .hm-notice-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 16px; font-weight: 700; color: #0a1535; line-height: 1.35; margin: 0 0 8px;
        }

        .hm-notice-body {
          font-size: 13px; color: #4a5578; line-height: 1.6;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          margin: 0;
        }

        .hm-notice-cta {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 12px; font-weight: 700; color: #1a55d0;
          margin-top: 12px;
        }

        /* ── Galeria ── */
        .hm-gallery-grid {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(3, 1fr);
        }
        .hm-gallery-item {
          display: block; text-decoration: none;
          border-radius: 16px; overflow: hidden;
          background: #dde6f5;
          position: relative;
          aspect-ratio: 1;
        }
        .hm-gallery-item:first-child {
          grid-column: span 2;
          grid-row: span 2;
          border-radius: 22px;
        }
        .hm-gallery-img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.35s ease;
          display: block;
        }
        .hm-gallery-item:hover .hm-gallery-img { transform: scale(1.04); }
        .hm-gallery-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, transparent 50%, rgba(10,20,60,0.45) 100%);
          opacity: 0; transition: opacity 0.25s;
        }
        .hm-gallery-item:hover .hm-gallery-overlay { opacity: 1; }

        /* ── Localização ── */
        .hm-location {
          background: linear-gradient(135deg, #0a1535 0%, #0e1d50 50%, #0a2060 100%);
          border-radius: 28px;
          padding: 36px 28px;
          color: #fff;
          position: relative;
          overflow: hidden;
        }
        .hm-location::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,140,255,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .hm-location::after {
          content: '';
          position: absolute;
          bottom: -40px; left: -40px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(30,80,200,0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .hm-location-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(20px, 5vw, 26px); font-weight: 700;
          margin: 0 0 20px; position: relative; z-index: 1;
        }

        .hm-address-card {
          display: block; text-decoration: none;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 16px; padding: 18px 20px;
          transition: background 0.18s;
          position: relative; z-index: 1;
          margin-bottom: 20px;
        }
        .hm-address-card:hover { background: rgba(255,255,255,0.12); }

        .hm-address-label {
          font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(120,190,255,0.6); font-weight: 700; margin-bottom: 8px;
        }
        .hm-address-text {
          font-size: 15px; font-weight: 600; color: #fff; line-height: 1.55;
        }
        .hm-address-hint {
          font-size: 11px; color: rgba(140,200,255,0.55); margin-top: 8px;
          display: flex; align-items: center; gap: 4px;
        }

        .hm-loc-btns {
          display: flex; flex-wrap: wrap; gap: 10px;
          position: relative; z-index: 1;
        }

        .hm-loc-btn-white {
          display: inline-flex; align-items: center; gap: 8px;
          background: #fff; color: #0a1535;
          font-weight: 800; font-size: 13px; letter-spacing: 0.01em;
          padding: 12px 22px; border-radius: 999px;
          text-decoration: none; transition: opacity 0.18s, transform 0.18s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          flex: 1; min-width: 160px; justify-content: center;
        }
        .hm-loc-btn-white:hover { opacity: 0.92; transform: translateY(-2px); }

        .hm-loc-btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.18);
          color: rgba(200,225,255,0.88);
          font-weight: 800; font-size: 13px;
          padding: 12px 22px; border-radius: 999px;
          text-decoration: none; transition: background 0.18s, transform 0.18s;
          flex: 1; min-width: 160px; justify-content: center;
        }
        .hm-loc-btn-outline:hover { background: rgba(255,255,255,0.12); transform: translateY(-2px); }

        /* ── Devocional CTA Banner ── */
        .hm-devo-banner {
          background: linear-gradient(130deg, #040c20, #071428, #0a1840);
          border: 1px solid rgba(60,140,255,0.15);
          border-radius: 24px;
          padding: 30px 26px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 560px) {
          .hm-devo-banner { flex-direction: row; align-items: center; justify-content: space-between; }
        }
        .hm-devo-banner::before {
          content: '';
          position: absolute; top: -40px; right: -40px;
          width: 180px; height: 180px; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,120,255,0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .hm-devo-banner-text { position: relative; z-index: 1; }
        .hm-devo-banner-kicker {
          font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(80,180,255,0.6); font-weight: 700; margin-bottom: 6px;
        }
        .hm-devo-banner-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(18px, 4vw, 22px); color: #ddeeff; font-weight: 700;
          margin: 0; line-height: 1.3;
        }

        /* ── Divider ── */
        .hm-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(30,80,200,0.15), transparent);
          margin: 48px 0;
        }

        /* ── Empty states ── */
        .hm-empty {
          background: #fff; border-radius: 20px;
          border: 1px solid rgba(30,80,200,0.08);
          padding: 32px 24px; text-align: center;
          color: #7888aa; font-size: 14px;
        }

        /* ── PIX / Dízimos & Ofertas ── */
        .hm-pix-card {
          background: linear-gradient(135deg, #0a1535 0%, #0e1d50 50%, #0a2060 100%);
          border-radius: 28px;
          padding: 36px 28px;
          position: relative;
          overflow: hidden;
        }
        .hm-pix-card::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,140,255,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .hm-pix-card::after {
          content: '';
          position: absolute;
          bottom: -40px; left: -40px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(30,80,200,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .hm-pix-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(60,140,255,0.12);
          border: 1px solid rgba(60,140,255,0.25);
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 11px; font-weight: 900; letter-spacing: 0.2em;
          color: rgba(120,190,255,0.85); text-transform: uppercase;
          margin-bottom: 16px;
          position: relative; z-index: 1;
        }
        .hm-pix-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(22px, 5vw, 28px); font-weight: 700;
          color: #fff; margin: 0 0 10px;
          position: relative; z-index: 1;
        }
        .hm-pix-verse {
          font-style: italic; font-size: 13px; line-height: 1.65;
          color: rgba(180,210,255,0.55);
          margin: 0 0 24px;
          position: relative; z-index: 1;
        }
        .hm-pix-steps {
          display: flex; flex-direction: column; gap: 10px;
          margin-bottom: 24px;
          position: relative; z-index: 1;
        }
        .hm-pix-step {
          display: flex; align-items: center; gap: 12px;
          font-size: 13px; color: rgba(200,225,255,0.78); line-height: 1.45;
        }
        .hm-pix-step-num {
          display: inline-flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
          background: rgba(60,140,255,0.18);
          border: 1px solid rgba(60,140,255,0.3);
          font-size: 11px; font-weight: 800;
          color: rgba(120,190,255,0.9);
        }
        .hm-pix-key-box {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px; padding: 18px 22px;
          margin-bottom: 16px;
          position: relative; z-index: 1;
        }
        .hm-pix-key-label {
          display: flex; align-items: center; gap: 5px;
          font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(80,180,255,0.65); font-weight: 700; margin-bottom: 8px;
        }
        .hm-pix-key-value {
          display: block; font-size: 15px; font-weight: 700;
          color: #fff; word-break: break-all; letter-spacing: 0.01em;
        }
        .hm-pix-copy-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%;
          background: linear-gradient(130deg, #1a55d0, #0090ff);
          color: #fff; font-weight: 800; font-size: 14px;
          padding: 14px 24px; border-radius: 999px;
          border: none; cursor: pointer; letter-spacing: 0.02em;
          box-shadow: 0 8px 32px rgba(0,100,255,0.35);
          transition: transform 0.18s, box-shadow 0.18s, background 0.25s;
          position: relative; z-index: 1;
        }
        .hm-pix-copy-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(0,100,255,0.45); }
        .hm-pix-copy-btn.copied { background: linear-gradient(130deg, #0e3fa8, #0070cc); }
      `}</style>

      <div className="hm-root">

        {/* ─────────────── HERO ─────────────── */}
        <section
          className="hm-hero"
          ref={heroRef}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMousePos({
              x: ((e.clientX - rect.left) / rect.width) * 100,
              y: ((e.clientY - rect.top) / rect.height) * 100,
            });
          }}
        >
          {/* Partículas */}
          <Particles />

          {/* Glow dinâmico */}
          <div
            className="hm-hero-glow"
            style={{
              width: 600, height: 600,
              background: "radial-gradient(circle, rgba(0,120,255,0.18) 0%, transparent 65%)",
              left: `${mousePos.x}%`,
              top: `${mousePos.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
          {/* Glow estático azul profundo */}
          <div
            className="hm-hero-glow"
            style={{
              width: 800, height: 800,
              background: "radial-gradient(circle, rgba(30,60,180,0.12) 0%, transparent 60%)",
              left: "50%", top: "60%",
              transform: "translate(-50%, -50%)",
            }}
          />

          {/* Conteúdo */}
          <div className="hm-hero-inner">
            <img src={LOGO_FULL} alt="AD Ministério Irlanda" className="hm-logo" style={{ display: "block", margin: "0 auto" }} />

            <p className="hm-tagline">
              Uma família de fé que cresce unida, servindo a Deus e cuidando de pessoas.
            </p>

            <div className="hm-hero-btns">
              <Link to="/avisos" className="hm-btn-primary">
                <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
                  <path d="M10 2a6 6 0 00-6 6v1.5a3.5 3.5 0 01-1 2.45V13h14v-1.05A3.5 3.5 0 0116 9.5V8a6 6 0 00-6-6zm-1 14a1 1 0 102 0H9z"/>
                </svg>
                Ver Avisos
              </Link>

              <Link to="/devocional" className="hm-btn-ghost">
                📖 Devocional de Hoje
              </Link>

              <Link to="/galeria" className="hm-btn-ghost">
                🖼 Galeria
              </Link>
            </div>

            {/* Ícones das redes sociais */}
            <div className="hm-social-icons">
              {/* Instagram */}
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hm-social-icon" aria-label="Instagram" onClick={() => trackSocialClick("instagram")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              {/* YouTube */}
              <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="hm-social-icon" aria-label="YouTube" onClick={() => trackSocialClick("youtube")}>
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}>
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              {/* TikTok */}
              <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" className="hm-social-icon" aria-label="TikTok" onClick={() => trackSocialClick("tiktok")}>
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 19, height: 19 }}>
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="hm-scroll-hint">
            <span>Role para ver mais</span>
            <div className="hm-scroll-arrow">
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </section>

        {/* ─────────────── CONTEÚDO ─────────────── */}
        <div className="hm-content">

          {/* Banner Devocional */}
          <div className="hm-devo-banner" style={{ marginBottom: 48 }}>
            <div className="hm-devo-banner-text">
              <p className="hm-devo-banner-kicker">✦ &nbsp;Palavra do dia</p>
              <h2 className="hm-devo-banner-title">O devocional de hoje está te esperando</h2>
            </div>
            <Link
              to="/devocional"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "linear-gradient(130deg, #1040b0, #0088ee)",
                color: "#fff", fontWeight: 800, fontSize: 14,
                padding: "13px 26px", borderRadius: 999,
                textDecoration: "none", whiteSpace: "nowrap",
                boxShadow: "0 6px 24px rgba(0,100,255,0.3)",
                transition: "transform 0.18s, box-shadow 0.18s",
                position: "relative", zIndex: 1,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"; }}
            >
              Ler agora →
            </Link>
          </div>

          {/* ── Avisos ── */}
          <div className="hm-section-header">
            <div>
              <p className="hm-section-label">✦ &nbsp;Fique por dentro</p>
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
                    📅 &nbsp;{formatDateBR(notice.event_date ?? notice.created_at)}
                  </div>
                  <h3 className="hm-notice-title">{notice.title}</h3>
                  <p className="hm-notice-body">{notice.body}</p>
                  <span className="hm-notice-cta">
                    Ver detalhes
                    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12 }}>
                      <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06L7.28 11.78a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="hm-divider" />

          {/* ── Galeria ── */}
          <div className="hm-section-header">
            <div>
              <p className="hm-section-label">✦ &nbsp;Memórias</p>
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
              {galleryPreview.map((url, i) => (
                <Link key={url} to="/galeria" className="hm-gallery-item">
                  <img src={url} alt="Foto do culto" className="hm-gallery-img" loading="lazy" />
                  <div className="hm-gallery-overlay" />
                </Link>
              ))}
            </div>
          )}

          <div className="hm-divider" />

          {/* ── Localização ── */}
          <div className="hm-location">
            <h3 className="hm-location-title">Venha nos visitar 🕊</h3>

            <a href={CHURCH_DIRECTIONS_LINK} target="_blank" rel="noopener noreferrer" className="hm-address-card">
              <p className="hm-address-label">Endereço</p>
              <p className="hm-address-text">
                📍 {ADDRESS_LINE_1}<br />
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
              <a href={shareLocationWhatsUrl} target="_blank" rel="noopener noreferrer" className="hm-loc-btn-white">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 17, height: 17, color: "#128C7E" }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.123 1.528 5.854L0 24l6.335-1.508A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 01-5.031-1.388l-.361-.214-3.741.981.999-3.648-.235-.374A9.794 9.794 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                </svg>
                Enviar localização
              </a>

              <a href={pastorWhatsUrl} target="_blank" rel="noopener noreferrer" className="hm-loc-btn-outline">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 17, height: 17 }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.123 1.528 5.854L0 24l6.335-1.508A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 01-5.031-1.388l-.361-.214-3.741.981.999-3.648-.235-.374A9.794 9.794 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                </svg>
                Falar com o Pastor
              </a>
            </div>
          </div>

          <div className="hm-divider" />

          {/* ── Dízimos & Ofertas ── */}
          <div className="hm-pix-card">
            <div className="hm-pix-badge">
              {/* Ícone PIX (losango) */}
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13 }}>
                <polygon points="10,1 14,5 10,9 6,5"/>
                <polygon points="14,5 19,10 14,15 10,11"/>
                <polygon points="10,11 14,15 10,19 6,15"/>
                <polygon points="1,10 6,5 10,9 6,15"/>
              </svg>
              PIX
            </div>

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
              className={`hm-pix-copy-btn${copied ? ' copied' : ''}`}
              onClick={() => {
                navigator.clipboard.writeText('aogiminhumas@gmail.com');
                setCopied(true);
                trackPixCopy();
                setTimeout(() => setCopied(false), 2500);
              }}
            >
              {copied ? (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 17, height: 17 }}>
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/>
                  </svg>
                  Chave copiada!
                </>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 17, height: 17 }}>
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