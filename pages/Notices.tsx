import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const CHURCH_ADDRESS = "Av. Maria José de Paula, Setor Amélio Alves - Inhumas";
const CHURCH_SIGNATURE = "AD Ministério Irlanda • Inhumas - GO";

type Notice = {
  id: string;
  title: string;
  body: string;
  is_published?: boolean;
  event_date?: string | null;
  created_at?: string | null;
};

function formatDateBR(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateFull(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function shareWhatsApp(n: Notice) {
  const title = `*${n.title}*`;
  const body = n.body?.trim() ? `\n\n${n.body.trim()}` : "";
  const address = `\n\n📍 ${CHURCH_ADDRESS}`;
  const signature = `\n${CHURCH_SIGNATURE}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(`${title}${body}${address}${signature}`)}`, "_blank", "noopener,noreferrer");
}

// Quantos dias faltam para o evento
function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

function DaysBadge({ days }: { days: number | null }) {
  if (days === null) return null;
  if (days < 0) return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", background: "rgba(100,120,180,0.12)", color: "#7888bb", borderRadius: 999, padding: "2px 8px" }}>
      Realizado
    </span>
  );
  if (days === 0) return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", background: "rgba(0,180,100,0.12)", color: "#00b864", borderRadius: 999, padding: "2px 8px", animation: "ntPulse 2s ease-in-out infinite" }}>
      Hoje!
    </span>
  );
  if (days === 1) return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", background: "rgba(255,160,0,0.12)", color: "#e08800", borderRadius: 999, padding: "2px 8px" }}>
      Amanhã
    </span>
  );
  if (days <= 7) return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", background: "rgba(26,85,208,0.1)", color: "#1a55d0", borderRadius: 999, padding: "2px 8px" }}>
      Em {days} dias
    </span>
  );
  return null;
}

