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

function normalizeText(s: string) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function hashStringToIndex(str: string, mod: number) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return mod === 0 ? 0 : h % mod;
}

function pickThemePhrase(dev: DevocionalData) {
  const text = normalizeText(`${dev.title} ${dev.verseText} ${dev.verseRef} ${dev.body}`);
  const themes: Array<{ name: string; test: (t: string) => boolean; phrases: string[] }> = [
    { name: "medo_ansiedade", test: (t) => /(medo|ansiedad|preocup|aflit|angusti|temor|panico|insegur|cansad)/.test(t), phrases: ["Se seu coração está pesado, leia isso com calma. Deus sustenta você.", "Talvez você esteja ansioso. Respire. Deus continua no controle.", "Quando o medo grita, a Palavra fala mais alto. Leia isso com fé."] },
    { name: "fe_confianca", test: (t) => /(fe|confi|crer|descans|entrega|espera|fidel|seguranc|ampar|sustent)/.test(t), phrases: ["Deus ainda fala hoje. Leia isso com o coração aberto.", "O que Deus prometeu, Ele sustenta. Leia e renove sua fé.", "Não é sobre sentir; é sobre confiar. Leia isso e descanse."] },
    { name: "perdao_reconciliacao", test: (t) => /(perd|magoa|ofens|reconcili|culpa|restaur|voltar)/.test(t), phrases: ["Talvez seja o dia de recomeçar. Leia isso e libere perdão.", "Deus cura o que a mágoa tentou destruir. Leia isso com sinceridade.", "O perdão abre portas que o orgulho fecha. Leia e seja livre."] },
    { name: "cura_consolo", test: (t) => /(cura|doenc|enferm|dor|luto|lagr|choro|consol|ferid)/.test(t), phrases: ["Se a dor apertou, não caminhe sozinho. Leia isso e receba consolo.", "Deus vê suas lágrimas. Leia isso com esperança.", "Há cura na presença de Deus. Leia isso com fé."] },
    { name: "familia_casamento", test: (t) => /(famil|casament|marid|espos|filh|pais|lar|casa)/.test(t), phrases: ["Que Deus fortaleça seu lar. Leia isso e ore pela sua família.", "Família é projeto de Deus. Leia isso com amor e propósito.", "Seja luz dentro de casa. Leia isso e ajuste o coração."] },
    { name: "proposito_chamado", test: (t) => /(proposit|chamad|missao|obra|servir|vocacao|dons|minister)/.test(t), phrases: ["Deus não te chamou à toa. Leia isso e alinhe seu propósito.", "Seu chamado não é acidente. Leia isso e siga firme.", "Há direção de Deus para você hoje. Leia com atenção."] },
    { name: "provisao_portas", test: (t) => /(provis|porta|empreg|trabalh|financ|necessid|milagr|sustento)/.test(t), phrases: ["Deus abre caminhos onde ninguém vê saída. Leia isso e confie.", "Sua provisão não depende do cenário. Leia isso com fé.", "Deus é fiel no sustento. Leia isso e descanse."] },
    { name: "coragem_guerra", test: (t) => /(corag|forca|luta|batalh|guerra|resist|persever|vencer)/.test(t), phrases: ["Se hoje foi difícil, não desista. Leia isso e se levante.", "Você não luta sozinho. Leia isso e tome coragem.", "Deus fortalece os cansados. Leia isso e continue."] },
  ];
  const fallbackPhrases = ["Deus tem uma palavra para você hoje. Leia com atenção.", "Leia isso com o coração aberto. Deus pode te surpreender.", "Uma palavra certa no tempo certo muda tudo. Leia com fé."];
  const theme = themes.find((th) => th.test(text));
  const base = theme ? theme.phrases : fallbackPhrases;
  return base[hashStringToIndex(`${todayKey()}|${dev.title}|${theme?.name ?? "fallback"}`, base.length)];
}

