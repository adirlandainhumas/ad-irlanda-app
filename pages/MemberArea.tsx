import { useEffect, useState, type ChangeEvent, type FC, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Phone,
  Save,
  Upload,
  User,
  UserCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { emptyMemberDetails, type MemberDetails } from '../types';

const PHOTO_BUCKET = 'member-photos';

const MemberArea: FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [memberDetails, setMemberDetails] = useState<MemberDetails>(emptyMemberDetails);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const forceLoginEveryRefresh = async () => {
      await supabase.auth.signOut();
      setSession(null);
    };

    forceLoginEveryRefresh();

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

      const nextDetails: MemberDetails = {
        ...emptyMemberDetails,
        full_name: profileName || '',
        email: profileEmail || '',
        ...(data || {}),
      };

      setMemberDetails(nextDetails);
      setSelectedPhoto(null);

      if (nextDetails.photo_path) {
        await refreshPhotoUrl(nextDetails.photo_path);
      } else {
        setPhotoUrl(null);
      }
    } catch (err) {
      console.error('Erro ao buscar ficha do membro:', err);
      setMemberDetails({
        ...emptyMemberDetails,
        full_name: profileName || '',
        email: profileEmail || '',
      });
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
      console.error('Erro ao gerar URL assinada da foto:', signedUrlError);
      setPhotoUrl(null);
      return;
    }

    setPhotoUrl(data?.signedUrl || null);
  };

  const updateMemberField = (field: keyof MemberDetails, value: string) => {
    setMemberDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem válido.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem precisa ter no máximo 5MB.');
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

  const validateFicha = (details: MemberDetails) => {
    if (!details.full_name.trim()) return 'Nome completo é obrigatório.';
    if (!details.gender.trim()) return 'Sexo é obrigatório.';
    if (!details.birth_date.trim()) return 'Data de nascimento é obrigatória.';
    if (!details.marital_status.trim()) return 'Estado civil é obrigatório.';
    if (!details.address_street.trim()) return 'Logradouro é obrigatório.';
    if (!details.address_block.trim()) return 'Número é obrigatório.';
    if (!details.address_sector.trim()) return 'Bairro é obrigatório.';
    if (!details.postal_code.trim()) return 'CEP é obrigatório.';
    if (!details.address_city.trim()) return 'Cidade é obrigatória.';
    if (!details.address_state.trim()) return 'UF é obrigatória.';
    if (!details.phone.trim()) return 'Número de celular é obrigatório.';
    if (!details.email.trim()) return 'E-mail é obrigatório.';
    if (!details.church_entry_date.trim()) return 'Data de entrada na igreja é obrigatória.';
    if (!details.baptism_date.trim()) return 'Data de batismo é obrigatória.';
    if (!details.church_function.trim()) return 'Função é obrigatória.';
    return null;
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
        setSuccessMsg('Cadastro criado. Confirme seu e-mail e faça login.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação.');
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
      full_name: memberDetails.full_name || session.user.user_metadata?.full_name || '',
      email: memberDetails.email || session.user.email || '',
    };

    const validationError = validateFicha(payload);
    if (validationError) {
      setError(validationError);
      setLoading(false);
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

      setMemberDetails({ ...payload, photo_path: photoPath || '' });
      setSelectedPhoto(null);
      setSuccessMsg('Ficha cadastral salva com sucesso.');

      if (photoPath) {
        await refreshPhotoUrl(photoPath);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar ficha cadastral.');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
          <h2 className="text-2xl font-black text-center text-slate-800 mb-2">
            {isSignUp ? 'Criar conta de membro' : 'Entrar na área de membros'}
          </h2>
          <p className="text-center text-sm text-slate-500 mb-6">
            Após cada refresh o login é solicitado novamente.
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <InputField
                label="Nome completo"
                value={fullName}
                onChange={setFullName}
                icon={<User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />}
              />
            )}

            <InputField
              label="E-mail"
              value={email}
              onChange={setEmail}
              icon={<Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />}
              type="email"
            />

            <InputField
              label="Senha"
              value={password}
              onChange={setPassword}
              icon={<Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />}
              type="password"
            />

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">
                <CheckCircle2 className="w-5 h-5" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : isSignUp ? 'Criar conta' : 'Entrar'}
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
  }

  const photoToRender = photoPreview || photoUrl;

  return (
    <div className="min-h-[70vh] flex items-start justify-center p-4 sm:p-8">
      <div className="w-full max-w-3xl bg-[#f4f4f4] rounded-2xl border border-slate-300 shadow-xl p-6 sm:p-10">
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png"
            alt="Logo Assembleia de Deus"
            className="w-24 h-24 object-contain"
          />
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">FICHA CADASTRAL DE MEMBRO</h2>
        </div>

        {fetchingDetails && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-100">
            <Loader2 className="w-5 h-5 animate-spin" />
            Carregando dados da ficha...
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveFicha} className="space-y-6">
          <div className="space-y-2 border border-slate-300 rounded-xl p-4 bg-white">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Foto do membro</label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                {photoToRender ? (
                  <img src={photoToRender} alt="Foto do membro" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-10 h-10 text-slate-500" />
                )}
              </div>

              <div className="flex-1 min-w-[220px]">
                <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 cursor-pointer hover:bg-slate-100 text-sm font-semibold text-slate-700">
                  <Upload className="w-4 h-4" />
                  Enviar foto da galeria
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
                <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 cursor-pointer hover:bg-slate-100 text-sm font-semibold text-slate-700 mt-2">
                  <Camera className="w-4 h-4" />
                  Capturar foto
                  <input type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoChange} />
                </label>
              </div>
            </div>
          </div>

          <InputField label="Nome completo" value={memberDetails.full_name} onChange={(v) => updateMemberField('full_name', v)} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Sexo"
              value={memberDetails.gender}
              onChange={(v) => updateMemberField('gender', v)}
              options={['Masculino', 'Feminino']}
            />
            <InputField
              label="Data de nascimento"
              value={memberDetails.birth_date}
              onChange={(v) => updateMemberField('birth_date', v)}
              type="date"
            />
          </div>

          <SelectField
            label="Estado civil"
            value={memberDetails.marital_status}
            onChange={(v) => updateMemberField('marital_status', v)}
            options={['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável']}
          />

          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-800">Endereço completo</h3>
            <InputField
              label="Logradouro (rua, avenida, estrada, etc.)"
              value={memberDetails.address_street}
              onChange={(v) => updateMemberField('address_street', v)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Número" value={memberDetails.address_block} onChange={(v) => updateMemberField('address_block', v)} />
              <InputField
                label="Complemento"
                value={memberDetails.address_lot}
                onChange={(v) => updateMemberField('address_lot', v)}
                required={false}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Bairro" value={memberDetails.address_sector} onChange={(v) => updateMemberField('address_sector', v)} />
              <InputField label="CEP" value={memberDetails.postal_code} onChange={(v) => updateMemberField('postal_code', v)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Cidade" value={memberDetails.address_city} onChange={(v) => updateMemberField('address_city', v)} />
              <InputField
                label="UF"
                value={memberDetails.address_state}
                onChange={(v) => updateMemberField('address_state', v.toUpperCase())}
              />
            </div>
          </div>

          <InputField
            label="Número celular"
            value={memberDetails.phone}
            onChange={(v) => updateMemberField('phone', v)}
            icon={<Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />}
          />

          <InputField
            label="E-mail"
            value={memberDetails.email}
            onChange={(v) => updateMemberField('email', v)}
            icon={<Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />}
            type="email"
          />

          <div className="space-y-3">
            <h3 className="text-xl font-black text-slate-800">Informações eclesiásticas</h3>
            <InputField
              label="Data de entrada na igreja"
              value={memberDetails.church_entry_date}
              onChange={(v) => updateMemberField('church_entry_date', v)}
              type="date"
            />
            <InputField
              label="Data de batismo"
              value={memberDetails.baptism_date}
              onChange={(v) => updateMemberField('baptism_date', v)}
              type="date"
            />
            <InputField
              label="Função"
              value={memberDetails.church_function}
              onChange={(v) => updateMemberField('church_function', v)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" /> Salvar ficha cadastral
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const InputField = ({
  label,
  value,
  onChange,
  type = 'text',
  required = true,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  icon?: ReactNode;
}) => (
  <div className="space-y-1">
    <label className="text-sm font-bold text-slate-700">{label}</label>
    <div className="relative">
      {icon}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full border border-slate-300 rounded-xl py-3 ${icon ? 'pl-12' : 'pl-4'} pr-4 bg-white`}
        required={required}
      />
    </div>
  </div>
);

const SelectField = ({
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
    <label className="text-sm font-bold text-slate-700">{label}</label>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full border border-slate-300 rounded-xl py-3 px-4 bg-white"
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

export default MemberArea;
