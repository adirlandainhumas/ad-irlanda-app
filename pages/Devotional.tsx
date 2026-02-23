import React, { useEffect, useMemo, useState } from "react";

type DevocionalData = {
  ok?: boolean;
  dateLabel: string;
  title: string;
  verseText: string;
  verseRef: string;
  body: string;
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Devotional() {
  const [data, setData] = useState<DevocionalData | null>(null);
  const [loading, setLoading] = useState(true);

  const bibleVersion = "acf";
  const cacheKey = useMemo(() => `devocional:${bibleVersion}:${todayKey()}`, []);

  const logoUrl =
    "https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png";

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setData(JSON.parse(cached));
          setLoading(false);
          return;
        }

        const res = await fetch(`/.netlify/functions/devocional?b=${bibleVersion}`);
        const json = await res.json();

        if (!alive) return;

        setData(json);
        localStorage.setItem(cacheKey, JSON.stringify(json));
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };

    load();
    return () => { alive = false };
  }, []);

  const shareUrl = "https://aogimconectinhumas.site/devocional";

  const compartilharWhatsApp = () => {
    if (!data) return;

    const text = `✨ Deus ainda fala hoje. Leia isso com o coração aberto.

📖 ${data.title}

"${data.verseText}"
${data.verseRef}

Leia completo:
${shareUrl}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 animated-bg relative">

      {/* Logo */}
      <div className="absolute top-6 w-full flex justify-center">
        <img
          src={logoUrl}
          alt="AOGIM Logo"
          className="w-40 sm:w-48 md:w-56 lg:w-64 object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]"
        />
      </div>

      {/* Glow Effects */}
      <div className="absolute w-96 h-96 bg-blue-500/20 blur-3xl rounded-full top-20 -left-20"></div>
      <div className="absolute w-96 h-96 bg-purple-500/20 blur-3xl rounded-full bottom-10 -right-20"></div>

      <div className="relative w-full max-w-xl mt-32">

        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">

          {loading && (
            <p className="text-center text-white text-lg">Carregando devocional...</p>
          )}

          {data && (
            <>
              <p className="text-sm uppercase tracking-widest text-white/70 text-center">
                Devocional do Dia
              </p>

              <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-white text-center">
                {data.title}
              </h1>

              <div className="mt-8 text-center">
                <p className="text-lg sm:text-xl text-white leading-relaxed">
                  “{data.verseText}”
                </p>
                <p className="mt-3 text-sm font-semibold text-white/80">
                  {data.verseRef}
                </p>
              </div>

              <div className="mt-8 space-y-4 text-white/90 text-base leading-relaxed">
                {data.body.split("\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              <div className="mt-10">
                <button
                  onClick={compartilharWhatsApp}
                  className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white py-3 font-semibold transition"
                >
                  Compartilhar no WhatsApp
                </button>
              </div>

            </>
          )}
        </div>
      </div>
    </main>
  );
}