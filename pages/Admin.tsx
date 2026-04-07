import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { sendPushNotification } from "../lib/pushSubscription";

const ADMIN_EMAIL = "adirlandainhumaslinks@gmail.com";
const SUPABASE_URL = "https://llevczjsjurdfejwcqpo.supabase.co";
const GALLERY_BUCKET = "galeria";
const GALLERY_FOLDER = "ultimo-culto";
const FUNCOES = ['Membro','Diácono','Diáconisa','Presbítero','Evangelista','Pastor','Cooperador(a)'];
const CONGREGACOES = ['Inhumas - GO', 'Uruana - GO', 'Belo Horizonte - MG'];

type Notice = {
  id: string; title: string; body: string;
  is_published?: boolean; event_date?: string | null; created_at?: string | null;
};

type GalleryFile = { name: string; path: string; url: string; };

type Membro = {
  id: string; nome: string; email: string; telefone: string;
  status: string; created_at: string; funcao?: string; congregacao?: string;
};

type PrayerRequest = {
  id: string; nome: string; contato?: string | null; pedido: string; created_at: string;
};

type MembroFicha = {
  full_name?: string; gender?: string; birth_date?: string;
  marital_status?: string; phone?: string; email?: string;
  address_street?: string; address_block?: string; address_lot?: string;
  address_sector?: string; address_city?: string; address_state?: string;
  church_function?: string; church_entry_date?: string; baptism_date?: string;
  church_role_info?: string; photo_path?: string; numero_registro?: string;
  data_emissao?: string;
};

