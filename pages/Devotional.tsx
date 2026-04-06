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

// ─── Story 1080×1920 ─────────────────────────────────────────────────────────
function gerarStory(data: DevocionalData): Promise<string> {
  return new Promise((resolve) => {
    const W=1080, H=1920;
    const c=document.createElement("canvas");
    c.width=W; c.height=H;
    const ctx=c.getContext("2d")!;

    // Fundo — azul noturno profundo
    const bg=ctx.createLinearGradient(0,0,W*0.5,H);
    bg.addColorStop(0,"#030f2b"); bg.addColorStop(0.35,"#041428");
    bg.addColorStop(0.7,"#061d3e"); bg.addColorStop(1,"#020c1f");
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    // Glow âmbar — canto superior (luz divina / amanhecer)
    const ag=ctx.createRadialGradient(0,0,0,0,0,W*0.75);
    ag.addColorStop(0,"rgba(212,120,14,0.15)");
    ag.addColorStop(0.45,"rgba(212,120,14,0.05)");
    ag.addColorStop(1,"transparent");
    ctx.fillStyle=ag; ctx.fillRect(0,0,W,H);

    // Glow azul — canto inferior direito
    const bg2=ctx.createRadialGradient(W,H*0.7,0,W,H*0.7,W*0.85);
    bg2.addColorStop(0,"rgba(30,64,175,0.2)");
    bg2.addColorStop(1,"transparent");
    ctx.fillStyle=bg2; ctx.fillRect(0,0,W,H);

    // Grade geométrica sutil (arquitetura sacra)
    ctx.save(); ctx.globalAlpha=0.04; ctx.strokeStyle="rgba(147,197,253,1)"; ctx.lineWidth=1;
    for(let x=0;x<W;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.restore();

    // Estrelas — ~10% âmbar (vitral)
    ctx.save();
    for(let i=0;i<95;i++){
      const px=Math.random()*W,py=Math.random()*H*0.82,pr=Math.random()*1.9+0.3;
      ctx.globalAlpha=Math.random()*0.5+0.1;
      ctx.fillStyle=i<10?`hsl(40,90%,${76+Math.random()*18}%)`:
                         `hsl(${210+Math.random()*30},82%,${72+Math.random()*24}%)`;
      ctx.beginPath(); ctx.arc(px,py,pr,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();

    // Barra âmbar no topo — assinatura
    const tb=ctx.createLinearGradient(0,0,W,0);
    tb.addColorStop(0,"rgba(217,119,6,0.5)");
    tb.addColorStop(0.5,"rgba(251,191,36,0.92)");
    tb.addColorStop(1,"rgba(217,119,6,0.5)");
    ctx.fillStyle=tb; ctx.fillRect(0,0,W,6);

    // Helpers
    const wrap=(text:string,maxW:number,font:string)=>{
      ctx.font=font;
      return text.split(" ").reduce((lines:string[],word)=>{
        const last=lines[lines.length-1]??"";
        const test=last?`${last} ${word}`:word;
        if(ctx.measureText(test).width>maxW&&last) return[...lines,word];
        return[...lines.slice(0,-1),test];
      },[""]).filter(Boolean);
    };
    const center=(text:string,y:number,font:string,color:string,alpha=1)=>{
      ctx.save(); ctx.globalAlpha=alpha; ctx.font=font;
      ctx.fillStyle=color; ctx.textAlign="center";
      ctx.fillText(text,W/2,y); ctx.restore();
    };
    const hline=(y:number,alpha=0.28)=>{
      ctx.save();
      const l=ctx.createLinearGradient(120,0,W-120,0);
      l.addColorStop(0,"transparent"); l.addColorStop(0.5,`rgba(120,170,255,${alpha})`); l.addColorStop(1,"transparent");
      ctx.strokeStyle=l; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(120,y); ctx.lineTo(W-120,y); ctx.stroke(); ctx.restore();
    };
    const amberLine=(y:number,w=110)=>{
      ctx.save();
      const l=ctx.createLinearGradient(W/2-w,0,W/2+w,0);
      l.addColorStop(0,"transparent"); l.addColorStop(0.5,"rgba(251,191,36,0.55)"); l.addColorStop(1,"transparent");
      ctx.strokeStyle=l; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(W/2-w,y); ctx.lineTo(W/2+w,y); ctx.stroke(); ctx.restore();
    };

    // Cabeçalho
    hline(172);
    center("M I N I S T É R I O   I R L A N D A",136,"300 24px Georgia,serif","rgba(147,197,253,0.55)");
    amberLine(154);
    center("DEVOCIONAL  DO  DIA",228,"700 23px sans-serif","rgba(96,165,250,0.72)");
    center(data.dateLabel,278,"italic 300 25px Georgia,serif","rgba(147,197,253,0.40)");
    hline(316);

    // Título
    let ty=390;
    if(data.title){
      const tlines=wrap(data.title,W-160,"600 60px Georgia,serif");
      ctx.save(); ctx.font="600 60px Georgia,serif"; ctx.fillStyle="#dce8ff";
      ctx.textAlign="center"; ctx.shadowColor="rgba(30,64,175,0.45)"; ctx.shadowBlur=24;
      tlines.forEach(l=>{ctx.fillText(l,W/2,ty);ty+=82;}); ctx.restore();
      ty+=22;
    }

    // Ornamento âmbar
    center("✦",ty,"22px serif","rgba(251,191,36,0.78)"); ty+=55;

    // Aspas decorativas (toque âmbar)
    ctx.save(); ctx.font="italic 115px Georgia,serif"; ctx.fillStyle="rgba(212,120,14,0.07)";
    ctx.textAlign="left"; ctx.fillText("\u201C",90,ty+12); ctx.restore();

    // Versículo
    const vlines=wrap(`"${data.verseText}"`,W-200,"italic 40px Georgia,serif");
    ctx.save(); ctx.font="italic 40px Georgia,serif";
    ctx.fillStyle="rgba(214,231,255,0.93)"; ctx.textAlign="center";
    ctx.shadowColor="rgba(30,64,175,0.14)"; ctx.shadowBlur=8;
    vlines.forEach(l=>{ctx.fillText(l,W/2,ty);ty+=62;}); ctx.restore();
    ty+=16;

    hline(ty,0.18); ty+=50;
    ctx.save(); ctx.font="600 35px Georgia,serif"; ctx.fillStyle="rgba(147,197,253,0.96)";
    ctx.textAlign="center"; ctx.shadowColor="rgba(59,130,246,0.35)"; ctx.shadowBlur=14;
    ctx.fillText(data.verseRef,W/2,ty); ctx.restore(); ty+=60;

    center("✦",ty,"20px serif","rgba(251,191,36,0.55)"); ty+=55;

    // Corpo
    const shortBody=data.body.length>240?data.body.slice(0,240).replace(/\s\w+$/,"")+"…":data.body;
    const blines=wrap(shortBody,W-180,"400 33px Georgia,serif");
    ctx.save(); ctx.font="400 33px Georgia,serif";
    ctx.fillStyle="rgba(186,214,255,0.72)"; ctx.textAlign="center";
    blines.slice(0,6).forEach(l=>{ctx.fillText(l,W/2,ty);ty+=53;}); ctx.restore();

    // Rodapé
    const footY=H-162;
    hline(footY-44,0.18);
    ctx.save(); ctx.font="700 50px Georgia,serif"; ctx.textAlign="center";
    ctx.shadowColor="rgba(59,130,246,0.55)"; ctx.shadowBlur=28;
    const hg=ctx.createLinearGradient(W/2-160,0,W/2+160,0);
    hg.addColorStop(0,"#60a5fa"); hg.addColorStop(0.5,"#93c5fd"); hg.addColorStop(1,"#60a5fa");
    ctx.fillStyle=hg; ctx.fillText("#AOGIM",W/2,footY+20); ctx.restore();

    // Ponto âmbar decorativo no rodapé
    center("✦",footY+56,"14px serif","rgba(251,191,36,0.45)");

    resolve(c.toDataURL("image/png"));
  });
}

// ─── Componente ──────────────────────────────────────────────────────────────
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

  useEffect(()=>{
    let alive=true;
    (async()=>{
      try{
        const cached=localStorage.getItem(cacheKey);
        if(cached){setData(JSON.parse(cached));setLoading(false);return;}
        const res=await fetch("/.netlify/functions/devocional",{cache:"no-store"});
        const json=await res.json() as DevocionalData;
        if(!alive)return;
        setData(json);
        localStorage.setItem(cacheKey,JSON.stringify(json));
      }catch{}
      finally{if(alive)setLoading(false);}
    })();
    return()=>{alive=false;};
  },[]);

  const compartilharWA=()=>{
    if(!data)return;
    const text=`📖 *${data.title}*\n\n_"${data.verseText}"_\n*${data.verseRef}*\n\n${data.body.slice(0,200)}…\n\n🙏 Leia o devocional completo:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank");
  };

  const handleGerarImg=async()=>{
    if(!data)return;
    setGerandoImg(true);
    try{setImgGerada(await gerarStory(data));}
    finally{setGerandoImg(false);}
  };

  const handleDownload=()=>{
    if(!imgGerada)return;
    const a=document.createElement("a");
    a.href=imgGerada; a.download=`devocional-story-${todayKey()}.png`; a.click();
  };

  const handleShareStory=async()=>{
    if(!imgGerada)return;
    setCompartilhando(true);
    try{
      const blob=await(await fetch(imgGerada)).blob();
      const file=new File([blob],`devocional-${todayKey()}.png`,{type:"image/png"});
      const nav=navigator as any;
      if(nav.share&&(!nav.canShare||nav.canShare({files:[file]}))){
        await nav.share({files:[file],title:"Devocional do dia"});
        return;
      }
      handleDownload();
      window.open("https://www.instagram.com/","_blank");
    }catch{handleDownload();}
    finally{setCompartilhando(false);}
  };

  const preview=(text:string,wordLimit=36)=>{
    const words=text.split(" ");
    if(words.length<=wordLimit)return{short:text,truncated:false};
    return{short:words.slice(0,wordLimit).join(" ")+"…",truncated:true};
  };

  return(
    <>
      <style>{`
        @keyframes dvFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dvSpin{to{transform:rotate(360deg)}}

        .dv-root{font-family:'Lato',sans-serif;min-height:100vh;background:#F6F8FF;}

        .dv-in{opacity:0;animation:dvFadeUp .45s ease forwards;}
        .dv-in-1{animation-delay:.05s}
        .dv-in-2{animation-delay:.15s}
        .dv-in-3{animation-delay:.28s}
        .dv-in-4{animation-delay:.42s}
        .dv-in-5{animation-delay:.56s}

        .dv-verse-card{
          border-radius:16px; padding:24px 22px 20px;
          background:#FFFBEB;
          border:1px solid #FDE68A;
          border-left:3px solid #D97706;
          position:relative; overflow:hidden;
        }
        .dv-verse-card::before{
          content:'\u201C';
          font-family:'Playfair Display',Georgia,serif;
          font-size:100px; color:rgba(180,83,9,0.07);
          position:absolute; top:-10px; left:8px;
          line-height:1; pointer-events:none;
        }

        .dv-section-card{
          border-radius:14px;
          background:#FFFFFF;
          border:1px solid #E8E5E0;
          overflow:hidden;
          box-shadow:0 1px 3px rgba(28,25,23,0.05);
        }
        .dv-section-header{
          display:flex; align-items:center; justify-content:space-between;
          padding:13px 18px;
          border-bottom:1px solid #E8E5E0;
          cursor:pointer; user-select:none;
        }
        .dv-section-header:hover{background:#EEF2FF;}
        .dv-section-label{
          font-size:10px; font-weight:700; letter-spacing:.18em;
          text-transform:uppercase; color:#A8A29E;
          display:flex; align-items:center; gap:8px;
        }
        .dv-section-chevron{font-size:11px;color:#A8A29E;transition:transform .25s;}
        .dv-section-chevron-open{transform:rotate(180deg);}
        .dv-section-body{padding:16px 18px 18px;}
        .dv-section-text{
          font-family:'Playfair Display',Georgia,serif;
          font-size:clamp(14px,4vw,16px);
          line-height:1.85; color:#57534E; margin:0;
        }
        .dv-read-more{
          background:none; border:none; cursor:pointer;
          font-size:12px; font-weight:700; color:#1E40AF;
          padding:8px 0 0; display:block; font-family:'Lato',sans-serif;
          transition:color .15s;
        }
        .dv-read-more:hover{color:#1D4ED8;}

        .dv-divider{height:1px;background:linear-gradient(90deg,transparent,#E8E5E0,transparent);}

        .dv-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;border:none;border-radius:14px;padding:14px 0;cursor:pointer;font-family:'Lato',sans-serif;font-size:15px;font-weight:700;color:#fff;transition:opacity .18s,transform .18s;}
        .dv-btn:hover{opacity:.9;transform:translateY(-1px);}
        .dv-btn:active{transform:translateY(0);}
        .dv-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;}
        .dv-btn-wa{background:#1E40AF;}
        .dv-btn-wa:hover{background:#1D4ED8;opacity:1;}
        .dv-btn-ig{background:linear-gradient(130deg,#1040b0,#0080e0,#00aaff);}
        .dv-btn-sm{flex:1;border:none;border-radius:12px;padding:12px 0;cursor:pointer;font-family:'Lato',sans-serif;font-size:13px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;gap:7px;transition:opacity .18s;}
        .dv-btn-sm:hover{opacity:.9;}
        .dv-btn-outline{padding:11px 14px;border-radius:12px;cursor:pointer;font-size:12px;font-weight:700;font-family:'Lato',sans-serif;color:#57534E;border:1px solid #E8E5E0;background:transparent;transition:border-color .18s,color .18s;}
        .dv-btn-outline:hover{border-color:#A8A29E;color:#1C1917;}

        .dv-preview{border-radius:12px;overflow:hidden;border:1px solid #E8E5E0;box-shadow:0 4px 16px rgba(28,25,23,0.1);}
      `}</style>

      <main className="dv-root">
        {/* Logo */}
        <div style={{display:"flex",justifyContent:"center",paddingTop:24,paddingBottom:4}}>
          <img src={logoUrl} alt="AOGIM Conect" style={{width:72,objectFit:"contain"}}/>
        </div>

        <div style={{width:"100%",maxWidth:520,margin:"0 auto",padding:"0 16px 80px"}}>

          {/* Loading */}
          {loading&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"65vh",gap:16}}>
              <div style={{width:28,height:28,border:"2px solid #E8E5E0",borderTopColor:"#1E40AF",borderRadius:"50%",animation:"dvSpin .85s linear infinite"}}/>
              <p style={{color:"#A8A29E",fontSize:13,letterSpacing:".1em",fontFamily:"Georgia,serif",fontStyle:"italic"}}>Carregando…</p>
            </div>
          )}

          {!loading&&!data&&(
            <p style={{textAlign:"center",color:"#A8A29E",marginTop:80,fontSize:15,fontFamily:"Georgia,serif",fontStyle:"italic"}}>
              Não consegui carregar o devocional agora. Tente novamente em instantes.
            </p>
          )}

          {!loading&&data&&(
            <>
              {/* Cabeçalho */}
              <div className="dv-in dv-in-1" style={{textAlign:"center",paddingTop:8,paddingBottom:20}}>
                <span style={{fontSize:10,letterSpacing:".22em",color:"#1E40AF",textTransform:"uppercase",fontWeight:700}}>
                  Devocional do Dia
                </span>
                {data.dateLabel&&(
                  <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,color:"#A8A29E",fontStyle:"italic",margin:"6px 0 4px"}}>
                    {data.dateLabel}
                  </p>
                )}
                {data.title&&(
                  <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"clamp(20px,5.5vw,26px)",fontWeight:700,color:"#1C1917",margin:"8px 0 0",lineHeight:1.25}}>
                    {data.title}
                  </h1>
                )}
              </div>

              <div className="dv-divider dv-in dv-in-1" style={{marginBottom:24}}/>

              {/* Versículo */}
              <div className="dv-verse-card dv-in dv-in-2" style={{marginBottom:16}}>
                <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"clamp(15px,4.5vw,18px)",color:"#57534E",lineHeight:1.7,fontStyle:"italic",textAlign:"center",position:"relative",zIndex:1,margin:0}}>
                  "{data.verseText}"
                </p>
                <div style={{marginTop:14,display:"flex",alignItems:"center",gap:10}}>
                  <div style={{flex:1,height:1,background:"#FDE68A"}}/>
                  <span style={{fontSize:12,fontWeight:700,color:"#B45309",letterSpacing:".07em"}}>{data.verseRef}</span>
                  <div style={{flex:1,height:1,background:"#FDE68A"}}/>
                </div>
              </div>

              {/* Card Reflexão */}
              <div className="dv-section-card dv-in dv-in-3" style={{marginBottom:10}}>
                <div className="dv-section-header" onClick={()=>setExpandedBody(v=>!v)}>
                  <span className="dv-section-label">
                    <svg viewBox="0 0 16 16" fill="currentColor" style={{width:11,height:11}}>
                      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 12.5a5.5 5.5 0 110-11 5.5 5.5 0 010 11zm.75-8.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.25 7a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0V7z"/>
                    </svg>
                    Reflexão
                  </span>
                  <span className={`dv-section-chevron${expandedBody?" dv-section-chevron-open":""}`}>▼</span>
                </div>
                <div className="dv-section-body" style={{paddingTop:14}}>
                  <p className="dv-section-text">
                    {expandedBody ? data.body : preview(data.body).short}
                  </p>
                  {preview(data.body).truncated&&(
                    <button className="dv-read-more" onClick={()=>setExpandedBody(v=>!v)}>
                      {expandedBody ? "← Menos" : "Ler tudo →"}
                    </button>
                  )}
                </div>
              </div>

              {/* Card Oração */}
              <div className="dv-section-card dv-in dv-in-3" style={{marginBottom:28}}>
                <div className="dv-section-header" onClick={()=>setExpandedPrayer(v=>!v)}>
                  <span className="dv-section-label">
                    <svg viewBox="0 0 16 16" fill="currentColor" style={{width:11,height:11}}>
                      <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14.5C4.41 14.5 1.5 11.59 1.5 8S4.41 1.5 8 1.5 14.5 4.41 14.5 8 11.59 14.5 8 14.5zm.75-5.25v3.5a.75.75 0 01-1.5 0v-3.5a.75.75 0 011.5 0zM8 5.5a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
                    </svg>
                    Oração
                  </span>
                  <span className={`dv-section-chevron${expandedPrayer?" dv-section-chevron-open":""}`}>▼</span>
                </div>
                <div className="dv-section-body" style={{paddingTop:14}}>
                  <p className="dv-section-text" style={{fontStyle:"italic"}}>
                    {expandedPrayer ? data.prayer : preview(data.prayer,24).short}
                  </p>
                  {preview(data.prayer,24).truncated&&(
                    <button className="dv-read-more" onClick={()=>setExpandedPrayer(v=>!v)}>
                      {expandedPrayer ? "← Menos" : "Ler tudo →"}
                    </button>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="dv-in dv-in-4" style={{display:"flex",flexDirection:"column",gap:12}}>

                {/* WhatsApp */}
                <button className="dv-btn dv-btn-wa" onClick={compartilharWA}>
                  <svg viewBox="0 0 32 32" fill="currentColor" style={{width:20,height:20,flexShrink:0}}>
                    <path d="M19.11 17.63c-.29-.15-1.7-.84-1.97-.94-.26-.1-.46-.15-.65.15-.19.29-.75.94-.92 1.13-.17.19-.33.22-.62.07-.29-.15-1.22-.45-2.32-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.33.43-.5.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.65-1.56-.89-2.13-.23-.56-.47-.48-.65-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.44 0 1.44 1.03 2.83 1.18 3.03.15.19 2.03 3.1 4.92 4.35.69.3 1.23.48 1.65.62.69.22 1.31.19 1.8.12.55-.08 1.7-.69 1.94-1.35.24-.67.24-1.24.17-1.35-.07-.12-.26-.19-.55-.34M16.04 26.67h-.01c-1.73 0-3.42-.46-4.9-1.34l-.35-.2-3.63.95.97-3.53-.23-.36a10.6 10.6 0 0 1-1.61-5.65c0-5.87 4.78-10.65 10.66-10.65 2.84 0 5.51 1.11 7.52 3.12a10.56 10.56 0 0 1 3.11 7.52c0 5.88-4.78 10.65-10.65 10.65m9.04-19.69A12.7 12.7 0 0 0 16.04 3.2C9.02 3.2 3.3 8.92 3.3 15.94c0 2.25.6 4.46 1.74 6.4L3.2 29.12l6.95-1.82a12.68 12.68 0 0 0 5.89 1.5h.01c7.02 0 12.74-5.72 12.74-12.74 0-3.4-1.33-6.6-3.71-9.08"/>
                  </svg>
                  Compartilhar no WhatsApp
                </button>

                {/* Story Instagram */}
                {!imgGerada?(
                  <button className="dv-btn dv-btn-ig" onClick={handleGerarImg} disabled={gerandoImg}>
                    {gerandoImg?(
                      <><div style={{width:18,height:18,border:"2px solid rgba(255,255,255,0.25)",borderTopColor:"#fff",borderRadius:"50%",animation:"dvSpin .85s linear infinite"}}/>Gerando Story…</>
                    ):(
                      <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20,flexShrink:0}}><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>Criar Story para o Instagram</>
                    )}
                  </button>
                ):(
                  <div className="dv-in" style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div className="dv-preview">
                      <img src={imgGerada} alt="Story" style={{width:"100%",display:"block"}}/>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button className="dv-btn-sm dv-btn-ig" onClick={handleShareStory} disabled={compartilhando}>
                        {compartilhando?"Abrindo…":"Compartilhar"}
                      </button>
                      <button className="dv-btn-sm dv-btn-wa" style={{flex:"0 0 auto",padding:"13px 16px"}} onClick={handleDownload}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:14,height:14}}><path d="M12 3v12m0 0l-4-4m4 4l4-4M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Baixar
                      </button>
                      <button className="dv-btn-outline" onClick={()=>setImgGerada(null)}>Refazer</button>
                    </div>
                    <p style={{textAlign:"center",fontSize:11,color:"#A8A29E",fontStyle:"italic",fontFamily:"Georgia,serif",margin:0}}>
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
