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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DevocionalData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bibleVersion = "acf";
  const cacheKey = useMemo(() => `devocional:${bibleVersion}:${todayKey()}`, []);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as DevocionalData;
          if (alive) {
            setData(parsed);
            setLoading(false);
          }
          return;
        }
      } catch {}

      try {
        const res = await fetch(
          `/.netlify/functions/devocional?b=${encodeURIComponent(bibleVersion)}`
        );

        if (!res.ok) throw new Error();

        const json = await res.json();

        if (!alive) return;

        setData(json);
        setLoading(false);

        localStorage.setItem(cacheKey, JSON.stringify(json));
      } catch {
        if (!alive) return;
        setError("Não consegui carregar o devocional de hoje.");
        setLoading(false);
      }
    };

    load();
    return () => { alive = false; };
  }, []);

  const shareUrl = "https://aogimconectinhumas.site/devocional";

  const shareText = data
    ? `📖 Devocional do Dia – AOGIM Conect

"${data.verseText}"
${data.verseRef}

Leia completo:
${shareUrl}`
    : "";

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl">

        <h1 className="text-3xl font-bold text-slate-900">
          {data?.title ?? "Devocional"}
        </h1>

        {loading && <p className="mt-6">Carregando...</p>}
        {error && <p className="mt-6 text-red-600">{error}</p>}

        {data && (
          <>
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-xl">
              <p className="text-lg leading-relaxed">
                “{data.verseText}”
              </p>
              <p className="mt-3 text-sm font-semibold">
                {data.verseRef}
              </p>
            </div>

            <div className="mt-8 space-y-5 text-slate-800 leading-relaxed">
              {data.body.split("\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">

              {/* WhatsApp */}
              <button
                onClick={() => {
                  const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                  window.open(url, "_blank");
                }}
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 font-semibold shadow-md transition"
              >
                Compartilhar no WhatsApp
              </button>

              {/* Instagram */}
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareText);
                    window.location.href = "instagram://story-camera";
                  } catch {
                    window.open("https://www.instagram.com/", "_blank");
                  }
                }}
                className="rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white px-6 py-3 font-semibold shadow-md transition"
              >
                Compartilhar no Instagram
              </button>

            </div>
          </>
        )}
      </div>
    </main>
  );
}