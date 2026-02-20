import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

// Ajustes fixos do ministério
const CHURCH_ADDRESS = "Av. Maria José de Paula, Setor Amélio Alves - Inhumas";
const CHURCH_SIGNATURE = "AD Ministério Irlanda • Inhumas - GO";

// Ícone oficial do WhatsApp (SVG)
function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.11 17.63c-.29-.15-1.7-.84-1.97-.94-.26-.1-.46-.15-.65.15-.19.29-.75.94-.92 1.13-.17.19-.33.22-.62.07-.29-.15-1.22-.45-2.32-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.33.43-.5.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.65-1.56-.89-2.13-.23-.56-.47-.48-.65-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.44 0 1.44 1.03 2.83 1.18 3.03.15.19 2.03 3.1 4.92 4.35.69.3 1.23.48 1.65.62.69.22 1.31.19 1.8.12.55-.08 1.7-.69 1.94-1.35.24-.67.24-1.24.17-1.35-.07-.12-.26-.19-.55-.34M16.04 26.67h-.01c-1.73 0-3.42-.46-4.9-1.34l-.35-.2-3.63.95.97-3.53-.23-.36a10.6 10.6 0 0 1-1.61-5.65c0-5.87 4.78-10.65 10.66-10.65 2.84 0 5.51 1.11 7.52 3.12a10.56 10.56 0 0 1 3.11 7.52c0 5.88-4.78 10.65-10.65 10.65m9.04-19.69A12.7 12.7 0 0 0 16.04 3.2C9.02 3.2 3.3 8.92 3.3 15.94c0 2.25.6 4.46 1.74 6.4L3.2 29.12l6.95-1.82a12.68 12.68 0 0 0 5.89 1.5h.01c7.02 0 12.74-5.72 12.74-12.74 0-3.4-1.33-6.6-3.71-9.08"
      />
    </svg>
  );
}

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
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function Notices() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Notice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Notice | null>(null);

  const activeDateLabel = useMemo(() => {
    if (!active) return "";
    return active.event_date
      ? formatDateBR(active.event_date)
      : active.created_at
      ? formatDateBR(active.created_at)
      : "";
  }, [active]);

  async function loadNotices() {
    setLoading(true);
    setError(null);

    try {
      // ✅ Tenta ordenar por event_date (crescente)
      let res = await supabase
        .from("notices")
        .select("*")
        .eq("is_published", true)
        .order("event_date", { ascending: true });

      // ✅ Se não existir event_date, faz fallback em created_at
      if (res.error) {
        res = await supabase
          .from("notices")
          .select("*")
          .eq("is_published", true)
          .order("created_at", { ascending: true });
      }

      if (res.error) throw res.error;

      setItems((res.data as Notice[]) ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar avisos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotices();
  }, []);

  function openNotice(n: Notice) {
    setActive(n);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setActive(null);
  }

  function buildWhatsAppText(n: Notice) {
    // ✅ título em negrito no WhatsApp
    const title = `*${n.title}*`;
    const body = n.body?.trim() ? `\n\n${n.body.trim()}` : "";
    const address = `\n\n📍 ${CHURCH_ADDRESS}`;
    const signature = `\n${CHURCH_SIGNATURE}`;
    return `${title}${body}${address}${signature}`;
  }

  function shareWhatsApp(n: Notice) {
    const text = buildWhatsAppText(n);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-28">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Avisos</h1>
            <p className="text-slate-600 mt-1">Fique por dentro do que Deus está fazendo no nosso meio.</p>
          </div>
          <button
            onClick={loadNotices}
            className="rounded-xl border bg-white px-4 py-2 hover:bg-slate-50 transition text-slate-700"
          >
            Atualizar
          </button>
        </div>

        {loading && (
          <div className="mt-10 text-center text-slate-500">Carregando avisos…</div>
        )}

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 border border-red-100 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="mt-10 text-center text-slate-500">Nenhum aviso publicado no momento.</div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((n) => {
            const dateLabel = n.event_date
              ? formatDateBR(n.event_date)
              : n.created_at
              ? formatDateBR(n.created_at)
              : "";

            return (
              <button
                key={n.id}
                onClick={() => openNotice(n)}
                className="text-left bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>📅</span>
                  <span>{dateLabel}</span>
                </div>

                <div className="mt-2 text-base font-semibold text-slate-900">
                  {n.title}
                </div>

                <div className="mt-2 text-sm text-slate-600 line-clamp-3">
                  {n.body}
                </div>

                <div className="mt-4 text-xs text-blue-700 font-semibold">
                  Toque para ver completo →
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODAL */}
      {open && active && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>📅</span>
                  <span>{activeDateLabel}</span>
                </div>

                <button
                  onClick={closeModal}
                  className="rounded-full w-9 h-9 border bg-white hover:bg-slate-50 transition grid place-items-center"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              <h2 className="mt-3 text-xl sm:text-2xl font-bold text-slate-900">
                {active.title}
              </h2>

              <p className="mt-4 text-slate-700 leading-relaxed whitespace-pre-line">
                {active.body}
              </p>

              <div className="mt-5 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">Endereço:</span>{" "}
                {CHURCH_ADDRESS}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => shareWhatsApp(active)}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-500 text-white px-4 py-3 font-semibold shadow-sm hover:bg-green-600 transition"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  Compartilhar via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}