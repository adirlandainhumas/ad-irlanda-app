import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const CHURCH_ADDRESS   = "Av. Maria José de Paula, Setor Amélio Alves - Inhumas";
const CHURCH_SIGNATURE = "AD Ministério Irlanda • Inhumas - GO";

type Notice = {
  id: string;
  title: string;
  body: string;
  is_published?: boolean;
  event_date?: string | null;
  created_at?: string | null;
};

const MONTHS_PT  = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS_FULL  = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
const DAYS_SHORT = ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"];

function toYMD(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function formatDateFull(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });
}

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date(); now.setHours(0,0,0,0); d.setHours(0,0,0,0);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

function DaysBadge({ days }: { days: number | null }) {
  if (days === null) return null;
  if (days < 0)      return <span className="nt-badge nt-badge-done">Realizado</span>;
  if (days === 0)    return <span className="nt-badge nt-badge-today">Hoje!</span>;
  if (days === 1)    return <span className="nt-badge nt-badge-soon">Amanhã</span>;
  if (days <= 7)     return <span className="nt-badge nt-badge-week">Em {days} dias</span>;
  return null;
}

function WaIcon({ size = 17 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" style={{width:size,height:size,flexShrink:0}} fill="currentColor" aria-hidden="true">
      <path d="M19.11 17.63c-.29-.15-1.7-.84-1.97-.94-.26-.1-.46-.15-.65.15-.19.29-.75.94-.92 1.13-.17.19-.33.22-.62.07-.29-.15-1.22-.45-2.32-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.33.43-.5.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.65-1.56-.89-2.13-.23-.56-.47-.48-.65-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.44 0 1.44 1.03 2.83 1.18 3.03.15.19 2.03 3.1 4.92 4.35.69.3 1.23.48 1.65.62.69.22 1.31.19 1.8.12.55-.08 1.7-.69 1.94-1.35.24-.67.24-1.24.17-1.35-.07-.12-.26-.19-.55-.34M16.04 26.67h-.01c-1.73 0-3.42-.46-4.9-1.34l-.35-.2-3.63.95.97-3.53-.23-.36a10.6 10.6 0 0 1-1.61-5.65c0-5.87 4.78-10.65 10.66-10.65 2.84 0 5.51 1.11 7.52 3.12a10.56 10.56 0 0 1 3.11 7.52c0 5.88-4.78 10.65-10.65 10.65m9.04-19.69A12.7 12.7 0 0 0 16.04 3.2C9.02 3.2 3.3 8.92 3.3 15.94c0 2.25.6 4.46 1.74 6.4L3.2 29.12l6.95-1.82a12.68 12.68 0 0 0 5.89 1.5h.01c7.02 0 12.74-5.72 12.74-12.74 0-3.4-1.33-6.6-3.71-9.08"/>
    </svg>
  );
}