// ── Gerador de Story Instagram 1080×1920 ─────────────────────────────────────
function gerarStoryInstagram(data: DevocionalData): Promise<string> {
  return new Promise((resolve) => {
    const W = 1080, H = 1920;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Fundo
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#090e1d");
    bg.addColorStop(0.35, "#0d1430");
    bg.addColorStop(0.65, "#110a26");
    bg.addColorStop(1, "#080c18");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Grain
    ctx.save(); ctx.globalAlpha = 0.025;
    for (let i = 0; i < 8000; i++) {
      ctx.fillStyle = `hsl(${Math.random() * 60 + 200},50%,80%)`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
    }
    ctx.restore();

    // Glows
    const glows = [
      { x: 0.15, y: 0.1, r: 0.55, c: "rgba(79,105,210,0.2)" },
      { x: 0.85, y: 0.88, r: 0.6, c: "rgba(180,100,255,0.16)" },
      { x: 0.5, y: 0.5, r: 0.5, c: "rgba(100,130,255,0.07)" },
    ];
    glows.forEach(({ x, y, r, c }) => {
      const g = ctx.createRadialGradient(W * x, H * y, 0, W * x, H * y, W * r);
      g.addColorStop(0, c); g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    });

    const lineGrad = (x0: number, x1: number) => {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, "transparent"); g.addColorStop(0.5, "rgba(180,150,255,0.45)"); g.addColorStop(1, "transparent");
      return g;
    };

    const drawOrnamentLines = (y: number) => {
      ctx.save(); ctx.lineWidth = 1.5;
      ctx.strokeStyle = lineGrad(80, W - 80);
      ctx.beginPath(); ctx.moveTo(80, y); ctx.lineTo(W - 80, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(80, y + 10); ctx.lineTo(W - 80, y + 10); ctx.stroke();
      ctx.translate(W / 2, y + 5); ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = "rgba(180,150,255,0.4)";
      ctx.strokeRect(-10, -10, 20, 20);
      ctx.restore();
    };

    const wrapText = (text: string, maxW: number, font: string): string[] => {
      ctx.font = font;
      return text.split(" ").reduce((lines: string[], word) => {
        const last = lines[lines.length - 1] ?? "";
        const test = last ? `${last} ${word}` : word;
        if (ctx.measureText(test).width > maxW && last) return [...lines, word];
        return [...lines.slice(0, -1), test];
      }, [""]);
    };

    let y = 0;

    // ── TOPO: Ornamento + Ministério ──
    drawOrnamentLines(140);
    ctx.save();
    ctx.font = "300 30px Georgia, serif";
    ctx.fillStyle = "rgba(180,160,255,0.65)";
    ctx.textAlign = "center";
    ctx.fillText("AOGIM  CONECT  ·  MINISTÉRIO  IRLANDA", W / 2, 100);
    ctx.restore();

    // ── Tag ──
    y = 225;
    ctx.save();
    ctx.font = "700 24px sans-serif";
    ctx.fillStyle = "rgba(160,130,220,0.7)";
    ctx.textAlign = "center";
    ctx.fillText("D E V O C I O N A L   D O   D I A", W / 2, y);
    ctx.restore();

    // Data
    if (data.dateLabel) {
      y += 46;
      ctx.save();
      ctx.font = "italic 300 30px Georgia, serif";
      ctx.fillStyle = "rgba(200,185,255,0.5)";
      ctx.textAlign = "center";
      ctx.fillText(data.dateLabel, W / 2, y);
      ctx.restore();
    }

    // Linha separadora
    y += 50;
    ctx.save();
    ctx.strokeStyle = lineGrad(100, W - 100);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(100, y); ctx.lineTo(W - 100, y); ctx.stroke();
    ctx.restore();

    // ── Título ──
    y += 70;
    const titleLines = wrapText(data.title, W - 180, "600 80px Georgia, serif");
    ctx.save();
    ctx.font = "600 80px Georgia, serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    titleLines.forEach((line) => { ctx.fillText(line, W / 2, y); y += 100; });
    ctx.restore();
    y += 20;

    // ── Card do Verso (fundo) ──
    const cardPad = 60, cardX = 80, cardW = W - 160;
    const verseLines = wrapText(`"${data.verseText}"`, cardW - cardPad * 2, "italic 40px Georgia, serif");
    const cardH = verseLines.length * 58 + 160;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardX, y, cardW, cardH, 28);
    const cardBg = ctx.createLinearGradient(cardX, y, cardX + cardW, y + cardH);
    cardBg.addColorStop(0, "rgba(100,80,200,0.14)");
    cardBg.addColorStop(1, "rgba(160,80,220,0.08)");
    ctx.fillStyle = cardBg; ctx.fill();
    ctx.strokeStyle = "rgba(180,150,255,0.2)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();

    // Aspas decorativas
    ctx.save();
    ctx.font = "italic 160px Georgia, serif";
    ctx.fillStyle = "rgba(160,130,255,0.12)";
    ctx.fillText("\u201C", cardX + 20, y + 100);
    ctx.restore();

    // Verso
    let verseY = y + 80;
    ctx.save();
    ctx.font = "italic 40px Georgia, serif";
    ctx.fillStyle = "rgba(230,220,255,0.92)";
    ctx.textAlign = "center";
    verseLines.forEach((line) => { ctx.fillText(line, W / 2, verseY); verseY += 58; });
    ctx.restore();

    // Referência
    verseY += 16;
    ctx.save();
    ctx.strokeStyle = lineGrad(cardX + 60, cardX + cardW - 60);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cardX + 60, verseY); ctx.lineTo(cardX + cardW - 60, verseY); ctx.stroke();
    ctx.font = "700 36px Georgia, serif";
    ctx.fillStyle = "rgba(200,170,255,0.95)";
    ctx.textAlign = "center";
    ctx.fillText(`— ${data.verseRef}`, W / 2, verseY + 48);
    ctx.restore();
    y += cardH + 55;

    // ── Divisor ──
    ctx.save();
    ctx.strokeStyle = lineGrad(120, W - 120);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(120, y); ctx.lineTo(W - 120, y); ctx.stroke();
    ctx.font = "22px serif"; ctx.fillStyle = "rgba(180,150,255,0.55)"; ctx.textAlign = "center";
    ctx.fillText("✦", W / 2, y + 10);
    ctx.restore();
    y += 55;

    // ── Reflexão (1º parágrafo do body) ──
    const para = data.body.split("\n").map((p) => p.trim()).filter(Boolean)[0] ?? "";
    const excerpt = para.length > 220 ? para.substring(0, 217) + "…" : para;
    const bodyLines = wrapText(excerpt, W - 160, "400 36px Georgia, serif");
    if (bodyLines.length > 0 && y + bodyLines.length * 52 < H - 380) {
      ctx.save();
      ctx.font = "400 36px Georgia, serif";
      ctx.fillStyle = "rgba(200,190,230,0.75)";
      ctx.textAlign = "center";
      bodyLines.forEach((line) => { ctx.fillText(line, W / 2, y); y += 52; });
      ctx.restore();
      y += 20;
    }

    // ── Linha de leitura completa ──
    y = Math.max(y + 30, H - 320);
    ctx.save();
    ctx.font = "italic 300 28px Georgia, serif";
    ctx.fillStyle = "rgba(180,160,220,0.55)";
    ctx.textAlign = "center";
    ctx.fillText("Leia o devocional completo em:", W / 2, y);
    ctx.restore();
    y += 52;

    // Pill URL
    const pill = { w: 580, h: 68, r: 34 };
    const pillX = W / 2 - pill.w / 2;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pillX, y - pill.h + 14, pill.w, pill.h, pill.r);
    const pillGrad = ctx.createLinearGradient(pillX, 0, pillX + pill.w, 0);
    pillGrad.addColorStop(0, "rgba(90,70,190,0.6)");
    pillGrad.addColorStop(1, "rgba(150,70,210,0.6)");
    ctx.fillStyle = pillGrad; ctx.fill();
    ctx.strokeStyle = "rgba(200,170,255,0.3)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = "500 26px sans-serif";
    ctx.fillStyle = "rgba(230,220,255,0.9)"; ctx.textAlign = "center";
    ctx.fillText("aogimconectinhumas.site", W / 2, y + 6);
    ctx.restore();

    // ── Ornamento rodapé ──
    drawOrnamentLines(H - 140);
    ctx.save();
    ctx.font = "300 24px Georgia, serif";
    ctx.fillStyle = "rgba(160,150,200,0.45)";
    ctx.textAlign = "center";
    ctx.fillText("Assembleia de Deus • Humanitas", W / 2, H - 80);
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
  const [visivel, setVisivel] = useState(false);

  const bibleVersion = "acf";
  const cacheKey = useMemo(() => `devocional:${bibleVersion}:${todayKey()}`, []);

  const logoUrl =
    "https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png";

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) { setData(JSON.parse(cached)); setLoading(false); return; }
        const res = await fetch(`/.netlify/functions/devocional?b=${encodeURIComponent(bibleVersion)}`, { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" });
        const json = (await res.json()) as DevocionalData;
        if (!alive) return;
        setData(json);
        localStorage.setItem(cacheKey, JSON.stringify(json));
        setLoading(false);
      } catch { setLoading(false); }
    };
    load();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!loading) setTimeout(() => setVisivel(true), 60);
  }, [loading]);

  const shareUrl = "https://aogimconectinhumas.site/#/devocional?utm_source=whatsapp&utm_medium=share";

  const compartilharWhatsApp = () => {
    if (!data) return;
    const line = pickThemePhrase(data);
    const text = `${line}\n\n📖 ${data.title}\n\n"${data.verseText}"\n${data.verseRef}\n\nLeia completo:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleGerarImagem = async () => {
    if (!data) return;
    setGerandoImagem(true);
    try { setImagemGerada(await gerarStoryInstagram(data)); }
    finally { setGerandoImagem(false); }
  };

  const handleDownload = () => {
    if (!imagemGerada) return;
    const a = document.createElement("a");
    a.href = imagemGerada;
    a.download = `devocional-story-${todayKey()}.png`;
    a.click();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&display=swap');

        .dev-root { font-family: 'Lato', sans-serif; }
        .dev-serif { font-family: 'Playfair Display', Georgia, serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes devSpin { to { transform: rotate(360deg); } }
        @keyframes shimmerDot { 0%,100%{opacity:.3} 50%{opacity:.8} }

        .dev-fade { opacity: 0; animation: fadeUp 0.65s ease forwards; }
        .dev-d1 { animation-delay: 0.05s; }
        .dev-d2 { animation-delay: 0.18s; }
        .dev-d3 { animation-delay: 0.32s; }
        .dev-d4 { animation-delay: 0.48s; }
        .dev-d5 { animation-delay: 0.65s; }
        .dev-d6 { animation-delay: 0.82s; }

        .dev-ornament { height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(180,150,255,0.45) 30%, rgba(180,150,255,0.45) 70%, transparent 100%); }

        .dev-verse-card {
          background: linear-gradient(135deg, rgba(100,80,200,0.13) 0%, rgba(160,80,220,0.07) 100%);
          border: 1px solid rgba(180,150,255,0.18);
          border-radius: 20px;
          padding: 28px 24px;
          position: relative;
        }
        .dev-verse-card::before {
          content: '\u201C';
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 120px;
          color: rgba(160,130,255,0.1);
          position: absolute;
          top: -20px;
          left: 10px;
          line-height: 1;
          pointer-events: none;
        }

        .dev-body-p {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(15px, 4vw, 17px);
          line-height: 1.85;
          color: rgba(205,198,235,0.82);
        }
        .dev-body-p + .dev-body-p {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .dev-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 16px;
          padding: 15px 0;
          border: none;
          cursor: pointer;
          color: #fff;
          font-family: 'Lato', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.03em;
          transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
        }
        .dev-btn:hover { transform: translateY(-2px); }
        .dev-btn:active { transform: translateY(0); }
        .dev-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .dev-btn-wa {
          background: linear-gradient(135deg, #1a7a4a, #22a05a);
          box-shadow: 0 8px 32px rgba(20,120,60,0.32);
        }
        .dev-btn-wa:hover { box-shadow: 0 14px 40px rgba(20,120,60,0.42); }

        .dev-btn-ig {
          background: linear-gradient(135deg, #5830b4, #9d3db8, #c44080);
          box-shadow: 0 8px 32px rgba(140,50,160,0.32);
        }
        .dev-btn-ig:hover { box-shadow: 0 14px 40px rgba(140,50,160,0.45); }

        .dev-btn-dl {
          flex: 1;
          background: linear-gradient(135deg, #5830b4, #9d3db8, #c44080);
          box-shadow: 0 6px 24px rgba(140,50,160,0.28);
        }
        .dev-btn-secondary {
          padding: 15px 20px;
          border-radius: 14px;
          border: 1px solid rgba(180,150,255,0.2);
          background: rgba(255,255,255,0.05);
          color: rgba(200,190,240,0.8);
          font-family: 'Lato', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s;
        }
        .dev-btn-secondary:hover { background: rgba(255,255,255,0.09); }
      `}</style>

      <main
        className="dev-root"
        style={{
          minHeight: "100vh",
          position: "relative",
          overflowX: "hidden",
          background: "linear-gradient(155deg, #090e1d 0%, #0d1430 38%, #110a26 68%, #07090f 100%)",
        }}
      >
        {/* Glows fixos */}
        <div style={{ position: "fixed", top: "-8%", left: "-12%", width: "55vw", height: "55vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(70,90,210,0.14) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", bottom: "-8%", right: "-12%", width: "50vw", height: "50vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(160,80,220,0.11) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 24, paddingBottom: 8, position: "relative", zIndex: 1 }}>
          <img src={logoUrl} alt="AOGIM Conect" style={{ width: 90, objectFit: "contain", filter: "drop-shadow(0 0 18px rgba(255,255,255,0.22))" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 520, margin: "0 auto", padding: "0 16px 72px" }}>

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
              <div style={{ width: 34, height: 34, border: "2px solid rgba(180,150,255,0.18)", borderTopColor: "rgba(180,150,255,0.85)", borderRadius: "50%", animation: "devSpin 0.85s linear infinite" }} />
              <p style={{ color: "rgba(180,150,255,0.55)", fontSize: 13, letterSpacing: "0.1em" }}>Carregando devocional…</p>
            </div>
          )}

          {!loading && !data && (
            <p style={{ textAlign: "center", color: "rgba(200,190,240,0.65)", marginTop: 80, fontFamily: "Georgia, serif", fontSize: 16 }}>
              Não consegui carregar o devocional agora. Tente novamente em instantes.
            </p>
          )}

          {!loading && data && (
            <>
              {/* Cabeçalho */}
              <div className="dev-fade dev-d1" style={{ textAlign: "center", paddingTop: 4, paddingBottom: 20 }}>
                <p style={{ fontSize: 10, letterSpacing: "0.25em", color: "rgba(160,140,220,0.65)", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
                  ✦ &nbsp; Devocional do Dia &nbsp; ✦
                </p>
                {data.dateLabel && (
                  <p className="dev-serif" style={{ fontSize: 14, color: "rgba(180,160,240,0.5)", fontStyle: "italic" }}>{data.dateLabel}</p>
                )}
              </div>

              {/* Ornamento superior */}
              <div className="dev-ornament dev-fade dev-d1" />

              {/* Título */}
              <div className="dev-fade dev-d2" style={{ textAlign: "center", padding: "30px 4px 26px" }}>
                <h1 className="dev-serif" style={{ fontSize: "clamp(24px, 6.5vw, 32px)", fontWeight: 600, color: "#ffffff", lineHeight: 1.28, letterSpacing: "-0.01em", margin: 0 }}>
                  {data.title}
                </h1>
              </div>

              {/* Verso */}
              <div className="dev-verse-card dev-fade dev-d3" style={{ marginBottom: 28 }}>
                <p className="dev-serif" style={{ fontSize: "clamp(15px, 4.2vw, 18px)", color: "rgba(228,218,255,0.93)", lineHeight: 1.72, fontStyle: "italic", textAlign: "center", position: "relative", zIndex: 1 }}>
                  "{data.verseText}"
                </p>
                <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(180,150,255,0.18)" }} />
                  <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(190,160,255,0.9)", letterSpacing: "0.07em", margin: 0 }}>{data.verseRef}</p>
                  <div style={{ flex: 1, height: 1, background: "rgba(180,150,255,0.18)" }} />
                </div>
              </div>

              {/* Divisor */}
              <div className="dev-fade dev-d3" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(180,150,255,0.22))" }} />
                <span style={{ color: "rgba(180,150,255,0.45)", fontSize: 12 }}>✦</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(180,150,255,0.22), transparent)" }} />
              </div>

              {/* Corpo */}
              <div className="dev-fade dev-d4" style={{ marginBottom: 36 }}>
                {data.body.split("\n").map((p) => p.trim()).filter(Boolean).map((p, i) => (
                  <p key={i} className="dev-body-p">{p}</p>
                ))}
              </div>

              {/* Botões */}
              <div className="dev-fade dev-d5" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* WhatsApp */}
                <button className="dev-btn dev-btn-wa" onClick={compartilharWhatsApp}>
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20, flexShrink: 0 }}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.123 1.528 5.854L0 24l6.335-1.508A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 01-5.031-1.388l-.361-.214-3.741.981.999-3.648-.235-.374A9.794 9.794 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                  </svg>
                  Compartilhar no WhatsApp
                </button>

                {/* Instagram */}
                {!imagemGerada ? (
                  <button className="dev-btn dev-btn-ig" onClick={handleGerarImagem} disabled={gerandoImagem}>
                    {gerandoImagem ? (
                      <>
                        <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.28)", borderTopColor: "#fff", borderRadius: "50%", animation: "devSpin 0.85s linear infinite" }} />
                        Gerando Story…
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20, flexShrink: 0 }}>
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                          <circle cx="12" cy="12" r="5"/>
                          <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
                        </svg>
                        Criar Story para o Instagram
                      </>
                    )}
                  </button>
                ) : (
                  <div className="dev-fade dev-d6" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid rgba(180,150,255,0.18)", boxShadow: "0 16px 48px rgba(80,50,180,0.25)" }}>
                      <img src={imagemGerada} alt="Story Instagram" style={{ width: "100%", display: "block" }} />
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="dev-btn dev-btn-dl" onClick={handleDownload} style={{ flex: 1, borderRadius: 14, padding: "13px 0", border: "none", cursor: "pointer", color: "#fff", fontFamily: "'Lato', sans-serif", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
                          <path d="M12 3v12m0 0l-4-4m4 4l4-4M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Baixar Story
                      </button>
                      <button className="dev-btn-secondary" onClick={() => setImagemGerada(null)}>Refazer</button>
                    </div>
                    <p style={{ textAlign: "center", fontSize: 11, color: "rgba(180,160,220,0.42)", fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                      Compartilhe nos Stories ou Feed do Instagram
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}