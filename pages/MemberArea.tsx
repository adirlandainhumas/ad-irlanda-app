
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Mail, Lock, LogOut, AlertCircle, Loader2, CheckCircle2, UserCircle, Phone, Calendar, ArrowLeft, Save, CreditCard, ExternalLink, X } from 'lucide-react';
const MemberArea: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showFichaForm, setShowFichaForm] = useState(false);
  const [showCard, setShowCard] = useState(false);
  
  // Auth states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Ficha / Member Details states
  const [hasFicha, setHasFicha] = useState(false);
  const [fichaPhone, setFichaPhone] = useState('');
  const [fichaBirthDate, setFichaBirthDate] = useState('');

  const logoUrl = "https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchMemberDetails(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchMemberDetails(session.user.id);
      } else {
        setShowFichaForm(false);
        setHasFicha(false);
        setShowCard(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMemberDetails = async (userId: string) => {
    setFetchingDetails(true);
    try {
      const { data, error } = await supabase
        .from('member_details')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setHasFicha(true);
        setFichaPhone(data.phone || '');
        setFichaBirthDate(data.birth_date || '');
      }
    } catch (err) {
      console.error('Error fetching member details:', err);
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        if (!fullName.trim()) throw new Error('O nome completo é obrigatório.');
        
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });
        if (error) throw error;
        setSuccessMsg('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSaveFicha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    
    setLoading(true);
    setError(null);

    const userFullName = session.user.user_metadata?.full_name || 'Membro';

    try {
      const { error } = await supabase
        .from('member_details')
        .upsert(
          { 
            user_id: session.user.id, 
            full_name: userFullName, 
            phone: fichaPhone, 
            birth_date: fichaBirthDate 
          }, 
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      setHasFicha(true);
      setSuccessMsg('Ficha salva com sucesso!');
      setShowFichaForm(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar ficha.');
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    const userDisplayName = session.user.user_metadata?.full_name || 'Membro';

    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in zoom-in-95 duration-300">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-inner relative">
          <User className="w-12 h-12" />
          <div className="absolute -bottom-1 -right-1 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-800 leading-tight">Olá, {userDisplayName.split(' ')[0]}!</h2>
          <p className="text-slate-500 font-medium text-sm">{session.user.email}</p>
        </div>

        {successMsg && (
          <div className="w-full max-w-xs bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-bold border border-green-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5" />
            {successMsg}
          </div>
        )}

        <div className="w-full max-w-xs space-y-4 pt-4">
          <button
            onClick={() => hasFicha ? setShowCard(true) : setShowFichaForm(true)}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-5 px-6 rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {hasFicha ? (
              <><CreditCard className="w-6 h-6" /> Acessar Cartão de Membro</>
            ) : (
              <><UserCircle className="w-6 h-6" /> Preencher Ficha de Membro</>
            )}
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-400 font-bold py-4 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all border border-slate-100 hover:border-red-100 mt-8"
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </button>
        </div>

        {/* MODAL FICHA */}
        {showFichaForm && (
          <div className="fixed inset-0 top-16 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-300">
              <button 
                onClick={() => setShowFichaForm(false)}
                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Ficha de Membro</h2>
                  <p className="text-slate-500 text-sm">Atualize seus dados na nossa secretaria.</p>
                </div>

                <form onSubmit={handleSaveFicha} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Nome completo</label>
                    <div className="relative">
                      <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      <input
                        type="text"
                        value={userDisplayName}
                        disabled
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Telefone / WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={fichaPhone}
                        onChange={(e) => setFichaPhone(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Data de Nascimento</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="date"
                        value={fichaBirthDate}
                        onChange={(e) => setFichaBirthDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                      <AlertCircle className="w-5 h-5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Ficha</>}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CARTÃO DIGITAL */}
        {showCard && (
          <div className="fixed inset-0 top-16 z-50 flex flex-col items-center justify-center p-6 bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-sm flex flex-col items-center gap-8">
              
              {/* O CARTÃO */}
              <div className="w-full relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                
                <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-950 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-900/40 overflow-hidden aspect-[1.58/1] flex flex-col justify-between border border-white/10">
                  
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none"></div>

                  {/* Topo do Cartão */}
                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex items-center gap-3">
                      <img 
                        src={logoUrl} 
                        alt="Logo AD" 
                        className="h-10 md:h-12 w-auto object-contain"
                      />
                      <div className="flex flex-col">
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] leading-none">Ministério Irlanda</span>
                        <span className="text-[8px] md:text-[9px] opacity-60 uppercase tracking-widest font-bold">Inhumas - GO</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                       <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-blue-400/20 px-3 py-1.5 rounded-full border border-blue-400/20 text-blue-100">Ativo</span>
                    </div>
                  </div>

                  {/* Meio - Nome */}
                  <div className="relative z-10 mt-2">
                    <p className="text-[9px] uppercase tracking-[0.4em] font-black text-blue-300 mb-1 opacity-80">Membro Titular</p>
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none drop-shadow-md">
                      {userDisplayName}
                    </h3>
                  </div>

                  {/* Base - Detalhes */}
                  <div className="flex justify-between items-end relative z-10 border-t border-white/10 pt-4 mt-2">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 w-full">
                      <div className="flex flex-col">
                        <span className="text-[7px] uppercase tracking-widest opacity-50 font-black">Contato</span>
                        <span className="text-xs font-bold tracking-wider">{fichaPhone}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[7px] uppercase tracking-widest opacity-50 font-black">Nascimento</span>
                        <span className="text-xs font-bold tracking-wider">
                          {fichaBirthDate ? new Date(fichaBirthDate).toLocaleDateString('pt-BR') : '--/--/----'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controles do Modal */}
              <div className="w-full space-y-4">
                <button 
                  onClick={() => {
                    setShowCard(false);
                    setShowFichaForm(true);
                  }}
                  className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Atualizar Informações
                </button>

                <button 
                  onClick={() => setShowCard(false)}
                  className="w-full py-5 bg-white text-blue-900 rounded-3xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-blue-900">Área do Membro</h2>
          <p className="text-slate-500 mt-1">Acesse sua conta para ver informações exclusivas.</p>
        </div>

        {successMsg && (
          <div className="p-4 bg-green-50 text-green-700 rounded-2xl text-sm font-bold border border-green-100">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Nome completo</label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 animate-in shake-1">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccessMsg(null);
            }}
            className="text-blue-600 text-sm font-bold hover:underline"
          >
            {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se agora'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberArea;
