import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const CHURCH_ADDRESS  = "Av. Maria José de Paula, Setor Amélio Alves - Inhumas";
const CHURCH_SIGNATURE = "AD Ministério Irlanda • Inhumas - GO";

type Notice = {
  id: string;
  title: string;
  body: string;
  is_published?: boolean;
  event_date?: string | null;
  created_at?: string | null;
};

const MONTHS_PT   = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS_FULL   = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const DAYS_SHORT  = ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"];

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
  if (days === null)   return null;
  if (days < 0)        return <span className="nt-badge nt-badge-done">Realizado</span>;
  if (days === 0)      return <span className="nt-badge nt-badge-today">Hoje!</span>;
  if (days === 1)      return <span className="nt-badge nt-badge-soon">Amanhã</span>;
  if (days <= 7)       return <span className="nt-badge nt-badge-week">Em {days} dias</span>;
  return null;
}

function WaIcon() {
  return (
    <svg viewBox="0 0 32 32" style={{width:17,height:17,flexShrink:0}} fill="currentColor" aria-hidden="true">
      <path d="M19.11 17.63c-.29-.15-1.7-.84-1.97-.94-.26-.1-.46-.15-.65.15-.19.29-.75.94-.92 1.13-.17.19-.33.22-.62.07-.29-.15-1.22-.45-2.32-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.33.43-.5.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.65-1.56-.89-2.13-.23-.56-.47-.48-.65-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.44 0 1.44 1.03 2.83 1.18 3.03.15.19 2.03 3.1 4.92 4.35.69.3 1.23.48 1.65.62.69.22 1.31.19 1.8.12.55-.08 1.7-.69 1.94-1.35.24-.67.24-1.24.17-1.35-.07-.12-.26-.19-.55-.34M16.04 26.67h-.01c-1.73 0-3.42-.46-4.9-1.34l-.35-.2-3.63.95.97-3.53-.23-.36a10.6 10.6 0 0 1-1.61-5.65c0-5.87 4.78-10.65 10.66-10.65 2.84 0 5.51 1.11 7.52 3.12a10.56 10.56 0 0 1 3.11 7.52c0 5.88-4.78 10.65-10.65 10.65m9.04-19.69A12.7 12.7 0 0 0 16.04 3.2C9.02 3.2 3.3 8.92 3.3 15.94c0 2.25.6 4.46 1.74 6.4L3.2 29.12l6.95-1.82a12.68 12.68 0 0 0 5.89 1.5h.01c7.02 0 12.74-5.72 12.74-12.74 0-3.4-1.33-6.6-3.71-9.08"/>
    </svg>
  );
}

