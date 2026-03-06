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
  const [tab, setTab] = useState<"notices" | "photos" | "membros" | "oracao">("notices");
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [prayerMsg, setPrayerMsg] = useState<string | null>(null);
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushUrl, setPushUrl] = useState("/avisos");
  const [pushSending, setPushSending] = useState(false);
  const [pushMsg, setPushMsg] = useState<string | null>(null);
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
    if (s === "aprovado")  return "bg-green-50 border-green-100 text-green-700";
    if (s === "reprovado") return "bg-red-50 border-red-100 text-red-700";
    return "bg-yellow-50 border-yellow-100 text-yellow-700";
  };
  const statusLabel = (s: string) => {
    if (s === "aprovado")  return "APROVADO";
    if (s === "reprovado") return "REPROVADO";
    return "PENDENTE";
  };

  const pageTitle = useMemo(() => {
    if (tab === "notices") return "Gerenciar Avisos";
    if (tab === "photos")  return "Gerenciar Fotos";
    if (tab === "oracao")  return "Pedidos de Oração";
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
          {(["notices","photos","membros","oracao"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-xl px-4 py-2 border transition relative ${tab===t ? "bg-blue-700 text-white border-blue-700" : "bg-white hover:bg-slate-50"}`}
            >
              {t === "notices" && "Avisos"}
              {t === "photos"  && "Fotos (Galeria)"}
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
          <div className="mt-6 rounded-xl bg-green-50 border border-green-100 text-green-800 px-4 py-3 flex items-center justify-between">
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
                    <span className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 ${n.is_published ? "bg-green-50 border-green-100 text-green-700" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
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
                {pushMsg && <div className="rounded-xl bg-green-50 border border-green-200 text-green-800 px-3 py-2 text-sm">{pushMsg}</div>}
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
              <div className="bg-green-50 rounded-2xl border border-green-200 p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-green-700">{stats.aprovados}</div>
                <div className="text-xs text-green-600 mt-1">Aprovados</div>
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
                className={`rounded-full px-3 py-1 text-xs border transition ${filtroCongregacao==="todas" ? "bg-indigo-700 text-white border-indigo-700" : "bg-white hover:bg-slate-50"}`}
              >
                🏛 Todas ({contagemCong["todas"] ?? 0})
              </button>
              {CONGREGACOES.map(c => (
                <button key={c} onClick={() => setFiltroCongregacao(c)}
                  className={`rounded-full px-3 py-1 text-xs border transition ${filtroCongregacao===c ? "bg-indigo-700 text-white border-indigo-700" : "bg-white hover:bg-slate-50"}`}
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
                        <div className="text-xs text-blue-600 font-semibold mt-1">⛪ {m.funcao}</div>
                      )}
                      {m.congregacao && (
                        <div className="text-xs text-indigo-600 font-semibold mt-0.5">📍 {m.congregacao}</div>
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
                        className="rounded-xl border border-green-200 text-green-700 px-4 py-2.5 text-sm font-semibold hover:bg-green-50 transition flex items-center gap-1"
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
                    className="text-sm text-blue-600 underline"
                  >
                    Limpar filtros
                  </button>
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
                  <div className="text-xs font-semibold text-indigo-600 mt-1">
                    📍 {fichaModal.membro.congregacao || 'Inhumas - GO'}
                  </div>
                  {fichaModal.ficha.numero_registro && (
                    <div className="text-xs font-mono text-blue-600 mt-1">Nº {fichaModal.ficha.numero_registro}</div>
                  )}
                  {/* Botões de contato rápido */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {(fichaModal.membro.telefone || fichaModal.ficha.phone) && (
                      <a
                        href={whatsappLink(fichaModal.membro.telefone || fichaModal.ficha.phone || '')}
                        target="_blank" rel="noreferrer"
                        className="rounded-lg bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 text-xs font-semibold hover:bg-green-100 transition"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                    {(fichaModal.membro.email || fichaModal.ficha.email) && (
                      <a
                        href={`mailto:${fichaModal.membro.email || fichaModal.ficha.email}`}
                        className="rounded-lg bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 text-xs font-semibold hover:bg-blue-100 transition"
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
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">📍 Congregação</h4>
                <div className="flex items-center gap-3">
                  <select
                    value={congregacaoEditando}
                    onChange={e => setCongregacaoEditando(e.target.value)}
                    className="flex-1 rounded-xl border border-indigo-200 px-3 py-2.5 text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                  >
                    {CONGREGACOES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button
                    onClick={salvarCongregacao}
                    disabled={congregacaoSalvando || congregacaoEditando === fichaModal.membro.congregacao}
                    className="rounded-xl bg-indigo-700 text-white px-5 py-2.5 font-semibold hover:bg-indigo-800 transition disabled:opacity-50 text-sm whitespace-nowrap"
                  >
                    {congregacaoSalvando ? "Salvando…" : "Salvar"}
                  </button>
                </div>
                <p className="text-xs text-indigo-400 mt-2">Somente o administrador pode alterar a congregação do membro.</p>
              </div>

              {/* Alterar função */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">⛪ Função na Igreja</h4>
                <div className="flex items-center gap-3">
                  <select
                    value={funcaoEditando}
                    onChange={e => setFuncaoEditando(e.target.value)}
                    className="flex-1 rounded-xl border border-blue-200 px-3 py-2.5 text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-blue-300 bg-white"
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
                <p className="text-xs text-blue-400 mt-2">Somente o administrador pode alterar a função do membro.</p>
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
