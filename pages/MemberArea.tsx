import { useEffect, useState, type FC, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase'; 
codex/reativar-area-de-membros-com-supabase-1xbf7v
import {
  emptyMemberDetails,
  formatDate,
  isFichaComplete,
  type MemberDetails,
} from '../types';

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
  UserCircle,
  Users,
  X,
} from 'lucide-react';

const MemberArea: FC = () => {
  const [session, setSession] = useState<Session | null>(null);
import { User, Mail, Lock, LogOut, AlertCircle, Loader2, CheckCircle2, UserCircle, Phone, Calendar, ArrowLeft, Save, CreditCard, ExternalLink, X } from 'lucide-react';
const MemberArea: React.FC = () => {
  const [session, setSession] = useState<any>(null);
 main
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showFichaForm, setShowFichaForm] = useState(false);
  const [showCard, setShowCard] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [hasFicha, setHasFicha] = useState(false);
  const [memberDetails, setMemberDetails] = useState<MemberDetails>(emptyMemberDetails);

  const logoUrl = 'https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchMemberDetails(session.user.id, session.user.user_metadata?.full_name, session.user.email);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        fetchMemberDetails(
          currentSession.user.id,
          currentSession.user.user_metadata?.full_name,
          currentSession.user.email,
        );
      } else {
        setShowFichaForm(false);
        setHasFicha(false);
        setShowCard(false);
        setMemberDetails(emptyMemberDetails);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMemberDetails = async (userId: string, profileName?: string, profileEmail?: string) => {
    setFetchingDetails(true);
    try {
      const { data, error } = await supabase.from('member_details').select('*').eq('user_id', userId).maybeSingle();

      if (error) throw error;

      const hydratedData: MemberDetails = {
        ...emptyMemberDetails,
        full_name: profileName || '',
        email: profileEmail || '',
        ...(data || {}),
      };

      setMemberDetails(hydratedData);
      const complete = isFichaComplete(hydratedData);
      setHasFicha(complete);
      if (!complete) {
        setShowFichaForm(true);
      }
    } catch (err) {
      console.error('Error fetching member details:', err);
      const fallback: MemberDetails = {
        ...emptyMemberDetails,
        full_name: profileName || '',
        email: profileEmail || '',
      };
      setMemberDetails(fallback);
      setHasFicha(false);
      setShowFichaForm(true);
    } finally {
      setFetchingDetails(false);
    }
  };

  const updateMemberField = (field: keyof MemberDetails, value: string) => {
    setMemberDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleAuth = async (e: FormEvent) => {
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
              full_name: fullName,
            },
          },
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

  const handleSaveFicha = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setLoading(true);
    setError(null);

    const payload: MemberDetails = {
      ...memberDetails,
      full_name: memberDetails.full_name || session.user.user_metadata?.full_name || 'Membro',
      email: memberDetails.email || session.user.email || '',
    };

    if (!isFichaComplete(payload)) {
      setLoading(false);
      setError('Preencha todos os campos da ficha cadastral para continuar.');
      return;
    }

    try {
      const { error } = await supabase
        .from('member_details')
        .upsert(
          {
            user_id: session.user.id,
            ...payload,
          },
          { onConflict: 'user_id' },
        );

      if (error) throw error;

      setMemberDetails(payload);
      setHasFicha(true);
      setSuccessMsg('Ficha cadastral salva com sucesso!');
      setShowFichaForm(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar ficha cadastral.');
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    const userDisplayName = memberDetails.full_name || session.user.user_metadata?.full_name || 'Membro';

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
          <div className="w-full max-w-xl bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-bold border border-green-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5" />
            {successMsg}
          </div>
        )}

        <div className="w-full max-w-xl space-y-4 pt-4">
          {!hasFicha && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-black text-amber-800 uppercase tracking-wide">Ficha cadastral pendente</p>
                <p className="text-sm text-amber-700 mt-1">
                  Complete sua ficha para liberar seu Cartão de Membro Digital no estilo CNH.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => (hasFicha ? setShowCard(true) : setShowFichaForm(true))}
            className={`w-full text-white font-bold py-5 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${
              hasFicha ? 'bg-blue-700 hover:bg-blue-800 shadow-blue-100' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-100'
            }`}
          >
            {hasFicha ? (
              <>
                <CreditCard className="w-6 h-6" /> Acessar Cartão de Membro
              </>
            ) : (
              <>
                <UserCircle className="w-6 h-6" /> Preencher Ficha Cadastral
              </>
            )}
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-400 font-bold py-4 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all border border-slate-100 hover:border-red-100"
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </button>
        </div>

        {showFichaForm && (
          <div className="fixed inset-0 top-16 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white w-full max-w-3xl rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 my-6">
              <button
                onClick={() => setShowFichaForm(false)}
                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Ficha Cadastral de Membro</h2>
                  <p className="text-slate-500 text-sm">
                    Complete os dados para liberar seu cartão de membro digital.
                  </p>
                </div>

                <form onSubmit={handleSaveFicha} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Nome Completo</label>
                      <div className="relative">
                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={memberDetails.full_name}
                          onChange={(e) => updateMemberField('full_name', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Sexo</label>
                      <select
                        value={memberDetails.gender}
                        onChange={(e) => updateMemberField('gender', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4"
                        required
                      >
                        <option value="">Selecione</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Data de Nascimento</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="date"
                          value={memberDetails.birth_date}
                          onChange={(e) => updateMemberField('birth_date', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Estado Civil</label>
                      <select
                        value={memberDetails.marital_status}
                        onChange={(e) => updateMemberField('marital_status', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4"
                        required
                      >
                        <option value="">Selecione</option>
                        <option value="Solteiro(a)">Solteiro(a)</option>
                        <option value="Casado(a)">Casado(a)</option>
                        <option value="Divorciado(a)">Divorciado(a)</option>
                        <option value="Viúvo(a)">Viúvo(a)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Número de Contato</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="(00) 00000-0000"
                          value={memberDetails.phone}
                          onChange={(e) => updateMemberField('phone', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">E-mail</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          placeholder="exemplo@email.com"
                          value={memberDetails.email}
                          onChange={(e) => updateMemberField('email', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">
                        Endereço Completo (Rua/Av)
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Rua ou Av"
                          value={memberDetails.address_street}
                          onChange={(e) => updateMemberField('address_street', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Quadra</label>
                      <input
                        type="text"
                        value={memberDetails.address_block}
                        onChange={(e) => updateMemberField('address_block', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Lote</label>
                      <input
                        type="text"
                        value={memberDetails.address_lot}
                        onChange={(e) => updateMemberField('address_lot', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Setor</label>
                      <input
                        type="text"
                        value={memberDetails.address_sector}
                        onChange={(e) => updateMemberField('address_sector', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Cidade</label>
                      <input
                        type="text"
                        value={memberDetails.address_city}
                        onChange={(e) => updateMemberField('address_city', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Estado</label>
                      <input
                        type="text"
                        placeholder="GO"
                        value={memberDetails.address_state}
                        onChange={(e) => updateMemberField('address_state', e.target.value.toUpperCase())}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">
                        Informações Eclesiásticas (Função na igreja)
                      </label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={memberDetails.church_role_info}
                          onChange={(e) => updateMemberField('church_role_info', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Função</label>
                      <input
                        type="text"
                        value={memberDetails.church_function}
                        onChange={(e) => updateMemberField('church_function', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Data de Entrada na Igreja</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="date"
                          value={memberDetails.church_entry_date}
                          onChange={(e) => updateMemberField('church_entry_date', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Data de Batismo</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="date"
                          value={memberDetails.baptism_date}
                          onChange={(e) => updateMemberField('baptism_date', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-5 rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
                  >
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" /> Salvar Ficha Cadastral
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {showCard && hasFicha && (
          <div className="fixed inset-0 top-16 z-50 flex flex-col items-center justify-center p-6 bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md flex flex-col items-center gap-8">
              <div className="w-full relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 rounded-[2rem] blur opacity-40" />
                <div className="relative bg-gradient-to-br from-emerald-900 via-cyan-900 to-blue-900 rounded-[2rem] p-6 text-white shadow-2xl overflow-hidden border border-white/20">
                  <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={logoUrl} alt="Logo AD" className="h-10 w-auto object-contain" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.25em] font-black">Cartão de Membro Digital</p>
                        <p className="text-[10px] opacity-80">Estilo CNH • Ministério Irlanda</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-black bg-emerald-400/20 border border-emerald-300/30 px-3 py-1 rounded-full">
                      Ativo
                    </span>
                  </div>

                  <div className="relative z-10 mt-6 space-y-2">
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-200 font-black">Nome</p>
                    <h3 className="text-2xl font-black leading-tight uppercase">{memberDetails.full_name}</h3>
                    <p className="text-sm text-cyan-100">{memberDetails.church_function}</p>
                  </div>

                  <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 text-xs border-t border-white/20 pt-4">
                    <div>
                      <p className="opacity-60 uppercase tracking-widest text-[9px]">Sexo</p>
                      <p className="font-bold">{memberDetails.gender}</p>
                    </div>
                    <div>
                      <p className="opacity-60 uppercase tracking-widest text-[9px]">Nascimento</p>
                      <p className="font-bold">{formatDate(memberDetails.birth_date)}</p>
                    </div>
                    <div>
                      <p className="opacity-60 uppercase tracking-widest text-[9px]">Contato</p>
                      <p className="font-bold">{memberDetails.phone}</p>
                    </div>
                    <div>
                      <p className="opacity-60 uppercase tracking-widest text-[9px]">Estado Civil</p>
                      <p className="font-bold">{memberDetails.marital_status}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="opacity-60 uppercase tracking-widest text-[9px]">Endereço</p>
                      <p className="font-bold leading-tight">
                        {memberDetails.address_street}, Qd {memberDetails.address_block}, Lt {memberDetails.address_lot},
                        {' '}
                        {memberDetails.address_sector} - {memberDetails.address_city}/{memberDetails.address_state}
                      </p>
                    </div>
                    <div>
                      <p className="opacity-60 uppercase tracking-widest text-[9px]">Entrada na Igreja</p>
                      <p className="font-bold">{formatDate(memberDetails.church_entry_date)}</p>
                    </div>
                    <div>
                      <p className="opacity-60 uppercase tracking-widest text-[9px]">Batismo</p>
                      <p className="font-bold">{formatDate(memberDetails.baptism_date)}</p>
                    </div>
                  </div>
                </div>
              </div>

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
          <p className="text-slate-500 mt-1">Acesse sua conta para se cadastrar e preencher sua ficha cadastral.</p>
        </div>

        {successMsg && (
          <div className="p-4 bg-green-50 text-green-700 rounded-2xl text-sm font-bold border border-green-100">{successMsg}</div>
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
            disabled={loading || fetchingDetails}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {loading || fetchingDetails ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isSignUp ? (
              'Criar Conta'
            ) : (
              'Entrar'
            )}
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
