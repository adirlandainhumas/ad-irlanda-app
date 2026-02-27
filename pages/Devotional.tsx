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
    { name: "perdao_reconciliacao", test: (t) => /(perd|magoa|ofens|reconcili|culpa|restaur|voltar)/.test(t), phrases: ["Talvez seja o dia de recomeçar. Leia isso e libere perdão.", "Deus cura o que a mágoa tentou destruir.", "O perdão abre portas que o orgulho fecha. Seja livre."] },
    { name: "cura_consolo", test: (t) => /(cura|doenc|enferm|dor|luto|lagr|choro|consol|ferid)/.test(t), phrases: ["Se a dor apertou, não caminhe sozinho. Há consolo aqui.", "Deus vê suas lágrimas. Leia isso com esperança.", "Há cura na presença de Deus. Leia isso com fé."] },
    { name: "familia_casamento", test: (t) => /(famil|casament|marid|espos|filh|pais|lar|casa)/.test(t), phrases: ["Que Deus fortaleça seu lar. Leia e ore pela sua família.", "Família é projeto de Deus. Leia com amor e propósito.", "Seja luz dentro de casa. Ajuste o coração."] },
    { name: "proposito_chamado", test: (t) => /(proposit|chamad|missao|obra|servir|vocacao|dons|minister)/.test(t), phrases: ["Deus não te chamou à toa. Alinhe seu propósito.", "Seu chamado não é acidente. Siga firme.", "Há direção de Deus para você hoje."] },
    { name: "provisao_portas", test: (t) => /(provis|porta|empreg|trabalh|financ|necessid|milagr|sustento)/.test(t), phrases: ["Deus abre caminhos onde ninguém vê saída.", "Sua provisão não depende do cenário. Confie.", "Deus é fiel no sustento."] },
    { name: "coragem_guerra", test: (t) => /(corag|forca|luta|batalh|guerra|resist|persever|vencer)/.test(t), phrases: ["Se hoje foi difícil, não desista. Se levante.", "Você não luta sozinho. Tome coragem.", "Deus fortalece os cansados. Continue."] },
  ];
  const fallback = ["Deus tem uma palavra para você hoje.", "Leia com o coração aberto. Deus pode te surpreender.", "Uma palavra certa no tempo certo muda tudo."];
  const theme = themes.find((th) => th.test(text));
  const base = theme ? theme.phrases : fallback;
  return base[hashStringToIndex(`${todayKey()}|${dev.title}|${theme?.name ?? "f"}`, base.length)];
}

