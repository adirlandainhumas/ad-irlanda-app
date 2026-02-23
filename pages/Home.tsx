import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const LOGO_FULL =
  "https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png";

const ADDRESS_LINE_1 = "Av. Maria José de Paula";
const ADDRESS_LINE_2 = "Setor Amélio Alves - Inhumas - GO";

// Link direto (compartilhável) do Google Maps para a igreja
const CHURCH_MAPS_LINK =
  "https://www.google.com/maps/search/?api=1&query=AOGIM%20-%20Assembleia%20de%20Deus%20Min.%20Irlanda%20Inhumas";

// Link para abrir rota (navegação)
const CHURCH_DIRECTIONS_LINK =
  "https://www.google.com/maps/dir/?api=1&destination=AOGIM%20-%20Assembleia%20de%20Deus%20Min.%20Irlanda%20Inhumas";

const GALLERY_BUCKET = "galeria";
const GALLERY_PATH = "ultimo-culto";

const PASTOR_WHATSAPP_NUMBER = "5562984468270"; // +55 62 98446-8270

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

  // Avisos
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

  // Prévia da galeria (Storage)
  useEffect(() => {
    async function loadGalleryPreview() {
      setLoadingGallery(true);

      const { data, error } = await supabase.storage
        .from(GALLERY_BUCKET)
        .list(GALLERY_PATH, {
          limit: 30,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (!error && data) {
        const urls = data
          .filter((f) => !!f.name && !f.name.startsWith("."))
          .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f.name))
          .slice(0, 6)
          .map(
            (f) =>
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

  const pastorWhatsUrl = `https://wa.me/${PASTOR_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Olá, pastor! Gostaria de falar com o senhor."
  )}`;

  // WhatsApp para compartilhar localização (link + endereço)
  const shareLocationWhatsUrl = `https://wa.me/?text=${encodeURIComponent(
    `📍 Localização da igreja (clique para abrir no Maps):\n${CHURCH_MAPS_LINK}\n\nEndereço:\n${ADDRESS_LINE_1}\n${ADDRESS_LINE_2}`
  )}`;

  // Copiar endereço
  async function handleCopyAddress() {
    const text = `${ADDRESS_LINE_1}\n${ADDRESS_LINE_2}\n${CHURCH_MAPS_LINK}`;
    try {
      await navigator.clipboard.writeText(text);
      alert("Endereço copiado! Agora é só colar onde quiser.");
    } catch {
      // fallback simples
      prompt("Copie o endereço:", text);
    }
  }

  return (
    <div className="relative">
      {/* HERO */}
      <section
        className="hero-animated-gradient relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden rounded-b-[2.5rem] text-white"
        style={
          {
            ["--mouse-x" as any]: "50%",
            ["--mouse-y" as any]: "35%",
          } as React.CSSProperties
        }
        onMouseMove={(e) => {
          const section = e.currentTarget;
          const rect = section.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          section.style.setProperty("--mouse-x", `${x}%`);
          section.style.setProperty("--mouse-y", `${y}%`);
        }}
      >
        {/* Luz dinâmica */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-[640px] h-[640px] bg-sky-400/20 blur-3xl rounded-full transition-all duration-200"
            style={{
              left: "var(--mouse-x)",
              top: "var(--mouse-y)",
              transform: "translate(-50%, -50%)",
            }}
          />
          <div className="absolute inset-0 bg-black/25" />
        </div>

        {/* Conteúdo do HERO */}
        <div className="relative z-10 w-full max-w-5xl px-6 text-center">
          <div className="flex justify-center">
            <img
              src={LOGO_FULL}
              alt="AD Ministério Irlanda"
              className="
                w-[170px]
                sm:w-[220px]
                md:w-[300px]
                lg:w-[360px]
                h-auto object-contain
                drop-shadow-[0_20px_60px_rgba(0,0,0,0.40)]
              "
            />
          </div>

          <p className="mt-8 text-base md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
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
        {/* Avisos */}
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">
            Próximos Avisos
          </h2>
          <Link
            to="/avisos"
            className="text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
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

        {/* Prévia da Galeria */}
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
              Nenhuma foto disponível ainda. Assim que você enviar no painel
              admin, elas aparecem aqui automaticamente.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              {galleryPreview.map((url) => (
                <Link
                  key={url}
                  to="/galeria"
                  className="group relative overflow-hidden rounded-2xl bg-slate-100 border"
                  aria-label="Abrir galeria"
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

        {/* Localização (card clicável + compartilhamento fácil) */}
        <div className="mt-16 rounded-[2rem] bg-gradient-to-br from-blue-700 to-blue-900 text-white p-8 shadow-lg">
          <h3 className="text-2xl font-black">Venha nos visitar</h3>

          {/* CARD CLICÁVEL: abre o Google Maps */}
          <a
            href={CHURCH_DIRECTIONS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block rounded-2xl bg-white/10 border border-white/15 p-4 hover:bg-white/15 transition"
          >
            <div className="text-xs uppercase tracking-widest text-white/70">
              Endereço
            </div>
            <div className="mt-2 font-semibold">
              📍 {ADDRESS_LINE_1}
              <br />
              {ADDRESS_LINE_2}
            </div>
            <div className="mt-2 text-xs text-white/70">
              Toque para abrir rota no Google Maps →
            </div>
          </a>

          {/* Botões */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a
              href={shareLocationWhatsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-white text-blue-900 px-6 py-3 font-bold hover:opacity-90 transition w-full sm:w-auto"
            >
              Mandar localização no WhatsApp
            </a>

           
            <a
              href={pastorWhatsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 hover:bg-white/10 text-white px-6 py-3 font-bold transition w-full sm:w-auto"
            >
              Falar com o Pastor
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}