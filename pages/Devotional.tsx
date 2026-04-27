import React, { useEffect, useState } from "react";

type DevocionalData = {
  ok?: boolean;
  dateLabel: string;
  title: string;
  verseText: string;
  verseRef: string;
  body: string;
  prayer: string;
  source?: string;
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// Story 1080x1920 — Warm Ivory Editorial
function gerarStory(data: DevocionalData): Promise<string> {
  return new Promise((resolve) => {
    const W = 1080, H = 1920;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d")!;

    // 1. Background: gradiente creme quente — limpo, sem blobs
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0,   "#FCF8F0");
    bg.addColorStop(0.5, "#F5EDD8");
    bg.addColorStop(1,   "#EDE0C0");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Brilho suave centralizado no topo (unico, sem manchas laterais)
    const topGlow = ctx.createRadialGradient(W/2, 0, 0, W/2, 0, W*0.60);
    topGlow.addColorStop(0, "rgba(205,150,38,0.14)");
    topGlow.addColorStop(1, "transparent");
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, W, H);

    // Helpers
    const wrapText = (text: string, maxW: number, font: string) => {
      ctx.font = font;
      return text.split(" ").reduce((lines: string[], word) => {
        const last = lines[lines.length - 1] ?? "";
        const test = last ? `${last} ${word}` : word;
        if (ctx.measureText(test).width > maxW && last) return [...lines, word];
        return [...lines.slice(0, -1), test];
      }, [""]).filter(Boolean);
    };

    const ct = (text: string, y: number, font: string, color: string, alpha = 1) => {
      ctx.save(); ctx.globalAlpha = alpha; ctx.font = font;
      ctx.fillStyle = color; ctx.textAlign = "center";
      ctx.fillText(text, W / 2, y); ctx.restore();
    };

    const hLine = (y: number, alpha: number, w = W * 0.52) => {
      const x0 = (W - w) / 2;
      const g = ctx.createLinearGradient(x0, y, x0 + w, y);
      g.addColorStop(0, "transparent");
      g.addColorStop(0.2,  `rgba(165,115,16,${alpha})`);
      g.addColorStop(0.8,  `rgba(165,115,16,${alpha})`);
      g.addColorStop(1, "transparent");
      ctx.save(); ctx.fillStyle = g; ctx.fillRect(x0, y - 0.9, w, 1.8); ctx.restore();
    };

    const drawCross = (cx: number, cy: number, arm = 34) => {
      ctx.save();
      ctx.shadowColor = "rgba(150,105,10,0.28)";
      ctx.shadowBlur  = 16;
      ctx.strokeStyle = "#9A6E10";
      ctx.lineWidth   = 2.5;
      ctx.lineCap     = "round";
      ctx.beginPath();
      ctx.moveTo(cx,              cy - arm);
      ctx.lineTo(cx,              cy + arm);
      ctx.moveTo(cx - arm * 0.58, cy - arm * 0.16);
      ctx.lineTo(cx + arm * 0.58, cy - arm * 0.16);
      ctx.stroke();
      ctx.restore();
    };

    // 2. Barras de acento topo/base
    const bar = ctx.createLinearGradient(0, 0, W, 0);
    bar.addColorStop(0,    "transparent");
    bar.addColorStop(0.15, "rgba(155,108,14,0.78)");
    bar.addColorStop(0.85, "rgba(155,108,14,0.78)");
    bar.addColorStop(1,    "transparent");
    ctx.fillStyle = bar; ctx.fillRect(0, 0, W, 4);

    // 3. Cruz decorativa
    drawCross(W / 2, 204, 34);

    // 4. Cabecalho
    let cy = 308;
    hLine(cy, 0.30, W * 0.40); cy += 58;
    ct("MINISTERIO IRLANDA", cy, "400 24px Georgia,serif", "#2C1E08", 0.46);
    cy += 48;
    ct("DEVOCIONAL  DO  DIA", cy, "bold 21px sans-serif", "#9A6E10", 0.84);
    cy += 44;
    ct(data.dateLabel, cy, "italic 400 23px Georgia,serif", "#2C1E08", 0.34);
    cy += 68;
    hLine(cy, 0.30); cy += 80;

    // 5. Titulo — hero typography
    if (data.title) {
      const tFont  = "bold 82px Georgia,serif";
      const tLines = wrapText(data.title, W - 160, tFont);
      ctx.save(); ctx.font = tFont; ctx.fillStyle = "#1A1008"; ctx.textAlign = "center";
      tLines.forEach(l => { ctx.fillText(l, W / 2, cy); cy += 98; });
      ctx.restore(); cy += 24;
    }
    hLine(cy, 0.20, W * 0.28); cy += 74;

    // 6. Versiculo
    const vFont  = "italic 400 44px Georgia,serif";
    const vLines = wrapText(`"${data.verseText}"`, W - 210, vFont);
    ctx.save(); ctx.font = vFont; ctx.fillStyle = "#3A2A14";
    ctx.globalAlpha = 0.88; ctx.textAlign = "center";
    vLines.forEach(l => { ctx.fillText(l, W / 2, cy); cy += 64; });
    ctx.restore(); cy += 18;

    ct(data.verseRef, cy, "bold 32px Georgia,serif", "#8B6208"); cy += 64;
    hLine(cy, 0.26); cy += 66;

    // 7. Corpo — reflexao breve
    const shortBody = data.body.length > 310
      ? data.body.slice(0, 310).replace(/\s\w+$/, "") + "..."
      : data.body;
    const bLines = wrapText(shortBody, W - 230, "400 36px Georgia,serif");
    ctx.save(); ctx.font = "400 36px Georgia,serif";
    ctx.fillStyle = "#4A3820"; ctx.globalAlpha = 0.65; ctx.textAlign = "center";
    bLines.slice(0, 7).forEach(l => { ctx.fillText(l, W / 2, cy); cy += 54; });
    ctx.restore();

    // 8. Rodape
    hLine(H - 202, 0.26);
    ctx.save(); ctx.font = "bold 54px Georgia,serif"; ctx.textAlign = "center";
    ctx.fillStyle = "#9A6E10";
    ctx.fillText("#AOGIM", W / 2, H - 122); ctx.restore();

    ctx.fillStyle = bar; ctx.fillRect(0, H - 4, W, 4);

    resolve(cv.toDataURL("image/png"));
  });
}

