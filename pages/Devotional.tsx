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

  // Link do seu site (o WhatsApp vai usar o OG do index.html)
  const shareUrl =
    "https://aogimconectinhumas.site/#/devocional?utm_source=whatsapp&utm_medium=share";

  const compartilharWhatsApp = () => {
    if (!data) return;

    const emotionalLine = pickThemePhrase(data);

    const text = `${emotionalLine}

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
          alt="AOGIM Conect"
          className="w-40 sm:w-48 md:w-56 lg:w-64 object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.28)]"
        />
      </div>

      {/* Glow Effects */}
      <div className="absolute w-96 h-96 bg-blue-500/20 blur-3xl rounded-full top-20 -left-20" />
      <div className="absolute w-96 h-96 bg-purple-500/20 blur-3xl rounded-full bottom-10 -right-20" />

      <div className="relative w-full max-w-xl mt-32">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          {loading && (
            <p className="text-center text-white text-lg">Carregando devocional...</p>
          )}

          {!loading && !data && (
            <p className="text-center text-white/90">
              Não consegui carregar o devocional agora. Tente novamente em instantes.
            </p>
          )}

          {data && (
            <>
              <p className="text-sm uppercase tracking-widest text-white/70 text-center">
                Devocional do Dia {data.dateLabel ? `• ${data.dateLabel}` : ""}
              </p>

              <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-white text-center">
                {data.title}
              </h1>

              <div className="mt-8 text-center">
                <p className="text-lg sm:text-xl text-white leading-relaxed">
                  “{data.verseText}”
                </p>
                <p className="mt-3 text-sm font-semibold text-white/80">{data.verseRef}</p>
              </div>

              <div className="mt-8 space-y-4 text-white/90 text-base leading-relaxed">
                {data.body
                  .split("\n")
                  .map((p) => p.trim())
                  .filter(Boolean)
                  .map((p, i) => (
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