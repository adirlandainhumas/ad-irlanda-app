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

const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS_PT   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function ymd(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

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

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date(); now.setHours(0,0,0,0); d.setHours(0,0,0,0);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

function DaysBadge({ days }: { days: number | null }) {
  if (days === null) return null;
  if (days < 0)  return <span className="nt-badge nt-badge-done">Realizado</span>;
  if (days === 0) return <span className="nt-badge nt-badge-today">Hoje!</span>;
  if (days === 1) return <span className="nt-badge nt-badge-soon">Amanhã</span>;
  if (days <= 7)  return <span className="nt-badge nt-badge-week">Em {days} dias</span>;
  return null;
}

function WaIcon() {
  return (
    <svg viewBox="0 0 32 32" style={{ width: 18, height: 18, flexShrink: 0 }} fill="currentColor" aria-hidden="true">
      <path d="M19.11 17.63c-.29-.15-1.7-.84-1.97-.94-.26-.1-.46-.15-.65.15-.19.29-.75.94-.92 1.13-.17.19-.33.22-.62.07-.29-.15-1.22-.45-2.32-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.33.43-.5.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.65-1.56-.89-2.13-.23-.56-.47-.48-.65-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.44 0 1.44 1.03 2.83 1.18 3.03.15.19 2.03 3.1 4.92 4.35.69.3 1.23.48 1.65.62.69.22 1.31.19 1.8.12.55-.08 1.7-.69 1.94-1.35.24-.67.24-1.24.17-1.35-.07-.12-.26-.19-.55-.34M16.04 26.67h-.01c-1.73 0-3.42-.46-4.9-1.34l-.35-.2-3.63.95.97-3.53-.23-.36a10.6 10.6 0 0 1-1.61-5.65c0-5.87 4.78-10.65 10.66-10.65 2.84 0 5.51 1.11 7.52 3.12a10.56 10.56 0 0 1 3.11 7.52c0 5.88-4.78 10.65-10.65 10.65m9.04-19.69A12.7 12.7 0 0 0 16.04 3.2C9.02 3.2 3.3 8.92 3.3 15.94c0 2.25.6 4.46 1.74 6.4L3.2 29.12l6.95-1.82a12.68 12.68 0 0 0 5.89 1.5h.01c7.02 0 12.74-5.72 12.74-12.74 0-3.4-1.33-6.6-3.71-9.08"/>
    </svg>
  );
}

function shareWhatsApp(n: Notice) {
  const text = `*${n.title}*${n.body?.trim() ? `\n\n${n.body.trim()}` : ""}\n\n📍 ${CHURCH_ADDRESS}\n${CHURCH_SIGNATURE}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}

// Gera array de dias para o calendário do mês
function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ─── Componente ──────────────────────────────────────────────────────────────
export default function Notices() {
  const [loading, setLoading] = useState(true);
  const [items, setItems]     = useState<Notice[]>([]);
  const [error, setError]     = useState<string | null>(null);
  const [active, setActive]   = useState<Notice | null>(null);
  const [view, setView]       = useState<"list" | "calendar">("list");

  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

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

  // Mapa: "YYYY-MM-DD" → Notice[]
  const noticesByDate = useMemo(() => {
    const map: Record<string, Notice[]> = {};
    items.forEach((n) => {
      const key = ymd(n.event_date ?? n.created_at);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(n);
    });
    return map;
  }, [items]);

  const calCells = useMemo(() => buildCalendar(calYear, calMonth), [calYear, calMonth]);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  const activeDateFull = useMemo(() => formatDateFull(active?.event_date ?? active?.created_at), [active]);
  const activeDays     = useMemo(() => daysUntil(active?.event_date), [active]);

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700;900&display=swap');
        * { box-sizing: border-box; }
        .nt-root { font-family: 'Lato', sans-serif; min-height: 100vh; background: #f0f4ff; }

        /* ── Hero ── */
        .nt-hero {
          background: linear-gradient(155deg,#060d20 0%,#0a1535 40%,#0e1d50 70%,#050f28 100%);
          padding: 44px 20px 56px; position: relative; overflow: hidden;
          border-radius: 0 0 2.5rem 2.5rem;
        }
        .nt-hero::before {
          content:''; position:absolute; top:-80px; right:-80px;
          width:360px; height:360px; border-radius:50%;
          background:radial-gradient(circle,rgba(0,120,255,.16) 0%,transparent 70%);
          pointer-events:none;
        }
        .nt-hero::after {
          content:''; position:absolute; bottom:-60px; left:-60px;
          width:280px; height:280px; border-radius:50%;
          background:radial-gradient(circle,rgba(30,60,200,.12) 0%,transparent 70%);
          pointer-events:none;
        }
        .nt-hero-inner { position:relative; z-index:1; max-width:700px; margin:0 auto; display:flex; flex-direction:column; gap:14px; }
        .nt-hero-kicker { font-size:10px; letter-spacing:.24em; text-transform:uppercase; color:rgba(80,180,255,.65); font-weight:700; display:flex; align-items:center; gap:8px; }
        .nt-hero-kicker::before { content:''; width:24px; height:1px; background:rgba(80,180,255,.4); }
        .nt-hero-title { font-family:'Playfair Display',Georgia,serif; font-size:clamp(28px,7vw,42px); font-weight:700; color:#fff; margin:0; line-height:1.15; }
        .nt-hero-sub { font-family:'Playfair Display',Georgia,serif; font-size:clamp(14px,3.5vw,17px); color:rgba(160,200,255,.65); font-style:italic; margin:0; max-width:420px; }
        .nt-hero-actions { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:4px; }
        .nt-count-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); border-radius:999px; padding:6px 14px; font-size:12px; font-weight:700; color:rgba(180,220,255,.75); }
        .nt-refresh-btn { display:inline-flex; align-items:center; gap:6px; background:rgba(26,85,208,.2); border:1px solid rgba(60,140,255,.25); border-radius:999px; padding:6px 16px; font-size:12px; font-weight:700; color:rgba(100,180,255,.85); cursor:pointer; transition:background .18s,transform .18s; font-family:'Lato',sans-serif; }
        .nt-refresh-btn:hover { background:rgba(26,85,208,.32); transform:translateY(-1px); }

        /* ── Toggle vista ── */
        .nt-toggle { display:flex; gap:6px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); border-radius:999px; padding:4px; }
        .nt-toggle-btn { display:flex; align-items:center; gap:6px; border:none; border-radius:999px; padding:6px 14px; font-size:12px; font-weight:700; cursor:pointer; transition:all .18s; font-family:'Lato',sans-serif; }
        .nt-toggle-btn-active { background:#fff; color:#0a1535; }
        .nt-toggle-btn-inactive { background:transparent; color:rgba(180,220,255,.65); }

        /* ── Conteúdo ── */
        .nt-content { max-width:700px; margin:0 auto; padding:28px 16px 80px; }

        /* ── Cards ── */
        .nt-grid { display:grid; gap:14px; }
        @keyframes ntFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ntSpin   { to{transform:rotate(360deg)} }
        @keyframes ntPulse  { 0%,100%{opacity:.6} 50%{opacity:1} }

        .nt-card { display:block; width:100%; text-align:left; background:#fff; border-radius:20px; border:1px solid rgba(30,80,200,.07); box-shadow:0 2px 12px rgba(30,80,200,.05); padding:0; cursor:pointer; transition:transform .2s,box-shadow .2s; overflow:hidden; font-family:'Lato',sans-serif; }
        .nt-card:hover { transform:translateY(-3px); box-shadow:0 10px 36px rgba(26,85,208,.12); }
        .nt-card:focus-visible { outline:2px solid #1a55d0; outline-offset:2px; }
        .nt-card-accent { height:3px; background:linear-gradient(90deg,#1a55d0,#0090ff); }
        .nt-card-body { padding:18px 20px 16px; }
        .nt-card-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:10px; }
        .nt-card-date { font-size:11px; font-weight:700; color:#1a55d0; letter-spacing:.05em; background:rgba(26,85,208,.08); border-radius:999px; padding:3px 10px; display:flex; align-items:center; gap:4px; }
        .nt-card-title { font-family:'Playfair Display',Georgia,serif; font-size:clamp(15px,4vw,17px); font-weight:700; color:#0a1535; line-height:1.3; margin:0 0 7px; }
        .nt-card-preview { font-size:13px; color:#4a5578; line-height:1.65; margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .nt-card-footer { display:flex; align-items:center; justify-content:space-between; margin-top:12px; padding-top:10px; border-top:1px solid rgba(30,80,200,.06); }
        .nt-card-cta { font-size:12px; font-weight:700; color:#1a55d0; display:flex; align-items:center; gap:4px; }
        .nt-card-share { display:inline-flex; align-items:center; gap:6px; background:rgba(0,180,80,.08); border:1px solid rgba(0,180,80,.15); border-radius:999px; padding:5px 12px; font-size:11px; font-weight:700; color:#00a050; cursor:pointer; transition:background .18s; font-family:'Lato',sans-serif; }
        .nt-card-share:hover { background:rgba(0,180,80,.15); }
        .nt-card-in { animation:ntFadeUp .45s ease forwards; opacity:0; }

        /* ── Badges ── */
        .nt-badge { font-size:10px; font-weight:700; letter-spacing:.08em; border-radius:999px; padding:2px 8px; }
        .nt-badge-done  { background:rgba(100,120,180,.12); color:#7888bb; }
        .nt-badge-today { background:rgba(0,180,100,.12); color:#00b864; animation:ntPulse 2s ease-in-out infinite; }
        .nt-badge-soon  { background:rgba(255,160,0,.12); color:#e08800; }
        .nt-badge-week  { background:rgba(26,85,208,.1); color:#1a55d0; }

        /* ── Calendário ── */
        .nt-cal-wrap { background:#fff; border-radius:24px; border:1px solid rgba(30,80,200,.08); box-shadow:0 2px 16px rgba(30,80,200,.06); overflow:hidden; }

        .nt-cal-header {
          background:linear-gradient(135deg,#060d20,#0a1535);
          padding:18px 20px 16px;
          display:flex; align-items:center; justify-content:space-between;
        }
        .nt-cal-nav { display:flex; align-items:center; gap:8px; }
        .nt-cal-nav-btn { width:32px; height:32px; border-radius:50%; border:1px solid rgba(255,255,255,.15); background:rgba(255,255,255,.07); color:rgba(200,220,255,.85); display:grid; place-items:center; cursor:pointer; transition:background .18s; font-size:14px; }
        .nt-cal-nav-btn:hover { background:rgba(255,255,255,.14); }
        .nt-cal-month { font-family:'Playfair Display',Georgia,serif; font-size:18px; font-weight:700; color:#fff; min-width:160px; text-align:center; }
        .nt-cal-today-btn { font-size:11px; font-weight:700; color:rgba(100,180,255,.75); background:rgba(60,140,255,.1); border:1px solid rgba(60,140,255,.2); border-radius:999px; padding:4px 12px; cursor:pointer; transition:background .18s; font-family:'Lato',sans-serif; }
        .nt-cal-today-btn:hover { background:rgba(60,140,255,.18); }

        .nt-cal-grid { padding:16px; }
        .nt-cal-days-header { display:grid; grid-template-columns:repeat(7,1fr); margin-bottom:8px; }
        .nt-cal-day-name { text-align:center; font-size:10px; font-weight:700; letter-spacing:.1em; color:rgba(26,85,208,.55); padding:4px 0; text-transform:uppercase; }

        .nt-cal-cells { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
        .nt-cal-cell {
          min-height:52px; border-radius:12px; padding:6px 5px 5px;
          display:flex; flex-direction:column; align-items:center;
          position:relative; cursor:default;
          transition:background .15s;
        }
        .nt-cal-cell-empty { background:transparent; }
        .nt-cal-cell-day { background:rgba(240,244,255,.7); }
        .nt-cal-cell-day:hover { background:rgba(26,85,208,.06); }
        .nt-cal-cell-today { background:rgba(26,85,208,.08); outline:2px solid rgba(26,85,208,.25); outline-offset:-1px; }
        .nt-cal-cell-has-event { cursor:pointer; background:rgba(26,85,208,.06); }
        .nt-cal-cell-has-event:hover { background:rgba(26,85,208,.12); }

        .nt-cal-num { font-size:12px; font-weight:700; color:#4a5578; line-height:1; margin-bottom:4px; }
        .nt-cal-num-today { color:#1a55d0; }

        .nt-cal-dot-wrap { display:flex; flex-direction:column; gap:2px; width:100%; }
        .nt-cal-dot {
          width:100%; border-radius:4px; padding:2px 4px;
          font-size:9px; font-weight:700; line-height:1.2;
          background:linear-gradient(90deg,#1a55d0,#0090ff);
          color:#fff; text-align:left;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
          cursor:pointer;
        }
        .nt-cal-dot-done { background:linear-gradient(90deg,#8899cc,#aabbdd); }

        /* Legenda */
        .nt-cal-legend { display:flex; gap:14px; flex-wrap:wrap; padding:0 16px 16px; }
        .nt-cal-legend-item { display:flex; align-items:center; gap:5px; font-size:11px; color:#7888aa; font-weight:600; }
        .nt-cal-legend-dot { width:10px; height:10px; border-radius:3px; }

        /* ── Popup de dia (calendário) ── */
        .nt-day-popup {
          background:#fff; border-radius:20px;
          border:1px solid rgba(26,85,208,.12);
          box-shadow:0 8px 40px rgba(26,85,208,.15);
          padding:0; overflow:hidden;
          margin-top:12px;
          animation:ntFadeUp .25s ease;
        }
        .nt-day-popup-header {
          background:linear-gradient(135deg,#060d20,#0a1535);
          padding:14px 18px;
          display:flex; align-items:center; justify-content:space-between;
        }
        .nt-day-popup-title { font-family:'Playfair Display',Georgia,serif; font-size:15px; font-weight:700; color:#fff; margin:0; }
        .nt-day-popup-close { width:28px; height:28px; border-radius:50%; border:1px solid rgba(255,255,255,.15); background:rgba(255,255,255,.07); color:rgba(200,220,255,.8); display:grid; place-items:center; cursor:pointer; font-size:12px; font-family:'Lato',sans-serif; }

        /* ── Estados ── */
        .nt-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 0; gap:14px; }
        .nt-spinner { width:30px; height:30px; border:2px solid rgba(26,85,208,.15); border-top-color:rgba(26,85,208,.8); border-radius:50%; animation:ntSpin .85s linear infinite; }
        .nt-loading-text { font-family:'Playfair Display',Georgia,serif; font-size:14px; font-style:italic; color:rgba(26,85,208,.45); }
        .nt-empty { text-align:center; padding:52px 24px; background:#fff; border-radius:20px; border:1px solid rgba(30,80,200,.07); }
        .nt-empty-icon { font-size:36px; margin-bottom:12px; }
        .nt-empty-text { font-family:'Playfair Display',Georgia,serif; font-size:16px; color:#7888aa; font-style:italic; }
        .nt-error { background:rgba(220,50,50,.06); border:1px solid rgba(220,50,50,.15); border-radius:16px; padding:14px 18px; color:#b03030; font-size:14px; margin-bottom:16px; }

        /* ── Modal ── */
        .nt-backdrop { position:fixed; inset:0; background:rgba(5,15,40,.65); backdrop-filter:blur(6px); display:flex; align-items:flex-end; justify-content:center; z-index:50; padding:0; animation:ntFadeUp .2s ease; }
        @media(min-width:560px){ .nt-backdrop { align-items:center; padding:24px; } }
        .nt-modal { width:100%; max-width:560px; background:#fff; border-radius:28px 28px 0 0; overflow:hidden; box-shadow:0 -8px 60px rgba(10,20,60,.25); max-height:90vh; display:flex; flex-direction:column; }
        @media(min-width:560px){ .nt-modal { border-radius:28px; max-height:85vh; box-shadow:0 24px 80px rgba(10,20,60,.3); } }
        .nt-modal-header { background:linear-gradient(135deg,#060d20,#0a1535); padding:22px 22px 18px; flex-shrink:0; }
        .nt-modal-header-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:12px; }
        .nt-modal-date-full { font-size:11px; letter-spacing:.08em; text-transform:capitalize; color:rgba(100,180,255,.65); font-weight:600; }
        .nt-modal-close { width:32px; height:32px; border-radius:50%; border:1px solid rgba(255,255,255,.15); background:rgba(255,255,255,.07); color:rgba(200,220,255,.8); display:grid; place-items:center; cursor:pointer; flex-shrink:0; font-size:14px; transition:background .18s; font-family:'Lato',sans-serif; }
        .nt-modal-close:hover { background:rgba(255,255,255,.14); }
        .nt-modal-title { font-family:'Playfair Display',Georgia,serif; font-size:clamp(17px,5vw,22px); font-weight:700; color:#fff; margin:0; line-height:1.25; }
        .nt-modal-body { padding:22px; overflow-y:auto; flex:1; }
        .nt-modal-text { font-size:15px; color:#2a3555; line-height:1.8; white-space:pre-line; margin:0; font-family:'Playfair Display',Georgia,serif; }
        .nt-modal-address { margin-top:18px; padding:12px 14px; background:rgba(26,85,208,.05); border:1px solid rgba(26,85,208,.1); border-radius:14px; font-size:13px; color:#4a5578; }
        .nt-modal-address strong { color:#0a1535; }
        .nt-modal-footer { padding:14px 22px 18px; border-top:1px solid rgba(30,80,200,.08); flex-shrink:0; }
        .nt-modal-share-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:10px; background:linear-gradient(130deg,#158a4a,#1db860); color:#fff; font-weight:800; font-size:15px; padding:14px 0; border-radius:16px; border:none; cursor:pointer; font-family:'Lato',sans-serif; box-shadow:0 6px 24px rgba(15,140,60,.28); transition:transform .18s,box-shadow .18s; }
        .nt-modal-share-btn:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(15,140,60,.4); }
      `}</style>

      <div className="nt-root">

        {/* ── Hero ── */}
        <header className="nt-hero">
          <div className="nt-hero-inner">
            <p className="nt-hero-kicker">Fique por dentro dos nossos cultos</p>
            <h1 className="nt-hero-title">Agenda da<br />Semana</h1>
            <p className="nt-hero-sub">Tudo que está acontecendo no nosso meio, em um só lugar.</p>

            <div className="nt-hero-actions">
              {!loading && (
                <span className="nt-count-pill">
                  <svg viewBox="0 0 16 16" fill="currentColor" style={{width:12,height:12}}>
                    <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8-3.25a.75.75 0 01.75.75v2.69l1.28 1.28a.75.75 0 11-1.06 1.06l-1.5-1.5A.75.75 0 017.25 9.5V6.5A.75.75 0 018 5.75z"/>
                  </svg>
                  {items.length} {items.length === 1 ? "aviso" : "avisos"} publicados
                </span>
              )}

              {/* Toggle Lista / Calendário */}
              <div className="nt-toggle">
                <button className={`nt-toggle-btn ${view === "list" ? "nt-toggle-btn-active" : "nt-toggle-btn-inactive"}`} onClick={() => setView("list")}>
                  <svg viewBox="0 0 16 16" fill="currentColor" style={{width:12,height:12}}>
                    <path d="M2 4.5A.5.5 0 012.5 4h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5zm0 4a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5zm0 4a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5z"/>
                  </svg>
                  Lista
                </button>
                <button className={`nt-toggle-btn ${view === "calendar" ? "nt-toggle-btn-active" : "nt-toggle-btn-inactive"}`} onClick={() => setView("calendar")}>
                  <svg viewBox="0 0 16 16" fill="currentColor" style={{width:12,height:12}}>
                    <path d="M3.5 0a.5.5 0 01.5.5V1h8V.5a.5.5 0 011 0V1h1a2 2 0 012 2v11a2 2 0 01-2 2H2a2 2 0 01-2-2V3a2 2 0 012-2h1V.5a.5.5 0 01.5-.5zM1 4v10a1 1 0 001 1h12a1 1 0 001-1V4H1z"/>
                  </svg>
                  Calendário
                </button>
              </div>

              <button className="nt-refresh-btn" onClick={loadNotices}>
                <svg viewBox="0 0 16 16" fill="currentColor" style={{width:12,height:12}}>
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

          {/* ════════ VISTA LISTA ════════ */}
          {!loading && view === "list" && (
            <>
              {items.length === 0 ? (
                <div className="nt-empty">
                  <div className="nt-empty-icon">🕊</div>
                  <p className="nt-empty-text">Nenhum aviso publicado no momento.</p>
                </div>
              ) : (
                <div className="nt-grid">
                  {items.map((n, idx) => {
                    const dateLabel = formatDateBR(n.event_date ?? n.created_at);
                    const days = daysUntil(n.event_date);
                    return (
                      <button key={n.id} className="nt-card nt-card-in" style={{animationDelay:`${idx * 0.07}s`}} onClick={() => setActive(n)}>
                        <div className="nt-card-accent" />
                        <div className="nt-card-body">
                          <div className="nt-card-meta">
                            {dateLabel && <span className="nt-card-date">📅 {dateLabel}</span>}
                            <DaysBadge days={days} />
                          </div>
                          <h2 className="nt-card-title">{n.title}</h2>
                          <p className="nt-card-preview">{n.body}</p>
                          <div className="nt-card-footer">
                            <span className="nt-card-cta">
                              Ler completo
                              <svg viewBox="0 0 16 16" fill="currentColor" style={{width:11,height:11}}>
                                <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06L7.28 11.78a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
                              </svg>
                            </span>
                            <button className="nt-card-share" onClick={(e) => { e.stopPropagation(); shareWhatsApp(n); }}>
                              <WaIcon />
                              Compartilhar
                            </button>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ════════ VISTA CALENDÁRIO ════════ */}
          {!loading && view === "calendar" && (
            <CalendarView
              calYear={calYear}
              calMonth={calMonth}
              calCells={calCells}
              todayStr={todayStr}
              noticesByDate={noticesByDate}
              onPrev={prevMonth}
              onNext={nextMonth}
              onToday={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); }}
              onOpenNotice={(n) => setActive(n)}
            />
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
                  {activeDateFull && <p className="nt-modal-date-full">📅 {activeDateFull}</p>}
                  <DaysBadge days={activeDays} />
                </div>
                <button className="nt-modal-close" onClick={() => setActive(null)} aria-label="Fechar">✕</button>
              </div>
              <h2 className="nt-modal-title">{active.title}</h2>
            </div>
            <div className="nt-modal-body">
              <p className="nt-modal-text">{active.body}</p>
              <div className="nt-modal-address"><strong>📍 Endereço:</strong> {CHURCH_ADDRESS}</div>
            </div>
            <div className="nt-modal-footer">
              <button className="nt-modal-share-btn" onClick={() => shareWhatsApp(active)}>
                <WaIcon />
                Compartilhar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Subcomponente do Calendário ─────────────────────────────────────────────
function CalendarView({
  calYear, calMonth, calCells, todayStr, noticesByDate,
  onPrev, onNext, onToday, onOpenNotice,
}: {
  calYear: number; calMonth: number;
  calCells: (number | null)[];
  todayStr: string;
  noticesByDate: Record<string, Notice[]>;
  onPrev: () => void; onNext: () => void; onToday: () => void;
  onOpenNotice: (n: Notice) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const selectedNotices = selectedDay ? (noticesByDate[selectedDay] ?? []) : [];

  function cellKey(day: number) {
    return `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }

  return (
    <div>
      <div className="nt-cal-wrap">
        {/* Cabeçalho */}
        <div className="nt-cal-header">
          <div className="nt-cal-nav">
            <button className="nt-cal-nav-btn" onClick={onPrev} aria-label="Mês anterior">‹</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <span className="nt-cal-month">{MONTHS_PT[calMonth]} {calYear}</span>
            <button className="nt-cal-today-btn" onClick={onToday}>Hoje</button>
          </div>
          <div className="nt-cal-nav">
            <button className="nt-cal-nav-btn" onClick={onNext} aria-label="Próximo mês">›</button>
          </div>
        </div>

        {/* Grade */}
        <div className="nt-cal-grid">
          {/* Nomes dos dias */}
          <div className="nt-cal-days-header">
            {DAYS_PT.map(d => (
              <div key={d} className="nt-cal-day-name">{d}</div>
            ))}
          </div>

          {/* Células */}
          <div className="nt-cal-cells">
            {calCells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} className="nt-cal-cell nt-cal-cell-empty" />;
              const key = cellKey(day);
              const notices = noticesByDate[key] ?? [];
              const isToday = key === todayStr;
              const hasEvent = notices.length > 0;
              const isSelected = selectedDay === key;

              return (
                <div
                  key={key}
                  className={`nt-cal-cell ${isToday ? "nt-cal-cell-today" : "nt-cal-cell-day"} ${hasEvent ? "nt-cal-cell-has-event" : ""}`}
                  style={isSelected ? { outline: "2px solid #1a55d0", outlineOffset: "-1px", background: "rgba(26,85,208,.1)" } : {}}
                  onClick={() => hasEvent ? setSelectedDay(isSelected ? null : key) : undefined}
                >
                  <span className={`nt-cal-num ${isToday ? "nt-cal-num-today" : ""}`}>{day}</span>
                  {hasEvent && (
                    <div className="nt-cal-dot-wrap">
                      {notices.slice(0, 2).map((n) => {
                        const days = daysUntil(n.event_date);
                        return (
                          <div
                            key={n.id}
                            className={`nt-cal-dot ${days !== null && days < 0 ? "nt-cal-dot-done" : ""}`}
                            title={n.title}
                          >
                            {n.title}
                          </div>
                        );
                      })}
                      {notices.length > 2 && (
                        <div style={{fontSize:9,color:"#1a55d0",fontWeight:700,paddingLeft:4}}>+{notices.length - 2}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legenda */}
        <div className="nt-cal-legend">
          <div className="nt-cal-legend-item">
            <div className="nt-cal-legend-dot" style={{background:"linear-gradient(90deg,#1a55d0,#0090ff)"}} />
            Evento futuro
          </div>
          <div className="nt-cal-legend-item">
            <div className="nt-cal-legend-dot" style={{background:"linear-gradient(90deg,#8899cc,#aabbdd)"}} />
            Realizado
          </div>
          <div className="nt-cal-legend-item">
            <div className="nt-cal-legend-dot" style={{width:10,height:10,borderRadius:3,outline:"2px solid rgba(26,85,208,.3)",background:"rgba(26,85,208,.08)"}} />
            Hoje
          </div>
        </div>
      </div>

      {/* Popup do dia selecionado */}
      {selectedDay && selectedNotices.length > 0 && (
        <div className="nt-day-popup" style={{marginTop:14}}>
          <div className="nt-day-popup-header">
            <p className="nt-day-popup-title">
              📅 {new Date(selectedDay + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </p>
            <button className="nt-day-popup-close" onClick={() => setSelectedDay(null)}>✕</button>
          </div>
          <div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:10}}>
            {selectedNotices.map((n) => (
              <button
                key={n.id}
                style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",padding:0,cursor:"pointer",fontFamily:"'Lato',sans-serif"}}
                onClick={() => onOpenNotice(n)}
              >
                <div style={{background:"#f0f4ff",borderRadius:14,padding:"12px 14px",border:"1px solid rgba(26,85,208,.08)",transition:"background .15s"}}
                  onMouseEnter={e => (e.currentTarget.style.background="#e4ebff")}
                  onMouseLeave={e => (e.currentTarget.style.background="#f0f4ff")}
                >
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,fontWeight:700,color:"#0a1535"}}>{n.title}</span>
                    <DaysBadge days={daysUntil(n.event_date)} />
                  </div>
                  <p style={{fontSize:12,color:"#4a5578",lineHeight:1.6,margin:"0 0 8px",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                    {n.body}
                  </p>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:11,fontWeight:700,color:"#1a55d0"}}>Ler completo →</span>
                    <button
                      style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(0,180,80,.08)",border:"1px solid rgba(0,180,80,.15)",borderRadius:999,padding:"4px 10px",fontSize:11,fontWeight:700,color:"#00a050",cursor:"pointer",fontFamily:"'Lato',sans-serif"}}
                      onClick={(e) => { e.stopPropagation(); shareWhatsApp(n); }}
                    >
                      <WaIcon />
                      Compartilhar
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}