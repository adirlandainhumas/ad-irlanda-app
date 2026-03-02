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

    const bg=ctx.createLinearGradient(0,0,W*.6,H);
    bg.addColorStop(0,"#020d1f"); bg.addColorStop(.3,"#041428");
    bg.addColorStop(.65,"#051c3a"); bg.addColorStop(1,"#020b18");
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    [[0,H*.35,W*.8,"rgba(30,100,220,0.22)","rgba(20,70,180,0.08)"],[W,H*.1,W*.7,"rgba(0,180,255,0.15)","transparent"],[W*.3,H,W*.9,"rgba(40,60,200,0.18)","transparent"]].forEach(([x,y,r,c1,c2]:any)=>{
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,c1); g.addColorStop(1,c2);
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    });

    const drawWave=(oY:number,amp:number,freq:number,phase:number,cs:string,ce:string)=>{
      ctx.beginPath(); ctx.moveTo(0,H);
      for(let x=0;x<=W;x+=4){
        const y=oY+Math.sin((x/W)*Math.PI*freq+phase)*amp+Math.sin((x/W)*Math.PI*(freq*1.7)+phase*.6)*(amp*.35);
        ctx.lineTo(x,y);
      }
      ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath();
      const wg=ctx.createLinearGradient(0,oY-amp,0,H);
      wg.addColorStop(0,cs); wg.addColorStop(1,ce);
      ctx.fillStyle=wg; ctx.fill();
    };
    drawWave(H*.62,90,2.2,.4,"rgba(10,60,160,0.55)","rgba(5,20,80,0.4)");
    drawWave(H*.70,70,2.8,1.1,"rgba(15,80,200,0.5)","rgba(5,25,100,0.5)");
    drawWave(H*.78,55,3.4,2.0,"rgba(0,120,255,0.35)","rgba(0,40,120,0.55)");

    ctx.save(); ctx.globalAlpha=.18;
    [{oY:H*.62,amp:90,freq:2.2,ph:.4},{oY:H*.70,amp:70,freq:2.8,ph:1.1},{oY:H*.78,amp:55,freq:3.4,ph:2.0}].forEach(p=>{
      ctx.beginPath();
      for(let x=0;x<=W;x+=4){const y=p.oY+Math.sin((x/W)*Math.PI*p.freq+p.ph)*p.amp; x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      ctx.strokeStyle="rgba(120,200,255,0.7)"; ctx.lineWidth=2.5; ctx.stroke();
    }); ctx.restore();

    ctx.save();
    for(let i=0;i<80;i++){
      const px=Math.random()*W,py=Math.random()*H*.75,pr=Math.random()*1.8+.3;
      ctx.globalAlpha=Math.random()*.5+.1;
      ctx.fillStyle=`hsl(${200+Math.random()*40},80%,${70+Math.random()*30}%)`;
      ctx.beginPath(); ctx.arc(px,py,pr,0,Math.PI*2); ctx.fill();
    } ctx.restore();

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
    const hline=(y:number,alpha=.35)=>{
      ctx.save();
      const l=ctx.createLinearGradient(100,0,W-100,0);
      l.addColorStop(0,"transparent"); l.addColorStop(.5,`rgba(80,160,255,${alpha})`); l.addColorStop(1,"transparent");
      ctx.strokeStyle=l; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(100,y); ctx.lineTo(W-100,y); ctx.stroke(); ctx.restore();
    };

    hline(165);
    center("AOGIM  CONECT",130,"300 28px Georgia,serif","rgba(100,180,255,0.65)");
    center("DEVOCIONAL  DO  DIA",228,"700 24px sans-serif","rgba(80,160,255,0.6)");
    center(data.dateLabel,278,"italic 300 26px Georgia,serif","rgba(120,190,255,0.45)");
    hline(315);

    // Título
    let ty=380;
    if(data.title){
      const tlines=wrap(data.title,W-160,"600 62px Georgia,serif");
      ctx.save(); ctx.font="600 62px Georgia,serif"; ctx.fillStyle="#e8f4ff";
      ctx.textAlign="center"; ctx.shadowColor="rgba(0,100,255,0.3)"; ctx.shadowBlur=20;
      tlines.forEach(l=>{ctx.fillText(l,W/2,ty);ty+=80;}); ctx.restore();
      ty+=20;
    }

    center("✦",ty,"22px serif","rgba(80,160,255,0.5)"); ty+=50;

    // Versículo
    ctx.save(); ctx.font="italic 110px Georgia,serif"; ctx.fillStyle="rgba(50,130,255,0.08)";
    ctx.textAlign="left"; ctx.fillText("\u201C",85,ty+10); ctx.restore();

    const vlines=wrap(`"${data.verseText}"`,W-200,"italic 40px Georgia,serif");
    ctx.save(); ctx.font="italic 40px Georgia,serif";
    ctx.fillStyle="rgba(210,235,255,0.93)"; ctx.textAlign="center";
    ctx.shadowColor="rgba(0,100,255,0.12)"; ctx.shadowBlur=8;
    vlines.forEach(l=>{ctx.fillText(l,W/2,ty);ty+=60;}); ctx.restore();
    ty+=14;

    hline(ty,0.22); ty+=48;
    ctx.save(); ctx.font="600 36px Georgia,serif"; ctx.fillStyle="rgba(100,190,255,0.9)";
    ctx.textAlign="center"; ctx.shadowColor="rgba(0,120,255,0.3)"; ctx.shadowBlur=14;
    ctx.fillText(data.verseRef,W/2,ty); ctx.restore(); ty+=55;

    center("✦",ty,"20px serif","rgba(80,160,255,0.45)"); ty+=50;

    // Corpo (primeiras linhas)
    const shortBody = data.body.length>240 ? data.body.slice(0,240).replace(/\s\w+$/,"")+"…" : data.body;
    const blines=wrap(shortBody,W-180,"400 34px Georgia,serif");
    ctx.save(); ctx.font="400 34px Georgia,serif";
    ctx.fillStyle="rgba(185,215,255,0.72)"; ctx.textAlign="center";
    blines.slice(0,6).forEach(l=>{ctx.fillText(l,W/2,ty);ty+=52;}); ctx.restore();

    // Rodapé
    const footY=H-155;
    hline(footY-40,0.22);
    ctx.save(); ctx.font="700 52px Georgia,serif"; ctx.textAlign="center";
    ctx.shadowColor="rgba(0,140,255,0.6)"; ctx.shadowBlur=24;
    const hg=ctx.createLinearGradient(W/2-150,0,W/2+150,0);
    hg.addColorStop(0,"#60b8ff"); hg.addColorStop(.5,"#a0d8ff"); hg.addColorStop(1,"#60b8ff");
    ctx.fillStyle=hg; ctx.fillText("#AOGIM",W/2,footY+20); ctx.restore();

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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&display=swap');
        *{box-sizing:border-box;}

        .dv-root{
          font-family:'Lato',sans-serif;
          min-height:100vh;
          background:linear-gradient(155deg,#060d20 0%,#0a1535 40%,#0e1d50 70%,#050f28 100%);
          position:relative; overflow-x:hidden;
        }
        .dv-glow-a{position:fixed;pointer-events:none;z-index:0;top:-10%;left:-15%;width:60vw;height:60vw;border-radius:50%;background:radial-gradient(circle,rgba(30,90,210,0.13) 0%,transparent 70%);}
        .dv-glow-b{position:fixed;pointer-events:none;z-index:0;bottom:-10%;right:-10%;width:50vw;height:50vw;border-radius:50%;background:radial-gradient(circle,rgba(0,140,255,0.1) 0%,transparent 70%);}

        @keyframes dvFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dvSpin{to{transform:rotate(360deg)}}

        .dv-in{opacity:0;animation:dvFadeUp .5s ease forwards;}
        .dv-in-1{animation-delay:.05s}
        .dv-in-2{animation-delay:.15s}
        .dv-in-3{animation-delay:.28s}
        .dv-in-4{animation-delay:.42s}
        .dv-in-5{animation-delay:.56s}

        .dv-verse-card{
          border-radius:20px; padding:26px 22px 20px;
          background:linear-gradient(135deg,rgba(20,70,180,0.16),rgba(0,100,220,0.07));
          border:1px solid rgba(60,140,255,0.2);
          position:relative; overflow:hidden;
        }
        .dv-verse-card::before{
          content:'\u201C';
          font-family:'Playfair Display',Georgia,serif;
          font-size:100px; color:rgba(40,120,255,0.1);
          position:absolute; top:-10px; left:8px;
          line-height:1; pointer-events:none;
        }

        .dv-section-card{
          border-radius:18px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(60,140,255,0.1);
          overflow:hidden;
        }
        .dv-section-header{
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 18px;
          border-bottom:1px solid rgba(60,140,255,0.08);
          cursor:pointer; user-select:none;
        }
        .dv-section-header:hover{background:rgba(60,140,255,0.05);}
        .dv-section-label{
          font-size:10px; font-weight:700; letter-spacing:.18em;
          text-transform:uppercase; color:rgba(80,160,255,0.7);
          display:flex; align-items:center; gap:8px;
        }
        .dv-section-chevron{font-size:12px;color:rgba(80,160,255,0.5);transition:transform .25s;}
        .dv-section-chevron-open{transform:rotate(180deg);}
        .dv-section-body{padding:16px 18px 18px;}
        .dv-section-text{
          font-family:'Playfair Display',Georgia,serif;
          font-size:clamp(14px,4vw,16px);
          line-height:1.85; color:rgba(190,215,250,0.82); margin:0;
        }
        .dv-read-more{
          background:none; border:none; cursor:pointer;
          font-size:12px; font-weight:700; color:rgba(80,160,255,0.7);
          padding:8px 0 0; display:block; font-family:'Lato',sans-serif;
          transition:color .15s;
        }
        .dv-read-more:hover{color:rgba(120,180,255,0.9);}

        .dv-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(60,140,255,0.25),transparent);}

        .dv-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;border:none;border-radius:16px;padding:15px 0;cursor:pointer;font-family:'Lato',sans-serif;font-size:15px;font-weight:700;color:#fff;transition:transform .18s,box-shadow .18s,opacity .18s;}
        .dv-btn:hover{transform:translateY(-2px);}
        .dv-btn:active{transform:translateY(1px);}
        .dv-btn:disabled{opacity:.55;cursor:not-allowed;transform:none;}
        .dv-btn-wa{background:linear-gradient(130deg,#158a4a,#1db860);box-shadow:0 6px 28px rgba(15,140,60,0.28);}
        .dv-btn-wa:hover{box-shadow:0 10px 36px rgba(15,140,60,0.42);}
        .dv-btn-ig{background:linear-gradient(130deg,#1040b0,#0080e0,#00aaff);box-shadow:0 6px 28px rgba(0,100,220,0.28);}
        .dv-btn-ig:hover{box-shadow:0 10px 36px rgba(0,100,220,0.42);}
        .dv-btn-sm{flex:1;border:none;border-radius:14px;padding:13px 0;cursor:pointer;font-family:'Lato',sans-serif;font-size:13px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;gap:7px;transition:transform .18s;}
        .dv-btn-sm:hover{transform:translateY(-2px);}
        .dv-btn-outline{padding:12px 16px;border-radius:14px;cursor:pointer;font-size:12px;font-weight:600;font-family:'Lato',sans-serif;color:rgba(160,200,255,0.7);border:1px solid rgba(60,140,255,0.18);background:rgba(30,80,180,0.08);transition:background .18s;}
        .dv-btn-outline:hover{background:rgba(30,80,180,0.15);}

        .dv-preview{border-radius:16px;overflow:hidden;border:1px solid rgba(60,140,255,0.2);box-shadow:0 16px 48px rgba(0,80,200,0.22);}
      `}</style>

      <main className="dv-root">
        <div className="dv-glow-a"/><div className="dv-glow-b"/>

        {/* Logo */}
        <div style={{display:"flex",justifyContent:"center",paddingTop:24,paddingBottom:4,position:"relative",zIndex:1}}>
          <img src={logoUrl} alt="AOGIM Conect" style={{width:80,objectFit:"contain",filter:"drop-shadow(0 0 16px rgba(80,160,255,0.28))"}}/>
        </div>

        <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:520,margin:"0 auto",padding:"0 16px 80px"}}>

          {/* Loading */}
          {loading&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"65vh",gap:16}}>
              <div style={{width:28,height:28,border:"2px solid rgba(60,140,255,0.18)",borderTopColor:"rgba(80,180,255,0.85)",borderRadius:"50%",animation:"dvSpin .85s linear infinite"}}/>
              <p style={{color:"rgba(80,160,255,0.5)",fontSize:13,letterSpacing:".1em",fontFamily:"Georgia,serif",fontStyle:"italic"}}>Carregando…</p>
            </div>
          )}

          {!loading&&!data&&(
            <p style={{textAlign:"center",color:"rgba(150,190,255,0.6)",marginTop:80,fontSize:15,fontFamily:"Georgia,serif",fontStyle:"italic"}}>
              Não consegui carregar o devocional agora. Tente novamente em instantes.
            </p>
          )}

          {!loading&&data&&(
            <>
              {/* Cabeçalho */}
              <div className="dv-in dv-in-1" style={{textAlign:"center",paddingTop:8,paddingBottom:20}}>
                <span style={{fontSize:10,letterSpacing:".22em",color:"rgba(80,160,255,0.6)",textTransform:"uppercase",fontWeight:700}}>
                  ✦ &nbsp;Devocional do Dia&nbsp; ✦
                </span>
                {data.dateLabel&&(
                  <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,color:"rgba(100,180,255,0.45)",fontStyle:"italic",margin:"6px 0 4px"}}>
                    {data.dateLabel}
                  </p>
                )}
                {data.title&&(
                  <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"clamp(20px,5.5vw,26px)",fontWeight:700,color:"#ddeeff",margin:"8px 0 0",lineHeight:1.25}}>
                    {data.title}
                  </h1>
                )}
              </div>

              <div className="dv-divider dv-in dv-in-1" style={{marginBottom:24}}/>

              {/* Versículo */}
              <div className="dv-verse-card dv-in dv-in-2" style={{marginBottom:16}}>
                <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"clamp(15px,4.5vw,18px)",color:"rgba(215,235,255,0.93)",lineHeight:1.7,fontStyle:"italic",textAlign:"center",position:"relative",zIndex:1,margin:0}}>
                  "{data.verseText}"
                </p>
                <div style={{marginTop:14,display:"flex",alignItems:"center",gap:10}}>
                  <div style={{flex:1,height:1,background:"rgba(60,140,255,0.18)"}}/>
                  <span style={{fontSize:12,fontWeight:700,color:"rgba(80,180,255,0.9)",letterSpacing:".07em"}}>{data.verseRef}</span>
                  <div style={{flex:1,height:1,background:"rgba(60,140,255,0.18)"}}/>
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
                    <p style={{textAlign:"center",fontSize:11,color:"rgba(80,160,255,0.35)",fontStyle:"italic",fontFamily:"Georgia,serif",margin:0}}>
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