function shareWhatsApp(n: Notice) {
  const text = `*${n.title}*${n.body?.trim() ? `\n\n${n.body.trim()}` : ""}\n\n📍 ${CHURCH_ADDRESS}\n${CHURCH_SIGNATURE}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}

function getWeekStart(date: Date): Date {
  const d = new Date(date); d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay()); return d;
}
function addDays(date: Date, n: number): Date {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}
function dateToYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Notices() {
  const [loading, setLoading] = useState(true);
  const [items, setItems]     = useState<Notice[]>([]);
  const [error, setError]     = useState<string | null>(null);
  const [active, setActive]   = useState<Notice | null>(null);

  const today    = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayStr = useMemo(() => dateToYMD(today), [today]);

  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));

  // Segunda → Domingo (ordem cascata)
  const weekDays = useMemo(() =>
    [1,2,3,4,5,6,0].map((offset) => {
      const base = addDays(weekStart, offset);
      return base;
    }),
    [weekStart]
  );

  async function loadNotices() {
    setLoading(true); setError(null);
    try {
      let res = await supabase.from("notices").select("*").eq("is_published", true).order("event_date", { ascending: true });
      if (res.error) res = await supabase.from("notices").select("*").eq("is_published", true).order("created_at", { ascending: true });
      if (res.error) throw res.error;
      setItems((res.data as Notice[]) ?? []);
    } catch (e: any) { setError(e?.message ?? "Erro ao carregar avisos."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadNotices(); }, []);

  const noticesByDate = useMemo(() => {
    const map: Record<string, Notice[]> = {};
    items.forEach((n) => {
      const key = toYMD(n.event_date ?? n.created_at);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(n);
    });
    return map;
  }, [items]);

  // Label do intervalo da semana
  const weekLabel = useMemo(() => {
    const mon = weekDays[0];
    const sun = weekDays[6];
    if (mon.getMonth() === sun.getMonth())
      return `${mon.getDate()} – ${sun.getDate()} de ${MONTHS_PT[mon.getMonth()]} ${mon.getFullYear()}`;
    return `${mon.getDate()} ${MONTHS_PT[mon.getMonth()]} – ${sun.getDate()} ${MONTHS_PT[sun.getMonth()]} ${sun.getFullYear()}`;
  }, [weekDays]);

  // Quantos eventos nesta semana
  const weekEventCount = useMemo(() =>
    weekDays.reduce((acc, d) => acc + (noticesByDate[dateToYMD(d)]?.length ?? 0), 0),
    [weekDays, noticesByDate]
  );

  const activeDateFull = useMemo(() => formatDateFull(active?.event_date ?? active?.created_at), [active]);
  const activeDays     = useMemo(() => daysUntil(active?.event_date), [active]);

  function prevWeek() { setWeekStart(w => addDays(w, -7)); }
  function nextWeek() { setWeekStart(w => addDays(w,  7)); }
  function goToday()  { setWeekStart(getWeekStart(new Date())); }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700;900&display=swap');
        * { box-sizing: border-box; }
        .nt-root { font-family:'Lato',sans-serif; min-height:100vh; background:#f0f4ff; }

        /* ── Hero ── */
        .nt-hero {
          background:linear-gradient(155deg,#060d20 0%,#0a1535 40%,#0e1d50 70%,#050f28 100%);
          padding:44px 20px 52px; position:relative; overflow:hidden;
          border-radius:0 0 2.5rem 2.5rem;
        }
        .nt-hero::before { content:''; position:absolute; top:-80px; right:-80px; width:340px; height:340px; border-radius:50%; background:radial-gradient(circle,rgba(0,120,255,.15) 0%,transparent 70%); pointer-events:none; }
        .nt-hero::after  { content:''; position:absolute; bottom:-60px; left:-60px; width:260px; height:260px; border-radius:50%; background:radial-gradient(circle,rgba(30,60,200,.11) 0%,transparent 70%); pointer-events:none; }
        .nt-hero-inner { position:relative; z-index:1; max-width:680px; margin:0 auto; display:flex; flex-direction:column; gap:13px; }
        .nt-hero-kicker { font-size:10px; letter-spacing:.24em; text-transform:uppercase; color:rgba(80,180,255,.65); font-weight:700; display:flex; align-items:center; gap:8px; }
        .nt-hero-kicker::before { content:''; width:24px; height:1px; background:rgba(80,180,255,.4); }
        .nt-hero-title { font-family:'Playfair Display',Georgia,serif; font-size:clamp(28px,7vw,42px); font-weight:700; color:#fff; margin:0; line-height:1.15; }
        .nt-hero-sub { font-family:'Playfair Display',Georgia,serif; font-size:clamp(14px,3.5vw,17px); color:rgba(160,200,255,.65); font-style:italic; margin:0; max-width:400px; }
        .nt-hero-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:4px; }
        .nt-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); border-radius:999px; padding:5px 13px; font-size:11px; font-weight:700; color:rgba(180,220,255,.75); }
        .nt-refresh { display:inline-flex; align-items:center; gap:6px; background:rgba(26,85,208,.2); border:1px solid rgba(60,140,255,.22); border-radius:999px; padding:5px 14px; font-size:11px; font-weight:700; color:rgba(100,180,255,.85); cursor:pointer; transition:background .18s; font-family:'Lato',sans-serif; }
        .nt-refresh:hover { background:rgba(26,85,208,.32); }

        /* ── Conteúdo ── */
        .nt-content { max-width:680px; margin:0 auto; padding:24px 16px 80px; }

        /* ── Navegação da semana ── */
        .nt-week-nav {
          display:flex; align-items:center; justify-content:space-between;
          background:#fff; border-radius:18px;
          border:1px solid rgba(26,85,208,.08);
          box-shadow:0 2px 12px rgba(26,85,208,.06);
          padding:12px 16px; margin-bottom:20px;
        }
        .nt-nav-btn { width:34px; height:34px; border-radius:50%; border:1px solid rgba(26,85,208,.15); background:rgba(26,85,208,.05); color:#1a55d0; display:grid; place-items:center; cursor:pointer; font-size:16px; transition:background .15s; }
        .nt-nav-btn:hover { background:rgba(26,85,208,.12); }
        .nt-week-center { display:flex; flex-direction:column; align-items:center; gap:5px; }
        .nt-week-label { font-family:'Playfair Display',Georgia,serif; font-size:clamp(13px,3.5vw,15px); font-weight:700; color:#0a1535; }
        .nt-today-btn { font-size:10px; font-weight:700; color:rgba(26,85,208,.7); background:rgba(26,85,208,.07); border:1px solid rgba(26,85,208,.15); border-radius:999px; padding:3px 11px; cursor:pointer; transition:background .15s; font-family:'Lato',sans-serif; }
        .nt-today-btn:hover { background:rgba(26,85,208,.13); }

        /* ── Cascata ── */
        .nt-cascade { display:flex; flex-direction:column; gap:0; position:relative; }

        /* Linha vertical da timeline */
        .nt-cascade::before {
          content:''; position:absolute;
          left:38px; top:0; bottom:0; width:2px;
          background:linear-gradient(180deg, rgba(26,85,208,.25) 0%, rgba(26,85,208,.08) 100%);
          border-radius:2px;
        }

        /* ── Linha de dia ── */
        .nt-day-row { display:flex; gap:0; position:relative; padding-bottom:4px; }

        /* Marcador do dia na linha */
        .nt-day-marker {
          display:flex; flex-direction:column; align-items:center;
          width:78px; flex-shrink:0; padding-top:14px; position:relative; z-index:1;
        }

        .nt-day-circle {
          width:32px; height:32px; border-radius:50%;
          display:grid; place-items:center;
          font-size:13px; font-weight:700;
          background:#fff;
          border:2px solid rgba(26,85,208,.18);
          color:#4a5578;
          box-shadow:0 2px 8px rgba(26,85,208,.08);
          transition:all .2s;
          flex-shrink:0;
        }
        .nt-day-circle-today {
          background:linear-gradient(135deg,#1a55d0,#0090ff);
          border-color:transparent;
          color:#fff;
          box-shadow:0 4px 16px rgba(26,85,208,.35);
        }
        .nt-day-circle-has-event {
          border-color:#1a55d0;
          color:#1a55d0;
          background:#f0f4ff;
        }
        .nt-day-circle-done {
          border-color:rgba(26,85,208,.1);
          color:#aabbdd;
          background:#f7f9ff;
        }

        .nt-day-name-label {
          font-size:9px; font-weight:700; letter-spacing:.1em;
          color:rgba(26,85,208,.4); text-transform:uppercase;
          margin-top:5px; text-align:center;
        }
        .nt-day-name-today { color:#1a55d0; }

        /* Conteúdo à direita do marcador */
        .nt-day-content {
          flex:1; padding:10px 0 10px 12px;
          display:flex; flex-direction:column; gap:8px;
          min-height:60px;
          justify-content:center;
        }

        /* Dia sem evento — linha tracejada sutil */
        .nt-day-empty-line {
          height:1px;
          background:linear-gradient(90deg, rgba(26,85,208,.1), transparent);
          border-radius:1px;
          align-self:center;
          width:100%;
        }

        /* ── Cards de evento ── */
        @keyframes ntFadeIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ntSpin   { to{transform:rotate(360deg)} }
        @keyframes ntPulse  { 0%,100%{opacity:.6} 50%{opacity:1} }

        .nt-event-card {
          background:#fff;
          border-radius:16px;
          border:1px solid rgba(26,85,208,.09);
          box-shadow:0 2px 10px rgba(26,85,208,.06);
          overflow:hidden;
          cursor:pointer;
          transition:transform .18s, box-shadow .18s;
          animation:ntFadeIn .35s ease forwards;
          font-family:'Lato',sans-serif;
          text-align:left; width:100%;
        }
        .nt-event-card:hover { transform:translateX(3px); box-shadow:0 6px 24px rgba(26,85,208,.13); }
        .nt-event-card-accent { height:3px; background:linear-gradient(90deg,#1a55d0,#0090ff); }
        .nt-event-card-accent-done { background:linear-gradient(90deg,#8899cc,#aabbdd); }
        .nt-event-card-body { padding:12px 14px 10px; }
        .nt-event-card-meta { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:6px; }
        .nt-event-card-title { font-family:'Playfair Display',Georgia,serif; font-size:clamp(14px,3.8vw,16px); font-weight:700; color:#0a1535; line-height:1.3; margin:0 0 5px; }
        .nt-event-card-preview { font-size:12px; color:#4a5578; line-height:1.6; margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .nt-event-card-footer { display:flex; align-items:center; justify-content:space-between; margin-top:10px; padding-top:8px; border-top:1px solid rgba(26,85,208,.06); }
        .nt-event-card-cta { font-size:11px; font-weight:700; color:#1a55d0; display:flex; align-items:center; gap:3px; }
        .nt-event-card-share { display:inline-flex; align-items:center; gap:5px; background:rgba(0,180,80,.08); border:1px solid rgba(0,180,80,.15); border-radius:999px; padding:4px 10px; font-size:11px; font-weight:700; color:#00a050; cursor:pointer; transition:background .15s; font-family:'Lato',sans-serif; }
        .nt-event-card-share:hover { background:rgba(0,180,80,.15); }

        /* Badges */
        .nt-badge { font-size:10px; font-weight:700; letter-spacing:.06em; border-radius:999px; padding:2px 8px; }
        .nt-badge-done  { background:rgba(100,120,180,.1); color:#8899bb; }
        .nt-badge-today { background:rgba(0,180,100,.1); color:#00a864; animation:ntPulse 2s ease-in-out infinite; }
        .nt-badge-soon  { background:rgba(255,160,0,.1); color:#d08000; }
        .nt-badge-week  { background:rgba(26,85,208,.1); color:#1a55d0; }

        /* Semana sem eventos */
        .nt-empty-week {
          text-align:center; padding:32px 20px;
          background:#fff; border-radius:18px;
          border:1px solid rgba(26,85,208,.07);
          margin-top:8px;
        }
        .nt-empty-week-icon { font-size:28px; margin-bottom:8px; }
        .nt-empty-week-text { font-family:'Playfair Display',Georgia,serif; font-size:15px; color:#8899bb; font-style:italic; }

        /* Loading */
        .nt-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 0; gap:14px; }
        .nt-spinner { width:28px; height:28px; border:2px solid rgba(26,85,208,.15); border-top-color:rgba(26,85,208,.8); border-radius:50%; animation:ntSpin .85s linear infinite; }
        .nt-loading-text { font-family:'Playfair Display',Georgia,serif; font-size:14px; font-style:italic; color:rgba(26,85,208,.45); }
        .nt-error { background:rgba(220,50,50,.06); border:1px solid rgba(220,50,50,.15); border-radius:16px; padding:14px 18px; color:#b03030; font-size:14px; margin-bottom:16px; }

        /* Modal */
        .nt-backdrop { position:fixed; inset:0; background:rgba(5,15,40,.65); backdrop-filter:blur(6px); display:flex; align-items:flex-end; justify-content:center; z-index:50; animation:ntFadeIn .2s ease; }
        @media(min-width:560px){ .nt-backdrop { align-items:center; padding:24px; } }
        .nt-modal { width:100%; max-width:540px; background:#fff; border-radius:28px 28px 0 0; overflow:hidden; box-shadow:0 -8px 60px rgba(10,20,60,.25); max-height:90vh; display:flex; flex-direction:column; }
        @media(min-width:560px){ .nt-modal { border-radius:28px; max-height:85vh; box-shadow:0 24px 80px rgba(10,20,60,.3); } }
        .nt-modal-header { background:linear-gradient(135deg,#060d20,#0a1535); padding:22px 22px 18px; flex-shrink:0; }
        .nt-modal-header-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:12px; }
        .nt-modal-date { font-size:11px; letter-spacing:.08em; text-transform:capitalize; color:rgba(100,180,255,.65); font-weight:600; }
        .nt-modal-close { width:32px; height:32px; border-radius:50%; border:1px solid rgba(255,255,255,.15); background:rgba(255,255,255,.07); color:rgba(200,220,255,.8); display:grid; place-items:center; cursor:pointer; flex-shrink:0; font-size:14px; transition:background .18s; font-family:'Lato',sans-serif; }
        .nt-modal-close:hover { background:rgba(255,255,255,.14); }
        .nt-modal-title { font-family:'Playfair Display',Georgia,serif; font-size:clamp(17px,5vw,22px); font-weight:700; color:#fff; margin:0; line-height:1.25; }
        .nt-modal-body { padding:22px; overflow-y:auto; flex:1; }
        .nt-modal-text { font-size:15px; color:#2a3555; line-height:1.8; white-space:pre-line; margin:0; font-family:'Playfair Display',Georgia,serif; }
        .nt-modal-address { margin-top:18px; padding:12px 14px; background:rgba(26,85,208,.05); border:1px solid rgba(26,85,208,.1); border-radius:14px; font-size:13px; color:#4a5578; }
        .nt-modal-address strong { color:#0a1535; }
        .nt-modal-footer { padding:14px 22px 18px; border-top:1px solid rgba(26,85,208,.08); flex-shrink:0; }
        .nt-modal-share-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:10px; background:linear-gradient(130deg,#158a4a,#1db860); color:#fff; font-weight:800; font-size:15px; padding:14px 0; border-radius:16px; border:none; cursor:pointer; font-family:'Lato',sans-serif; box-shadow:0 6px 24px rgba(15,140,60,.28); transition:transform .18s,box-shadow .18s; }
        .nt-modal-share-btn:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(15,140,60,.4); }
      `}</style>

      <div className="nt-root">

        {/* ── Hero ── */}
        <header className="nt-hero">
          <div className="nt-hero-inner">
            <p className="nt-hero-kicker">Fique por dentro</p>
            <h1 className="nt-hero-title">Avisos do<br />Ministério</h1>
            <p className="nt-hero-sub">Tudo que está acontecendo no nosso meio, em um só lugar.</p>
            <div className="nt-hero-row">
              {!loading && (
                <span className="nt-pill">
                  <svg viewBox="0 0 16 16" fill="currentColor" style={{width:11,height:11}}>
                    <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8-3.25a.75.75 0 01.75.75v2.69l1.28 1.28a.75.75 0 11-1.06 1.06l-1.5-1.5A.75.75 0 017.25 9.5V6.5A.75.75 0 018 5.75z"/>
                  </svg>
                  {items.length} {items.length === 1 ? "aviso" : "avisos"}
                </span>
              )}
              <button className="nt-refresh" onClick={loadNotices}>
                <svg viewBox="0 0 16 16" fill="currentColor" style={{width:11,height:11}}>
                  <path fillRule="evenodd" d="M8 3a5 5 0 100 10A5 5 0 008 3zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z" clipRule="evenodd"/>
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

          {!loading && (
            <>
              {/* Navegação da semana */}
              <div className="nt-week-nav">
                <button className="nt-nav-btn" onClick={prevWeek} aria-label="Semana anterior">‹</button>
                <div className="nt-week-center">
                  <span className="nt-week-label">{weekLabel}</span>
                  <button className="nt-today-btn" onClick={goToday}>Esta semana</button>
                </div>
                <button className="nt-nav-btn" onClick={nextWeek} aria-label="Próxima semana">›</button>
              </div>

              {/* Cascata vertical */}
              {weekEventCount === 0 ? (
                <div className="nt-empty-week">
                  <div className="nt-empty-week-icon">🕊</div>
                  <p className="nt-empty-week-text">Nenhum aviso nesta semana.</p>
                </div>
              ) : (
                <div className="nt-cascade">
                  {weekDays.map((dayDate, rowIdx) => {
                    const key      = dateToYMD(dayDate);
                    const notices  = noticesByDate[key] ?? [];
                    const isToday  = key === todayStr;
                    const hasEvent = notices.length > 0;
                    const isPast   = dayDate < today;

                    return (
                      <div key={key} className="nt-day-row">
                        {/* Marcador */}
                        <div className="nt-day-marker">
                          <div className={`nt-day-circle ${isToday ? "nt-day-circle-today" : hasEvent ? (isPast ? "nt-day-circle-done" : "nt-day-circle-has-event") : ""}`}>
                            {dayDate.getDate()}
                          </div>
                          <span className={`nt-day-name-label ${isToday ? "nt-day-name-today" : ""}`}>
                            {DAYS_SHORT[dayDate.getDay()]}
                          </span>
                        </div>

                        {/* Conteúdo */}
                        <div className="nt-day-content">
                          {hasEvent ? (
                            notices.map((n, ni) => {
                              const days = daysUntil(n.event_date);
                              const done = days !== null && days < 0;
                              return (
                                <button
                                  key={n.id}
                                  className="nt-event-card"
                                  style={{ animationDelay: `${(rowIdx * 0.06) + (ni * 0.04)}s` }}
                                  onClick={() => setActive(n)}
                                >
                                  <div className={`nt-event-card-accent ${done ? "nt-event-card-accent-done" : ""}`} />
                                  <div className="nt-event-card-body">
                                    <div className="nt-event-card-meta">
                                      <DaysBadge days={days} />
                                    </div>
                                    <h3 className="nt-event-card-title">{n.title}</h3>
                                    <p className="nt-event-card-preview">{n.body}</p>
                                    <div className="nt-event-card-footer">
                                      <span className="nt-event-card-cta">
                                        Ler completo
                                        <svg viewBox="0 0 16 16" fill="currentColor" style={{width:10,height:10}}>
                                          <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06L7.28 11.78a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
                                        </svg>
                                      </span>
                                      <button
                                        className="nt-event-card-share"
                                        onClick={(e) => { e.stopPropagation(); shareWhatsApp(n); }}
                                      >
                                        <WaIcon size={14} />
                                        Compartilhar
                                      </button>
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="nt-day-empty-line" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {active && (
        <div className="nt-backdrop" onClick={() => setActive(null)}>
          <div className="nt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nt-modal-header">
              <div className="nt-modal-header-top">
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {activeDateFull && <p className="nt-modal-date">📅 {activeDateFull}</p>}
                  <DaysBadge days={activeDays} />
                </div>
                <button className="nt-modal-close" onClick={() => setActive(null)}>✕</button>
              </div>
              <h2 className="nt-modal-title">{active.title}</h2>
            </div>
            <div className="nt-modal-body">
              <p className="nt-modal-text">{active.body}</p>
              <div className="nt-modal-address"><strong>📍 Endereço:</strong> {CHURCH_ADDRESS}</div>
            </div>
            <div className="nt-modal-footer">
              <button className="nt-modal-share-btn" onClick={() => shareWhatsApp(active)}>
                <WaIcon size={20} />
                Compartilhar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}