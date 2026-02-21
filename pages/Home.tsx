import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const LOGO_FULL =
  "https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png";

const ADDRESS = "Av. Maria José de Paula, Setor Amélio Alves - Inhumas - GO";

const GALLERY_BUCKET = "galeria";
const GALLERY_PATH = "ultimo-culto"; // pasta no Storage

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
  return d.toLocaleDateString("pt-BR");
}

export default function Home() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(true);

  const [galleryPreview, setGalleryPreview] = useState<string[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);

  useEffect(() => {
    async function loadNotices() {
      setLoadingNotices(true);

      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("is_published", true)
        .order("event_date", { ascending: true });

      if (!error && data) setNotices(data as Notice[]);
      setLoadingNotices(false);
    }

    loadNotices();
  }, []);

  useEffect(() => {
    async function loadGalleryPreview() {
      setLoadingGallery(true);

      const { data, error } = await supabase.storage
        .from(GALLERY_BUCKET)
        .list(GALLERY_PATH, {
          limit: 12,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (!error && data) {
        const urls = data
          .filter((f) => !!f.name && !f.name.startsWith("."))
          .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f.name))
          .slice(0, 6)
          .map((f) =>
            supabase.storage
              .from(GALLERY_BUCKET)
              .getPublicUrl(`${GALLERY_PATH}/${f.name}`).data.publicUrl
          );

        setGalleryPreview(urls);
      } else {
        setGalleryPreview([]);
      }

      setLoadingGallery(false);
    }

    loadGalleryPreview();
  }, []);

  return (
    <div className="relative">
      {/* HERO */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
        {/* Background Glow */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -top-40 -left-40 w-[520px] h-[520px] bg-blue-600 blur-3xl rounded-full animate-pulse" />
          <div className="absolute top-10 right-[-120px] w-[420px] h-[420px] bg-indigo-500 blur-3xl rounded-full animate-pulse" />
          <div className="absolute bottom-[-180px] left-1/3 w-[560px] h-[560px] bg-cyan-500 blur-3xl rounded-full animate-pulse" />
        </div>

        <div className="relative z-10 w-full max-w-5xl px-6 text-center">
          {/* LOGO CENTRAL */}
          <div className="flex justify-center">
            <img
              src={LOGO_FULL}
              alt="AD Ministério Irlanda"
              className="
                w-[180px]
                sm:w-[240px]
                md:w-[320px]
                lg:w-[380px]
                h-auto object-contain
                drop-shadow-[0_20px_60px_rgba(0,0,0,0.35)]
              "
            />
          </div>

          <p className="mt-8 text-base md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            Conecte-se aos avisos, devocionais e registros do último culto — com
            uma experiência moderna, leve e feita para o seu dia a dia.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/avisos"
              className="w-full sm:w-auto rounded-full bg-blue-600 hover:bg-blue-500 transition px-7 py-3 font-semibold shadow-lg shadow-blue-600/25"
            >
              Ver Avisos
            </Link>

            <Link
              to="/devocional"
              className="w-full sm:w-auto rounded-full border border-white/20 bg-white/5 hover:bg-white/10 transition px-7 py-3 font-semibold"
            >
              Devocional de Hoje
            </Link>

            <Link
              to="/galeria"
              className="w-full sm:w-auto rounded-full border border-white/20 bg-white/0 hover:bg-white/10 transition px-7 py-3 font-semibold"
            >
              Ver Galeria
            </Link>
          </div>
        </div>
      </section>

      {/* CONTEÚDO */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">
            Próximos Avisos
          </h2>
          <Link to="/avisos" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
            Ver todos →
          </Link>
        </div>

        {loadingNotices ? (
          <p className="mt-6 text-slate-500">Carregando avisos...</p>
        ) : notices.length === 0 ? (
          <p className="mt-6 text-slate-500">Nenhum aviso publicado.</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {notices.map((notice) => (
              <Link
                key={notice.id}
                to="/avisos"
                className="rounded-3xl bg-white border shadow-sm p-5 hover:shadow-md transition"
              >
                <div className="text-xs text-slate-500">
                  📅 {formatDateBR(notice.event_date ?? notice.created_at)}
                </div>

                <div className="mt-2 text-base font-bold text-slate-900">
                  {notice.title}
                </div>

                <div className="mt-2 text-sm text-slate-600 line-clamp-2">
                  {notice.body}
                </div>

                <div className="mt-4 text-xs font-semibold text-blue-700">
                  Toque para ver →
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ✅ PRÉVIA DA GALERIA (ANTES DO ENDEREÇO) */}
        <div className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-[0.32em]">
                Galeria
              </div>
              <h3 className="mt-2 text-2xl md:text-3xl font-black text-slate-900">
                Fotos do Último Culto
              </h3>
            </div>

            <Link
              to="/galeria"
              className="text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              Ver todas →
            </Link>
          </div>

          {loadingGallery ? (
            <p className="mt-6 text-slate-500">Carregando fotos...</p>
          ) : galleryPreview.length === 0 ? (
            <div className="mt-6 rounded-3xl bg-white border p-6 text-slate-500">
              Nenhuma foto disponível ainda. Assim que você enviar no painel admin,
              elas aparecem aqui automaticamente.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              {galleryPreview.map((url) => (
                <Link
                  key={url}
                  to="/galeria"
                  className="group relative overflow-hidden rounded-2xl bg-slate-100 border"
                >
                  <img
                    src={url}
                    alt="Foto do culto"
                    className="w-full h-[150px] sm:h-[180px] md:h-[210px] object-cover group-hover:scale-[1.03] transition duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent opacity-0 group-hover:opacity-100 transition" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ENDEREÇO / VISITA */}
        <div className="mt-16 rounded-[2rem] bg-gradient-to-br from-blue-700 to-blue-900 text-white p-8 shadow-lg">
          <h3 className="text-2xl font-black">Venha nos visitar</h3>

          <p className="mt-4">📍 {ADDRESS}</p>

          <div className="mt-6">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Olá! Quero informações sobre os cultos. Endereço: ${ADDRESS}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-white text-blue-900 px-6 py-3 font-bold hover:opacity-90 transition"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}