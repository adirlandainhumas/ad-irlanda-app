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
const DAYS_SHORT = ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"];

// ── Funções de data ──────────────────────────────────────────────────────────

// Lê "YYYY-MM-DD" como data LOCAL (evita desvio UTC→Brasília)
function parseLocalDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function toYMD(dateStr?: string | null): string {
  const m = dateStr?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = parseLocalDate(dateStr);
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function dateToYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function formatDateFull(dateStr?: string | null) {
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr ?? "";
  return d.toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });
}

function daysUntil(dateStr?: string | null): number | null {
  const d = parseLocalDate(dateStr);
  if (!d) return null;
  const now = new Date(); now.setHours(0,0,0,0); d.setHours(0,0,0,0);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

// Semana começa na Segunda-feira, termina no Domingo
function getWeekStart(date: Date): Date {
  const d = new Date(date); d.setHours(0,0,0,0);
  const dow = d.getDay(); // 0=Dom, 1=Seg … 6=Sáb
  const diff = dow === 0 ? -6 : 1 - dow; // domingo → recua 6; demais → vai pra segunda
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function DaysBadge({ days }: { days: number | null }) {
  if (days === null) return null;
  if (days < 0)   return <span className="nt-badge nt-badge-done">Realizado</span>;
  if (days === 0) return <span className="nt-badge nt-badge-today">Hoje!</span>;
  if (days === 1) return <span className="nt-badge nt-badge-soon">Amanhã</span>;
  if (days <= 7)  return <span className="nt-badge nt-badge-week">Em {days} dias</span>;
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

// ── Componente principal ─────────────────────────────────────────────────────
export default function Notices() {
  const [loading, setLoading] = useState(true);
  const [items, setItems]     = useState<Notice[]>([]);
  const [error, setError]     = useState<string | null>(null);
  const [active, setActive]   = useState<Notice | null>(null);

  const today    = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayStr = useMemo(() => dateToYMD(today), [today]);

  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));

  // Seg(0) → Dom(6): offsets 0,1,2,3,4,5,6 a partir da segunda
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

  const weekLabel = useMemo(() => {
    const seg = weekDays[0]; // Segunda
    const dom = weekDays[6]; // Domingo
    if (seg.getMonth() === dom.getMonth())
      return `${seg.getDate()} – ${dom.getDate()} de ${MONTHS_PT[seg.getMonth()]} ${seg.getFullYear()}`;
    return `${seg.getDate()} ${MONTHS_PT[seg.getMonth()]} – ${dom.getDate()} ${MONTHS_PT[dom.getMonth()]} ${dom.getFullYear()}`;
  }, [weekDays]);

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
        .nt-root { font-family:'Lato',sans-serif; min-height:100vh; background:#FAFAF8; }

        /* Hero */
        .nt-hero { background:#1E40AF; padding:40px 20px 48px; position:relative; overflow:hidden; border-radius:0 0 2rem 2rem; }
        .nt-hero::before { content:''; position:absolute; top:-60px; right:-60px; width:280px; height:280px; border-radius:50%; background:radial-gradient(circle,rgba(255,255,255,.07) 0%,transparent 70%); pointer-events:none; }
        .nt-hero-inner { position:relative; z-index:1; max-width:680px; margin:0 auto; display:flex; flex-direction:column; gap:12px; }
        .nt-hero-kicker { font-size:10px; letter-spacing:.24em; text-transform:uppercase; color:rgba(255,255,255,.6); font-weight:700; display:flex; align-items:center; gap:8px; }
        .nt-hero-kicker::before { content:''; width:24px; height:1px; background:rgba(255,255,255,.3); }
        .nt-hero-title { font-family:'Playfair Display',Georgia,serif; font-size:clamp(26px,7vw,40px); font-weight:700; color:#fff; margin:0; line-height:1.15; }
        .nt-hero-sub { font-family:'Playfair Display',Georgia,serif; font-size:clamp(13px,3.5vw,16px); color:rgba(255,255,255,.65); font-style:italic; margin:0; max-width:400px; }
        .nt-hero-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:4px; }
        .nt-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.2); border-radius:999px; padding:5px 13px; font-size:11px; font-weight:700; color:rgba(255,255,255,.85); }
        .nt-refresh { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.18); border-radius:999px; padding:5px 14px; font-size:11px; font-weight:700; color:rgba(255,255,255,.8); cursor:pointer; transition:background .18s; font-family:'Lato',sans-serif; }
        .nt-refresh:hover { background:rgba(255,255,255,.2); }

        /* Conteúdo */
        .nt-content { max-width:680px; margin:0 auto; padding:24px 16px 80px; }

        /* Navegação semanal */
        .nt-week-nav { display:flex; align-items:center; justify-content:space-between; background:#fff; border-radius:16px; border:1px solid #E8E5E0; box-shadow:0 1px 4px rgba(28,25,23,0.06); padding:12px 16px; margin-bottom:20px; }
        .nt-nav-btn { width:34px; height:34px; border-radius:50%; border:1px solid #E8E5E0; background:#F5F2EE; color:#57534E; display:grid; place-items:center; cursor:pointer; font-size:16px; transition:background .15s, color .15s; }
        .nt-nav-btn:hover { background:#E8E5E0; color:#1C1917; }
        .nt-week-center { display:flex; flex-direction:column; align-items:center; gap:5px; }
        .nt-week-label { font-family:'Playfair Display',Georgia,serif; font-size:clamp(13px,3.5vw,15px); font-weight:700; color:#1C1917; }
        .nt-today-btn { font-size:10px; font-weight:700; color:#1E40AF; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:999px; padding:3px 11px; cursor:pointer; transition:background .15s; font-family:'Lato',sans-serif; }
        .nt-today-btn:hover { background:#dcfce7; }

        /* Cascata */
        .nt-cascade { display:flex; flex-direction:column; position:relative; }
        .nt-cascade::before { content:''; position:absolute; left:38px; top:0; bottom:0; width:2px; background:linear-gradient(180deg,rgba(30,64,175,.18) 0%,rgba(30,64,175,.04) 100%); border-radius:2px; }

        /* Linha de dia */
        .nt-day-row { display:flex; position:relative; padding-bottom:2px; }

        /* Marcador */
        .nt-day-marker { display:flex; flex-direction:column; align-items:center; width:78px; flex-shrink:0; padding-top:14px; position:relative; z-index:1; }

        .nt-day-circle { width:32px; height:32px; border-radius:50%; display:grid; place-items:center; font-size:13px; font-weight:700; transition:all .2s; flex-shrink:0; }
        .nt-day-circle-empty { background:#F5F2EE; border:1.5px dashed #D6D3D1; color:#D6D3D1; }
        .nt-day-circle-event { background:#fff; border:2px solid #1E40AF; color:#1E40AF; box-shadow:0 2px 8px rgba(30,64,175,.18); }
        .nt-day-circle-done { background:#F5F2EE; border:2px solid #D6D3D1; color:#A8A29E; }
        .nt-day-circle-today { background:#1E40AF !important; border:none !important; color:#fff !important; box-shadow:0 4px 14px rgba(30,64,175,.35) !important; }

        .nt-day-name-label { font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; margin-top:5px; text-align:center; }
        .nt-day-name-empty  { color:#D6D3D1; }
        .nt-day-name-event  { color:#1E40AF; }
        .nt-day-name-today  { color:#1E40AF; }

        /* Conteúdo à direita */
        .nt-day-content { flex:1; padding:10px 0 10px 12px; display:flex; flex-direction:column; gap:8px; min-height:60px; justify-content:center; }
        .nt-day-empty-line { height:1px; background:linear-gradient(90deg,#E8E5E0,transparent); border-radius:1px; align-self:center; width:100%; }

        /* Cards */
        @keyframes ntFadeIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ntSpin   { to{transform:rotate(360deg)} }
        @keyframes ntPulse  { 0%,100%{opacity:.6} 50%{opacity:1} }

        .nt-event-card { background:#fff; border-radius:14px; border:1px solid #E8E5E0; box-shadow:0 1px 4px rgba(28,25,23,0.05); overflow:hidden; cursor:pointer; transition:transform .18s,box-shadow .18s; animation:ntFadeIn .35s ease forwards; font-family:'Lato',sans-serif; text-align:left; width:100%; }
        .nt-event-card:hover { transform:translateX(3px); box-shadow:0 4px 16px rgba(28,25,23,0.1); }
        .nt-event-card-accent { height:3px; background:#D97706; }
        .nt-event-card-accent-done { background:#D6D3D1; }
        .nt-event-card-body { padding:12px 14px 10px; }
        .nt-event-card-meta { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:6px; }
        .nt-event-card-title { font-family:'Playfair Display',Georgia,serif; font-size:clamp(14px,3.8vw,16px); font-weight:700; color:#1C1917; line-height:1.3; margin:0 0 5px; }
        .nt-event-card-preview { font-size:12px; color:#57534E; line-height:1.6; margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .nt-event-card-footer { display:flex; align-items:center; justify-content:space-between; margin-top:10px; padding-top:8px; border-top:1px solid #E8E5E0; }
        .nt-event-card-cta { font-size:11px; font-weight:700; color:#1E40AF; display:flex; align-items:center; gap:3px; }
        .nt-event-card-share { display:inline-flex; align-items:center; gap:5px; background:#25D366; border:none; border-radius:999px; padding:5px 12px; font-size:11px; font-weight:700; color:#fff; cursor:pointer; transition:background .15s; font-family:'Lato',sans-serif; }
        .nt-event-card-share:hover { background:#1ebe5d; }

        /* Badges */
        .nt-badge { font-size:10px; font-weight:700; letter-spacing:.06em; border-radius:999px; padding:2px 8px; }
        .nt-badge-done  { background:#F5F2EE; color:#A8A29E; }
        .nt-badge-today { background:#EFF6FF; color:#1E40AF; animation:ntPulse 2s ease-in-out infinite; }
        .nt-badge-soon  { background:#FFFBEB; color:#B45309; }
        .nt-badge-week  { background:#EFF6FF; color:#1E40AF; }

        /* Semana vazia */
        .nt-empty-week { text-align:center; padding:32px 20px; background:#fff; border-radius:16px; border:1px solid #E8E5E0; }
        .nt-empty-week-icon { font-size:28px; margin-bottom:8px; }
        .nt-empty-week-text { font-family:'Playfair Display',Georgia,serif; font-size:15px; color:#A8A29E; font-style:italic; }

        /* Loading / erro */
        .nt-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 0; gap:14px; }
        .nt-spinner { width:28px; height:28px; border:2px solid #E8E5E0; border-top-color:#1E40AF; border-radius:50%; animation:ntSpin .85s linear infinite; }
        .nt-loading-text { font-family:'Playfair Display',Georgia,serif; font-size:14px; font-style:italic; color:#A8A29E; }
        .nt-error { background:#FEF2F2; border:1px solid #FECACA; border-radius:14px; padding:14px 18px; color:#991B1B; font-size:14px; margin-bottom:16px; }

        /* Modal */
        .nt-backdrop { position:fixed; inset:0; background:rgba(28,25,23,.55); backdrop-filter:blur(4px); display:flex; align-items:flex-end; justify-content:center; z-index:50; animation:ntFadeIn .2s ease; }
        @media(min-width:560px){ .nt-backdrop { align-items:center; padding:24px; } }
        .nt-modal { width:100%; max-width:540px; background:#fff; border-radius:24px 24px 0 0; overflow:hidden; box-shadow:0 -4px 40px rgba(28,25,23,.18); max-height:90vh; display:flex; flex-direction:column; }
        @media(min-width:560px){ .nt-modal { border-radius:24px; max-height:85vh; box-shadow:0 20px 60px rgba(28,25,23,.2); } }
        .nt-modal-header { background:#1E40AF; padding:22px 22px 18px; flex-shrink:0; }
        .nt-modal-header-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:12px; }
        .nt-modal-date { font-size:11px; letter-spacing:.08em; text-transform:capitalize; color:rgba(255,255,255,.65); font-weight:600; }
        .nt-modal-close { width:32px; height:32px; border-radius:50%; border:1px solid rgba(255,255,255,.2); background:rgba(255,255,255,.1); color:rgba(255,255,255,.8); display:grid; place-items:center; cursor:pointer; flex-shrink:0; font-size:14px; transition:background .18s; font-family:'Lato',sans-serif; }
        .nt-modal-close:hover { background:rgba(255,255,255,.2); }
        .nt-modal-title { font-family:'Playfair Display',Georgia,serif; font-size:clamp(17px,5vw,22px); font-weight:700; color:#fff; margin:0; line-height:1.25; }
        .nt-modal-body { padding:22px; overflow-y:auto; flex:1; }
        .nt-modal-text { font-size:15px; color:#57534E; line-height:1.8; white-space:pre-line; margin:0; font-family:'Playfair Display',Georgia,serif; }
        .nt-modal-address { margin-top:18px; padding:12px 14px; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:12px; font-size:13px; color:#57534E; }
        .nt-modal-address strong { color:#1E40AF; }
        .nt-modal-footer { padding:14px 22px 18px; border-top:1px solid #E8E5E0; flex-shrink:0; }
        .nt-modal-share-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:10px; background:#1E40AF; color:#fff; font-weight:800; font-size:15px; padding:14px 0; border-radius:14px; border:none; cursor:pointer; font-family:'Lato',sans-serif; transition:background .18s; }
        .nt-modal-share-btn:hover { background:#1D4ED8; }
      `}</style>

      <div className="nt-root">

        {/* Hero */}
        <header className="nt-hero">
          <div className="nt-hero-inner">
            <p className="nt-hero-kicker">Fique por dentro</p>
            <h1 className="nt-hero-title">Agenda da <br />Semana</h1>
            <p className="nt-hero-sub">Tudo que está acontecendo na nossa igreja, em um só lugar.</p>
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

        {/* Conteúdo */}
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
              {/* Cascata */}
              <div className="nt-cascade">
                {weekDays.map((dayDate, rowIdx) => {
                  const key      = dateToYMD(dayDate);
                  const notices  = noticesByDate[key] ?? [];
                  const isToday  = key === todayStr;
                  const hasEvent = notices.length > 0;
                  const allDone  = hasEvent && notices.every(n => (daysUntil(n.event_date) ?? 0) < 0);

                  // Classe do círculo
                  const circleClass = isToday
                    ? "nt-day-circle nt-day-circle-today"
                    : hasEvent
                      ? allDone
                        ? "nt-day-circle nt-day-circle-done"
                        : "nt-day-circle nt-day-circle-event"
                      : "nt-day-circle nt-day-circle-empty";

                  const nameClass = isToday
                    ? "nt-day-name-label nt-day-name-today"
                    : hasEvent
                      ? "nt-day-name-label nt-day-name-event"
                      : "nt-day-name-label nt-day-name-empty";

                  return (
                    <div key={key} className="nt-day-row">
                      {/* Marcador */}
                      <div className="nt-day-marker">
                        <div className={circleClass}>{dayDate.getDate()}</div>
                        <span className={nameClass}>{DAYS_SHORT[dayDate.getDay()]}</span>
                      </div>

                      {/* Conteúdo */}
                      <div className="nt-day-content">
                        {hasEvent ? (
                          notices.map((n, ni) => {
                            const days = daysUntil(n.event_date);
                            const done = (days ?? 0) < 0;
                            return (
                              <button
                                key={n.id}
                                className="nt-event-card"
                                style={{ animationDelay: `${rowIdx * 0.05 + ni * 0.04}s` }}
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
            </>
          )}
          {/* ── Rodapé informativo ── */}
          <div style={{
            marginTop: 40,
            background: "#1E40AF",
            borderRadius: 20,
            padding: "24px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}>
            {/* Endereço */}
            <div>
              <p style={{ fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,.6)", fontWeight:700, margin:"0 0 6px" }}>
                Nossa localização
              </p>
              <p style={{ fontSize:14, color:"rgba(255,255,255,.9)", fontWeight:600, lineHeight:1.6, margin:0, fontFamily:"'Lato',sans-serif" }}>
                Av. Maria José de Paula<br />
                Setor Amélio Alves — Inhumas, GO
              </p>
            </div>

            {/* Divisor */}
            <div style={{ height:1, background:"rgba(255,255,255,.15)", borderRadius:1 }} />

            {/* Redes sociais */}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <p style={{ fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,.6)", fontWeight:700, margin:0, flex:1 }}>
                Siga-nos
              </p>
              {/* Instagram */}
              <a href="https://www.instagram.com/aogiminhumas" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", color:"rgba(255,255,255,0.9)", textDecoration:"none", transition:"background .18s", flexShrink:0 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:17,height:17}}>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              {/* YouTube */}
              <a href="https://www.youtube.com/channel/UCZSKJY1tWNQHyEE3vO0y4wQ" target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", color:"rgba(255,255,255,0.9)", textDecoration:"none", transition:"background .18s", flexShrink:0 }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" style={{width:17,height:17}}>
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              {/* TikTok */}
              <a href="https://www.tiktok.com/@ad.irlanda.inhumas" target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", color:"rgba(255,255,255,0.9)", textDecoration:"none", transition:"background .18s", flexShrink:0 }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16}}>
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z"/>
                </svg>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Modal */}
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