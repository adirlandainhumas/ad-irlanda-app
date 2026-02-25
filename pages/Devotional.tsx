import React, { useEffect, useMemo, useState } from "react";
import DevotionalShareActions from "../components/DevotionalShareActions";

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

function buildShareText(dev: DevocionalData, shareUrl: string) {
  const emotionalLine = pickThemePhrase(dev);
  return `${emotionalLine}

📖 ${dev.title}

"${dev.verseText}"
${dev.verseRef}

Leia completo:
${shareUrl}`;
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

        const res = await fetch(
          `/.netlify/functions/devocional?b=${encodeURIComponent(bibleVersion)}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }
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
    return () => {
      alive = false;
    };
  }, []);

  const shareUrl =
    "https://aogimconectinhumas.site/#/devocional?utm_source=whatsapp&utm_medium=share";

  return (
    <main className="min-h-screen flex items-start justify-center px-4 pt-6 pb-10 animated-bg relative">
      <div className="absolute top-4 w-full flex justify-center">
        <img
          src={logoUrl}
          alt="AOGIM Conect"
          className="w-24 sm:w-28 md:w-32 lg:w-36 object-contain drop-shadow-[0_0_28px_rgba(255,255,255,0.32)]"
        />
      </div>

      <div className="absolute w-96 h-96 bg-blue-500/20 blur-3xl rounded-full top-20 -left-20" />
      <div className="absolute w-96 h-96 bg-cyan-400/15 blur-3xl rounded-full top-24 right-0" />
      <div className="absolute w-96 h-96 bg-purple-500/20 blur-3xl rounded-full bottom-10 -right-20" />

      <div className="relative w-full max-w-2xl mt-20 sm:mt-24">
        <div className="backdrop-blur-2xl bg-white/12 border border-white/30 rounded-3xl p-5 sm:p-8 shadow-[0_20px_70px_rgba(7,18,56,0.5)]">
          {loading && <p className="text-center text-white text-lg">Carregando devocional...</p>}

          {!loading && !data && (
            <p className="text-center text-white/90">
              Não consegui carregar o devocional agora. Tente novamente em instantes.
            </p>
          )}

          {data && (
            <>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 rounded-full bg-white/15 border border-white/25 text-[11px] uppercase tracking-[0.16em] text-white/85">
                  Devocional Diário
                </span>
                <span className="px-3 py-1 rounded-full bg-sky-300/15 border border-sky-100/30 text-[11px] uppercase tracking-[0.12em] text-sky-100">
                  {data.dateLabel || "Hoje"}
                </span>
              </div>

              <h1 className="mt-4 text-lg sm:text-xl font-semibold text-white text-center leading-snug">
                {data.title}
              </h1>

              <div className="mt-5 rounded-2xl bg-white/10 border border-white/20 p-4 sm:p-5 text-center">
                <p className="text-base sm:text-lg text-white leading-relaxed">“{data.verseText}”</p>
                <p className="mt-3 text-sm font-semibold text-white/85">{data.verseRef}</p>
              </div>

              <div className="mt-6 space-y-4 text-white/95 text-[15px] sm:text-base leading-7">
                {data.body
                  .split("\n")
                  .map((p) => p.trim())
                  .filter(Boolean)
                  .map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
              </div>

              <DevotionalShareActions
                data={data}
                shareUrl={shareUrl}
                buildShareText={buildShareText}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