// ─── Story Instagram 1080×1920 — Azul oceânico com waves ────────────────────
function gerarStory(data: DevocionalData): Promise<string> {
  return new Promise((resolve) => {
    const W = 1080, H = 1920;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d")!;

    // ── Fundo azul profundo ──
    const bg = ctx.createLinearGradient(0, 0, W * 0.6, H);
    bg.addColorStop(0, "#020d1f");
    bg.addColorStop(0.3, "#041428");
    bg.addColorStop(0.65, "#051c3a");
    bg.addColorStop(1, "#020b18");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── Glow azul lateral esquerdo ──
    const g1 = ctx.createRadialGradient(0, H * 0.35, 0, 0, H * 0.35, W * 0.8);
    g1.addColorStop(0, "rgba(30,100,220,0.22)");
    g1.addColorStop(0.5, "rgba(20,70,180,0.08)");
    g1.addColorStop(1, "transparent");
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

    // ── Glow ciano superior direito ──
    const g2 = ctx.createRadialGradient(W, H * 0.1, 0, W, H * 0.1, W * 0.7);
    g2.addColorStop(0, "rgba(0,180,255,0.15)");
    g2.addColorStop(1, "transparent");
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

    // ── Glow azul royal inferior ──
    const g3 = ctx.createRadialGradient(W * 0.3, H, 0, W * 0.3, H, W * 0.9);
    g3.addColorStop(0, "rgba(40,60,200,0.18)");
    g3.addColorStop(1, "transparent");
    ctx.fillStyle = g3; ctx.fillRect(0, 0, W, H);

    // ── WAVES — 3 camadas sinusoidais ──
    const drawWave = (
      offsetY: number,
      amplitude: number,
      frequency: number,
      phase: number,
      colorStart: string,
      colorEnd: string,
      alpha: number
    ) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) {
        const y = offsetY + Math.sin((x / W) * Math.PI * frequency + phase) * amplitude
                          + Math.sin((x / W) * Math.PI * (frequency * 1.7) + phase * 0.6) * (amplitude * 0.35);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      const wg = ctx.createLinearGradient(0, offsetY - amplitude, 0, H);
      wg.addColorStop(0, colorStart); wg.addColorStop(1, colorEnd);
      ctx.fillStyle = wg; ctx.fill();
      ctx.restore();
    };

    // Wave traseira (mais alta, mais suave)
    drawWave(H * 0.62, 90, 2.2, 0.4, "rgba(10,60,160,0.55)", "rgba(5,20,80,0.4)", 1);
    // Wave média
    drawWave(H * 0.70, 70, 2.8, 1.1, "rgba(15,80,200,0.5)", "rgba(5,25,100,0.5)", 1);
    // Wave frontal (mais baixa, mais nítida)
    drawWave(H * 0.78, 55, 3.4, 2.0, "rgba(0,120,255,0.35)", "rgba(0,40,120,0.55)", 1);

    // ── Brilho nas cristas das waves ──
    ctx.save();
    ctx.globalAlpha = 0.18;
    for (let layer = 0; layer < 3; layer++) {
      const params = [
        { oY: H * 0.62, amp: 90, freq: 2.2, ph: 0.4 },
        { oY: H * 0.70, amp: 70, freq: 2.8, ph: 1.1 },
        { oY: H * 0.78, amp: 55, freq: 3.4, ph: 2.0 },
      ][layer];
      ctx.beginPath();
      for (let x = 0; x <= W; x += 4) {
        const y = params.oY + Math.sin((x / W) * Math.PI * params.freq + params.ph) * params.amp;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(120,200,255,0.7)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();

    // ── Partículas de luz (estrelas no oceano) ──
    ctx.save();
    for (let i = 0; i < 80; i++) {
      const px = Math.random() * W;
      const py = Math.random() * H * 0.75;
      const pr = Math.random() * 1.8 + 0.3;
      ctx.globalAlpha = Math.random() * 0.5 + 0.1;
      ctx.fillStyle = `hsl(${200 + Math.random() * 40}, 80%, ${70 + Math.random() * 30}%)`;
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // ── Helpers de texto ──
    const wrap = (text: string, maxW: number, font: string): string[] => {
      ctx.font = font;
      return text.split(" ").reduce((lines: string[], word) => {
        const last = lines[lines.length - 1] ?? "";
        const test = last ? `${last} ${word}` : word;
        if (ctx.measureText(test).width > maxW && last) return [...lines, word];
        return [...lines.slice(0, -1), test];
      }, [""]).filter(Boolean);
    };

    const centerText = (text: string, y: number, font: string, color: string, alpha = 1) => {
      ctx.save(); ctx.globalAlpha = alpha; ctx.font = font; ctx.fillStyle = color; ctx.textAlign = "center";
      ctx.fillText(text, W / 2, y); ctx.restore();
    };

    // ── CONTEÚDO ──
    // Topo: linha fina decorativa
    ctx.save();
    const tl = ctx.createLinearGradient(120, 0, W - 120, 0);
    tl.addColorStop(0, "transparent"); tl.addColorStop(0.5, "rgba(80,160,255,0.5)"); tl.addColorStop(1, "transparent");
    ctx.strokeStyle = tl; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(120, 170); ctx.lineTo(W - 120, 170); ctx.stroke();
    ctx.restore();

    // Ministério
    centerText("AOGIM  CONECT", 130, "300 28px Georgia, serif", "rgba(100,180,255,0.65)");

    // Tag devocional
    centerText("DEVOCIONAL  DO  DIA", 230, "700 24px sans-serif", "rgba(80,160,255,0.6)");
    if (data.dateLabel) {
      centerText(data.dateLabel, 278, "italic 300 28px Georgia, serif", "rgba(120,190,255,0.45)");
    }

    // Linha separadora
    ctx.save();
    const sl = ctx.createLinearGradient(120, 0, W - 120, 0);
    sl.addColorStop(0, "transparent"); sl.addColorStop(0.5, "rgba(60,140,255,0.4)"); sl.addColorStop(1, "transparent");
    ctx.strokeStyle = sl; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(120, 320); ctx.lineTo(W - 120, 320); ctx.stroke();
    ctx.restore();

    // ── TÍTULO — grande, centralizado, serifado ──
    const titleLines = wrap(data.title, W - 160, "600 84px Georgia, serif");
    let ty = 430;
    ctx.save(); ctx.font = "600 84px Georgia, serif"; ctx.fillStyle = "#e8f4ff"; ctx.textAlign = "center";
    // Sombra suave
    ctx.shadowColor = "rgba(0,100,255,0.4)"; ctx.shadowBlur = 30;
    titleLines.forEach((line) => { ctx.fillText(line, W / 2, ty); ty += 108; });
    ctx.restore();
    ty += 30;

    // Ornamento entre título e verso
    centerText("✦", ty, "24px serif", "rgba(80,160,255,0.55)");
    ty += 55;

    // ── VERSO ──
    // Abertura de aspas grande
    ctx.save(); ctx.font = "italic 130px Georgia, serif"; ctx.fillStyle = "rgba(50,130,255,0.12)";
    ctx.textAlign = "left"; ctx.fillText("\u201C", 90, ty + 20); ctx.restore();

    const verseLines = wrap(`"${data.verseText}"`, W - 200, "italic 42px Georgia, serif");
    ctx.save(); ctx.font = "italic 42px Georgia, serif"; ctx.fillStyle = "rgba(200,230,255,0.93)"; ctx.textAlign = "center";
    verseLines.forEach((line) => { ctx.fillText(line, W / 2, ty); ty += 62; });
    ctx.restore();
    ty += 20;

    // Referência
    ctx.save();
    const rl = ctx.createLinearGradient(W / 2 - 180, 0, W / 2 + 180, 0);
    rl.addColorStop(0, "transparent"); rl.addColorStop(0.5, "rgba(80,160,255,0.35)"); rl.addColorStop(1, "transparent");
    ctx.strokeStyle = rl; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W / 2 - 180, ty); ctx.lineTo(W / 2 + 180, ty); ctx.stroke();
    ctx.restore();
    ty += 52;

    ctx.save(); ctx.font = "600 38px Georgia, serif"; ctx.fillStyle = "rgba(100,190,255,0.9)"; ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,120,255,0.3)"; ctx.shadowBlur = 15;
    ctx.fillText(data.verseRef, W / 2, ty); ctx.restore();

    // ── RODAPÉ — #AOGIM ──
    // Linha antes do rodapé
    const footerY = H - 160;
    ctx.save();
    const fl = ctx.createLinearGradient(100, 0, W - 100, 0);
    fl.addColorStop(0, "transparent"); fl.addColorStop(0.5, "rgba(60,130,255,0.3)"); fl.addColorStop(1, "transparent");
    ctx.strokeStyle = fl; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(100, footerY - 40); ctx.lineTo(W - 100, footerY - 40); ctx.stroke();
    ctx.restore();

    // #AOGIM grande e luminoso
    ctx.save();
    ctx.font = "700 52px Georgia, serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,140,255,0.6)"; ctx.shadowBlur = 24;
    const hg = ctx.createLinearGradient(W / 2 - 150, 0, W / 2 + 150, 0);
    hg.addColorStop(0, "#60b8ff"); hg.addColorStop(0.5, "#a0d8ff"); hg.addColorStop(1, "#60b8ff");
    ctx.fillStyle = hg;
    ctx.fillText("#AOGIM", W / 2, footerY + 20);
    ctx.restore();

    resolve(c.toDataURL("image/png"));
  });
}

