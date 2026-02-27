import React, { useEffect, useMemo, useRef, useState } from "react";

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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function normalizeText(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hashStringToIndex(str: string, mod: number) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return mod === 0 ? 0 : h % mod;
}

function pickThemePhrase(dev: DevocionalData) {
  const text = normalizeText(`${dev.title} ${dev.verseText} ${dev.verseRef} ${dev.body}`);

  const themes: Array<{
    name: string;
    test: (t: string) => boolean;
    phrases: string[];
  }> = [
    {
      name: "medo_ansiedade",
      test: (t) =>
        /(medo|ansiedad|preocup|aflit|angusti|temor|panico|insegur|cansad|peso no coracao)/.test(t),
      phrases: [
        "Se seu coração está pesado, leia isso com calma. Deus sustenta você.",
        "Talvez você esteja ansioso. Respire. Deus continua no controle.",
        "Quando o medo grita, a Palavra fala mais alto. Leia isso com fé.",
      ],
    },
    {
      name: "fe_confianca",
      test: (t) =>
        /(fe|confi|crer|descans|entrega|espera|fidel|seguranc|ampar|sustent)/.test(t),
      phrases: [
        "Deus ainda fala hoje. Leia isso com o coração aberto.",
        "O que Deus prometeu, Ele sustenta. Leia e renove sua fé.",
        "Não é sobre sentir; é sobre confiar. Leia isso e descanse.",
      ],
    },
    {
      name: "perdao_reconciliacao",
      test: (t) => /(perd|magoa|ofens|reconcili|culpa|restaur|voltar)/.test(t),
      phrases: [
        "Talvez seja o dia de recomeçar. Leia isso e libere perdão.",
        "Deus cura o que a mágoa tentou destruir. Leia isso com sinceridade.",
        "O perdão abre portas que o orgulho fecha. Leia e seja livre.",
      ],
    },
    {
      name: "cura_consolo",
      test: (t) => /(cura|doenc|enferm|dor|luto|lagr|choro|consol|ferid)/.test(t),
      phrases: [
        "Se a dor apertou, não caminhe sozinho. Leia isso e receba consolo.",
        "Deus vê suas lágrimas. Leia isso com esperança.",
        "Há cura na presença de Deus. Leia isso com fé.",
      ],
    },
    {
      name: "familia_casamento",
      test: (t) => /(famil|casament|marid|espos|filh|pais|lar|casa)/.test(t),
      phrases: [
        "Que Deus fortaleça seu lar. Leia isso e ore pela sua família.",
        "Família é projeto de Deus. Leia isso com amor e propósito.",
        "Seja luz dentro de casa. Leia isso e ajuste o coração.",
      ],
    },
    {
      name: "proposito_chamado",
      test: (t) => /(proposit|chamad|missao|obra|servir|vocacao|dons|minister)/.test(t),
      phrases: [
        "Deus não te chamou à toa. Leia isso e alinhe seu propósito.",
        "Seu chamado não é acidente. Leia isso e siga firme.",
        "Há direção de Deus para você hoje. Leia com atenção.",
      ],
    },
    {
      name: "provisao_portas",
      test: (t) => /(provis|porta|empreg|trabalh|financ|necessid|milagr|sustento)/.test(t),
      phrases: [
        "Deus abre caminhos onde ninguém vê saída. Leia isso e confie.",
        "Sua provisão não depende do cenário. Leia isso com fé.",
        "Deus é fiel no sustento. Leia isso e descanse.",
      ],
    },
    {
      name: "coragem_guerra",
      test: (t) => /(corag|forca|luta|batalh|guerra|resist|persever|vencer)/.test(t),
      phrases: [
        "Se hoje foi difícil, não desista. Leia isso e se levante.",
        "Você não luta sozinho. Leia isso e tome coragem.",
        "Deus fortalece os cansados. Leia isso e continue.",
      ],
    },
  ];

  const fallbackPhrases = [
    "Deus tem uma palavra para você hoje. Leia com atenção.",
    "Leia isso com o coração aberto. Deus pode te surpreender.",
    "Uma palavra certa no tempo certo muda tudo. Leia com fé.",
  ];

  const theme = themes.find((th) => th.test(text));
  const base = theme ? theme.phrases : fallbackPhrases;
  const idx = hashStringToIndex(
    `${todayKey()}|${dev.title}|${theme?.name ?? "fallback"}`,
    base.length
  );
  return base[idx];
}

