
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Notice } from '../types';
import { 
  Lock, Mail, LogOut, Plus, Trash2, Edit3, Save, X, 
  CheckCircle2, AlertCircle, Loader2, ShieldCheck, 
  Eye, EyeOff, Calendar, ChevronRight
} from 'lucide-react';

const ADMIN_EMAIL = 'adirlandainhumaslinks@gmail.com';

const Admin: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Form States
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user.email === ADMIN_EMAIL) fetchNotices();
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user.email === ADMIN_EMAIL) fetchNotices();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchNotices = async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('published_at', { ascending: false });

    if (data) setNotices(data);
    if (error) setError(error.message);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSubmitNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      const payload = {
        title,
        body,
        is_published: isPublished,
        published_at: new Date().toISOString()
      };

      let result;
      if (isEditing) {
        result = await supabase
          .from('notices')
          .update(payload)
          .eq('id', isEditing);
      } else {
        result = await supabase
          .from('notices')
          .insert([payload]);
      }

      if (result.error) throw result.error;

      setSuccess(isEditing ? 'Aviso atualizado!' : 'Aviso criado com sucesso!');
      resetForm();
      fetchNotices();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este aviso?')) return;
    
    try {
      const { error } = await supabase.from('notices').delete().eq('id', id);
      if (error) throw error;
      setSuccess('Aviso excluído.');
      fetchNotices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setTitle('');
    setBody('');
    setIsPublished(true);
    setIsEditing(null);
    setShowForm(false);
  };

  const startEdit = (notice: Notice) => {
    setTitle(notice.title);
    setBody(notice.body);
    setIsPublished(notice.is_published);
    setIsEditing(notice.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Se não estiver logado ou não for o email admin
  if (!session || session.user.email !== ADMIN_EMAIL) {
    if (session && session.user.email !== ADMIN_EMAIL) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Acesso Negado</h2>
          <p className="text-slate-500 mb-8">Você não tem permissão para acessar esta área.</p>
          <button onClick={handleSignOut} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold">Sair</button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-blue-900">Admin Login</h2>
            <p className="text-slate-500 text-sm mt-1">Acesso exclusivo para administradores.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input
                  type="email"
                  placeholder="admin@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {formLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Acessar Painel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard do Administrador
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-blue-900 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8" />
            Painel do Pastor
          </h2>
          <p className="text-slate-500 font-medium">Gerencie os avisos da igreja para o aplicativo.</p>
        </div>
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 text-slate-400 hover:text-red-600 font-bold transition-colors"
        >
          <LogOut className="w-5 h-5" /> Sair
        </button>
      </header>

      {/* FEEDBACK */}
      {(success || error) && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4 ${
          success ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          <div className="flex items-center gap-3">
            {success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold">{success || error}</span>
          </div>
          <button onClick={() => { setSuccess(null); setError(null); }}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* NOVO AVISO / EDITOR */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <button 
          onClick={() => { if(!showForm) resetForm(); setShowForm(!showForm); }}
          className={`w-full p-6 flex items-center justify-between font-black text-lg transition-colors ${showForm ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-800'}`}
        >
          <div className="flex items-center gap-3">
            {isEditing ? <Edit3 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            {isEditing ? 'Editando Aviso' : 'Novo Aviso'}
          </div>
          <ChevronRight className={`w-6 h-6 transition-transform ${showForm ? 'rotate-90' : ''}`} />
        </button>

        {showForm && (
          <form onSubmit={handleSubmitNotice} className="p-8 space-y-6 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Título do Aviso</label>
              <input
                type="text"
                placeholder="Ex: Culto de Jovens"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mensagem (Corpo)</label>
              <textarea
                placeholder="Descreva os detalhes do aviso..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                required
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => setIsPublished(!isPublished)}
                  className={`w-12 h-6 rounded-full relative transition-all ${isPublished ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPublished ? 'left-7' : 'left-1'}`} />
                </div>
                <span className="font-bold text-slate-700">Publicado</span>
              </label>

              <div className="flex-1 flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-4 px-6 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-[2] bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 hover:bg-blue-800 transition-all active:scale-95 disabled:opacity-50"
                >
                  {formLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> {isEditing ? 'Salvar Alterações' : 'Criar Aviso'}</>}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* LISTA DE AVISOS */}
      <section className="space-y-4">
        <h3 className="text-xl font-black text-slate-800 ml-1">Gerenciar Avisos Existentes</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map((notice) => (
            <div key={notice.id} className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    notice.is_published ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {notice.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {notice.is_published ? 'Publicado' : 'Rascunho'}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(notice.published_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">{notice.title}</h4>
                <p className="text-slate-500 text-sm line-clamp-3 mb-6 whitespace-pre-wrap">{notice.body}</p>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                <button 
                  onClick={() => startEdit(notice)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                >
                  <Edit3 className="w-4 h-4" /> Editar
                </button>
                <button 
                  onClick={() => handleDelete(notice.id)}
                  className="p-3 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          {notices.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <Plus className="w-12 h-12 opacity-10 mb-2" />
              <p className="font-bold">Nenhum aviso cadastrado.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Admin;