export default function Notices() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Notice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Notice | null>(null);

  async function loadNotices() {
    setLoading(true);
    setError(null);
    try {
      let res = await supabase.from("notices").select("*").eq("is_published", true).order("event_date", { ascending: true });
      if (res.error) res = await supabase.from("notices").select("*").eq("is_published", true).order("created_at", { ascending: true });
      if (res.error) throw res.error;
      setItems((res.data as Notice[]) ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar avisos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadNotices(); }, []);

  const activeDateFull = useMemo(() => formatDateFull(active?.event_date ?? active?.created_at), [active]);
  const activeDays = useMemo(() => daysUntil(active?.event_date), [active]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700;900&display=swap');

        * { box-sizing: border-box; }

        .nt-root {
          font-family: 'Lato', sans-serif;
          min-height: 100vh;
          background: #f0f4ff;
        }

        /* ── Hero da página ── */
        .nt-hero {
          background: linear-gradient(155deg, #060d20 0%, #0a1535 40%, #0e1d50 70%, #050f28 100%);
          padding: 48px 20px 60px;
          position: relative;
          overflow: hidden;
          border-radius: 0 0 2.5rem 2.5rem;
        }
        .nt-hero::before {
          content: '';
          position: absolute; top: -80px; right: -80px;
          width: 360px; height: 360px; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,120,255,0.16) 0%, transparent 70%);
          pointer-events: none;
        }
        .nt-hero::after {
          content: '';
          position: absolute; bottom: -60px; left: -60px;
          width: 280px; height: 280px; border-radius: 50%;
          background: radial-gradient(circle, rgba(30,60,200,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .nt-hero-inner {
          position: relative; z-index: 1;
          max-width: 700px; margin: 0 auto;
          display: flex; flex-direction: column; gap: 16px;
        }

        .nt-hero-kicker {
          font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase;
          color: rgba(80,180,255,0.65); font-weight: 700;
          display: flex; align-items: center; gap: 8px;
        }
        .nt-hero-kicker::before {
          content: '';
          width: 24px; height: 1px;
          background: rgba(80,180,255,0.4);
        }

        .nt-hero-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(28px, 7vw, 42px);
          font-weight: 700; color: #fff; margin: 0;
          line-height: 1.15;
        }

        .nt-hero-sub {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(14px, 3.5vw, 17px);
          color: rgba(160,200,255,0.65);
          font-style: italic; margin: 0;
          max-width: 420px;
        }

        .nt-hero-actions {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          margin-top: 4px;
        }

        .nt-count-pill {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px; padding: 6px 14px;
          font-size: 12px; font-weight: 700;
          color: rgba(180,220,255,0.75);
        }

        .nt-refresh-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(26,85,208,0.2);
          border: 1px solid rgba(60,140,255,0.25);
          border-radius: 999px; padding: 6px 16px;
          font-size: 12px; font-weight: 700;
          color: rgba(100,180,255,0.85);
          cursor: pointer; transition: background 0.18s, transform 0.18s;
          font-family: 'Lato', sans-serif;
        }
        .nt-refresh-btn:hover { background: rgba(26,85,208,0.32); transform: translateY(-1px); }

        /* ── Grid de cards ── */
        .nt-content { max-width: 700px; margin: 0 auto; padding: 32px 16px 80px; }

        .nt-grid { display: grid; gap: 14px; }

        /* ── Card individual ── */
        .nt-card {
          display: block; width: 100%; text-align: left;
          background: #fff;
          border-radius: 20px;
          border: 1px solid rgba(30,80,200,0.07);
          box-shadow: 0 2px 12px rgba(30,80,200,0.05);
          padding: 0;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          overflow: hidden;
          font-family: 'Lato', sans-serif;
        }
        .nt-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 36px rgba(26,85,208,0.12);
        }
        .nt-card:focus-visible {
          outline: 2px solid #1a55d0;
          outline-offset: 2px;
        }

        .nt-card-accent {
          height: 3px;
          background: linear-gradient(90deg, #1a55d0, #0090ff);
        }

        .nt-card-body { padding: 20px 22px 18px; }

        .nt-card-meta {
          display: flex; align-items: center; gap: 8px;
          flex-wrap: wrap; margin-bottom: 10px;
        }

        .nt-card-date {
          font-size: 11px; font-weight: 700;
          color: #1a55d0; letter-spacing: 0.05em;
          background: rgba(26,85,208,0.08);
          border-radius: 999px; padding: 3px 10px;
          display: flex; align-items: center; gap: 4px;
        }

        .nt-card-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(16px, 4vw, 18px);
          font-weight: 700; color: #0a1535;
          line-height: 1.3; margin: 0 0 8px;
        }

        .nt-card-preview {
          font-size: 13px; color: #4a5578; line-height: 1.65;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .nt-card-footer {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid rgba(30,80,200,0.06);
        }

        .nt-card-cta {
          font-size: 12px; font-weight: 700; color: #1a55d0;
          display: flex; align-items: center; gap: 4px;
        }

        .nt-card-share {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(0,180,80,0.08);
          border: 1px solid rgba(0,180,80,0.15);
          border-radius: 999px; padding: 5px 12px;
          font-size: 11px; font-weight: 700; color: #00a050;
          cursor: pointer; transition: background 0.18s;
          font-family: 'Lato', sans-serif;
        }
        .nt-card-share:hover { background: rgba(0,180,80,0.14); }

        /* ── Estados ── */
        @keyframes ntSpin { to { transform: rotate(360deg); } }
        @keyframes ntPulse { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes ntFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        .nt-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 60px 0; gap: 14px;
        }
        .nt-spinner {
          width: 30px; height: 30px;
          border: 2px solid rgba(26,85,208,0.15);
          border-top-color: rgba(26,85,208,0.8);
          border-radius: 50%; animation: ntSpin 0.85s linear infinite;
        }
        .nt-loading-text {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 14px; font-style: italic;
          color: rgba(26,85,208,0.45);
        }

        .nt-empty {
          text-align: center; padding: 52px 24px;
          background: #fff; border-radius: 20px;
          border: 1px solid rgba(30,80,200,0.07);
        }
        .nt-empty-icon { font-size: 36px; margin-bottom: 12px; }
        .nt-empty-text {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 16px; color: #7888aa; font-style: italic;
        }

        .nt-error {
          background: rgba(220,50,50,0.06);
          border: 1px solid rgba(220,50,50,0.15);
          border-radius: 16px; padding: 14px 18px;
          color: #b03030; font-size: 14px; margin-bottom: 16px;
        }

        .nt-card-in { animation: ntFadeUp 0.45s ease forwards; opacity: 0; }

        /* ── Modal ── */
        .nt-backdrop {
          position: fixed; inset: 0;
          background: rgba(5,15,40,0.65);
          backdrop-filter: blur(6px);
          display: flex; align-items: flex-end; justify-content: center;
          z-index: 50; padding: 0;
          animation: ntFadeUp 0.2s ease;
        }
        @media (min-width: 560px) {
          .nt-backdrop { align-items: center; padding: 24px; }
        }

        .nt-modal {
          width: 100%; max-width: 560px;
          background: #fff;
          border-radius: 28px 28px 0 0;
          overflow: hidden;
          box-shadow: 0 -8px 60px rgba(10,20,60,0.25);
          max-height: 90vh;
          display: flex; flex-direction: column;
        }
        @media (min-width: 560px) {
          .nt-modal { border-radius: 28px; max-height: 85vh; box-shadow: 0 24px 80px rgba(10,20,60,0.3); }
        }

        .nt-modal-header {
          background: linear-gradient(135deg, #060d20, #0a1535);
          padding: 24px 24px 20px;
          position: relative; flex-shrink: 0;
        }

        .nt-modal-header-top {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
          margin-bottom: 14px;
        }

        .nt-modal-date-full {
          font-size: 11px; letter-spacing: 0.08em; text-transform: capitalize;
          color: rgba(100,180,255,0.65); font-weight: 600;
        }

        .nt-modal-close {
          width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.07);
          color: rgba(200,220,255,0.8);
          display: grid; place-items: center;
          cursor: pointer; flex-shrink: 0;
          font-size: 14px; transition: background 0.18s;
          font-family: 'Lato', sans-serif;
        }
        .nt-modal-close:hover { background: rgba(255,255,255,0.14); }

        .nt-modal-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(18px, 5vw, 24px);
          font-weight: 700; color: #fff;
          margin: 0; line-height: 1.25;
        }

        .nt-modal-body {
          padding: 24px; overflow-y: auto; flex: 1;
        }

        .nt-modal-text {
          font-size: 15px; color: #2a3555; line-height: 1.8;
          white-space: pre-line; margin: 0;
          font-family: 'Playfair Display', Georgia, serif;
        }

        .nt-modal-address {
          margin-top: 20px;
          padding: 14px 16px;
          background: rgba(26,85,208,0.05);
          border: 1px solid rgba(26,85,208,0.1);
          border-radius: 14px;
          font-size: 13px; color: #4a5578;
        }
        .nt-modal-address strong { color: #0a1535; }

        .nt-modal-footer {
          padding: 16px 24px 20px;
          border-top: 1px solid rgba(30,80,200,0.08);
          flex-shrink: 0;
        }

        .nt-modal-share-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          background: linear-gradient(130deg, #158a4a, #1db860);
          color: #fff; font-weight: 800; font-size: 15px;
          padding: 14px 0; border-radius: 16px; border: none;
          cursor: pointer; font-family: 'Lato', sans-serif;
          box-shadow: 0 6px 24px rgba(15,140,60,0.28);
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .nt-modal-share-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(15,140,60,0.4); }
      `}</style>

      <div className="nt-root">

        {/* ── Hero ── */}
        <header className="nt-hero">
          <div className="nt-hero-inner">
            <p className="nt-hero-kicker">Fique por dentro</p>
            <h1 className="nt-hero-title">Avisos do<br />Ministério</h1>
            <p className="nt-hero-sub">Tudo que está acontecendo no nosso meio, em um só lugar.</p>

            <div className="nt-hero-actions">
              {!loading && (
                <span className="nt-count-pill">
                  <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12 }}>
                    <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8-3.25a.75.75 0 01.75.75v2.69l1.28 1.28a.75.75 0 11-1.06 1.06l-1.5-1.5A.75.75 0 017.25 9.5V6.5A.75.75 0 018 5.75z"/>
                  </svg>
                  {items.length} {items.length === 1 ? "aviso" : "avisos"} publicados
                </span>
              )}
              <button className="nt-refresh-btn" onClick={loadNotices}>
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12 }}>
                  <path fillRule="evenodd" d="M8 2.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM.5 8a7.5 7.5 0 1115 0A7.5 7.5 0 01.5 8z" clipRule="evenodd"/>
                  <path d="M8 4.75a.75.75 0 01.75.75V8a.75.75 0 01-.22.53l-2 2a.75.75 0 01-1.06-1.06l1.78-1.78V5.5A.75.75 0 018 4.75z"/>
                </svg>
                Atualizar
              </button>
            </div>
          </div>
        </header>

        {/* ── Conteúdo ── */}
        <div className="nt-content">

          {error && <div className="nt-error">⚠️ {error}</div>}

          {loading && (
            <div className="nt-loading">
              <div className="nt-spinner" />
              <p className="nt-loading-text">Buscando avisos…</p>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="nt-empty">
              <div className="nt-empty-icon">🕊</div>
              <p className="nt-empty-text">Nenhum aviso publicado no momento.</p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="nt-grid">
              {items.map((n, idx) => {
                const dateLabel = formatDateBR(n.event_date ?? n.created_at);
                const days = daysUntil(n.event_date);
                return (
                  <button
                    key={n.id}
                    className="nt-card nt-card-in"
                    style={{ animationDelay: `${idx * 0.07}s` }}
                    onClick={() => setActive(n)}
                  >
                    <div className="nt-card-accent" />
                    <div className="nt-card-body">
                      <div className="nt-card-meta">
                        {dateLabel && (
                          <span className="nt-card-date">📅 {dateLabel}</span>
                        )}
                        <DaysBadge days={days} />
                      </div>

                      <h2 className="nt-card-title">{n.title}</h2>
                      <p className="nt-card-preview">{n.body}</p>

                      <div className="nt-card-footer">
                        <span className="nt-card-cta">
                          Ler completo
                          <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 11, height: 11 }}>
                            <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06L7.28 11.78a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
                          </svg>
                        </span>
                        <button
                          className="nt-card-share"
                          onClick={(e) => { e.stopPropagation(); shareWhatsApp(n); }}
                        >
                          <svg viewBox="0 0 32 32" style={{ width: 13, height: 13 }} fill="currentColor">
                            <path d="M19.11 17.63c-.29-.15-1.7-.84-1.97-.94-.26-.1-.46-.15-.65.15-.19.29-.75.94-.92 1.13-.17.19-.33.22-.62.07-.29-.15-1.22-.45-2.32-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.33.43-.5.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.65-1.56-.89-2.13-.23-.56-.47-.48-.65-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.44 0 1.44 1.03 2.83 1.18 3.03.15.19 2.03 3.1 4.92 4.35.69.3 1.23.48 1.65.62.69.22 1.31.19 1.8.12.55-.08 1.7-.69 1.94-1.35.24-.67.24-1.24.17-1.35-.07-.12-.26-.19-.55-.34M16.04 26.67h-.01c-1.73 0-3.42-.46-4.9-1.34l-.35-.2-3.63.95.97-3.53-.23-.36a10.6 10.6 0 0 1-1.61-5.65c0-5.87 4.78-10.65 10.66-10.65 2.84 0 5.51 1.11 7.52 3.12a10.56 10.56 0 0 1 3.11 7.52c0 5.88-4.78 10.65-10.65 10.65m9.04-19.69A12.7 12.7 0 0 0 16.04 3.2C9.02 3.2 3.3 8.92 3.3 15.94c0 2.25.6 4.46 1.74 6.4L3.2 29.12l6.95-1.82a12.68 12.68 0 0 0 5.89 1.5h.01c7.02 0 12.74-5.72 12.74-12.74 0-3.4-1.33-6.6-3.71-9.08"/>
                          </svg>
                          Compartilhar
                        </button>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {active && (
        <div className="nt-backdrop" onClick={() => setActive(null)}>
          <div className="nt-modal" onClick={(e) => e.stopPropagation()}>

            {/* Header azul escuro */}
            <div className="nt-modal-header">
              <div className="nt-modal-header-top">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {activeDateFull && (
                    <p className="nt-modal-date-full">📅 {activeDateFull}</p>
                  )}
                  <DaysBadge days={activeDays} />
                </div>
                <button className="nt-modal-close" onClick={() => setActive(null)} aria-label="Fechar">✕</button>
              </div>
              <h2 className="nt-modal-title">{active.title}</h2>
            </div>

            {/* Corpo */}
            <div className="nt-modal-body">
              <p className="nt-modal-text">{active.body}</p>

              <div className="nt-modal-address">
                <strong>📍 Endereço:</strong> {CHURCH_ADDRESS}
              </div>
            </div>

            {/* Rodapé com compartilhamento */}
            <div className="nt-modal-footer">
              <button className="nt-modal-share-btn" onClick={() => shareWhatsApp(active)}>
                <svg viewBox="0 0 32 32" style={{ width: 20, height: 20 }} fill="currentColor">
                  <path d="M19.11 17.63c-.29-.15-1.7-.84-1.97-.94-.26-.1-.46-.15-.65.15-.19.29-.75.94-.92 1.13-.17.19-.33.22-.62.07-.29-.15-1.22-.45-2.32-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.33.43-.5.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.65-1.56-.89-2.13-.23-.56-.47-.48-.65-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.44 0 1.44 1.03 2.83 1.18 3.03.15.19 2.03 3.1 4.92 4.35.69.3 1.23.48 1.65.62.69.22 1.31.19 1.8.12.55-.08 1.7-.69 1.94-1.35.24-.67.24-1.24.17-1.35-.07-.12-.26-.19-.55-.34M16.04 26.67h-.01c-1.73 0-3.42-.46-4.9-1.34l-.35-.2-3.63.95.97-3.53-.23-.36a10.6 10.6 0 0 1-1.61-5.65c0-5.87 4.78-10.65 10.66-10.65 2.84 0 5.51 1.11 7.52 3.12a10.56 10.56 0 0 1 3.11 7.52c0 5.88-4.78 10.65-10.65 10.65m9.04-19.69A12.7 12.7 0 0 0 16.04 3.2C9.02 3.2 3.3 8.92 3.3 15.94c0 2.25.6 4.46 1.74 6.4L3.2 29.12l6.95-1.82a12.68 12.68 0 0 0 5.89 1.5h.01c7.02 0 12.74-5.72 12.74-12.74 0-3.4-1.33-6.6-3.71-9.08"/>
                </svg>
                Compartilhar no WhatsApp
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}