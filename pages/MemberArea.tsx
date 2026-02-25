import { useEffect, useState, type ChangeEvent, type FC, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AlertCircle, CheckCircle2, CreditCard, Loader2, LogOut, Mail, Phone, Save } from 'lucide-react';
import { AuthPanel } from '../components/member-area/AuthPanel';
import { InputField, SelectField } from '../components/member-area/FieldControls';
import { PhotoUploadField } from '../components/member-area/PhotoUploadField';
import { supabase } from '../lib/supabase';
import { emptyMemberDetails, isFichaComplete, type MemberDetails } from '../types';

const PHOTO_BUCKET = 'member-photos';

const MemberArea: FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [hasCompleteFicha, setHasCompleteFicha] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [memberDetails, setMemberDetails] = useState<MemberDetails>(emptyMemberDetails);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [schemaWarning, setSchemaWarning] = useState<string | null>(null);

  useEffect(() => {
    const forceLoginEveryRefresh = async () => {
      await supabase.auth.signOut();
      setSession(null);
      setAuthReady(true);
    };

    forceLoginEveryRefresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setError(null);
      setSuccessMsg(null);
      setSchemaWarning(null);

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
        setShowCard(false);
        setHasCompleteFicha(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const tryUpsertWithSchemaFallback = async (payload: Record<string, unknown>) => {
    let currentPayload = { ...payload };
    const maxAttempts = Math.max(Object.keys(currentPayload).length + 2, 12);

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const { error: upsertError } = await supabase
        .from('member_details')
        .upsert(currentPayload, { onConflict: 'user_id' });

      if (!upsertError) {
        return { error: null, payloadUsed: currentPayload };
      }

      const message = String(upsertError.message || '');
      const missingColumn = message.match(/Could not find the '([^']+)' column/)?.[1];

      if (!missingColumn || !(missingColumn in currentPayload)) {
        return { error: upsertError, payloadUsed: currentPayload };
      }

      delete currentPayload[missingColumn];
      setSchemaWarning(
        `A coluna '${missingColumn}' não existe no seu Supabase ainda. Salvei os dados possíveis, mas execute o SQL atualizado para guardar tudo.`,
      );
    }

    return {
      error: new Error('Não foi possível salvar os dados da ficha. Atualize o schema no Supabase e tente novamente.'),
      payloadUsed: currentPayload,
    };
  };

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
      const completeFromDb = isFichaComplete(nextDetails);
      setHasCompleteFicha(completeFromDb);

      if (nextDetails.photo_path) {
        await refreshPhotoUrl(nextDetails.photo_path);
      } else {
        setPhotoUrl(null);
        setShowCard(false);
      }
    } catch (err) {
      console.error('Erro ao buscar ficha do membro:', err);
      setMemberDetails({
        ...emptyMemberDetails,
        full_name: profileName || '',
        email: profileEmail || '',
      });
      setPhotoUrl(null);
      setHasCompleteFicha(false);
      setShowCard(false);
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
    setSchemaWarning(null);

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

      const { error: upsertError, payloadUsed } = await tryUpsertWithSchemaFallback({
        user_id: session.user.id,
        ...payload,
        photo_path: photoPath,
      });

      if (upsertError) throw upsertError;

      const completeAfterSave = isFichaComplete(payloadUsed as Partial<MemberDetails>);
      setMemberDetails({ ...payload, photo_path: photoPath || '' });
      setSelectedPhoto(null);
      setHasCompleteFicha(completeAfterSave);
      setSuccessMsg(
        completeAfterSave
          ? 'Ficha cadastral salva com sucesso. Cartão liberado automaticamente!'
          : 'Ficha salva parcialmente. Complete todos os campos para liberar o cartão.',
      );
      setShowCard(completeAfterSave);

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
    setSession(null);
    setShowCard(false);
    setHasCompleteFicha(false);
  };

  if (!authReady) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <AuthPanel
        isSignUp={isSignUp}
        loading={loading}
        fullName={fullName}
        email={email}
        password={password}
        error={error}
        successMsg={successMsg}
        onFullNameChange={setFullName}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleAuth}
        onToggleMode={() => {
          setIsSignUp((prev) => !prev);
          setError(null);
          setSuccessMsg(null);
        }}
      />
    );
  }

  const currentPhoto = photoPreview || photoUrl;

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

        {schemaWarning && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-xl text-sm border border-amber-200">
            <AlertCircle className="w-5 h-5" />
            <span>{schemaWarning}</span>
          </div>
        )}

        <form onSubmit={handleSaveFicha} className="space-y-6">
          <PhotoUploadField photoUrl={currentPhoto} onPhotoChange={handlePhotoChange} />

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
              label="Informações eclesiásticas (cargo/ministério)"
              value={memberDetails.church_role_info}
              onChange={(v) => updateMemberField('church_role_info', v)}
            />
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
            type="button"
            onClick={handleSignOut}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 rounded-xl flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" /> Sair da conta
          </button>

          <button
            type="button"
            onClick={() => {
              if (!hasCompleteFicha) {
                setError('Preencha e salve a ficha completa para liberar o Cartão de Membro.');
                return;
              }
              setShowCard((prev) => !prev);
            }}
            disabled={!hasCompleteFicha}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-5 h-5" />
            {hasCompleteFicha ? (showCard ? 'Ocultar Cartão Digital' : 'Ver Cartão Digital') : 'Cartão bloqueado até ficha completa'}
          </button>

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


          {showCard && (
            <div className="bg-white border-2 border-blue-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold uppercase text-blue-700 tracking-widest">CNH Digital • Cartão de Membro</p>
              <div className="mt-3 flex items-start gap-4">
                <div className="w-20 h-24 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border">
                  {currentPhoto ? (
                    <img src={currentPhoto} alt="Foto do membro" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-500">Sem foto</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-black text-slate-900 text-lg">{memberDetails.full_name || 'Membro'}</p>
                  <p className="text-sm text-slate-600">CPF não informado</p>
                  <p className="text-sm text-slate-600">Função: {memberDetails.church_function || '—'}</p>
                  <p className="text-sm text-slate-600">Validade: {memberDetails.church_entry_date || '—'}</p>
                </div>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default MemberArea;