function shareWhatsApp(n: Notice) {
  const text = `*${n.title}*${n.body?.trim() ? `\n\n${n.body.trim()}` : ""}\n\n📍 ${CHURCH_ADDRESS}\n${CHURCH_SIGNATURE}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}

// Retorna o domingo da semana que contém a data
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function dateToYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Notices() {
  const [loading, setLoading]  = useState(true);
  const [items, setItems]      = useState<Notice[]>([]);
  const [error, setError]      = useState<string | null>(null);
  const [active, setActive]    = useState<Notice | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const today      = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayStr   = useMemo(() => dateToYMD(today), [today]);

  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));

  // Dias da semana atual (Dom → Sáb)
  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
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

  // Mapa data → avisos
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

  // Avisos do dia selecionado
  const selectedNotices = useMemo(() =>
    selectedDay ? (noticesByDate[selectedDay] ?? []) : [],
    [selectedDay, noticesByDate]
  );

  // Label da semana exibida
  const weekLabel = useMemo(() => {
    const start = weekDays[0];
    const end   = weekDays[6];
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} – ${end.getDate()} de ${MONTHS_PT[start.getMonth()]} ${start.getFullYear()}`;
    }
    return `${start.getDate()} ${MONTHS_PT[start.getMonth()]} – ${end.getDate()} ${MONTHS_PT[end.getMonth()]} ${end.getFullYear()}`;
  }, [weekDays]);

  function prevWeek() { setWeekStart(w => addDays(w, -7)); setSelectedDay(null); }
  function nextWeek() { setWeekStart(w => addDays(w, 7));  setSelectedDay(null); }
  function goToday()  { setWeekStart(getWeekStart(new Date())); setSelectedDay(null); }

  const activeDateFull = useMemo(() => formatDateFull(active?.event_date ?? active?.created_at), [active]);
  const activeDays     = useMemo(() => daysUntil(active?.event_date), [active]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700;900&display=swap');
        * { box-sizing: border-box; }
        .nt-root { font-family:'Lato',sans-serif; min-height:100vh; background:#f0f4ff; }

        /* ── Hero ── */
        .nt-hero {
          background:linear-gradient(155deg,#060d20 0%,#0a1535 40%,#0e1d50 70%,#050f28 100%);
          padding:44px 20px 56px; position:relative; overflow:hidden;
          border-radius:0 0 2.5rem 2.5rem;
        }
        .nt-hero::before { content:''; position:absolute; top:-80px; right:-80px; width:360px; height:360px; border-radius:50%; background:radial-gradient(circle,rgba(0,120,255,.16) 0%,transparent 70%); pointer-events:none; }
        .nt-hero::after  { content:''; position:absolute; bottom:-60px; left:-60px; width:280px; height:280px; border-radius:50%; background:radial-gradient(circle,rgba(30,60,200,.12) 0%,transparent 70%); pointer-events:none; }
        .nt-hero-inner { position:relative; z-index:1; max-width:700px; margin:0 auto; display:flex; flex-direction:column; gap:14px; }
        .nt-hero-kicker { font-size:10px; letter-spacing:.24em; text-transform:uppercase; color:rgba(80,180,255,.65); font-weight:700; display:flex; align-items:center; gap:8px; }
        .nt-hero-kicker::before { content:''; width:24px; height:1px; background:rgba(80,180,255,.4); }
        .nt-hero-title { font-family:'Playfair Display',Georgia,serif; font-size:clamp(28px,7vw,42px); font-weight:700; color:#fff; margin:0; line-height:1.15; }
        .nt-hero-sub { font-family:'Playfair Display',Georgia,serif; font-size:clamp(14px,3.5vw,17px); color:rgba(160,200,255,.65); font-style:italic; margin:0; max-width:420px; }
        .nt-hero-actions { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:4px; }
        .nt-count-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); border-radius:999px; padding:6px 14px; font-size:12px; font-weight:700; color:rgba(180,220,255,.75); }
        .nt-refresh-btn { display:inline-flex; align-items:center; gap:6px; background:rgba(26,85,208,.2); border:1px solid rgba(60,140,255,.25); border-radius:999px; padding:6px 16px; font-size:12px; font-weight:700; color:rgba(100,180,255,.85); cursor:pointer; transition:background .18s,transform .18s; font-family:'Lato',sans-serif; }
        .nt-refresh-btn:hover { background:rgba(26,85,208,.32); transform:translateY(-1px); }

        /* ── Conteúdo ── */
        .nt-content { max-width:700px; margin:0 auto; padding:28px 16px 80px; }

        /* ── Calendário semanal ── */
        .nt-week-wrap { background:#fff; border-radius:24px; border:1px solid rgba(30,80,200,.08); box-shadow:0 4px 24px rgba(30,80,200,.07); overflow:hidden; }

        .nt-week-header {
          background:linear-gradient(135deg,#060d20,#0a1535);
          padding:18px 20px;
          display:flex; align-items:center; justify-content:space-between; gap:12px;
        }
        .nt-week-nav { display:flex; gap:6px; }
        .nt-week-nav-btn { width:34px; height:34px; border-radius:50%; border:1px solid rgba(255,255,255,.15); background:rgba(255,255,255,.07); color:rgba(200,220,255,.85); display:grid; place-items:center; cursor:pointer; transition:background .18s; font-size:16px; line-height:1; }
        .nt-week-nav-btn:hover { background:rgba(255,255,255,.14); }
        .nt-week-center { display:flex; flex-direction:column; align-items:center; gap:6px; }
        .nt-week-label { font-family:'Playfair Display',Georgia,serif; font-size:clamp(13px,3.5vw,16px); font-weight:700; color:#fff; text-align:center; }
        .nt-week-today-btn { font-size:10px; font-weight:700; color:rgba(100,180,255,.75); background:rgba(60,140,255,.12); border:1px solid rgba(60,140,255,.22); border-radius:999px; padding:3px 12px; cursor:pointer; transition:background .18s; font-family:'Lato',sans-serif; }
        .nt-week-today-btn:hover { background:rgba(60,140,255,.2); }

        /* Grade dos 7 dias */
        .nt-week-grid {
          display:grid;
          grid-template-columns:repeat(7,1fr);
          border-bottom:1px solid rgba(30,80,200,.06);
        }

        .nt-day-col {
          display:flex; flex-direction:column; align-items:center;
          padding:10px 4px 10px;
          border-right:1px solid rgba(30,80,200,.06);
          cursor:default;
          transition:background .15s;
          position:relative;
          min-height:72px;
        }
        .nt-day-col:last-child { border-right:none; }
        .nt-day-col-has-event { cursor:pointer; }
        .nt-day-col-has-event:hover { background:rgba(26,85,208,.04); }
        .nt-day-col-selected { background:rgba(26,85,208,.07) !important; }

        .nt-day-name { font-size:9px; font-weight:700; letter-spacing:.1em; color:rgba(26,85,208,.5); text-transform:uppercase; margin-bottom:5px; }
        .nt-day-num {
          width:30px; height:30px; border-radius:50%;
          display:grid; place-items:center;
          font-size:13px; font-weight:700; color:#4a5578;
          transition:background .15s;
        }
        .nt-day-num-today { background:linear-gradient(135deg,#1a55d0,#0090ff); color:#fff; }
        .nt-day-num-selected { background:rgba(26,85,208,.12); color:#1a55d0; }

        .nt-day-dots { display:flex; flex-direction:column; gap:3px; width:100%; margin-top:6px; }
        .nt-day-event-pill {
          width:100%; border-radius:6px; padding:2px 4px;
          font-size:8px; font-weight:700; line-height:1.3;
          color:#fff; text-align:center;
          background:linear-gradient(90deg,#1a55d0,#0090ff);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .nt-day-event-pill-done { background:linear-gradient(90deg,#8899cc,#aabbdd); }
        .nt-day-more { font-size:8px; font-weight:700; color:#1a55d0; text-align:center; }

        /* ── Painel de eventos do dia ── */
        @keyframes ntSlideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .nt-day-panel {
          animation:ntSlideDown .25s ease;
          margin-top:0;
          border-top:2px solid rgba(26,85,208,.12);
        }

        .nt-day-panel-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 18px 10px;
          background:rgba(26,85,208,.04);
          border-bottom:1px solid rgba(26,85,208,.07);
        }
        .nt-day-panel-title {
          font-family:'Playfair Display',Georgia,serif;
          font-size:14px; font-weight:700; color:#0a1535;
        }
        .nt-day-panel-close { width:26px; height:26px; border-radius:50%; border:1px solid rgba(30,80,200,.15); background:rgba(26,85,208,.06); color:#7888aa; display:grid; place-items:center; cursor:pointer; font-size:12px; font-family:'Lato',sans-serif; }

        .nt-day-panel-list { padding:10px 14px 14px; display:flex; flex-direction:column; gap:10px; }

        /* ── Cards ── */
        .nt-card { display:block; width:100%; text-align:left; background:#fff; border-radius:20px; border:1px solid rgba(30,80,200,.07); box-shadow:0 2px 12px rgba(30,80,200,.05); padding:0; cursor:pointer; transition:transform .2s,box-shadow .2s; overflow:hidden; font-family:'Lato',sans-serif; }
        .nt-card:hover { transform:translateY(-3px); box-shadow:0 10px 36px rgba(26,85,208,.12); }
        .nt-card:focus-visible { outline:2px solid #1a55d0; outline-offset:2px; }
        .nt-card-accent { height:3px; background:linear-gradient(90deg,#1a55d0,#0090ff); }
        .nt-card-body { padding:16px 18px 14px; }
        .nt-card-meta { display:flex; align-items:center; gap:7px; flex-wrap:wrap; margin-bottom:8px; }
        .nt-card-date { font-size:11px; font-weight:700; color:#1a55d0; letter-spacing:.05em; background:rgba(26,85,208,.08); border-radius:999px; padding:3px 10px; display:flex; align-items:center; gap:4px; }
        .nt-card-title { font-family:'Playfair Display',Georgia,serif; font-size:clamp(15px,4vw,17px); font-weight:700; color:#0a1535; line-height:1.3; margin:0 0 6px; }
        .nt-card-preview { font-size:13px; color:#4a5578; line-height:1.65; margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .nt-card-footer { display:flex; align-items:center; justify-content:space-between; margin-top:12px; padding-top:10px; border-top:1px solid rgba(30,80,200,.06); }
        .nt-card-cta { font-size:12px; font-weight:700; color:#1a55d0; display:flex; align-items:center; gap:4px; }
        .nt-card-share { display:inline-flex; align-items:center; gap:6px; background:rgba(0,180,80,.08); border:1px solid rgba(0,180,80,.15); border-radius:999px; padding:5px 11px; font-size:11px; font-weight:700; color:#00a050; cursor:pointer; transition:background .18s; font-family:'Lato',sans-serif; }
        .nt-card-share:hover { background:rgba(0,180,80,.15); }

        @keyframes ntFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ntSpin   { to{transform:rotate(360deg)} }
        @keyframes ntPulse  { 0%,100%{opacity:.6} 50%{opacity:1} }
        .nt-card-in { animation:ntFadeUp .45s ease forwards; opacity:0; }

        /* ── Badges ── */
        .nt-badge { font-size:10px; font-weight:700; letter-spacing:.08em; border-radius:999px; padding:2px 8px; }
        .nt-badge-done  { background:rgba(100,120,180,.12); color:#7888bb; }
        .nt-badge-today { background:rgba(0,180,100,.12); color:#00b864; animation:ntPulse 2s ease-in-out infinite; }
        .nt-badge-soon  { background:rgba(255,160,0,.12); color:#e08800; }
        .nt-badge-week  { background:rgba(26,85,208,.1); color:#1a55d0; }

        /* ── Estados ── */
        .nt-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 0; gap:14px; }
        .nt-spinner { width:30px; height:30px; border:2px solid rgba(26,85,208,.15); border-top-color:rgba(26,85,208,.8); border-radius:50%; animation:ntSpin .85s linear infinite; }
        .nt-loading-text { font-family:'Playfair Display',Georgia,serif; font-size:14px; font-style:italic; color:rgba(26,85,208,.45); }
        .nt-empty { text-align:center; padding:52px 24px; background:#fff; border-radius:20px; border:1px solid rgba(30,80,200,.07); }
        .nt-empty-icon { font-size:36px; margin-bottom:12px; }
        .nt-empty-text { font-family:'Playfair Display',Georgia,serif; font-size:16px; color:#7888aa; font-style:italic; }
        .nt-error { background:rgba(220,50,50,.06); border:1px solid rgba(220,50,50,.15); border-radius:16px; padding:14px 18px; color:#b03030; font-size:14px; margin-bottom:16px; }

        /* ── Legenda ── */
        .nt-legend { display:flex; gap:14px; flex-wrap:wrap; padding:10px 16px 14px; border-top:1px solid rgba(30,80,200,.06); }
        .nt-legend-item { display:flex; align-items:center; gap:5px; font-size:10px; color:#7888aa; font-weight:700; letter-spacing:.04em; }
        .nt-legend-dot { width:10px; height:10px; border-radius:3px; flex-shrink:0; }

        /* ── Todos os avisos ── */
        .nt-all-title { font-family:'Playfair Display',Georgia,serif; font-size:clamp(18px,5vw,22px); font-weight:700; color:#0a1535; margin:0 0 16px; }
        .nt-grid { display:grid; gap:12px; }

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
            <p className="nt-hero-kicker">Fique por dentro</p>
            <h1 className="nt-hero-title">Avisos do<br />Ministério</h1>
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

          {!loading && (
            <>
              {/* ── Calendário Semanal ── */}
              <div className="nt-week-wrap" style={{marginBottom: 28}}>

                {/* Cabeçalho com navegação */}
                <div className="nt-week-header">
                  <div className="nt-week-nav">
                    <button className="nt-week-nav-btn" onClick={prevWeek} aria-label="Semana anterior">‹</button>
                  </div>
                  <div className="nt-week-center">
                    <span className="nt-week-label">{weekLabel}</span>
                    <button className="nt-week-today-btn" onClick={goToday}>Esta semana</button>
                  </div>
                  <div className="nt-week-nav">
                    <button className="nt-week-nav-btn" onClick={nextWeek} aria-label="Próxima semana">›</button>
                  </div>
                </div>

                {/* Grade dos 7 dias */}
                <div className="nt-week-grid">
                  {weekDays.map((dayDate) => {
                    const key      = dateToYMD(dayDate);
                    const notices  = noticesByDate[key] ?? [];
                    const isToday  = key === todayStr;
                    const hasEvent = notices.length > 0;
                    const isSelected = selectedDay === key;

                    return (
                      <div
                        key={key}
                        className={`nt-day-col ${hasEvent ? "nt-day-col-has-event" : ""} ${isSelected ? "nt-day-col-selected" : ""}`}
                        onClick={() => hasEvent ? setSelectedDay(isSelected ? null : key) : undefined}
                      >
                        <span className="nt-day-name">{DAYS_SHORT[dayDate.getDay()]}</span>
                        <span className={`nt-day-num ${isToday ? "nt-day-num-today" : isSelected ? "nt-day-num-selected" : ""}`}>
                          {dayDate.getDate()}
                        </span>
                        {hasEvent && (
                          <div className="nt-day-dots">
                            {notices.slice(0,2).map((n) => (
                              <div
                                key={n.id}
                                className={`nt-day-event-pill ${daysUntil(n.event_date) !== null && daysUntil(n.event_date)! < 0 ? "nt-day-event-pill-done" : ""}`}
                                title={n.title}
                              >
                                {n.title}
                              </div>
                            ))}
                            {notices.length > 2 && (
                              <div className="nt-day-more">+{notices.length - 2}</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Painel do dia selecionado */}
                {selectedDay && selectedNotices.length > 0 && (
                  <div className="nt-day-panel">
                    <div className="nt-day-panel-header">
                      <p className="nt-day-panel-title">
                        📅 {new Date(selectedDay + "T12:00:00").toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long" })}
                      </p>
                      <button className="nt-day-panel-close" onClick={() => setSelectedDay(null)}>✕</button>
                    </div>
                    <div className="nt-day-panel-list">
                      {selectedNotices.map((n) => (
                        <button
                          key={n.id}
                          style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",padding:0,cursor:"pointer",fontFamily:"'Lato',sans-serif"}}
                          onClick={() => setActive(n)}
                        >
                          <div
                            style={{background:"#f4f7ff",borderRadius:14,padding:"12px 14px",border:"1px solid rgba(26,85,208,.08)",transition:"background .15s"}}
                            onMouseEnter={e => (e.currentTarget.style.background="#e8eeff")}
                            onMouseLeave={e => (e.currentTarget.style.background="#f4f7ff")}
                          >
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4,gap:8}}>
                              <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,fontWeight:700,color:"#0a1535",lineHeight:1.25}}>{n.title}</span>
                              <DaysBadge days={daysUntil(n.event_date)} />
                            </div>
                            <p style={{fontSize:12,color:"#4a5578",lineHeight:1.6,margin:"0 0 10px",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                              {n.body}
                            </p>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                              <span style={{fontSize:11,fontWeight:700,color:"#1a55d0",display:"flex",alignItems:"center",gap:3}}>
                                Ler completo
                                <svg viewBox="0 0 16 16" fill="currentColor" style={{width:10,height:10}}>
                                  <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06L7.28 11.78a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
                                </svg>
                              </span>
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

                {/* Legenda */}
                <div className="nt-legend">
                  <div className="nt-legend-item">
                    <div className="nt-legend-dot" style={{background:"linear-gradient(90deg,#1a55d0,#0090ff)"}} />
                    Evento futuro
                  </div>
                  <div className="nt-legend-item">
                    <div className="nt-legend-dot" style={{background:"linear-gradient(90deg,#8899cc,#aabbdd)"}} />
                    Realizado
                  </div>
                  <div className="nt-legend-item">
                    <div className="nt-legend-dot" style={{width:10,height:10,borderRadius:"50%",background:"linear-gradient(135deg,#1a55d0,#0090ff)"}} />
                    Hoje
                  </div>
                </div>
              </div>

              {/* ── Todos os avisos ── */}
              {items.length === 0 ? (
                <div className="nt-empty">
                  <div className="nt-empty-icon">🕊</div>
                  <p className="nt-empty-text">Nenhum aviso publicado no momento.</p>
                </div>
              ) : (
                <>
                  <h2 className="nt-all-title">Todos os Avisos</h2>
                  <div className="nt-grid">
                    {items.map((n, idx) => {
                      const dateLabel = n.event_date
                        ? new Date(n.event_date).toLocaleDateString("pt-BR", { day:"2-digit", month:"short", year:"numeric" })
                        : n.created_at
                        ? new Date(n.created_at).toLocaleDateString("pt-BR", { day:"2-digit", month:"short", year:"numeric" })
                        : "";
                      return (
                        <button key={n.id} className="nt-card nt-card-in" style={{animationDelay:`${idx * 0.07}s`}} onClick={() => setActive(n)}>
                          <div className="nt-card-accent" />
                          <div className="nt-card-body">
                            <div className="nt-card-meta">
                              {dateLabel && <span className="nt-card-date">📅 {dateLabel}</span>}
                              <DaysBadge days={daysUntil(n.event_date)} />
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
                </>
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