// Componente
export default function Devotional() {
  const [data, setData]                     = useState<DevocionalData|null>(null);
  const [loading, setLoading]               = useState(true);
  const [gerandoImg, setGerandoImg]         = useState(false);
  const [compartilhando, setCompartilhando] = useState(false);
  const [imgGerada, setImgGerada]           = useState<string|null>(null);
  const [expandedBody, setExpandedBody]     = useState(false);
  const [expandedPrayer, setExpandedPrayer] = useState(false);

  const cacheKey = `devocional:bibliaon:${todayKey()}`;
  const logoUrl  = "https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png";
  const shareUrl = "https://aogimconectinhumas.site/#/devocional";

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) { setData(JSON.parse(cached)); setLoading(false); return; }
        const res  = await fetch("/.netlify/functions/devocional", { cache: "no-store" });
        const json = await res.json() as DevocionalData;
        if (!alive) return;
        setData(json);
        localStorage.setItem(cacheKey, JSON.stringify(json));
      } catch {}
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const compartilharWA = () => {
    if (!data) return;
    const text = `📖 *${data.title}*\n\n_"${data.verseText}"_\n*${data.verseRef}*\n\n${data.body.slice(0, 200)}…\n\n🙏 Leia o devocional completo:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleGerarImg = async () => {
    if (!data) return;
    setGerandoImg(true);
    try { setImgGerada(await gerarStory(data)); }
    finally { setGerandoImg(false); }
  };

  const handleDownload = () => {
    if (!imgGerada) return;
    const a = document.createElement("a");
    a.href = imgGerada; a.download = `devocional-story-${todayKey()}.png`; a.click();
  };

  const handleShareStory = async () => {
    if (!imgGerada) return;
    setCompartilhando(true);
    try {
      const blob = await (await fetch(imgGerada)).blob();
      const file = new File([blob], `devocional-${todayKey()}.png`, { type: "image/png" });
      const nav  = navigator as any;
      if (nav.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
        await nav.share({ files: [file], title: "Devocional do dia" });
        return;
      }
      handleDownload();
      window.open("https://www.instagram.com/", "_blank");
    } catch { handleDownload(); }
    finally { setCompartilhando(false); }
  };

  const preview = (text: string, wordLimit = 36) => {
    const words = text.split(" ");
    if (words.length <= wordLimit) return { short: text, truncated: false };
    return { short: words.slice(0, wordLimit).join(" ") + "…", truncated: true };
  };

  return (
    <>
      <style>{`
        @keyframes dvFadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes dvSpin   { to { transform:rotate(360deg) } }

        .dv-root { font-family:'Lato',sans-serif; min-height:100vh; background:#F8F7F4; }

        .dv-top-accent {
          height:3px;
          background:linear-gradient(90deg,transparent,#C49A22 18%,#E8B84B 50%,#C49A22 82%,transparent);
        }

        .dv-in { opacity:0; animation:dvFadeUp .42s cubic-bezier(.22,.61,.36,1) forwards; }
        .dv-in-1 { animation-delay:.06s }
        .dv-in-2 { animation-delay:.16s }
        .dv-in-3 { animation-delay:.28s }
        .dv-in-4 { animation-delay:.42s }

        .dv-verse-card {
          border-radius:20px; padding:30px 24px 26px;
          background:linear-gradient(135deg,rgba(251,235,150,0.22) 0%,rgba(255,252,238,0.10) 100%);
          border:1px solid rgba(196,148,20,0.16);
          text-align:center; margin-bottom:16px;
        }
        .dv-verse-text {
          font-family:'Playfair Display',Georgia,serif;
          font-size:clamp(15px,4.6vw,19px); font-style:italic;
          line-height:1.80; color:#574A3E; margin:0 0 20px;
        }
        .dv-verse-ref-row { display:flex; align-items:center; gap:12px; }
        .dv-verse-line    { flex:1; height:1px; background:rgba(180,128,18,0.22); }
        .dv-verse-ref-txt { font-size:11px; font-weight:700; letter-spacing:.08em; color:#9A6D10; white-space:nowrap; }

        .dv-card {
          border-radius:16px; background:#FFFFFF;
          border:1px solid rgba(0,0,0,0.06); overflow:hidden;
          box-shadow:0 1px 3px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.03);
          margin-bottom:10px;
        }
        .dv-card-hdr {
          display:flex; align-items:center; justify-content:space-between;
          padding:13px 18px; border:none; width:100%; background:transparent;
          cursor:pointer; user-select:none;
          border-bottom:1px solid rgba(0,0,0,0.05); transition:background .15s;
        }
        .dv-card-hdr:hover { background:rgba(26,63,187,0.03); }
        .dv-card-label {
          font-size:10px; font-weight:700; letter-spacing:.20em;
          text-transform:uppercase; color:#9E958E;
          display:flex; align-items:center; gap:8px;
        }
        .dv-card-chev      { font-size:10px; color:#9E958E; transition:transform .22s; }
        .dv-card-chev-open { transform:rotate(180deg); }
        .dv-card-body { padding:17px 20px 20px; }
        .dv-card-text {
          font-family:'Playfair Display',Georgia,serif;
          font-size:clamp(14px,4vw,16px); line-height:1.85; color:#5B5249; margin:0;
        }
        .dv-read-more {
          background:none; border:none; cursor:pointer; font-size:12px;
          font-weight:700; color:#1A3FBB; padding:8px 0 0; display:block;
          font-family:'Lato',sans-serif;
        }

        .dv-divider { height:1px; background:linear-gradient(90deg,transparent,rgba(0,0,0,0.07),transparent); margin-bottom:24px; }

        .dv-btn {
          width:100%; display:flex; align-items:center; justify-content:center; gap:10px;
          border:none; border-radius:14px; padding:15px 0; cursor:pointer;
          font-family:'Lato',sans-serif; font-size:15px; font-weight:700; color:#fff;
          transition:opacity .18s,transform .18s;
        }
        .dv-btn:hover    { opacity:.9; transform:translateY(-1px); }
        .dv-btn:active   { transform:none; }
        .dv-btn:disabled { opacity:.45; cursor:not-allowed; transform:none; }
        .dv-btn-wa { background:#1E40AF; }
        .dv-btn-wa:hover { background:#1D4ED8; opacity:1; }
        .dv-btn-ig { background:linear-gradient(130deg,#1040b0,#0070d0,#00aaff); }

        .dv-btn-sm {
          flex:1; border:none; border-radius:12px; padding:13px 0; cursor:pointer;
          font-family:'Lato',sans-serif; font-size:13px; font-weight:700; color:#fff;
          display:flex; align-items:center; justify-content:center; gap:7px; transition:opacity .18s;
        }
        .dv-btn-sm:hover { opacity:.9; }
        .dv-btn-outline {
          padding:12px 16px; border-radius:12px; cursor:pointer; font-size:12px;
          font-weight:700; font-family:'Lato',sans-serif; color:#605950;
          border:1px solid rgba(0,0,0,0.09); background:transparent;
          transition:border-color .18s,color .18s;
        }
        .dv-btn-outline:hover { border-color:#9E958E; color:#17130E; }

        .dv-preview {
          border-radius:16px; overflow:hidden;
          border:1px solid rgba(0,0,0,0.07);
          box-shadow:0 8px 28px rgba(0,0,0,0.14);
        }
      `}</style>

      <div className="dv-top-accent" />
      <main className="dv-root">

        <div style={{ display:"flex", justifyContent:"center", paddingTop:20, paddingBottom:2 }}>
          <img src={logoUrl} alt="AOGIM Conect" style={{ width:66, objectFit:"contain" }} />
        </div>

        <div style={{ width:"100%", maxWidth:500, margin:"0 auto", padding:"0 18px 80px" }}>

          {loading && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"65vh", gap:16 }}>
              <div style={{ width:26, height:26, border:"2.5px solid rgba(0,0,0,0.08)", borderTopColor:"#1E40AF", borderRadius:"50%", animation:"dvSpin .85s linear infinite" }} />
              <p style={{ color:"#9E958E", fontSize:13, letterSpacing:".10em", fontFamily:"Georgia,serif", fontStyle:"italic" }}>Carregando…</p>
            </div>
          )}

          {!loading && !data && (
            <p style={{ textAlign:"center", color:"#9E958E", marginTop:80, fontSize:15, fontFamily:"Georgia,serif", fontStyle:"italic" }}>
              Não consegui carregar o devocional agora. Tente novamente em instantes.
            </p>
          )}

          {!loading && data && (
            <>
              <div className="dv-in dv-in-1" style={{ textAlign:"center", paddingTop:10, paddingBottom:22 }}>
                <span style={{ fontSize:10, letterSpacing:".24em", color:"#1A3FBB", textTransform:"uppercase", fontWeight:700 }}>
                  Devocional do Dia
                </span>
                {data.dateLabel && (
                  <p style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:14, color:"#9E958E", fontStyle:"italic", margin:"6px 0 4px" }}>
                    {data.dateLabel}
                  </p>
                )}
                {data.title && (
                  <h1 style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:"clamp(21px,5.8vw,27px)", fontWeight:700, color:"#17130E", margin:"10px 0 0", lineHeight:1.22 }}>
                    {data.title}
                  </h1>
                )}
              </div>

              <div className="dv-divider dv-in dv-in-1" />

              <div className="dv-verse-card dv-in dv-in-2">
                <p className="dv-verse-text">"{data.verseText}"</p>
                <div className="dv-verse-ref-row">
                  <span className="dv-verse-line" />
                  <span className="dv-verse-ref-txt">{data.verseRef}</span>
                  <span className="dv-verse-line" />
                </div>
              </div>

              <div className="dv-card dv-in dv-in-3">
                <button className="dv-card-hdr" onClick={() => setExpandedBody(v => !v)}>
                  <span className="dv-card-label">
                    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width:11, height:11 }}>
                      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 12.5a5.5 5.5 0 110-11 5.5 5.5 0 010 11zm.75-8.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.25 7a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0V7z"/>
                    </svg>
                    Reflexão
                  </span>
                  <span className={`dv-card-chev${expandedBody ? " dv-card-chev-open" : ""}`}>▼</span>
                </button>
                <div className="dv-card-body">
                  <p className="dv-card-text">
                    {expandedBody ? data.body : preview(data.body).short}
                  </p>
                  {preview(data.body).truncated && (
                    <button className="dv-read-more" onClick={() => setExpandedBody(v => !v)}>
                      {expandedBody ? "← Menos" : "Ler tudo →"}
                    </button>
                  )}
                </div>
              </div>

              <div className="dv-card dv-in dv-in-3" style={{ marginBottom:28 }}>
                <button className="dv-card-hdr" onClick={() => setExpandedPrayer(v => !v)}>
                  <span className="dv-card-label">
                    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width:11, height:11 }}>
                      <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14.5C4.41 14.5 1.5 11.59 1.5 8S4.41 1.5 8 1.5 14.5 4.41 14.5 8 11.59 14.5 8 14.5zm.75-5.25v3.5a.75.75 0 01-1.5 0v-3.5a.75.75 0 011.5 0zM8 5.5a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
                    </svg>
                    Oração
                  </span>
                  <span className={`dv-card-chev${expandedPrayer ? " dv-card-chev-open" : ""}`}>▼</span>
                </button>
                <div className="dv-card-body">
                  <p className="dv-card-text" style={{ fontStyle:"italic" }}>
                    {expandedPrayer ? data.prayer : preview(data.prayer, 24).short}
                  </p>
                  {preview(data.prayer, 24).truncated && (
                    <button className="dv-read-more" onClick={() => setExpandedPrayer(v => !v)}>
                      {expandedPrayer ? "← Menos" : "Ler tudo →"}
                    </button>
                  )}
                </div>
              </div>

              <div className="dv-in dv-in-4" style={{ display:"flex", flexDirection:"column", gap:12 }}>

                <button className="dv-btn dv-btn-wa" onClick={compartilharWA}>
                  <svg viewBox="0 0 32 32" fill="currentColor" style={{ width:20, height:20, flexShrink:0 }}>
                    <path d="M19.11 17.63c-.29-.15-1.7-.84-1.97-.94-.26-.1-.46-.15-.65.15-.19.29-.75.94-.92 1.13-.17.19-.33.22-.62.07-.29-.15-1.22-.45-2.32-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.33.43-.5.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.65-1.56-.89-2.13-.23-.56-.47-.48-.65-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.44 0 1.44 1.03 2.83 1.18 3.03.15.19 2.03 3.1 4.92 4.35.69.3 1.23.48 1.65.62.69.22 1.31.19 1.8.12.55-.08 1.7-.69 1.94-1.35.24-.67.24-1.24.17-1.35-.07-.12-.26-.19-.55-.34M16.04 26.67h-.01c-1.73 0-3.42-.46-4.9-1.34l-.35-.2-3.63.95.97-3.53-.23-.36a10.6 10.6 0 0 1-1.61-5.65c0-5.87 4.78-10.65 10.66-10.65 2.84 0 5.51 1.11 7.52 3.12a10.56 10.56 0 0 1 3.11 7.52c0 5.88-4.78 10.65-10.65 10.65m9.04-19.69A12.7 12.7 0 0 0 16.04 3.2C9.02 3.2 3.3 8.92 3.3 15.94c0 2.25.6 4.46 1.74 6.4L3.2 29.12l6.95-1.82a12.68 12.68 0 0 0 5.89 1.5h.01c7.02 0 12.74-5.72 12.74-12.74 0-3.4-1.33-6.6-3.71-9.08"/>
                  </svg>
                  Compartilhar no WhatsApp
                </button>

                {!imgGerada ? (
                  <button className="dv-btn dv-btn-ig" onClick={handleGerarImg} disabled={gerandoImg}>
                    {gerandoImg ? (
                      <>
                        <div style={{ width:18, height:18, border:"2px solid rgba(255,255,255,0.25)", borderTopColor:"#fff", borderRadius:"50%", animation:"dvSpin .85s linear infinite" }} />
                        Gerando Story…
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:20, height:20, flexShrink:0 }}>
                          <rect x="2" y="2" width="20" height="20" rx="5"/>
                          <circle cx="12" cy="12" r="5"/>
                          <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
                        </svg>
                        Criar Story para o Instagram
                      </>
                    )}
                  </button>
                ) : (
                  <div className="dv-in" style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <div className="dv-preview">
                      <img src={imgGerada} alt="Story do devocional" style={{ width:"100%", display:"block" }} />
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button className="dv-btn-sm dv-btn-ig" onClick={handleShareStory} disabled={compartilhando}>
                        {compartilhando ? "Abrindo…" : "Compartilhar"}
                      </button>
                      <button className="dv-btn-sm dv-btn-wa" style={{ flex:"0 0 auto", padding:"13px 16px" }} onClick={handleDownload}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width:14, height:14 }}>
                          <path d="M12 3v12m0 0l-4-4m4 4l4-4M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Baixar
                      </button>
                      <button className="dv-btn-outline" onClick={() => setImgGerada(null)}>Refazer</button>
                    </div>
                    <p style={{ textAlign:"center", fontSize:11, color:"#9E958E", fontStyle:"italic", fontFamily:"Georgia,serif", margin:0 }}>
                      Pronto para os Stories do Instagram
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
