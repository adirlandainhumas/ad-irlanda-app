import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const ADMIN_EMAIL = "adirlandainhumaslinks@gmail.com";
const SUPABASE_URL = "https://llevczjsjurdfejwcqpo.supabase.co";
const GALLERY_BUCKET = "galeria";
const GALLERY_FOLDER = "ultimo-culto";

type Notice = {
  id: string;
  title: string;
  body: string;
  is_published?: boolean;
  event_date?: string | null;
  created_at?: string | null;
};

type GalleryFile = {
  name: string;
  path: string;
  url: string;
};

type Membro = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  status: string;
  created_at: string;
};

function formatDateBR(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
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

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [tab, setTab] = useState<"notices" | "photos" | "membros">("notices");
  const isAdmin = sessionEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // login
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");

  // notices
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

  // photos
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photos, setPhotos] = useState<GalleryFile[]>([]);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState<string | null>(null);

  // membros
  const [membros, setMembros] = useState<Membro[]>([]);
  const [membrosBusy, setMembrosBusy] = useState(false);
  const [membrosMsg, setMembrosMsg] = useState<string | null>(null);
  const [membrosErr, setMembrosErr] = useState<string | null>(null);
  const [membroDetalhe, setMembroDetalhe] = useState<Membro | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "pendente" | "aprovado" | "reprovado">("pendente");

  // ── AUTH ────────────────────────────────────────────────────────────────
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
    if (!loading && isAdmin) { loadNotices(); loadPhotos(); loadMembros(); }
  }, [loading, isAdmin]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setNoticeErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setNoticeErr(error.message);
    setPassword("");
  }

  async function signOut() { await supabase.auth.signOut(); }

  // ── NOTICES ─────────────────────────────────────────────────────────────
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
        if (error) throw error;
        setNoticeMsg("Aviso atualizado!");
      } else {
        const { error } = await supabase.from("notices").insert(payload);
        if (error) throw error;
        setNoticeMsg("Aviso criado!");
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
      if (error) throw error;
      setNoticeMsg("Aviso excluído!"); await loadNotices();
    } catch (err: any) { setNoticeErr(err?.message ?? "Erro."); }
    finally { setNoticeBusy(false); }
  }

  // ── PHOTOS ──────────────────────────────────────────────────────────────
  async function loadPhotos() {
    setPhotoBusy(true); setPhotoErr(null);
    try {
      const { data, error } = await supabase.storage.from(GALLERY_BUCKET).list(GALLERY_FOLDER, { limit: 200 });
      if (error) throw error;
      setPhotos((data ?? []).filter(f => f.name && !f.name.startsWith(".")).map(f => ({
        name: f.name,
        path: `${GALLERY_FOLDER}/${f.name}`,
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
      if (error) throw error;
      setPhotoMsg("Foto excluída!"); await loadPhotos();
    } catch (err: any) { setPhotoErr(err?.message ?? "Erro."); }
    finally { setPhotoBusy(false); }
  }

  // ── MEMBROS ─────────────────────────────────────────────────────────────
  async function loadMembros() {
    setMembrosBusy(true); setMembrosErr(null);
    try {
      const { data, error } = await supabase
        .from("membros")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setMembros((data as Membro[]) ?? []);
    } catch (err: any) { setMembrosErr(err?.message ?? "Erro ao carregar membros."); }
    finally { setMembrosBusy(false); }
  }

  async function atualizarStatus(membroId: string, acao: "aprovar" | "reprovar") {
    setMembrosBusy(true); setMembrosMsg(null); setMembrosErr(null);
    try {
      const res = await fetch("/.netlify/functions/membro-aprovar", {
        method: "POST",
        body: JSON.stringify({ membroId, acao }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMembrosMsg(acao === "aprovar" ? "Membro aprovado! ✅" : "Membro reprovado.");
      setMembroDetalhe(null);
      await loadMembros();
    } catch (err: any) { setMembrosErr(err?.message ?? "Erro ao atualizar."); }
    finally { setMembrosBusy(false); }
  }

  const membrosFiltrados = useMemo(() => {
    if (filtroStatus === "todos") return membros;
    return membros.filter(m => m.status === filtroStatus);
  }, [membros, filtroStatus]);

  const pendentesCount = useMemo(() => membros.filter(m => m.status === "pendente").length, [membros]);

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
    return "Gerenciar Membros";
  }, [tab]);

  // ── RENDER ───────────────────────────────────────────────────────────────
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
                <input className="mt-1 w-full rounded-xl border px-3 py-3 outline-none focus:ring-2 focus:ring-blue-200" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" />
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

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Painel do Pastor</h1>
            <p className="text-slate-600 mt-1">{pageTitle}</p>
          </div>
          <button onClick={signOut} className="rounded-xl px-4 py-2 border bg-white hover:bg-slate-50 transition text-slate-700">Sair</button>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 flex-wrap">
          {(["notices","photos","membros"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl px-4 py-2 border transition relative ${tab===t ? "bg-blue-700 text-white border-blue-700" : "bg-white hover:bg-slate-50"}`}
            >
              {t === "notices" && "Avisos"}
              {t === "photos"  && "Fotos (Galeria)"}
              {t === "membros" && (
                <span className="flex items-center gap-2">
                  Membros
                  {pendentesCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {pendentesCount}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Mensagens globais */}
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

        {/* ── TAB MEMBROS ── */}
        {tab === "membros" && (
          <div className="mt-8">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Cadastros de Membros</h2>
              <button onClick={loadMembros} className="rounded-xl bg-white border px-4 py-2 hover:bg-slate-50 transition text-sm">↻ Atualizar</button>
            </div>

            {/* Filtros */}
            <div className="mt-4 flex gap-2 flex-wrap">
              {(["pendente","aprovado","reprovado","todos"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFiltroStatus(f)}
                  className={`rounded-full px-4 py-1.5 text-sm border transition ${filtroStatus===f ? "bg-blue-700 text-white border-blue-700" : "bg-white hover:bg-slate-50"}`}
                >
                  {f === "pendente"  && `⏳ Pendentes (${membros.filter(m=>m.status==="pendente").length})`}
                  {f === "aprovado"  && `✅ Aprovados (${membros.filter(m=>m.status==="aprovado").length})`}
                  {f === "reprovado" && `❌ Reprovados (${membros.filter(m=>m.status==="reprovado").length})`}
                  {f === "todos"     && `Todos (${membros.length})`}
                </button>
              ))}
            </div>

            {/* Lista */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {membrosFiltrados.map(m => (
                <div key={m.id} className="bg-white rounded-2xl border shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{m.nome}</div>
                      <div className="text-sm text-slate-500 mt-0.5 truncate">{m.email}</div>
                      <div className="text-sm text-slate-500">{m.telefone}</div>
                      <div className="text-xs text-slate-400 mt-1">Cadastrado em {formatDateBR(m.created_at)}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 font-semibold ${statusColor(m.status)}`}>
                      {statusLabel(m.status)}
                    </span>
                  </div>

                  {m.status === "pendente" && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => atualizarStatus(m.id, "aprovar")}
                        disabled={membrosBusy}
                        className="flex-1 rounded-xl bg-green-600 text-white px-4 py-2.5 font-semibold hover:bg-green-700 transition disabled:opacity-50 text-sm"
                      >
                        ✅ Aprovar
                      </button>
                      <button
                        onClick={() => atualizarStatus(m.id, "reprovar")}
                        disabled={membrosBusy}
                        className="flex-1 rounded-xl border border-red-200 text-red-600 px-4 py-2.5 font-semibold hover:bg-red-50 transition disabled:opacity-50 text-sm"
                      >
                        ❌ Reprovar
                      </button>
                    </div>
                  )}

                  {m.status === "aprovado" && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => atualizarStatus(m.id, "reprovar")}
                        disabled={membrosBusy}
                        className="flex-1 rounded-xl border border-red-200 text-red-600 px-4 py-2.5 text-sm hover:bg-red-50 transition disabled:opacity-50"
                      >
                        Revogar acesso
                      </button>
                    </div>
                  )}

                  {m.status === "reprovado" && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => atualizarStatus(m.id, "aprovar")}
                        disabled={membrosBusy}
                        className="flex-1 rounded-xl bg-green-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
                      >
                        Aprovar mesmo assim
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {membrosFiltrados.length === 0 && (
              <div className="mt-10 text-center text-slate-500">
                {filtroStatus === "pendente" ? "Nenhum cadastro pendente. 🎉" : "Nenhum membro encontrado."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FORM MODAL — Avisos */}
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
    </div>
  );
}