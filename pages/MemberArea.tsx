import { useEffect, useState, type ChangeEvent, type FC, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Phone,
  Save,
  Upload,
  User,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { emptyMemberDetails, formatDate, isFichaComplete, type MemberDetails } from '../types';

const PHOTO_BUCKET = 'member-photos';

const MemberArea: FC = () => {
  const [session, setSession] = useState<Session | null>(null);
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
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      setSession(activeSession);
      if (activeSession) {
        fetchMemberDetails(activeSession.user.id, activeSession.user.user_metadata?.full_name, activeSession.user.email);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setError(null);
      setSuccessMsg(null);

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
        setSelectedPhoto(null);
        setPhotoPreview(null);
        setPhotoUrl(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const fetchMemberDetails = async (userId: string, profileName?: string, profileEmail?: string) => {
    setFetchingDetails(true);

    try {
      const { data, error: queryError } = await supabase
        .from('member_details')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (queryError) throw queryError;

      const hydratedData: MemberDetails = {
        ...emptyMemberDetails,
        full_name: profileName || '',
        email: profileEmail || '',
        ...(data || {}),
      };

      setMemberDetails(hydratedData);
      setHasFicha(isFichaComplete(hydratedData));
      setShowFichaForm(!isFichaComplete(hydratedData));
      setSelectedPhoto(null);

      if (hydratedData.photo_path) {
        await refreshPhotoUrl(hydratedData.photo_path);
      } else {
        setPhotoUrl(null);
      }
    } catch (err) {
      console.error('Erro ao carregar ficha do membro:', err);
      const fallback: MemberDetails = {
        ...emptyMemberDetails,
        full_name: profileName || '',
        email: profileEmail || '',
      };

      setMemberDetails(fallback);
      setHasFicha(false);
      setShowFichaForm(true);
      setPhotoUrl(null);
    } finally {
      setFetchingDetails(false);
    }
  };

  const refreshPhotoUrl = async (photoPath: string) => {
    const { data, error: signedUrlError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(photoPath, 60 * 60);

    if (signedUrlError) {
      console.error('Erro ao gerar URL da foto:', signedUrlError);
      setPhotoUrl(null);
      return;
    }

    setPhotoUrl(data?.signedUrl ?? null);
  };

  const updateMemberField = (field: keyof MemberDetails, value: string) => {
    setMemberDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Selecione apenas arquivos de imagem para a foto do membro.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB.');
      return;
    }

    setError(null);
    setSelectedPhoto(file);

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadMemberPhoto = async (userId: string) => {
    if (!selectedPhoto) {
      return memberDetails.photo_path || null;
    }

    const extension = selectedPhoto.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${userId}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(filePath, selectedPhoto, { upsert: false, cacheControl: '3600' });

    if (uploadError) throw uploadError;

    if (memberDetails.photo_path) {
      await supabase.storage.from(PHOTO_BUCKET).remove([memberDetails.photo_path]);
    }

    return filePath;
  };

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        if (!fullName.trim()) throw new Error('O nome completo é obrigatório.');

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (signUpError) throw signUpError;
        setSuccessMsg('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFicha = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const payload: MemberDetails = {
      ...memberDetails,
      full_name: memberDetails.full_name || session.user.user_metadata?.full_name || 'Membro',
      email: memberDetails.email || session.user.email || '',
    };

    if (!isFichaComplete(payload)) {
      setLoading(false);
      setError('Preencha todos os campos obrigatórios para salvar a ficha cadastral.');
      return;
    }

    try {
      const photoPath = await uploadMemberPhoto(session.user.id);

      const { error: upsertError } = await supabase.from('member_details').upsert(
        {
          user_id: session.user.id,
          ...payload,
          photo_path: photoPath,
        },
        { onConflict: 'user_id' },
      );

      if (upsertError) throw upsertError;

      const nextDetails = { ...payload, photo_path: photoPath || '' };
      setMemberDetails(nextDetails);
      setHasFicha(true);
      setShowFichaForm(false);
      setSelectedPhoto(null);
      setSuccessMsg('Ficha cadastral salva com sucesso!');

      if (photoPath) {
        await refreshPhotoUrl(photoPath);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar ficha cadastral.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (session) {
    const userDisplayName = memberDetails.full_name || session.user.user_metadata?.full_name || 'Membro';
    const photoToRender = photoPreview || photoUrl;

    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-blue-600 shadow-inner border border-blue-100 overflow-hidden bg-blue-50">
          {photoToRender ? (
            <img src={photoToRender} alt="Foto do membro" className="w-full h-full object-cover" />
          ) : (
            <User className="w-12 h-12" />
          )}
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Olá, {userDisplayName.split(' ')[0]}!</h2>
          <p className="text-slate-500 font-medium text-sm">{session.user.email}</p>
        </div>

        {fetchingDetails && (
          <div className="w-full max-w-xl bg-blue-50 text-blue-700 p-4 rounded-2xl text-sm font-semibold border border-blue-100 flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Carregando seus dados...
          </div>
        )}

        {successMsg && (
          <div className="w-full max-w-xl bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-semibold border border-green-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {successMsg}
          </div>
        )}

        {error && (
          <div className="w-full max-w-xl bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-semibold border border-red-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="w-full max-w-xl space-y-4 pt-2">
          {!hasFicha && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Ficha cadastral pendente</p>
                <p className="text-sm text-amber-700 mt-1">Complete sua ficha para liberar seu cartão de membro.</p>
              </div>
            </div>
          )}

          <button
            onClick={() => (hasFicha ? setShowCard(true) : setShowFichaForm(true))}
            className={`w-full text-white font-bold py-5 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${
              hasFicha ? 'bg-blue-700 hover:bg-blue-800' : 'bg-amber-500 hover:bg-amber-600'
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
            className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-500 font-bold py-4 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all border border-slate-100"
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </button>
        </div>

        {showFichaForm && (
          <div className="fixed inset-0 top-16 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white w-full max-w-3xl rounded-3xl p-8 shadow-2xl relative my-6">
              <button
                onClick={() => setShowFichaForm(false)}
                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-black text-blue-900 mb-1">Ficha Cadastral de Membro</h2>
              <p className="text-slate-500 text-sm mb-6">Preencha os dados e envie/capture sua foto.</p>

              <form onSubmit={handleSaveFicha} className="space-y-5">
                <div className="space-y-2 border border-slate-200 rounded-2xl p-4 bg-slate-50">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Foto do Membro</label>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                      {photoToRender ? (
                        <img src={photoToRender} alt="Pré-visualização da foto" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-[220px]">
                      <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-white cursor-pointer hover:bg-slate-100 text-sm font-semibold text-slate-700">
                        <Upload className="w-4 h-4" />
                        Enviar foto da galeria
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                      </label>
                      <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-white cursor-pointer hover:bg-slate-100 text-sm font-semibold text-slate-700 mt-2">
                        <Camera className="w-4 h-4" />
                        Tirar foto agora
                        <input type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoChange} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <inputField label="Nome Completo" value={memberDetails.full_name} onChange={(value) => updateMemberField('full_name', value)} icon={<UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />} required full />

                  <selectField
                    label="Sexo"
                    value={memberDetails.gender}
                    onChange={(value) => updateMemberField('gender', value)}
                    options={['Masculino', 'Feminino']}
                  />

                  <dateField label="Data de Nascimento" value={memberDetails.birth_date} onChange={(value) => updateMemberField('birth_date', value)} />

                  <selectField
                    label="Estado Civil"
                    value={memberDetails.marital_status}
                    onChange={(value) => updateMemberField('marital_status', value)}
                    options={['Solteiro(a)', 'Casado(a)', 'Viúvo(a)', 'Divorciado(a)']}
                  />

                  <inputField label="Telefone" value={memberDetails.phone} onChange={(value) => updateMemberField('phone', value)} icon={<Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />} required />

                  <inputField label="E-mail" value={memberDetails.email} onChange={(value) => updateMemberField('email', value)} icon={<Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />} required type="email" />

                  <inputField label="Rua" value={memberDetails.address_street} onChange={(value) => updateMemberField('address_street', value)} required />
                  <inputField label="Quadra" value={memberDetails.address_block} onChange={(value) => updateMemberField('address_block', value)} required />
                  <inputField label="Lote" value={memberDetails.address_lot} onChange={(value) => updateMemberField('address_lot', value)} required />
                  <inputField label="Setor" value={memberDetails.address_sector} onChange={(value) => updateMemberField('address_sector', value)} required />
                  <inputField label="Cidade" value={memberDetails.address_city} onChange={(value) => updateMemberField('address_city', value)} required />
                  <inputField label="Estado" value={memberDetails.address_state} onChange={(value) => updateMemberField('address_state', value.toUpperCase())} required />

                  <inputField label="Informações Eclesiásticas" value={memberDetails.church_role_info} onChange={(value) => updateMemberField('church_role_info', value)} icon={<Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />} required />
                  <inputField label="Função" value={memberDetails.church_function} onChange={(value) => updateMemberField('church_function', value)} required />

                  <dateField label="Data de Entrada na Igreja" value={memberDetails.church_entry_date} onChange={(value) => updateMemberField('church_entry_date', value)} />
                  <dateField label="Data de Batismo" value={memberDetails.baptism_date} onChange={(value) => updateMemberField('baptism_date', value)} />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70"
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
        )}

        {showCard && (
          <div className="fixed inset-0 top-16 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white w-full max-w-xl rounded-3xl p-8 shadow-2xl relative my-6 border-4 border-blue-100">
              <button
                onClick={() => setShowCard(false)}
                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-200 flex items-center justify-center">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Foto do membro" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-500" />
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-blue-700 font-bold">Cartão de Membro</p>
                  <h3 className="text-xl font-black text-slate-800">{memberDetails.full_name}</h3>
                  <p className="text-sm text-slate-500">{memberDetails.email}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <cardLine label="Nascimento" value={formatDate(memberDetails.birth_date)} icon={<Calendar className="w-4 h-4" />} />
                <cardLine label="Telefone" value={memberDetails.phone} icon={<Phone className="w-4 h-4" />} />
                <cardLine label="Estado civil" value={memberDetails.marital_status} icon={<UserCircle className="w-4 h-4" />} />
                <cardLine label="Função" value={memberDetails.church_function} icon={<Users className="w-4 h-4" />} />
                <cardLine label="Entrada" value={formatDate(memberDetails.church_entry_date)} icon={<Calendar className="w-4 h-4" />} />
                <cardLine label="Batismo" value={formatDate(memberDetails.baptism_date)} icon={<Calendar className="w-4 h-4" />} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <h2 className="text-2xl font-black text-center text-slate-800 mb-2">
          {isSignUp ? 'Criar conta de membro' : 'Entrar na área de membros'}
        </h2>
        <p className="text-center text-sm text-slate-500 mb-6">
          Todos os dados são salvos no Supabase e cada membro vê apenas a própria ficha.
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Nome completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4"
                  required
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
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4"
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
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isSignUp ? (
              'Criar conta'
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setIsSignUp((prev) => !prev);
            setError(null);
            setSuccessMsg(null);
          }}
          className="w-full mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          {isSignUp ? 'Já tem conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
        </button>
      </div>
    </div>
  );
};

const inputField = ({
  label,
  value,
  onChange,
  required = true,
  type = 'text',
  icon,
  full = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  icon?: ReactNode;
  full?: boolean;
}) => (
  <div className={`space-y-1 ${full ? 'md:col-span-2' : ''}`}>
    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">{label}</label>
    <div className="relative">
      {icon}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full bg-white border border-slate-200 rounded-2xl py-4 ${icon ? 'pl-12' : 'pl-4'} pr-4`}
        required={required}
      />
    </div>
  </div>
);

const selectField = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">{label}</label>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4"
      required
    >
      <option value="">Selecione</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

const dateField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">{label}</label>
    <div className="relative">
      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4"
        required
      />
    </div>
  </div>
);

const cardLine = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) => (
  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
    <p className="text-[11px] uppercase tracking-wide text-slate-500 flex items-center gap-1">
      {icon}
      {label}
    </p>
    <p className="font-semibold text-slate-700 mt-1">{value || 'Não informado'}</p>
  </div>
);

export default MemberArea;
