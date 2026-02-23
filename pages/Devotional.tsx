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

  const gerarImagemInstagram = () => {
    if (!data) return;

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(0.5, "#1e3a8a");
    gradient.addColorStop(1, "#0f172a");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";

    ctx.font = "bold 70px Arial";
    ctx.fillText("Devocional do Dia", 540, 250);

    wrapText(ctx, `"${data.verseText}"`, 540, 600, 900, 80);

    ctx.font = "bold 50px Arial";
    ctx.fillText(data.verseRef, 540, 1100);

    ctx.font = "40px Arial";
    ctx.fillText("AOGIM Conect", 540, 1700);
    ctx.fillText("aogimconectinhumas.site", 540, 1780);

    const link = document.createElement("a");
    link.download = "devocional-aogim.png";
    link.href = canvas.toDataURL("image/png");
    link.click();

    setTimeout(() => {
      window.open("https://www.instagram.com/", "_blank");
    }, 1000);
  };

  function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(" ");
    let line = "";
    let testLine = "";
    let lines = [];

    for (let n = 0; n < words.length; n++) {
      testLine += `${words[n]} `;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line);
        line = `${words[n]} `;
        testLine = `${words[n]} `;
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, y + i * lineHeight);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 animated-bg relative">

      {/* Logo Responsiva */}
      <div className="absolute top-6 w-full flex justify-center">
        <img
          src="/logo.png"
          alt="AOGIM Logo"
          className="w-40 sm:w-48 md:w-56 lg:w-64"
        />
      </div>

      {/* Glow effects */}
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

              <div className="mt-10 flex flex-col gap-4">

                <button
                  onClick={() => {
                    const text = `📖 Devocional do Dia – AOGIM Conect

"${data.verseText}"
${data.verseRef}

Leia completo:
${shareUrl}`;

                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white py-3 font-semibold transition"
                >
                  Compartilhar no WhatsApp
                </button>

                <button
                  onClick={gerarImagemInstagram}
                  className="rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white py-3 font-semibold transition"
                >
                  Gerar imagem para Instagram
                </button>

              </div>

            </>
          )}
        </div>
      </div>
    </main>
  );
}