function formatDateBR(dateStr?: string | null) {
  if (!dateStr) return "—";
  // Parseia YYYY-MM-DD como data local (evita offset UTC que adianta 1 dia no Brasil)
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

function toISODate(dateInput: string) {
  if (!dateInput) return "";
  if (dateInput.includes("-")) return dateInput.slice(0, 10);
  const [dd, mm, yyyy] = dateInput.split("/");
  if (!dd || !mm || !yyyy) return "";
  return `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
}

function whatsappLink(tel: string) {
  const digits = tel.replace(/\D/g, '');
  const number = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${number}`;
}

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [tab, setTab] = useState<"notices" | "photos" | "membros" | "oracao" | "devocional">("notices");
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [prayerMsg, setPrayerMsg] = useState<string | null>(null);
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushUrl, setPushUrl] = useState("/avisos");
  const [pushSending, setPushSending] = useState(false);
  const [pushMsg, setPushMsg] = useState<string | null>(null);

  // ── DEVOCIONAL / CARROSSEL ────────────────────────────────────────────────
  type DevData = { dateLabel:string; title:string; verseText:string; verseRef:string; body:string; prayer:string; };
  const [devData,    setDevData]    = useState<DevData|null>(null);
  const [devLoading, setDevLoading] = useState(false);
  const [devErr,     setDevErr]     = useState<string|null>(null);
  const [devSlides,  setDevSlides]  = useState<string[]>([]);
  const [devGerando, setDevGerando] = useState(false);
  const [devZipBusy, setDevZipBusy] = useState(false);
  const [legenda,    setLegenda]    = useState<string>("");
  const [legendaBusy,setLegendaBusy]= useState(false);
  const [legendaErr, setLegendaErr] = useState<string|null>(null);
  const [legendaCopied, setLegendaCopied] = useState(false);

  const isAdmin = sessionEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");

  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticeBusy, setNoticeBusy] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [noticeErr, setNoticeErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formPublished, setFormPublished] = useState(true);
  const [formEventDate, setFormEventDate] = useState("");

  const [photoBusy, setPhotoBusy] = useState(false);
  const [photos, setPhotos] = useState<GalleryFile[]>([]);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState<string | null>(null);

  const [membros, setMembros] = useState<Membro[]>([]);
  const [membrosBusy, setMembrosBusy] = useState(false);
  const [membrosMsg, setMembrosMsg] = useState<string | null>(null);
  const [membrosErr, setMembrosErr] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "pendente" | "aprovado" | "reprovado">("pendente");
  const [filtroCongregacao, setFiltroCongregacao] = useState<string>("todas");
  const [busca, setBusca] = useState("");

  // ── Ficha do membro ──────────────────────────────────────────────────────
  const [fichaModal, setFichaModal] = useState<{ membro: Membro; ficha: MembroFicha; photoUrl: string | null } | null>(null);
  const [fichaLoading, setFichaLoading] = useState(false);
  const [funcaoEditando, setFuncaoEditando] = useState('');
  const [funcaoSalvando, setFuncaoSalvando] = useState(false);
  const [congregacaoEditando, setCongregacaoEditando] = useState('');
  const [congregacaoSalvando, setCongregacaoSalvando] = useState(false);

  // ── AUTH ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) { setSessionEmail(data.session?.user?.email ?? null); setLoading(false); }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSessionEmail(sess?.user?.email ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!loading && isAdmin) { loadNotices(); loadPhotos(); loadMembros(); loadPrayerRequests(); }
  }, [loading, isAdmin]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setNoticeErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setNoticeErr(error.message);
    setPassword("");
  }
  async function signOut() { await supabase.auth.signOut(); }

  // ── NOTICES ──────────────────────────────────────────────────────────────
  async function loadNotices() {
    setNoticeBusy(true); setNoticeErr(null);
    try {
      let res = await supabase.from("notices").select("*").order("event_date", { ascending: true });
      if (res.error) res = await supabase.from("notices").select("*").order("created_at", { ascending: true });
      if (res.error) throw res.error;
      setNotices((res.data as Notice[]) ?? []);
    } catch (err: any) { setNoticeErr(err?.message ?? "Erro ao carregar avisos."); }
    finally { setNoticeBusy(false); }
  }

  function openNewNotice() { setEditing(null); setFormTitle(""); setFormBody(""); setFormPublished(true); setFormEventDate(""); setShowForm(true); }
  function openEditNotice(n: Notice) { setEditing(n); setFormTitle(n.title ?? ""); setFormBody(n.body ?? ""); setFormPublished(Boolean(n.is_published)); setFormEventDate(n.event_date ? n.event_date.slice(0,10) : ""); setShowForm(true); }

  async function saveNotice() {
    setNoticeBusy(true); setNoticeMsg(null); setNoticeErr(null);
    try {
      const payload: any = { title: formTitle.trim(), body: formBody.trim(), is_published: formPublished };
      const iso = toISODate(formEventDate.trim());
      if (iso) payload.event_date = iso;
      if (!payload.title || !payload.body) { setNoticeErr("Preencha título e texto."); return; }
      if (editing?.id) {
        const { error } = await supabase.from("notices").update(payload).eq("id", editing.id);
        if (error) throw error; setNoticeMsg("Aviso atualizado!");
      } else {
        const { error } = await supabase.from("notices").insert(payload);
        if (error) throw error; setNoticeMsg("Aviso criado!");
        // Dispara push automaticamente ao publicar novo aviso
        if (formPublished) {
          sendPushNotification(
            `📢 ${formTitle.trim()}`,
            formBody.trim().slice(0, 120),
            '/avisos'
          );
        }
      }
      setShowForm(false); await loadNotices();
    } catch (err: any) { setNoticeErr(err?.message ?? "Erro ao salvar."); }
    finally { setNoticeBusy(false); }
  }

  async function deleteNotice(id: string) {
    if (!window.confirm("Excluir este aviso?")) return;
    setNoticeBusy(true);
    try {
      const { error } = await supabase.from("notices").delete().eq("id", id);
      if (error) throw error; setNoticeMsg("Aviso excluído!"); await loadNotices();
    } catch (err: any) { setNoticeErr(err?.message ?? "Erro."); }
    finally { setNoticeBusy(false); }
  }

  // ── PHOTOS ───────────────────────────────────────────────────────────────
  async function loadPhotos() {
    setPhotoBusy(true); setPhotoErr(null);
    try {
      const { data, error } = await supabase.storage.from(GALLERY_BUCKET).list(GALLERY_FOLDER, { limit: 200 });
      if (error) throw error;
      setPhotos((data ?? []).filter(f => f.name && !f.name.startsWith(".")).map(f => ({
        name: f.name, path: `${GALLERY_FOLDER}/${f.name}`,
        url: `${SUPABASE_URL}/storage/v1/object/public/${GALLERY_BUCKET}/${encodeURIComponent(GALLERY_FOLDER)}/${encodeURIComponent(f.name)}`,
      })).sort((a,b) => a.name.localeCompare(b.name)));
    } catch (err: any) { setPhotoErr(err?.message ?? "Erro ao carregar fotos."); }
    finally { setPhotoBusy(false); }
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPhotoBusy(true); setPhotoErr(null); setPhotoMsg(null);
    try {
      for (const file of Array.from(files)) {
        const { error } = await supabase.storage.from(GALLERY_BUCKET).upload(`${GALLERY_FOLDER}/${file.name}`, file, { upsert: true, contentType: file.type });
        if (error) throw error;
      }
      setPhotoMsg("Fotos enviadas!"); await loadPhotos();
    } catch (err: any) { setPhotoErr(err?.message ?? "Erro ao enviar."); }
    finally { setPhotoBusy(false); }
  }

  async function deletePhoto(path: string) {
    if (!window.confirm("Excluir esta foto?")) return;
    setPhotoBusy(true);
    try {
      const { error } = await supabase.storage.from(GALLERY_BUCKET).remove([path]);
      if (error) throw error; setPhotoMsg("Foto excluída!"); await loadPhotos();
    } catch (err: any) { setPhotoErr(err?.message ?? "Erro."); }
    finally { setPhotoBusy(false); }
  }

  // ── MEMBROS ──────────────────────────────────────────────────────────────
  async function loadMembros() {
    setMembrosBusy(true); setMembrosErr(null);
    try {
      const { data, error } = await supabase.from("membros").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setMembros((data as Membro[]) ?? []);
    } catch (err: any) { setMembrosErr(err?.message ?? "Erro ao carregar membros."); }
    finally { setMembrosBusy(false); }
  }

  async function loadPrayerRequests() {
    setPrayerLoading(true);
    try {
      const { data, error } = await supabase.from("prayer_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setPrayerRequests((data as PrayerRequest[]) ?? []);
    } catch (err: any) { setPrayerMsg("Erro ao carregar: " + (err?.message ?? "")); }
    finally { setPrayerLoading(false); }
  }

  async function deletePrayerRequest(id: string) {
    if (!confirm("Excluir este pedido?")) return;
    const { error } = await supabase.from("prayer_requests").delete().eq("id", id);
    if (!error) setPrayerRequests(prev => prev.filter(p => p.id !== id));
  }

  async function abrirFicha(membro: Membro) {
    setFichaLoading(true);
    try {
      const { data: ficha } = await supabase
        .from("member_details").select("*").eq("user_id", membro.id).maybeSingle();
      let photoUrl: string | null = null;
      if (ficha?.photo_path) {
        const { data: urlData } = await supabase.storage
          .from("member-photos").createSignedUrl(ficha.photo_path, 3600);
        photoUrl = urlData?.signedUrl ?? null;
      }
      setFuncaoEditando(membro.funcao || ficha?.church_function || 'Membro');
      setCongregacaoEditando(membro.congregacao || 'Inhumas - GO');
      setFichaModal({ membro, ficha: ficha ?? {}, photoUrl });
    } catch (err: any) {
      setMembrosErr("Erro ao carregar ficha: " + err.message);
    } finally {
      setFichaLoading(false);
    }
  }

  async function salvarFuncao() {
    if (!fichaModal) return;
    setFuncaoSalvando(true);
    try {
      await supabase.from("membros").update({ funcao: funcaoEditando }).eq("id", fichaModal.membro.id);
      await supabase.from("member_details").update({ church_function: funcaoEditando }).eq("user_id", fichaModal.membro.id);
      setMembros(prev => prev.map(m => m.id === fichaModal.membro.id ? { ...m, funcao: funcaoEditando } : m));
      setFichaModal(prev => prev ? {
        ...prev,
        membro: { ...prev.membro, funcao: funcaoEditando },
        ficha: { ...prev.ficha, church_function: funcaoEditando },
      } : null);
      setMembrosMsg(`Função atualizada para "${funcaoEditando}" ✅`);
    } catch (err: any) {
      setMembrosErr("Erro ao salvar função: " + err.message);
    } finally {
      setFuncaoSalvando(false);
    }
  }

  async function salvarCongregacao() {
    if (!fichaModal) return;
    setCongregacaoSalvando(true);
    try {
      // Congregação fica apenas na tabela membros
      await supabase.from("membros").update({ congregacao: congregacaoEditando }).eq("id", fichaModal.membro.id);
      setMembros(prev => prev.map(m => m.id === fichaModal.membro.id ? { ...m, congregacao: congregacaoEditando } : m));
      setFichaModal(prev => prev ? {
        ...prev,
        membro: { ...prev.membro, congregacao: congregacaoEditando },
      } : null);
      setMembrosMsg(`Congregação atualizada para "${congregacaoEditando}" ✅`);
    } catch (err: any) {
      setMembrosErr("Erro ao salvar congregação: " + err.message);
    } finally {
      setCongregacaoSalvando(false);
    }
  }

  async function atualizarStatus(membroId: string, acao: "aprovar" | "reprovar") {
    setMembrosBusy(true); setMembrosMsg(null); setMembrosErr(null);
    try {
      const res = await fetch("/.netlify/functions/membro-aprovar", {
        method: "POST", body: JSON.stringify({ membroId, acao }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMembrosMsg(acao === "aprovar" ? "Membro aprovado! ✅" : "Membro reprovado.");
      setFichaModal(null);
      await loadMembros();
    } catch (err: any) { setMembrosErr(err?.message ?? "Erro ao atualizar."); }
    finally { setMembrosBusy(false); }
  }

  // ── DEVOCIONAL helpers ───────────────────────────────────────────────────
  function dvTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  async function fetchDevocional() {
    setDevLoading(true); setDevErr(null); setDevSlides([]); setLegenda(""); setLegendaErr(null);
    try {
      const res = await fetch("/.netlify/functions/devocional", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setDevData(d);
    } catch(e: any) { setDevErr(e.message ?? "Erro ao buscar devocional."); }
    finally { setDevLoading(false); }
  }

  function dvWrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, font: string) {
    ctx.font = font;
    return text.split(" ").reduce((lines: string[], word) => {
      const last = lines[lines.length-1] ?? "";
      const test = last ? `${last} ${word}` : word;
      if (ctx.measureText(test).width > maxW && last) return [...lines, word];
      return [...lines.slice(0,-1), test];
    }, [""]).filter(Boolean);
  }
  function dvCenter(ctx: CanvasRenderingContext2D, text: string, y: number, font: string, color: string, alpha=1, sc?: string, sb?: number) {
    ctx.save(); ctx.globalAlpha=alpha; ctx.font=font; ctx.fillStyle=color; ctx.textAlign="center";
    if(sc){ctx.shadowColor=sc; ctx.shadowBlur=sb??0;}
    ctx.fillText(text, 1080/2, y); ctx.restore();
  }
  function dvHline(ctx: CanvasRenderingContext2D, y: number, alpha=0.28) {
    ctx.save();
    const l = ctx.createLinearGradient(80,0,1000,0);
    l.addColorStop(0,"transparent"); l.addColorStop(0.5,`rgba(120,170,255,${alpha})`); l.addColorStop(1,"transparent");
    ctx.strokeStyle=l; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(80,y); ctx.lineTo(1000,y); ctx.stroke(); ctx.restore();
  }
  function dvAmberLine(ctx: CanvasRenderingContext2D, y: number, w=100) {
    ctx.save();
    const l = ctx.createLinearGradient(1080/2-w,0,1080/2+w,0);
    l.addColorStop(0,"transparent"); l.addColorStop(0.5,"rgba(251,191,36,0.55)"); l.addColorStop(1,"transparent");
    ctx.strokeStyle=l; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(1080/2-w,y); ctx.lineTo(1080/2+w,y); ctx.stroke(); ctx.restore();
  }
  function dvDots(ctx: CanvasRenderingContext2D, current: number, total: number, H: number) {
    const r=8, gap=22, W=1080;
    const tw = r*2*total + gap*(total-1);
    let sx = (W-tw)/2;
    for(let i=0;i<total;i++){
      ctx.save(); ctx.beginPath();
      ctx.arc(sx+r, H-60, r, 0, Math.PI*2);
      ctx.fillStyle = i===current ? "rgba(96,165,250,0.92)" : "rgba(59,130,246,0.22)";
      ctx.fill(); ctx.restore();
      sx += r*2+gap;
    }
  }
  function dvMakeCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const W=1080, H=1350;
    const c = document.createElement("canvas");
    c.width=W; c.height=H;
    const ctx = c.getContext("2d")!;

    // ── FUNDO: gradiente profundo escuro-azul ──
    const bg = ctx.createLinearGradient(0,0,W*0.4,H);
    bg.addColorStop(0,"#06091f"); bg.addColorStop(0.5,"#080d2a"); bg.addColorStop(1,"#050718");
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    // ── FAIXA LATERAL ESQUERDA (vertical, âmbar difuso) ──
    const sideL = ctx.createLinearGradient(0,0,180,0);
    sideL.addColorStop(0,"rgba(251,191,36,0.07)"); sideL.addColorStop(1,"transparent");
    ctx.fillStyle=sideL; ctx.fillRect(0,0,180,H);

    // ── FAIXA LATERAL DIREITA ──
    const sideR = ctx.createLinearGradient(W,0,W-180,0);
    sideR.addColorStop(0,"rgba(96,165,250,0.06)"); sideR.addColorStop(1,"transparent");
    ctx.fillStyle=sideR; ctx.fillRect(W-180,0,180,H);

    // ── GRID DE PONTOS (textura moderna) ──
    ctx.save(); ctx.fillStyle="rgba(147,197,253,1)";
    for(let x=48;x<W;x+=72){
      for(let y=48;y<H;y+=72){
        ctx.globalAlpha=0.028+(Math.random()*0.018);
        ctx.beginPath(); ctx.arc(x,y,1.2,0,Math.PI*2); ctx.fill();
      }
    }
    ctx.restore();

    // ── ESTRELAS finas ──
    ctx.save();
    for(let i=0;i<55;i++){
      const px=Math.random()*W, py=Math.random()*H*0.72, pr=Math.random()*1.4+0.2;
      ctx.globalAlpha=Math.random()*0.42+0.06;
      ctx.fillStyle=i<10?`hsl(${40+Math.random()*12},95%,${78+Math.random()*16}%)`:
                         `hsl(${210+Math.random()*26},80%,${72+Math.random()*24}%)`;
      ctx.beginPath(); ctx.arc(px,py,pr,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();

    // ── EMBLEMA CENTRAL: sol/luz moderno ──
    const CX=W/2, CY=248;

    // Halo externo difuso
    const halo=ctx.createRadialGradient(CX,CY,0,CX,CY,310);
    halo.addColorStop(0,"rgba(251,191,36,0.13)"); halo.addColorStop(0.42,"rgba(96,165,250,0.05)"); halo.addColorStop(1,"transparent");
    ctx.fillStyle=halo; ctx.fillRect(0,0,W,H);

    // Raios irradiantes (16 raios, alternando grosso/fino)
    ctx.save(); ctx.translate(CX,CY);
    for(let i=0;i<16;i++){
      const angle=(i/16)*Math.PI*2 - Math.PI/2;
      const thick=i%2===0;
      ctx.globalAlpha=thick ? 0.22 : 0.10;
      ctx.strokeStyle=thick ? "#fbbf24" : "#93c5fd";
      ctx.lineWidth=thick ? 1.8 : 0.9;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle)*72, Math.sin(angle)*72);
      ctx.lineTo(Math.cos(angle)*185, Math.sin(angle)*185);
      ctx.stroke();
    }
    ctx.restore();

    // Anel externo duplo
    ctx.save();
    ctx.globalAlpha=0.38; ctx.strokeStyle="#fbbf24"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(CX,CY,185,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha=0.14; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(CX,CY,200,0,Math.PI*2); ctx.stroke();
    ctx.restore();

    // Anel interno
    ctx.save();
    ctx.globalAlpha=0.55; ctx.strokeStyle="#fbbf24"; ctx.lineWidth=1.8;
    ctx.beginPath(); ctx.arc(CX,CY,65,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha=0.20; ctx.strokeStyle="#93c5fd"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(CX,CY,72,0,Math.PI*2); ctx.stroke();
    ctx.restore();

    // Núcleo luminoso
    const core=ctx.createRadialGradient(CX,CY,0,CX,CY,65);
    core.addColorStop(0,"rgba(255,220,80,0.26)"); core.addColorStop(0.5,"rgba(251,191,36,0.10)"); core.addColorStop(1,"transparent");
    ctx.fillStyle=core; ctx.fillRect(0,0,W,H);

    // Cruz central fina (4 traços em X)
    ctx.save(); ctx.translate(CX,CY); ctx.globalAlpha=0.45; ctx.strokeStyle="#fbbf24"; ctx.lineWidth=1.2;
    [[0,1],[Math.PI/2,1],[Math.PI/4,0.6],[Math.PI*3/4,0.6]].forEach(([a,op])=>{
      ctx.globalAlpha=0.45*op;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*12,Math.sin(a)*12); ctx.lineTo(Math.cos(a)*52,Math.sin(a)*52);
      ctx.moveTo(Math.cos(a+Math.PI)*12,Math.sin(a+Math.PI)*12); ctx.lineTo(Math.cos(a+Math.PI)*52,Math.sin(a+Math.PI)*52);
      ctx.stroke();
    });
    ctx.restore();

    // ── COLUNA DE LUZ (beam vertical) ──
    const beam=ctx.createLinearGradient(CX,0,CX,H*0.55);
    beam.addColorStop(0,"rgba(251,191,36,0.16)"); beam.addColorStop(0.25,"rgba(251,191,36,0.07)"); beam.addColorStop(1,"transparent");
    ctx.save(); ctx.fillStyle=beam;
    ctx.beginPath();
    ctx.moveTo(CX-55,0); ctx.lineTo(CX+55,0);
    ctx.lineTo(CX+240,H*0.55); ctx.lineTo(CX-240,H*0.55);
    ctx.closePath(); ctx.fill(); ctx.restore();

    // ── LINHAS HORIZONTAIS DECORATIVAS ──
    const hline=(y:number,alpha:number,color="rgba(251,191,36,1)")=>{
      const g=ctx.createLinearGradient(0,y,W,y);
      g.addColorStop(0,"transparent"); g.addColorStop(0.18,color); g.addColorStop(0.82,color); g.addColorStop(1,"transparent");
      ctx.save(); ctx.globalAlpha=alpha; ctx.fillStyle=g; ctx.fillRect(0,y-0.7,W,1.4); ctx.restore();
    };
    hline(0,0.82);          // topo
    hline(H,0.82);          // base
    hline(CY-205,0.18);     // acima do emblema
    hline(CY+205,0.18);     // abaixo do emblema

    // ── BARRA ÂMBAR ESPESSA NO TOPO ──
    const tb=ctx.createLinearGradient(0,0,W,0);
    tb.addColorStop(0,"transparent"); tb.addColorStop(0.22,"rgba(251,191,36,0.92)"); tb.addColorStop(0.78,"rgba(251,191,36,0.92)"); tb.addColorStop(1,"transparent");
    ctx.fillStyle=tb; ctx.fillRect(0,0,W,5);
    // Barra base espelho
    ctx.fillStyle=tb; ctx.fillRect(0,H-5,W,5);

    // ── VINHETA RADIAL ──
    const vig=ctx.createRadialGradient(W/2,H/2,H*0.18,W/2,H/2,H*0.88);
    vig.addColorStop(0,"transparent"); vig.addColorStop(1,"rgba(2,4,16,0.48)");
    ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

    return [c, ctx];
  }
  function dvSplitBody(text: string): [string, string|null] {
    if(text.length<=520) return [text, null];
    const mid=Math.floor(text.length/2); let at=-1;
    for(let i=mid; i<Math.min(mid+240,text.length-10); i++){
      if(text[i]==="."&&(text[i+1]===" "||text[i+1]==="\n")){at=i+1;break;}
    }
    if(at===-1) for(let i=mid; i>Math.max(mid-240,0); i--){
      if(text[i]==="."&&(text[i+1]===" "||text[i+1]==="\n")){at=i+1;break;}
    }
    if(at===-1) at=mid;
    return [text.slice(0,at).trim(), text.slice(at).trim()];
  }

  function gerarSlides(d: DevData): string[] {
    const W=1080, H=1350;
    const [body1, body2] = dvSplitBody(d.body);
    const total = body2 ? 5 : 4;
    const result: string[] = [];

    // Slide 1: Capa
    {
      const [c, ctx] = dvMakeCanvas();
      dvHline(ctx,378); dvCenter(ctx,"M I N I S T É R I O   I R L A N D A",348,"300 22px Georgia,serif","rgba(147,197,253,0.55)");
      dvAmberLine(ctx,360);
      dvCenter(ctx,"DEVOCIONAL  DO  DIA",415,"700 21px sans-serif","rgba(96,165,250,0.72)");
      dvCenter(ctx,d.dateLabel,455,"italic 300 22px Georgia,serif","rgba(147,197,253,0.40)");
      dvHline(ctx,482);
      let ty=520;
      if(d.title){
        const tl=dvWrap(ctx,d.title,W-140,"600 64px Georgia,serif");
        ctx.save(); ctx.font="600 64px Georgia,serif"; ctx.fillStyle="#dce8ff";
        ctx.textAlign="center"; ctx.shadowColor="rgba(30,64,175,0.45)"; ctx.shadowBlur=26;
        tl.forEach(l=>{ctx.fillText(l,W/2,ty);ty+=84;}); ctx.restore(); ty+=20;
      }
      dvCenter(ctx,"✦",ty,"22px serif","rgba(251,191,36,0.78)"); ty+=58;
      ctx.save(); ctx.font="italic 120px Georgia,serif"; ctx.fillStyle="rgba(212,120,14,0.07)";
      ctx.textAlign="left"; ctx.fillText("\u201C",82,ty+10); ctx.restore();
      const vl=dvWrap(ctx,`"${d.verseText}"`,W-200,"italic 40px Georgia,serif");
      ctx.save(); ctx.font="italic 40px Georgia,serif"; ctx.fillStyle="rgba(214,231,255,0.93)";
      ctx.textAlign="center"; ctx.shadowColor="rgba(30,64,175,0.14)"; ctx.shadowBlur=8;
      vl.forEach(l=>{ctx.fillText(l,W/2,ty);ty+=62;}); ctx.restore(); ty+=18;
      dvHline(ctx,ty,0.18); ty+=52;
      ctx.save(); ctx.font="600 36px Georgia,serif"; ctx.fillStyle="rgba(147,197,253,0.96)";
      ctx.textAlign="center"; ctx.shadowColor="rgba(59,130,246,0.35)"; ctx.shadowBlur=14;
      ctx.fillText(d.verseRef,W/2,ty); ctx.restore();
      dvDots(ctx,0,total,H);
      result.push(c.toDataURL("image/png"));
    }

    // Slides de reflexão
    const textSlide = (idx:number, bodyText:string, isCont:boolean, hasMore:boolean) => {
      const [c, ctx] = dvMakeCanvas();
      dvHline(ctx,368); dvCenter(ctx,"✝",335,"48px serif","rgba(147,197,253,0.72)");
      ctx.save(); ctx.font="700 24px sans-serif"; ctx.fillStyle="rgba(96,165,250,0.68)";
      ctx.textAlign="center"; ctx.fillText("R  E  F  L  E  X  Ã  O",W/2,412); ctx.restore();
      dvAmberLine(ctx,430);
      let startY=490;
      if(isCont){ dvCenter(ctx,"continuação",472,"italic 300 22px Georgia,serif","rgba(147,197,253,0.32)"); startY=510; }
      const bl=dvWrap(ctx,bodyText,W-160,"400 36px Georgia,serif");
      ctx.save(); ctx.font="400 36px Georgia,serif"; ctx.fillStyle="rgba(186,214,255,0.82)"; ctx.textAlign="center";
      let ty=startY; bl.slice(0,14).forEach(l=>{ctx.fillText(l,W/2,ty);ty+=60;}); ctx.restore();
      if(hasMore){ dvCenter(ctx,"→ continua no próximo slide",H-100,"italic 300 25px Georgia,serif","rgba(147,197,253,0.38)"); }
      dvDots(ctx,idx,total,H);
      result.push(c.toDataURL("image/png"));
    };
    textSlide(1, body1, false, !!body2);
    if(body2) textSlide(2, body2, true, false);

    // Slide Oração
    {
      const idx = body2 ? 3 : 2;
      const [c, ctx] = dvMakeCanvas();
      dvHline(ctx,368); dvCenter(ctx,"🙏",335,"48px serif","rgba(147,197,253,0.72)");
      ctx.save(); ctx.font="700 24px sans-serif"; ctx.fillStyle="rgba(96,165,250,0.68)";
      ctx.textAlign="center"; ctx.fillText("O  R  A  Ç  Ã  O",W/2,412); ctx.restore();
      dvAmberLine(ctx,430);
      const pl=dvWrap(ctx,d.prayer,W-160,"italic 36px Georgia,serif");
      ctx.save(); ctx.font="italic 36px Georgia,serif"; ctx.fillStyle="rgba(200,225,255,0.86)"; ctx.textAlign="center";
      let ty=490; pl.slice(0,14).forEach(l=>{ctx.fillText(l,W/2,ty);ty+=60;}); ctx.restore();
      dvDots(ctx,idx,total,H);
      result.push(c.toDataURL("image/png"));
    }

    // Slide CTA
    {
      const [c, ctx] = dvMakeCanvas();
      ctx.save(); ctx.font="180px serif"; ctx.textAlign="center";
      ctx.globalAlpha=0.05; ctx.fillStyle="rgba(251,191,36,1)"; ctx.fillText("✦",W/2,640); ctx.restore();
      dvHline(ctx,368); dvCenter(ctx,"DEVOCIONAL DO DIA",342,"700 21px sans-serif","rgba(96,165,250,0.55)"); dvHline(ctx,382);
      let ty=460;
      const hl=dvWrap(ctx,"Esse devocional tocou seu coração?",W-120,"700 70px Georgia,serif");
      ctx.save(); ctx.font="700 70px Georgia,serif"; ctx.fillStyle="#dce8ff";
      ctx.textAlign="center"; ctx.shadowColor="rgba(30,64,175,0.45)"; ctx.shadowBlur=32;
      hl.forEach(l=>{ctx.fillText(l,W/2,ty);ty+=88;}); ctx.restore(); ty+=18;
      dvHline(ctx,ty,0.22); ty+=58;
      ["💾  Salva pra ler quando precisar","🙏  Manda pra alguém que precisa ouvir","💬  Conta pra gente nos comentários"].forEach(cta=>{
        const cl=dvWrap(ctx,cta,W-130,"400 36px sans-serif");
        ctx.save(); ctx.font="400 36px sans-serif"; ctx.fillStyle="rgba(186,214,255,0.88)"; ctx.textAlign="center";
        cl.forEach(l=>{ctx.fillText(l,W/2,ty);ty+=52;}); ctx.restore(); ty+=14;
      });
      ty+=20; dvHline(ctx,ty,0.2); ty+=54;
      ctx.save(); ctx.font="400 26px sans-serif"; ctx.fillStyle="rgba(147,197,253,0.48)";
      ctx.textAlign="center"; ctx.fillText("#AOGIM  #Devocional  #FéQueTransforma",W/2,ty); ctx.restore(); ty+=58;
      ctx.save(); ctx.font="700 52px Georgia,serif"; ctx.textAlign="center";
      ctx.shadowColor="rgba(59,130,246,0.6)"; ctx.shadowBlur=30;
      const hg=ctx.createLinearGradient(W/2-180,0,W/2+180,0);
      hg.addColorStop(0,"#60a5fa"); hg.addColorStop(0.5,"#93c5fd"); hg.addColorStop(1,"#60a5fa");
      ctx.fillStyle=hg; ctx.fillText("@AOGIM Conect",W/2,ty); ctx.restore();
      dvDots(ctx,total-1,total,H);
      result.push(c.toDataURL("image/png"));
    }

    return result;
  }

  function handleGerarCarrossel() {
    if(!devData) return;
    setDevGerando(true);
    setTimeout(()=>{
      try{ setDevSlides(gerarSlides(devData)); }
      catch(e:any){ setDevErr(e.message); }
      finally{ setDevGerando(false); }
    }, 40);
  }

  function dvDownloadSlide(src: string, idx: number) {
    const a = document.createElement("a");
    a.href = src; a.download = `devocional-slide-${String(idx+1).padStart(2,"0")}-${dvTodayKey()}.png`; a.click();
  }

  async function dvDownloadZip() {
    setDevZipBusy(true);
    try {
      // Gera ZIP nativo (sem biblioteca externa) usando a API de Streams do browser
      // Fallback: baixa todos separados com delay
      const nome = `devocional-carrossel-${dvTodayKey()}`;
      // Tenta usar showSaveFilePicker / FileSystemAccess API se disponível
      // caso contrário baixa um a um
      devSlides.forEach((src, i) => { setTimeout(()=>dvDownloadSlide(src, i), i*350); });
    } finally { setDevZipBusy(false); }
  }

  async function gerarLegenda() {
    if(!devData) return;
    setLegendaBusy(true); setLegendaErr(null); setLegenda("");
    try {
      const res = await fetch("/.netlify/functions/gerar-legenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: devData.title, verseText: devData.verseText, verseRef: devData.verseRef, body: devData.body }),
      });
      const d = await res.json();
      if(d.error) throw new Error(d.error);
      setLegenda(d.legenda ?? "");
    } catch(e:any) { setLegendaErr(e.message ?? "Erro ao gerar legenda."); }
    finally { setLegendaBusy(false); }
  }

  async function copiarLegenda() {
    try { await navigator.clipboard.writeText(legenda); setLegendaCopied(true); setTimeout(()=>setLegendaCopied(false), 2000); } catch {}
  }

  // ── Filtros e contagens ───────────────────────────────────────────────────
  const membrosFiltrados = useMemo(() => {
    let lista = membros;
    if (filtroStatus !== "todos") lista = lista.filter(m => m.status === filtroStatus);
    if (filtroCongregacao !== "todas") lista = lista.filter(m => m.congregacao === filtroCongregacao);
    if (busca.trim()) {
      const q = busca.toLowerCase().trim();
      lista = lista.filter(m =>
        m.nome?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.telefone?.replace(/\D/g,'').includes(q.replace(/\D/g,''))
      );
    }
    return lista;
  }, [membros, filtroStatus, filtroCongregacao, busca]);

  // Contagem por congregação respeitando o filtro de status atual
  const contagemCong = useMemo(() => {
    const base = filtroStatus === "todos" ? membros : membros.filter(m => m.status === filtroStatus);
    const result: Record<string, number> = { todas: base.length };
    CONGREGACOES.forEach(c => { result[c] = base.filter(m => m.congregacao === c).length; });
    return result;
  }, [membros, filtroStatus]);

  const pendentesCount = useMemo(() => membros.filter(m => m.status === "pendente").length, [membros]);

  const stats = useMemo(() => ({
    total: membros.length,
    pendentes: membros.filter(m => m.status === "pendente").length,
    aprovados: membros.filter(m => m.status === "aprovado").length,
    reprovados: membros.filter(m => m.status === "reprovado").length,
  }), [membros]);

  const statusColor = (s: string) => {
    if (s === "aprovado")  return "bg-blue-50 border-blue-100 text-blue-700";
    if (s === "reprovado") return "bg-red-50 border-red-100 text-red-700";
    return "bg-yellow-50 border-yellow-100 text-yellow-700";
  };
  const statusLabel = (s: string) => {
    if (s === "aprovado")  return "APROVADO";
    if (s === "reprovado") return "REPROVADO";
    return "PENDENTE";
  };

  const pageTitle = useMemo(() => {
    if (tab === "notices")    return "Gerenciar Avisos";
    if (tab === "photos")     return "Gerenciar Fotos";
    if (tab === "oracao")     return "Pedidos de Oração";
    if (tab === "devocional") return "Carrossel do Devocional";
    return "Gerenciar Membros";
  }, [tab]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-600">Carregando…</div>;

  if (!sessionEmail) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-md mx-auto pt-16 px-4">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
            <p className="text-slate-600 mt-1">Acesso exclusivo para administradores.</p>
            <form className="mt-6 space-y-4" onSubmit={signIn}>
              <div>
                <label className="text-xs font-semibold text-slate-600">E-mail</label>
                <input className="mt-1 w-full rounded-xl border px-3 py-3 outline-none focus:ring-2 focus:ring-blue-200" value={email} onChange={e=>setEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Senha</label>
                <input type="password" className="mt-1 w-full rounded-xl border px-3 py-3 outline-none focus:ring-2 focus:ring-blue-200" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              {noticeErr && <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 px-3 py-2 text-sm">{noticeErr}</div>}
              <button type="submit" className="w-full rounded-xl bg-blue-700 text-white py-3 font-semibold shadow-sm hover:bg-blue-800 transition">Entrar</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border p-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Acesso negado</h1>
          <p className="text-slate-600 mt-2">Este painel é exclusivo do administrador.</p>
          <button onClick={signOut} className="mt-6 w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-black transition">Sair</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-24">

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Painel do Pastor</h1>
            <p className="text-slate-600 mt-1">{pageTitle}</p>
          </div>
          <button onClick={signOut} className="rounded-xl px-4 py-2 border bg-white hover:bg-slate-50 transition text-slate-700">Sair</button>
        </div>

        <div className="mt-6 flex gap-2 flex-wrap">
          {(["notices","photos","membros","oracao","devocional"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-xl px-4 py-2 border transition relative ${tab===t ? (t==="devocional" ? "bg-purple-700 text-white border-purple-700" : "bg-blue-700 text-white border-blue-700") : "bg-white hover:bg-slate-50"}`}
            >
              {t === "notices"    && "Avisos"}
              {t === "photos"     && "Fotos (Galeria)"}
              {t === "devocional" && "📲 Carrossel"}
              {t === "membros" && (
                <span className="flex items-center gap-2">
                  Membros
                  {pendentesCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{pendentesCount}</span>
                  )}
                </span>
              )}
              {t === "oracao" && (
                <span className="flex items-center gap-2">
                  Orações
                  {prayerRequests.length > 0 && (
                    <span className="bg-purple-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{prayerRequests.length}</span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        {(noticeMsg || photoMsg || membrosMsg) && (
          <div className="mt-6 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 flex items-center justify-between">
            <span>{noticeMsg || photoMsg || membrosMsg}</span>
            <button onClick={() => { setNoticeMsg(null); setPhotoMsg(null); setMembrosMsg(null); }}>✕</button>
          </div>
        )}
        {(noticeErr || photoErr || membrosErr) && (
          <div className="mt-6 rounded-xl bg-red-50 border border-red-100 text-red-700 px-4 py-3 flex items-center justify-between">
            <span>{noticeErr || photoErr || membrosErr}</span>
            <button onClick={() => { setNoticeErr(null); setPhotoErr(null); setMembrosErr(null); }}>✕</button>
          </div>
        )}

        {/* ── TAB NOTICES ── */}
        {tab === "notices" && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Gerenciar Avisos</h2>
              <button onClick={openNewNotice} className="rounded-xl bg-white border px-4 py-2 hover:bg-slate-50 transition">+ Novo Aviso</button>
            </div>
            <p className="text-sm text-slate-600 mt-2">✅ Ordenação: por <b>data do aviso</b> (crescente).</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {notices.map(n => (
                <div key={n.id} className="bg-white rounded-2xl border shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-500">{n.event_date ? formatDateBR(n.event_date) : n.created_at ? formatDateBR(n.created_at) : ""}</div>
                      <div className="mt-1 text-base font-semibold text-slate-900">{n.title}</div>
                      <div className="mt-2 text-sm text-slate-600 line-clamp-3">{n.body}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 ${n.is_published ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                      {n.is_published ? "PUBLICADO" : "RASCUNHO"}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => openEditNotice(n)} className="flex-1 rounded-xl border px-4 py-2 hover:bg-slate-50 transition">Editar</button>
                    <button onClick={() => deleteNotice(n.id)} className="rounded-xl border px-4 py-2 hover:bg-red-50 transition text-red-700">🗑</button>
                  </div>
                </div>
              ))}
            </div>
            {notices.length === 0 && <div className="mt-10 text-center text-slate-500">Nenhum aviso encontrado.</div>}

            {/* ── Painel de Notificações Push ── */}
            <div className="mt-10 bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <h3 className="text-base font-semibold text-blue-900 flex items-center gap-2">
                🔔 Enviar Notificação Push
              </h3>
              <p className="text-sm text-blue-700 mt-1 mb-3">Envie uma notificação para todos os membros que aceitaram receber alertas.</p>
              <div className="flex gap-2 mb-4">
                <button onClick={() => { setPushTitle("📖 Devocional de hoje"); setPushBody("A palavra do dia está te esperando. Venha conferir!"); setPushUrl("/devocional"); }} className="text-xs rounded-xl border border-blue-300 bg-white px-3 py-1.5 text-blue-800 hover:bg-blue-50 transition">+ Devocional</button>
                <button onClick={() => { setPushTitle("⛪ Lembrete de Culto"); setPushBody("O culto começa em breve. Te esperamos!"); setPushUrl("/avisos"); }} className="text-xs rounded-xl border border-blue-300 bg-white px-3 py-1.5 text-blue-800 hover:bg-blue-50 transition">+ Culto</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Título</label>
                  <input className="mt-1 w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-200 text-sm" placeholder="Ex: Culto especial hoje!" value={pushTitle} onChange={e => setPushTitle(e.target.value)} maxLength={80} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Mensagem</label>
                  <input className="mt-1 w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-200 text-sm" placeholder="Ex: Não perca, às 19h na sede." value={pushBody} onChange={e => setPushBody(e.target.value)} maxLength={120} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Destino ao tocar</label>
                  <select className="mt-1 w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-200 text-sm" value={pushUrl} onChange={e => setPushUrl(e.target.value)}>
                    <option value="/avisos">Página de Avisos</option>
                    <option value="/devocional">Devocional</option>
                    <option value="/">Página Inicial</option>
                  </select>
                </div>
                {pushMsg && <div className="rounded-xl bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 text-sm">{pushMsg}</div>}
                <button
                  disabled={pushSending || !pushTitle.trim() || !pushBody.trim()}
                  onClick={async () => {
                    setPushSending(true); setPushMsg(null);
                    await sendPushNotification(pushTitle.trim(), pushBody.trim(), pushUrl);
                    setPushSending(false); setPushMsg("✅ Notificação enviada!");
                    setPushTitle(""); setPushBody("");
                    setTimeout(() => setPushMsg(null), 4000);
                  }}
                  className="w-full rounded-xl bg-blue-700 text-white py-3 font-semibold hover:bg-blue-800 transition disabled:opacity-50"
                >
                  {pushSending ? "Enviando…" : "🔔 Notificar todos os membros"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB PHOTOS ── */}
        {tab === "photos" && (
          <div className="mt-8">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Gerenciar Fotos da Galeria</h2>
              <label className="rounded-xl bg-white border px-4 py-2 hover:bg-slate-50 transition cursor-pointer">
                + Enviar fotos
                <input type="file" accept="image/*" multiple className="hidden" onChange={e => uploadPhotos(e.target.files)} />
              </label>
            </div>
            <p className="text-sm text-slate-600 mt-2">Pasta: <code>{GALLERY_BUCKET}/{GALLERY_FOLDER}</code></p>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map(p => (
                <div key={p.path} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  <div className="aspect-[4/5] bg-slate-100">
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <div className="text-xs text-slate-600 truncate">{p.name}</div>
                    <div className="mt-2 flex gap-2">
                      <a href={p.url} target="_blank" rel="noreferrer" className="flex-1 text-center rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 transition">Ver</a>
                      <button onClick={() => deletePhoto(p.path)} className="rounded-xl border px-3 py-2 text-sm hover:bg-red-50 transition text-red-700">🗑</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {photos.length === 0 && <div className="mt-10 text-center text-slate-500">Nenhuma foto na pasta <b>{GALLERY_FOLDER}</b>.</div>}
          </div>
        )}

        {/* ── TAB ORAÇÕES ── */}
        {tab === "oracao" && (
          <div className="mt-8">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Pedidos de Oração</h2>
              <button onClick={loadPrayerRequests} disabled={prayerLoading} className="rounded-xl bg-white border px-4 py-2 hover:bg-slate-50 transition text-sm disabled:opacity-50">
                {prayerLoading ? "Atualizando…" : "↻ Atualizar"}
              </button>
            </div>
            {prayerMsg && (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm">{prayerMsg}</div>
            )}
            {prayerLoading && <div className="mt-6 text-slate-500 text-sm">Carregando pedidos…</div>}
            {!prayerLoading && prayerRequests.length === 0 && (
              <div className="mt-6 text-slate-500 text-sm text-center py-12 bg-white rounded-2xl border">
                Nenhum pedido de oração recebido ainda.
              </div>
            )}
            <div className="mt-4 space-y-4">
              {prayerRequests.map(pr => (
                <div key={pr.id} className="bg-white rounded-2xl border p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-slate-900">{pr.nome}</span>
                        {pr.contato && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{pr.contato}</span>
                        )}
                        <span className="text-xs text-slate-400">{formatDateBR(pr.created_at)}</span>
                      </div>
                      <p className="mt-3 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{pr.pedido}</p>
                    </div>
                    <button
                      onClick={() => deletePrayerRequest(pr.id)}
                      className="text-slate-400 hover:text-red-500 transition flex-shrink-0 p-1"
                      title="Excluir pedido"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB MEMBROS ── */}
        {tab === "membros" && (
          <div className="mt-8">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Cadastros de Membros</h2>
              <button onClick={loadMembros} disabled={membrosBusy} className="rounded-xl bg-white border px-4 py-2 hover:bg-slate-50 transition text-sm disabled:opacity-50">
                {membrosBusy ? "Atualizando…" : "↻ Atualizar"}
              </button>
            </div>

            {/* Cards de estatísticas */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl border p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                <div className="text-xs text-slate-500 mt-1">Total</div>
              </div>
              <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-yellow-700">{stats.pendentes}</div>
                <div className="text-xs text-yellow-600 mt-1">Pendentes</div>
              </div>
              <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-blue-700">{stats.aprovados}</div>
                <div className="text-xs text-blue-600 mt-1">Aprovados</div>
              </div>
              <div className="bg-red-50 rounded-2xl border border-red-200 p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-red-600">{stats.reprovados}</div>
                <div className="text-xs text-red-500 mt-1">Reprovados</div>
              </div>
            </div>

            {/* Busca */}
            <div className="mt-4">
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="🔍  Buscar por nome, e-mail ou telefone…"
                className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Filtro por status */}
            <div className="mt-3 flex gap-2 flex-wrap">
              {(["pendente","aprovado","reprovado","todos"] as const).map(f => (
                <button key={f} onClick={() => setFiltroStatus(f)}
                  className={`rounded-full px-4 py-1.5 text-sm border transition ${filtroStatus===f ? "bg-blue-700 text-white border-blue-700" : "bg-white hover:bg-slate-50"}`}
                >
                  {f === "pendente"  && `⏳ Pendentes (${membros.filter(m=>m.status==="pendente").length})`}
                  {f === "aprovado"  && `✅ Aprovados (${membros.filter(m=>m.status==="aprovado").length})`}
                  {f === "reprovado" && `❌ Reprovados (${membros.filter(m=>m.status==="reprovado").length})`}
                  {f === "todos"     && `Todos (${membros.length})`}
                </button>
              ))}
            </div>

            {/* Filtro por congregação — contagens respeitam o filtro de status */}
            <div className="mt-3 flex gap-2 flex-wrap">
              <button onClick={() => setFiltroCongregacao("todas")}
                className={`rounded-full px-3 py-1 text-xs border transition ${filtroCongregacao==="todas" ? "bg-blue-700 text-white border-blue-700" : "bg-white hover:bg-slate-50"}`}
              >
                🏛 Todas ({contagemCong["todas"] ?? 0})
              </button>
              {CONGREGACOES.map(c => (
                <button key={c} onClick={() => setFiltroCongregacao(c)}
                  className={`rounded-full px-3 py-1 text-xs border transition ${filtroCongregacao===c ? "bg-blue-700 text-white border-blue-700" : "bg-white hover:bg-slate-50"}`}
                >
                  📍 {c} ({contagemCong[c] ?? 0})
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {membrosFiltrados.map(m => (
                <div key={m.id} className="bg-white rounded-2xl border shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{m.nome}</div>
                      <div className="text-sm text-slate-500 mt-0.5 truncate">{m.email}</div>
                      <div className="text-sm text-slate-500">{m.telefone}</div>
                      {m.funcao && (
                        <div className="text-xs text-blue-700 font-semibold mt-1">⛪ {m.funcao}</div>
                      )}
                      {m.congregacao && (
                        <div className="text-xs text-blue-700 font-semibold mt-0.5">📍 {m.congregacao}</div>
                      )}
                      <div className="text-xs text-slate-400 mt-1">Cadastrado em {formatDateBR(m.created_at)}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 font-semibold ${statusColor(m.status)}`}>
                      {statusLabel(m.status)}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => abrirFicha(m)}
                      disabled={fichaLoading}
                      className="flex-1 rounded-xl border border-blue-200 text-blue-700 px-4 py-2.5 text-sm font-semibold hover:bg-blue-50 transition disabled:opacity-50"
                    >
                      {fichaLoading ? "Carregando…" : "📋 Ver Ficha"}
                    </button>
                    {m.telefone && (
                      <a
                        href={whatsappLink(m.telefone)}
                        target="_blank" rel="noreferrer"
                        className="rounded-xl border border-blue-200 text-blue-700 px-4 py-2.5 text-sm font-semibold hover:bg-blue-50 transition flex items-center gap-1"
                      >
                        💬 WA
                      </a>
                    )}
                  </div>

                  {m.status === "pendente" && (
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => atualizarStatus(m.id, "aprovar")} disabled={membrosBusy}
                        className="flex-1 rounded-xl bg-green-600 text-white px-4 py-2.5 font-semibold hover:bg-green-700 transition disabled:opacity-50 text-sm">
                        ✅ Aprovar
                      </button>
                      <button onClick={() => atualizarStatus(m.id, "reprovar")} disabled={membrosBusy}
                        className="flex-1 rounded-xl border border-red-200 text-red-600 px-4 py-2.5 font-semibold hover:bg-red-50 transition disabled:opacity-50 text-sm">
                        ❌ Reprovar
                      </button>
                    </div>
                  )}
                  {m.status === "aprovado" && (
                    <div className="mt-2">
                      <button onClick={() => atualizarStatus(m.id, "reprovar")} disabled={membrosBusy}
                        className="w-full rounded-xl border border-red-200 text-red-600 px-4 py-2.5 text-sm hover:bg-red-50 transition disabled:opacity-50">
                        Revogar acesso
                      </button>
                    </div>
                  )}
                  {m.status === "reprovado" && (
                    <div className="mt-2">
                      <button onClick={() => atualizarStatus(m.id, "aprovar")} disabled={membrosBusy}
                        className="w-full rounded-xl bg-green-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50">
                        Aprovar mesmo assim
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {membrosFiltrados.length === 0 && !membrosBusy && (
              <div className="mt-10 text-center text-slate-500 space-y-2">
                <div className="text-3xl">🔍</div>
                {busca.trim()
                  ? <p>Nenhum membro encontrado para "<b>{busca}</b>".</p>
                  : filtroStatus === "pendente"
                    ? <p>Nenhum cadastro pendente. 🎉</p>
                    : <p>Nenhum membro encontrado com os filtros selecionados.</p>
                }
                {(busca || filtroCongregacao !== "todas") && (
                  <button
                    onClick={() => { setBusca(""); setFiltroCongregacao("todas"); }}
                    className="text-sm text-blue-700 underline"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB DEVOCIONAL / CARROSSEL ── */}
        {tab === "devocional" && (
          <div className="mt-8 space-y-6">

            {/* Buscar */}
            <div className="bg-white rounded-2xl border p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 mb-1">Devocional do dia</h2>
              <p className="text-sm text-slate-500 mb-4">Busca automaticamente o conteúdo de hoje do servidor.</p>
              <button
                onClick={fetchDevocional}
                disabled={devLoading}
                className="rounded-xl bg-blue-700 text-white px-5 py-2.5 font-semibold hover:bg-blue-800 transition disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {devLoading ? <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Buscando…</> : "🔄 Buscar devocional"}
              </button>
              {devErr && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{devErr}</p>}

              {devData && (
                <div className="mt-4 space-y-2 bg-slate-50 rounded-xl border p-4">
                  <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">{devData.dateLabel}</p>
                  <p className="font-semibold text-slate-800">{devData.title}</p>
                  <p className="text-sm text-slate-600 italic">"{devData.verseText}" — {devData.verseRef}</p>
                  <p className="text-sm text-slate-500 line-clamp-2">{devData.body.slice(0,120)}…</p>
                </div>
              )}
            </div>

            {/* Gerar Carrossel */}
            {devData && (
              <div className="bg-white rounded-2xl border p-5 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900 mb-1">Carrossel Instagram</h2>
                <p className="text-sm text-slate-500 mb-4">Slides 1080 × 1350 px · 4 ou 5 slides dependendo do texto</p>

                {devSlides.length === 0 ? (
                  <button
                    onClick={handleGerarCarrossel}
                    disabled={devGerando}
                    className="rounded-xl px-5 py-2.5 font-semibold text-white text-sm flex items-center gap-2 transition disabled:opacity-50"
                    style={{background:"linear-gradient(130deg,#6b21a8,#a855f7,#ec4899)"}}
                  >
                    {devGerando ? <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Gerando slides…</> : "🎨 Gerar carrossel"}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={dvDownloadZip}
                        disabled={devZipBusy}
                        className="rounded-xl px-5 py-2.5 font-semibold text-white text-sm flex items-center gap-2 transition disabled:opacity-50"
                        style={{background:"linear-gradient(130deg,#155c2a,#1db860)"}}
                      >
                        {devZipBusy ? "Baixando…" : "⬇️ Baixar todos os slides"}
                      </button>
                      <button
                        onClick={()=>{setDevSlides([]);}}
                        className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                      >
                        Refazer
                      </button>
                    </div>

                    {/* Grade de slides */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {devSlides.map((src, i) => (
                        <div key={i} className="relative rounded-xl overflow-hidden border border-purple-100 shadow-sm group">
                          <img src={src} alt={`Slide ${i+1}`} className="w-full block"/>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold">Slide {i+1}</span>
                            <button
                              onClick={()=>dvDownloadSlide(src,i)}
                              className="bg-purple-600 text-white text-xs font-bold rounded-lg px-2.5 py-1 hover:bg-purple-700 transition"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 text-center">Poste na ordem: Slide 1 → {devSlides.length}</p>
                  </div>
                )}
              </div>
            )}

            {/* Gerar Legenda */}
            {devData && (
              <div className="bg-white rounded-2xl border p-5 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900 mb-1">Legenda para Instagram</h2>
                <p className="text-sm text-slate-500 mb-4">Legenda personalizada com base no devocional + 5 hashtags temáticas, gerada por IA.</p>

                <button
                  onClick={gerarLegenda}
                  disabled={legendaBusy}
                  className="rounded-xl px-5 py-2.5 font-semibold text-white text-sm flex items-center gap-2 transition disabled:opacity-50"
                  style={{background:"linear-gradient(130deg,#0f4c8a,#1d8fe0)"}}
                >
                  {legendaBusy ? <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Gerando…</> : "✨ Gerar legenda com IA"}
                </button>

                {legendaErr && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{legendaErr}</p>}

                {legenda && (
                  <div className="mt-4 space-y-3">
                    <textarea
                      className="w-full rounded-xl border px-4 py-3 text-sm text-slate-700 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-200 min-h-[160px] leading-relaxed resize-none"
                      value={legenda}
                      onChange={e => setLegenda(e.target.value)}
                    />
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={copiarLegenda}
                        className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
                      >
                        {legendaCopied ? "✅ Copiado!" : "📋 Copiar legenda"}
                      </button>
                      <button
                        onClick={gerarLegenda}
                        disabled={legendaBusy}
                        className="rounded-xl border px-4 py-2 text-sm font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 transition disabled:opacity-50"
                      >
                        🔁 Gerar outra versão
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL AVISOS ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{editing ? "Editar Aviso" : "Novo Aviso"}</h3>
                <p className="text-sm text-slate-600 mt-1">Preencha título, texto e a data do aviso.</p>
              </div>
              <button className="rounded-xl px-3 py-2 border hover:bg-slate-50 transition" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Título</label>
                <input className="mt-1 w-full rounded-xl border px-3 py-3 outline-none focus:ring-2 focus:ring-blue-200" value={formTitle} onChange={e=>setFormTitle(e.target.value)} placeholder="Ex.: 20/02 CULTO DA MEIA NOITE" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Texto do Aviso</label>
                <textarea className="mt-1 w-full rounded-xl border px-3 py-3 outline-none focus:ring-2 focus:ring-blue-200 min-h-[120px]" value={formBody} onChange={e=>setFormBody(e.target.value)} placeholder="Escreva o aviso completo…" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Data do aviso</label>
                  <input type="date" className="mt-1 w-full rounded-xl border px-3 py-3 outline-none focus:ring-2 focus:ring-blue-200" value={formEventDate} onChange={e=>setFormEventDate(e.target.value)} />
                </div>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={formPublished} onChange={e=>setFormPublished(e.target.checked)} />
                    Publicado
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border px-4 py-3 hover:bg-slate-50 transition">Cancelar</button>
              <button disabled={noticeBusy} onClick={saveNotice} className="flex-1 rounded-xl bg-blue-700 text-white px-4 py-3 font-semibold hover:bg-blue-800 transition disabled:opacity-60">
                {noticeBusy ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL FICHA DO MEMBRO ── */}
      {fichaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center px-4 z-50 overflow-y-auto py-8">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border">

            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Ficha Cadastral</h3>
                <p className="text-sm text-slate-500 mt-0.5">{fichaModal.membro.nome}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${statusColor(fichaModal.membro.status)}`}>
                  {statusLabel(fichaModal.membro.status)}
                </span>
                <button onClick={() => setFichaModal(null)} className="p-2 rounded-xl border hover:bg-slate-50 transition text-slate-500">✕</button>
              </div>
            </div>

            <div className="p-6 space-y-6">

              {/* Foto + info básica + contato rápido */}
              <div className="flex items-start gap-5">
                <div className="w-24 h-28 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border">
                  {fichaModal.photoUrl
                    ? <img src={fichaModal.photoUrl} alt="foto" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-slate-400 text-3xl">👤</div>
                  }
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-lg font-bold text-slate-900">{fichaModal.ficha.full_name || fichaModal.membro.nome}</div>
                  <div className="text-sm text-slate-500">{fichaModal.ficha.email || fichaModal.membro.email}</div>
                  <div className="text-sm text-slate-500">{fichaModal.ficha.phone || fichaModal.membro.telefone}</div>
                  <div className="text-sm text-slate-500">
                    {fichaModal.ficha.gender && <span className="mr-3">{fichaModal.ficha.gender}</span>}
                    {fichaModal.ficha.marital_status && <span>{fichaModal.ficha.marital_status}</span>}
                  </div>
                  <div className="text-xs font-semibold text-blue-700 mt-1">
                    📍 {fichaModal.membro.congregacao || 'Inhumas - GO'}
                  </div>
                  {fichaModal.ficha.numero_registro && (
                    <div className="text-xs font-mono text-blue-700 mt-1">Nº {fichaModal.ficha.numero_registro}</div>
                  )}
                  {/* Botões de contato rápido */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {(fichaModal.membro.telefone || fichaModal.ficha.phone) && (
                      <a
                        href={whatsappLink(fichaModal.membro.telefone || fichaModal.ficha.phone || '')}
                        target="_blank" rel="noreferrer"
                        className="rounded-lg bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 text-xs font-semibold hover:bg-blue-100 transition"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                    {(fichaModal.membro.email || fichaModal.ficha.email) && (
                      <a
                        href={`mailto:${fichaModal.membro.email || fichaModal.ficha.email}`}
                        className="rounded-lg bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 transition"
                      >
                        ✉️ E-mail
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Dados pessoais */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dados Pessoais</h4>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Nascimento" value={formatDateBR(fichaModal.ficha.birth_date)} />
                  <InfoRow label="Estado Civil" value={fichaModal.ficha.marital_status} />
                  <InfoRow label="Endereço" value={[fichaModal.ficha.address_street, fichaModal.ficha.address_lot, fichaModal.ficha.address_block].filter(Boolean).join(', ')} full />
                  <InfoRow label="Setor / Bairro" value={fichaModal.ficha.address_sector} />
                  <InfoRow label="Cidade" value={fichaModal.ficha.address_city} />
                  <InfoRow label="Estado" value={fichaModal.ficha.address_state} />
                </div>
              </div>

              {/* Dados eclesiásticos */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dados Eclesiásticos</h4>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Entrada na Igreja" value={formatDateBR(fichaModal.ficha.church_entry_date)} />
                  <InfoRow label="Data de Batismo" value={formatDateBR(fichaModal.ficha.baptism_date)} />
                  {fichaModal.ficha.data_emissao && (
                    <InfoRow label="Emissão do Cartão" value={formatDateBR(fichaModal.ficha.data_emissao)} />
                  )}
                </div>
              </div>

              {/* Alterar congregação */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">📍 Congregação</h4>
                <div className="flex items-center gap-3">
                  <select
                    value={congregacaoEditando}
                    onChange={e => setCongregacaoEditando(e.target.value)}
                    className="flex-1 rounded-xl border border-blue-200 px-3 py-2.5 text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  >
                    {CONGREGACOES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button
                    onClick={salvarCongregacao}
                    disabled={congregacaoSalvando || congregacaoEditando === fichaModal.membro.congregacao}
                    className="rounded-xl bg-blue-700 text-white px-5 py-2.5 font-semibold hover:bg-blue-800 transition disabled:opacity-50 text-sm whitespace-nowrap"
                  >
                    {congregacaoSalvando ? "Salvando…" : "Salvar"}
                  </button>
                </div>
                <p className="text-xs text-blue-500 mt-2">Somente o administrador pode alterar a congregação do membro.</p>
              </div>

              {/* Alterar função */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">⛪ Função na Igreja</h4>
                <div className="flex items-center gap-3">
                  <select
                    value={funcaoEditando}
                    onChange={e => setFuncaoEditando(e.target.value)}
                    className="flex-1 rounded-xl border border-amber-200 px-3 py-2.5 text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                  >
                    {FUNCOES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <button
                    onClick={salvarFuncao}
                    disabled={funcaoSalvando || funcaoEditando === (fichaModal.membro.funcao || fichaModal.ficha.church_function)}
                    className="rounded-xl bg-blue-700 text-white px-5 py-2.5 font-semibold hover:bg-blue-800 transition disabled:opacity-50 text-sm whitespace-nowrap"
                  >
                    {funcaoSalvando ? "Salvando…" : "Salvar Função"}
                  </button>
                </div>
                <p className="text-xs text-amber-500 mt-2">Somente o administrador pode alterar a função do membro.</p>
              </div>

              {/* Ações de aprovação */}
              {fichaModal.membro.status === "pendente" && (
                <div className="flex gap-3">
                  <button onClick={() => atualizarStatus(fichaModal.membro.id, "aprovar")} disabled={membrosBusy}
                    className="flex-1 rounded-xl bg-green-600 text-white px-4 py-3 font-bold hover:bg-green-700 transition disabled:opacity-50">
                    ✅ Aprovar Membro
                  </button>
                  <button onClick={() => atualizarStatus(fichaModal.membro.id, "reprovar")} disabled={membrosBusy}
                    className="flex-1 rounded-xl border border-red-200 text-red-600 px-4 py-3 font-bold hover:bg-red-50 transition disabled:opacity-50">
                    ❌ Reprovar
                  </button>
                </div>
              )}
              {fichaModal.membro.status === "aprovado" && (
                <button onClick={() => atualizarStatus(fichaModal.membro.id, "reprovar")} disabled={membrosBusy}
                  className="w-full rounded-xl border border-red-200 text-red-600 px-4 py-3 font-bold hover:bg-red-50 transition disabled:opacity-50">
                  Revogar acesso
                </button>
              )}
              {fichaModal.membro.status === "reprovado" && (
                <button onClick={() => atualizarStatus(fichaModal.membro.id, "aprovar")} disabled={membrosBusy}
                  className="w-full rounded-xl bg-green-600 text-white px-4 py-3 font-bold hover:bg-green-700 transition disabled:opacity-50">
                  Aprovar mesmo assim
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, full }: { label: string; value?: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{label}</div>
      <div className="text-sm text-slate-800 font-medium mt-0.5">{value || "—"}</div>
    </div>
  );
}