// ── Gerador de imagem para Instagram ─────────────────────────────────────────
function gerarImagemInstagram(data: DevocionalData): Promise<string> {
  return new Promise((resolve) => {
    const SIZE = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d")!;

    // Fundo degradê profundo
    const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    grad.addColorStop(0, "#0b1437");
    grad.addColorStop(0.45, "#0f2157");
    grad.addColorStop(1, "#1a0a3d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Círculo de luz superior
    const glow1 = ctx.createRadialGradient(SIZE * 0.25, SIZE * 0.2, 0, SIZE * 0.25, SIZE * 0.2, SIZE * 0.55);
    glow1.addColorStop(0, "rgba(99,179,237,0.18)");
    glow1.addColorStop(1, "transparent");
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Círculo de luz inferior
    const glow2 = ctx.createRadialGradient(SIZE * 0.75, SIZE * 0.8, 0, SIZE * 0.75, SIZE * 0.8, SIZE * 0.5);
    glow2.addColorStop(0, "rgba(159,122,234,0.2)");
    glow2.addColorStop(1, "transparent");
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Linha decorativa horizontal superior
    ctx.save();
    ctx.globalAlpha = 0.35;
    const lineGrad = ctx.createLinearGradient(120, 0, SIZE - 120, 0);
    lineGrad.addColorStop(0, "transparent");
    lineGrad.addColorStop(0.5, "#a78bfa");
    lineGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(120, 200);
    ctx.lineTo(SIZE - 120, 200);
    ctx.stroke();
    ctx.restore();

    // Linha decorativa horizontal inferior
    ctx.save();
    ctx.globalAlpha = 0.35;
    const lineGrad2 = ctx.createLinearGradient(120, 0, SIZE - 120, 0);
    lineGrad2.addColorStop(0, "transparent");
    lineGrad2.addColorStop(0.5, "#a78bfa");
    lineGrad2.addColorStop(1, "transparent");
    ctx.strokeStyle = lineGrad2;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(120, SIZE - 200);
    ctx.lineTo(SIZE - 120, SIZE - 200);
    ctx.stroke();
    ctx.restore();

    // Tag "DEVOCIONAL DO DIA"
    ctx.save();
    ctx.font = "bold 28px sans-serif";
    ctx.letterSpacing = "8px";
    ctx.fillStyle = "rgba(167,139,250,0.9)";
    ctx.textAlign = "center";
    ctx.fillText("DEVOCIONAL DO DIA", SIZE / 2, 170);
    ctx.restore();

    // Título (quebra de linha automática)
    const wrapText = (text: string, maxWidth: number, fontSize: number, fontWeight = "600") => {
      ctx.font = `${fontWeight} ${fontSize}px Georgia, serif`;
      const words = text.split(" ");
      const lines: string[] = [];
      let current = "";
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && current) {
          lines.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);
      return lines;
    };

    const titleLines = wrapText(data.title, SIZE - 240, 72);
    const totalTitleH = titleLines.length * 88;
    const titleStartY = SIZE / 2 - totalTitleH / 2 - 40;

    ctx.save();
    ctx.font = "600 72px Georgia, serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    titleLines.forEach((line, i) => {
      ctx.fillText(line, SIZE / 2, titleStartY + i * 88);
    });
    ctx.restore();

    // Linha separadora
    const refY = titleStartY + totalTitleH + 28;
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SIZE / 2 - 60, refY);
    ctx.lineTo(SIZE / 2 + 60, refY);
    ctx.stroke();
    ctx.restore();

    // Referência bíblica
    ctx.save();
    ctx.font = "italic 38px Georgia, serif";
    ctx.fillStyle = "rgba(196,181,253,0.95)";
    ctx.textAlign = "center";
    ctx.fillText(data.verseRef, SIZE / 2, refY + 60);
    ctx.restore();

    // Logo / nome do ministério no rodapé
    ctx.save();
    ctx.font = "500 30px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.textAlign = "center";
    ctx.fillText("AOGIM Conect • Ministério Irlanda", SIZE / 2, SIZE - 130);
    ctx.restore();

    resolve(canvas.toDataURL("image/png"));
  });
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Devotional() {
  const [data, setData] = useState<DevocionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [gerandoImagem, setGerandoImagem] = useState(false);
  const [imagemGerada, setImagemGerada] = useState<string | null>(null);

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
        const res = await fetch(
          `/.netlify/functions/devocional?b=${encodeURIComponent(bibleVersion)}`,
          { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" }
        );
        const json = (await res.json()) as DevocionalData;
        if (!alive) return;
        setData(json);
        localStorage.setItem(cacheKey, JSON.stringify(json));
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  const shareUrl =
    "https://aogimconectinhumas.site/#/devocional?utm_source=whatsapp&utm_medium=share";

  const compartilharWhatsApp = () => {
    if (!data) return;
    const emotionalLine = pickThemePhrase(data);
    const text = `${emotionalLine}\n\n📖 ${data.title}\n\n"${data.verseText}"\n${data.verseRef}\n\nLeia completo:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleGerarImagem = async () => {
    if (!data) return;
    setGerandoImagem(true);
    try {
      const url = await gerarImagemInstagram(data);
      setImagemGerada(url);
    } finally {
      setGerandoImagem(false);
    }
  };

  const handleDownloadImagem = () => {
    if (!imagemGerada) return;
    const a = document.createElement("a");
    a.href = imagemGerada;
    a.download = `devocional-${todayKey()}.png`;
    a.click();
  };

  return (
    <main
      className="min-h-screen flex items-start justify-center px-4 pt-6 pb-16 animated-bg relative overflow-hidden"
    >
      {/* Logo */}
      <div className="absolute top-4 w-full flex justify-center z-10">
        <img
          src={logoUrl}
          alt="AOGIM Conect"
          className="w-24 sm:w-28 md:w-32 lg:w-36 object-contain drop-shadow-[0_0_28px_rgba(255,255,255,0.32)]"
        />
      </div>

      {/* Glows ambiente */}
      <div className="absolute w-[500px] h-[500px] bg-blue-500/15 blur-[120px] rounded-full top-0 -left-32 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-purple-600/15 blur-[120px] rounded-full bottom-0 -right-32 pointer-events-none" />
      <div className="absolute w-72 h-72 bg-indigo-400/10 blur-[80px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="relative w-full max-w-xl mt-24 sm:mt-28 space-y-4">

        {/* ── Card principal ── */}
        <div className="backdrop-blur-2xl bg-white/[0.08] border border-white/20 rounded-3xl overflow-hidden shadow-[0_20px_80px_rgba(7,18,56,0.55)]">

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="text-white/60 text-sm tracking-wide">Carregando devocional…</p>
            </div>
          )}

          {!loading && !data && (
            <p className="text-center text-white/70 py-16 px-6">
              Não consegui carregar o devocional agora. Tente novamente em instantes.
            </p>
          )}

          {data && (
            <>
              {/* Cabeçalho com degradê sutil */}
              <div className="bg-gradient-to-b from-white/[0.06] to-transparent px-6 pt-7 pb-5 text-center border-b border-white/10">
                <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-purple-300/80 font-medium">
                  <span className="w-4 h-px bg-purple-300/50" />
                  Devocional do Dia
                  {data.dateLabel ? ` • ${data.dateLabel}` : ""}
                  <span className="w-4 h-px bg-purple-300/50" />
                </span>

                <h1 className="mt-3 text-xl sm:text-2xl font-semibold text-white leading-snug tracking-tight">
                  {data.title}
                </h1>
              </div>

              {/* Verso */}
              <div className="px-6 sm:px-8 py-7">
                <div className="relative pl-4 border-l-2 border-purple-400/50">
                  <p className="text-base sm:text-[17px] text-white/90 leading-relaxed italic">
                    "{data.verseText}"
                  </p>
                  <p className="mt-3 text-sm font-semibold text-purple-300/90 not-italic">
                    {data.verseRef}
                  </p>
                </div>
              </div>

              {/* Divisor */}
              <div className="px-6 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <span className="text-white/20 text-xs">✦</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                </div>
              </div>

              {/* Corpo */}
              <div className="px-6 sm:px-8 py-7 space-y-4 text-white/85 text-[15px] sm:text-base leading-7">
                {data.body
                  .split("\n")
                  .map((p) => p.trim())
                  .filter(Boolean)
                  .map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
              </div>

              {/* Botões de compartilhamento */}
              <div className="px-6 sm:px-8 pb-7 pt-2 flex flex-col gap-3">
                {/* WhatsApp */}
                <button
                  onClick={compartilharWhatsApp}
                  className="group w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 font-semibold text-white transition-all duration-200 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] shadow-lg shadow-emerald-900/30"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.123 1.528 5.854L0 24l6.335-1.508A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 01-5.031-1.388l-.361-.214-3.741.981.999-3.648-.235-.374A9.794 9.794 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
                  </svg>
                  Compartilhar no WhatsApp
                </button>

                {/* Instagram — Gerar imagem */}
                {!imagemGerada ? (
                  <button
                    onClick={handleGerarImagem}
                    disabled={gerandoImagem}
                    className="group w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 font-semibold text-white transition-all duration-200 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 active:scale-[0.98] shadow-lg shadow-pink-900/30 disabled:opacity-60"
                  >
                    {gerandoImagem ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Gerando imagem…
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                          <circle cx="12" cy="12" r="5" />
                          <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                        </svg>
                        Criar imagem para o Instagram
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    {/* Preview da imagem */}
                    <div className="rounded-2xl overflow-hidden border border-white/15 shadow-xl">
                      <img src={imagemGerada} alt="Preview Instagram" className="w-full" />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleDownloadImagem}
                        className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-white bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 active:scale-[0.98] transition-all"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 shrink-0">
                          <path d="M12 3v12m0 0l-4-4m4 4l4-4M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Baixar imagem
                      </button>
                      <button
                        onClick={() => setImagemGerada(null)}
                        className="px-5 rounded-2xl py-3 font-semibold text-white/70 bg-white/10 hover:bg-white/15 active:scale-[0.98] transition-all text-sm"
                      >
                        Refazer
                      </button>
                    </div>

                    <p className="text-center text-white/40 text-xs">
                      Salve a imagem e compartilhe nos seus Stories ou Feed do Instagram
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </main>
  );
}