// ─── Componente ──────────────────────────────────────────────────────────────
export default function Devotional() {
  const [data, setData] = useState<DevocionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [gerandoImagem, setGerandoImagem] = useState(false);
  const [imagemGerada, setImagemGerada] = useState<string | null>(null);

  const bibleVersion = "acf";
  const cacheKey = useMemo(() => `devocional:${bibleVersion}:${todayKey()}`, []);
  const logoUrl = "https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png";

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) { setData(JSON.parse(cached)); setLoading(false); return; }
        const res = await fetch(`/.netlify/functions/devocional?b=${encodeURIComponent(bibleVersion)}`, { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" });
        const json = (await res.json()) as DevocionalData;
        if (!alive) return;
        setData(json);
        localStorage.setItem(cacheKey, JSON.stringify(json));
      } catch {}
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const shareUrl = "https://aogimconectinhumas.site/#/devocional?utm_source=whatsapp&utm_medium=share";

  const compartilharWhatsApp = () => {
    if (!data) return;
    const line = pickThemePhrase(data);
    const text = `${line}\n\n📖 *${data.title}*\n\n_"${data.verseText}"_\n*${data.verseRef}*\n\nLeia o devocional completo:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleGerarImagem = async () => {
    if (!data) return;
    setGerandoImagem(true);
    try { setImagemGerada(await gerarStory(data)); }
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

        * { box-sizing: border-box; }

        .dv-root {
          font-family: 'Lato', sans-serif;
          min-height: 100vh;
          background: linear-gradient(155deg, #080d1c 0%, #0a1228 40%, #0d0920 70%, #060709 100%);
          position: relative;
          overflow-x: hidden;
        }

        .dv-serif { font-family: 'Playfair Display', Georgia, serif; }

        /* Glows de fundo */
        .dv-glow-a {
          position: fixed; pointer-events: none; z-index: 0;
          top: -10%; left: -15%; width: 60vw; height: 60vw; border-radius: 50%;
          background: radial-gradient(circle, rgba(30,90,210,0.13) 0%, transparent 70%);
        }
        .dv-glow-b {
          position: fixed; pointer-events: none; z-index: 0;
          bottom: -10%; right: -10%; width: 50vw; height: 50vw; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,140,255,0.1) 0%, transparent 70%);
        }

        /* Animações */
        @keyframes dvFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dvSpin { to { transform: rotate(360deg); } }
        @keyframes dvPulse { 0%,100%{opacity:.5} 50%{opacity:1} }

        .dv-in { opacity: 0; animation: dvFadeUp 0.6s ease forwards; }
        .dv-in-1 { animation-delay: 0.05s; }
        .dv-in-2 { animation-delay: 0.18s; }
        .dv-in-3 { animation-delay: 0.32s; }
        .dv-in-4 { animation-delay: 0.48s; }
        .dv-in-5 { animation-delay: 0.64s; }
        .dv-in-6 { animation-delay: 0.80s; }

        /* Card do verso */
        .dv-verse {
          border-radius: 20px;
          padding: 28px 22px 22px;
          background: linear-gradient(135deg, rgba(20,70,180,0.14), rgba(0,100,220,0.07));
          border: 1px solid rgba(60,140,255,0.18);
          position: relative;
          overflow: hidden;
        }
        .dv-verse::before {
          content: '\u201C';
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 110px;
          color: rgba(40,120,255,0.1);
          position: absolute;
          top: -12px; left: 8px;
          line-height: 1;
          pointer-events: none;
        }

        /* Divisor */
        .dv-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(60,140,255,0.3), transparent);
        }

        /* Parágrafo do corpo */
        .dv-para {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(15px, 4.2vw, 17.5px);
          line-height: 1.9;
          color: rgba(200,215,240,0.82);
          margin: 0;
        }
        .dv-para + .dv-para {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid rgba(60,140,255,0.1);
        }

        /* Botões */
        .dv-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
          border: none; border-radius: 16px; padding: 15px 0; cursor: pointer;
          font-family: 'Lato', sans-serif; font-size: 15px; font-weight: 700;
          letter-spacing: 0.03em; color: #fff;
          transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s;
        }
        .dv-btn:hover  { transform: translateY(-2px); }
        .dv-btn:active { transform: translateY(1px); }
        .dv-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .dv-btn-wa {
          background: linear-gradient(130deg, #158a4a, #1db860);
          box-shadow: 0 6px 28px rgba(15,140,60,0.3);
        }
        .dv-btn-wa:hover { box-shadow: 0 10px 36px rgba(15,140,60,0.42); }

        .dv-btn-ig {
          background: linear-gradient(130deg, #1040b0, #0080e0, #00aaff);
          box-shadow: 0 6px 28px rgba(0,100,220,0.3);
        }
        .dv-btn-ig:hover { box-shadow: 0 10px 36px rgba(0,100,220,0.45); }

        .dv-btn-dl {
          flex: 1; border: none; border-radius: 14px; padding: 13px 0; cursor: pointer;
          font-family: 'Lato', sans-serif; font-size: 14px; font-weight: 700; color: #fff;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(130deg, #1040b0, #0080e0, #00aaff);
          box-shadow: 0 6px 24px rgba(0,100,220,0.28);
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .dv-btn-dl:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(0,100,220,0.4); }

        .dv-btn-sec {
          padding: 13px 18px; border-radius: 14px; cursor: pointer; font-size: 13px; font-weight: 600;
          font-family: 'Lato', sans-serif; color: rgba(160,200,255,0.75);
          border: 1px solid rgba(60,140,255,0.18); background: rgba(30,80,180,0.08);
          transition: background 0.18s;
        }
        .dv-btn-sec:hover { background: rgba(30,80,180,0.15); }

        /* Preview da imagem */
        .dv-preview {
          border-radius: 16px; overflow: hidden;
          border: 1px solid rgba(60,140,255,0.2);
          box-shadow: 0 16px 48px rgba(0,80,200,0.22);
        }
      `}</style>

      <main className="dv-root">
        <div className="dv-glow-a" />
        <div className="dv-glow-b" />

        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 24, paddingBottom: 4, position: "relative", zIndex: 1 }}>
          <img src={logoUrl} alt="AOGIM Conect" style={{ width: 88, objectFit: "contain", filter: "drop-shadow(0 0 16px rgba(80,160,255,0.28))" }} />
        </div>

        {/* Conteúdo */}
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 540, margin: "0 auto", padding: "0 16px 80px" }}>

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "65vh", gap: 16 }}>
              <div style={{ width: 32, height: 32, border: "2px solid rgba(60,140,255,0.18)", borderTopColor: "rgba(80,180,255,0.85)", borderRadius: "50%", animation: "dvSpin 0.85s linear infinite" }} />
              <p style={{ color: "rgba(80,160,255,0.55)", fontSize: 13, letterSpacing: "0.1em", fontFamily: "Georgia, serif" }}>Carregando…</p>
            </div>
          )}

          {!loading && !data && (
            <p className="dv-serif" style={{ textAlign: "center", color: "rgba(150,190,255,0.6)", marginTop: 80, fontSize: 16 }}>
              Não consegui carregar o devocional agora. Tente novamente em instantes.
            </p>
          )}

          {!loading && data && (
            <>
              {/* Cabeçalho */}
              <div className="dv-in dv-in-1" style={{ textAlign: "center", paddingTop: 8, paddingBottom: 18 }}>
                <span style={{ fontSize: 10, letterSpacing: "0.24em", color: "rgba(80,160,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                  ✦ &nbsp;Devocional do Dia&nbsp; ✦
                </span>
                {data.dateLabel && (
                  <p className="dv-serif" style={{ fontSize: 13, color: "rgba(100,180,255,0.45)", fontStyle: "italic", margin: "5px 0 0" }}>
                    {data.dateLabel}
                  </p>
                )}
              </div>

              {/* Ornamento */}
              <div className="dv-divider dv-in dv-in-1" />

              {/* Título */}
              <div className="dv-in dv-in-2" style={{ textAlign: "center", padding: "28px 4px 24px" }}>
                <h1 className="dv-serif" style={{ margin: 0, fontSize: "clamp(23px, 6.2vw, 30px)", fontWeight: 600, color: "#ddeeff", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                  {data.title}
                </h1>
              </div>

              {/* Card do verso */}
              <div className="dv-verse dv-in dv-in-3" style={{ marginBottom: 26 }}>
                <p className="dv-serif" style={{ fontSize: "clamp(15px, 4.3vw, 18px)", color: "rgba(210,230,255,0.93)", lineHeight: 1.72, fontStyle: "italic", textAlign: "center", position: "relative", zIndex: 1, margin: 0 }}>
                  "{data.verseText}"
                </p>
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(60,140,255,0.18)" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(80,180,255,0.9)", letterSpacing: "0.07em" }}>{data.verseRef}</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(60,140,255,0.18)" }} />
                </div>
              </div>

              {/* Divisor */}
              <div className="dv-in dv-in-3" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(60,140,255,0.2))" }} />
                <span style={{ color: "rgba(60,140,255,0.45)", fontSize: 11 }}>✦</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(60,140,255,0.2), transparent)" }} />
              </div>

              {/* Corpo — todos os parágrafos, sem corte */}
              <div className="dv-in dv-in-4" style={{ marginBottom: 40 }}>
                {data.body
                  .split("\n")
                  .map((p) => p.trim())
                  .filter(Boolean)
                  .map((p, i) => (
                    <p key={i} className="dv-para">{p}</p>
                  ))}
              </div>

              {/* Seção de compartilhar */}
              <div className="dv-in dv-in-5" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* WhatsApp */}
                <button className="dv-btn dv-btn-wa" onClick={compartilharWhatsApp}>
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20, flexShrink: 0 }}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.123 1.528 5.854L0 24l6.335-1.508A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 01-5.031-1.388l-.361-.214-3.741.981.999-3.648-.235-.374A9.794 9.794 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                  </svg>
                  Compartilhar no WhatsApp
                </button>

                {/* Story Instagram */}
                {!imagemGerada ? (
                  <button className="dv-btn dv-btn-ig" onClick={handleGerarImagem} disabled={gerandoImagem}>
                    {gerandoImagem ? (
                      <>
                        <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%", animation: "dvSpin 0.85s linear infinite" }} />
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
                  <div className="dv-in dv-in-6" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="dv-preview">
                      <img src={imagemGerada} alt="Story" style={{ width: "100%", display: "block" }} />
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="dv-btn-dl" onClick={handleDownload}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 15, height: 15 }}>
                          <path d="M12 3v12m0 0l-4-4m4 4l4-4M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Baixar Story
                      </button>
                      <button className="dv-btn-sec" onClick={() => setImagemGerada(null)}>Refazer</button>
                    </div>
                    <p className="dv-serif" style={{ textAlign: "center", fontSize: 11, color: "rgba(80,160,255,0.4)", fontStyle: "italic" }}>
                      Pronto para compartilhar nos Stories do Instagram
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