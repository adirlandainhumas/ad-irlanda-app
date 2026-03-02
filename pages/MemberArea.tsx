import { useEffect, useRef, useState, type ChangeEvent, type FC, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  AlertCircle, Calendar, Camera, CheckCircle2, CreditCard,
  Loader2, Lock, LogOut, Mail, Phone, Save, Upload,
  User, UserCircle, Users, X, Download, Share2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { emptyMemberDetails, formatDate, isFichaComplete, type MemberDetails } from '../types';

const PHOTO_BUCKET = 'member-photos';
const ADMIN_WHATSAPP = '556294478817'; // +55 62 9 4478-817
const LOGO_URL = 'https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png';

// ─── Geração do Cartão CNH Digital ───────────────────────────────────────────
async function gerarCartaoCNH(
  details: MemberDetails,
  photoUrl: string | null,
  memberId: string,
): Promise<string> {
  return new Promise(async (resolve) => {
    const W = 856, H = 540; // proporção CNH
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // ── Fundo ──────────────────────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#0a1628');
    bgGrad.addColorStop(0.5, '#0d1f45');
    bgGrad.addColorStop(1, '#061020');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Faixa lateral esquerda ─────────────────────────────────────────────
    const sideGrad = ctx.createLinearGradient(0, 0, 0, H);
    sideGrad.addColorStop(0, '#1a55d0');
    sideGrad.addColorStop(1, '#0040a0');
    ctx.fillStyle = sideGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(180, 0);
    ctx.lineTo(160, H); ctx.lineTo(0, H);
    ctx.closePath(); ctx.fill();

    // ── Padrão geométrico na faixa ─────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (let y = -20; y < H + 20; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(180, y + 30);
      ctx.stroke();
    }
    ctx.restore();

    // ── Glows de fundo ─────────────────────────────────────────────────────
    const glow1 = ctx.createRadialGradient(W * 0.7, H * 0.3, 0, W * 0.7, H * 0.3, 280);
    glow1.addColorStop(0, 'rgba(26,85,208,0.18)');
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1; ctx.fillRect(0, 0, W, H);

    const glow2 = ctx.createRadialGradient(W * 0.9, H * 0.8, 0, W * 0.9, H * 0.8, 200);
    glow2.addColorStop(0, 'rgba(0,144,255,0.12)');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2; ctx.fillRect(0, 0, W, H);

    // ── Logo na faixa esquerda ─────────────────────────────────────────────
    try {
      const logo = new Image(); logo.crossOrigin = 'anonymous';
      await new Promise<void>((res) => { logo.onload = () => res(); logo.onerror = () => res(); logo.src = LOGO_URL; });
      if (logo.complete && logo.naturalWidth > 0) {
        ctx.drawImage(logo, 18, 18, 60, 60);
      }
    } catch {}

    // ── Texto da faixa ─────────────────────────────────────────────────────
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '2px';

    // Rotacionar texto vertical
    ctx.translate(88, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('ASSEMBLÉIA DE DEUS  •  MINISTÉRIO IRLANDA  •  INHUMAS-GO', 0, 0);
    ctx.restore();

    // ── Foto do membro ─────────────────────────────────────────────────────
    const photoX = 192, photoY = 60, photoW = 130, photoH = 160;

    // borda foto
    ctx.save();
    ctx.shadowColor = 'rgba(26,85,208,0.6)';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = 'rgba(80,160,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(photoX - 2, photoY - 2, photoW + 4, photoH + 4, 8);
    ctx.stroke();
    ctx.restore();

    // clip foto
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, 6);
    ctx.clip();

    if (photoUrl) {
      try {
        const img = new Image(); img.crossOrigin = 'anonymous';
        await new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res(); img.src = photoUrl; });
        if (img.complete && img.naturalWidth > 0) {
          // cover
          const aspect = img.naturalWidth / img.naturalHeight;
          const boxAspect = photoW / photoH;
          let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
          if (aspect > boxAspect) { sw = sh * boxAspect; sx = (img.naturalWidth - sw) / 2; }
          else { sh = sw / boxAspect; sy = (img.naturalHeight - sh) / 2; }
          ctx.drawImage(img, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
        } else { drawPhotoPlaceholder(ctx, photoX, photoY, photoW, photoH); }
      } catch { drawPhotoPlaceholder(ctx, photoX, photoY, photoW, photoH); }
    } else { drawPhotoPlaceholder(ctx, photoX, photoY, photoW, photoH); }
    ctx.restore();

    // ── Dados do membro ────────────────────────────────────────────────────
    const cx = 340; // coluna dados
    const lineH = 38;
    let cy = 58;

    // Título cartão
    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = 'rgba(80,160,255,0.8)';
    ctx.letterSpacing = '3px';
    ctx.fillText('CARTÃO DE MEMBRO', cx, cy);
    cy += 28;

    // Nome
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillStyle = '#e8f4ff';
    ctx.shadowColor = 'rgba(0,100,255,0.2)';
    ctx.shadowBlur = 8;
    // Trunca nome longo
    let nomeDisplay = details.full_name || 'MEMBRO';
    if (ctx.measureText(nomeDisplay).width > 460) {
      const parts = nomeDisplay.split(' ');
      nomeDisplay = `${parts[0]} ${parts[parts.length - 1]}`;
    }
    ctx.fillText(nomeDisplay.toUpperCase(), cx, cy);
    cy += 10;
    ctx.restore();

    // Linha separadora
    const sepGrad = ctx.createLinearGradient(cx, 0, cx + 460, 0);
    sepGrad.addColorStop(0, 'rgba(80,160,255,0.6)');
    sepGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sepGrad;
    ctx.fillRect(cx, cy, 460, 1);
    cy += 18;

    // Campos em 2 colunas
    const campos: [string, string][] = [
      ['NASCIMENTO', formatDate(details.birth_date)],
      ['ESTADO CIVIL', details.marital_status || '—'],
      ['TELEFONE', details.phone || '—'],
      ['E-MAIL', details.email || '—'],
      ['FUNÇÃO', details.church_function || '—'],
      ['ENTRADA NA IGREJA', formatDate(details.church_entry_date)],
      ['DATA DE BATISMO', formatDate(details.baptism_date)],
      ['CIDADE', `${details.address_city || '—'}/${details.address_state || '—'}`],
    ];

    const col1X = cx, col2X = cx + 240;
    let row = 0;
    campos.forEach(([label, value], i) => {
      const colX = i % 2 === 0 ? col1X : col2X;
      if (i % 2 === 0 && i > 0) row++;
      const rowY = cy + row * lineH;

      ctx.save();
      ctx.font = 'bold 8.5px sans-serif';
      ctx.fillStyle = 'rgba(80,160,255,0.65)';
      ctx.letterSpacing = '1.5px';
      ctx.fillText(label, colX, rowY);

      ctx.font = '13px Georgia, serif';
      ctx.fillStyle = 'rgba(210,230,255,0.92)';
      ctx.letterSpacing = '0px';
      // Trunca valor longo
      let val = value;
      if (ctx.measureText(val).width > 220) val = val.slice(0, 28) + '…';
      ctx.fillText(val, colX, rowY + 16);
      ctx.restore();
    });

    cy += (Math.ceil(campos.length / 2)) * lineH + 10;

    // ── Número do cartão e validade ────────────────────────────────────────
    const ano = new Date().getFullYear();
    const anoVal = ano + 1;
    const numCartao = `AD-${ano}-${memberId.slice(0, 4).toUpperCase()}`;
    const validade = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${anoVal}`;

    // Fundo do rodapé
    ctx.save();
    ctx.fillStyle = 'rgba(26,85,208,0.15)';
    ctx.beginPath();
    ctx.roundRect(cx - 4, cy - 6, 504, 48, 8);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = 'bold 8px sans-serif';
    ctx.fillStyle = 'rgba(80,160,255,0.6)';
    ctx.letterSpacing = '1.5px';
    ctx.fillText('Nº DO CARTÃO', cx, cy + 6);
    ctx.font = 'bold 15px Courier New, monospace';
    ctx.fillStyle = 'rgba(180,220,255,0.95)';
    ctx.letterSpacing = '3px';
    ctx.fillText(numCartao, cx, cy + 24);

    ctx.font = 'bold 8px sans-serif';
    ctx.fillStyle = 'rgba(80,160,255,0.6)';
    ctx.letterSpacing = '1.5px';
    ctx.fillText('VALIDADE', cx + 240, cy + 6);
    ctx.font = 'bold 15px Courier New, monospace';
    ctx.fillStyle = 'rgba(180,220,255,0.95)';
    ctx.letterSpacing = '3px';
    ctx.fillText(validade, cx + 240, cy + 24);
    ctx.restore();

    // ── Chip decorativo ────────────────────────────────────────────────────
    ctx.save();
    const chipX = photoX, chipY = photoY + photoH + 16;
    const chipGrad = ctx.createLinearGradient(chipX, chipY, chipX + 44, chipY + 30);
    chipGrad.addColorStop(0, '#d4a843');
    chipGrad.addColorStop(0.5, '#f0c060');
    chipGrad.addColorStop(1, '#b8902a');
    ctx.fillStyle = chipGrad;
    ctx.beginPath();
    ctx.roundRect(chipX, chipY, 44, 32, 4);
    ctx.fill();
    // Detalhes chip
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(chipX + 4, chipY + 4, 36, 24);
    ctx.beginPath(); ctx.moveTo(chipX + 22, chipY + 4); ctx.lineTo(chipX + 22, chipY + 28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(chipX + 4, chipY + 16); ctx.lineTo(chipX + 40, chipY + 16); ctx.stroke();
    ctx.restore();

    // ── Ondas decorativas no canto direito ────────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.07;
    for (let r = 60; r <= 200; r += 40) {
      ctx.beginPath();
      ctx.arc(W + 20, H + 20, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#4090ff';
      ctx.lineWidth = 18;
      ctx.stroke();
    }
    ctx.restore();

    // ── Borda do cartão ───────────────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = 'rgba(60,140,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(1, 1, W - 2, H - 2, 16);
    ctx.stroke();
    ctx.restore();

    resolve(canvas.toDataURL('image/png', 0.95));
  });
}

function drawPhotoPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#0d2040'); g.addColorStop(1, '#1a3060');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(80,140,220,0.3)';
  ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2 - 15, 28, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w / 2, y + h + 20, 55, Math.PI, 0); ctx.fill();
}

// ─── Componente Principal ─────────────────────────────────────────────────────
const MemberArea: FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showFichaForm, setShowFichaForm] = useState(false);
  const [showCard, setShowCard] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [hasFicha, setHasFicha] = useState(false);
  const [memberDetails, setMemberDetails] = useState<MemberDetails>(emptyMemberDetails);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Cartão CNH
  const [cartaoImg, setCartaoImg] = useState<string | null>(null);
  const [gerandoCartao, setGerandoCartao] = useState(false);

  // Status de aprovação
  const [statusMembro, setStatusMembro] = useState<'pendente' | 'aprovado' | 'reprovado' | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      setSession(activeSession);
      if (activeSession) fetchMemberDetails(activeSession.user.id, activeSession.user.user_metadata?.full_name, activeSession.user.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setError(null); setSuccessMsg(null);
      if (currentSession) {
        fetchMemberDetails(currentSession.user.id, currentSession.user.user_metadata?.full_name, currentSession.user.email);
      } else {
        setShowFichaForm(false); setHasFicha(false); setShowCard(false);
        setMemberDetails(emptyMemberDetails); setSelectedPhoto(null);
        setPhotoPreview(null); setPhotoUrl(null);
        setStatusMembro(null); setCartaoImg(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview); };
  }, [photoPreview]);

  const fetchMemberDetails = async (userId: string, profileName?: string, profileEmail?: string) => {
    setFetchingDetails(true);
    try {
      // Verifica status na tabela membros
      const { data: membroData } = await supabase
        .from('membros')
        .select('status')
        .eq('id', userId)
        .maybeSingle();

      if (membroData) setStatusMembro(membroData.status as any);

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

      if (hydratedData.photo_path) await refreshPhotoUrl(hydratedData.photo_path);
      else setPhotoUrl(null);
    } catch (err) {
      const fallback: MemberDetails = { ...emptyMemberDetails, full_name: profileName || '', email: profileEmail || '' };
      setMemberDetails(fallback); setHasFicha(false); setShowFichaForm(true); setPhotoUrl(null);
    } finally {
      setFetchingDetails(false);
    }
  };

  const refreshPhotoUrl = async (photoPath: string) => {
    const { data, error: signedUrlError } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(photoPath, 60 * 60);
    if (signedUrlError) { setPhotoUrl(null); return; }
    setPhotoUrl(data?.signedUrl ?? null);
  };

  const updateMemberField = (field: keyof MemberDetails, value: string) => {
    setMemberDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Selecione apenas arquivos de imagem.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('A imagem deve ter no máximo 5MB.'); return; }
    setError(null); setSelectedPhoto(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadMemberPhoto = async (userId: string) => {
    if (!selectedPhoto) return memberDetails.photo_path || null;
    const extension = selectedPhoto.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${userId}/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(filePath, selectedPhoto, { upsert: false, cacheControl: '3600' });
    if (uploadError) throw uploadError;
    if (memberDetails.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([memberDetails.photo_path]);
    return filePath;
  };

  // ── Auth ──────────────────────────────────────────────────────────────────
  const handleAuth = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true); setError(null); setSuccessMsg(null);
    try {
      if (isSignUp) {
        if (!fullName.trim()) throw new Error('O nome completo é obrigatório.');
        if (!telefone.trim()) throw new Error('O telefone é obrigatório.');

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;

        // Insere na tabela membros com status pendente
        if (signUpData.user) {
          await supabase.from('membros').insert({
            id: signUpData.user.id,
            nome: fullName,
            email,
            telefone,
            status: 'pendente',
          });
        }

        // DESLOGA imediatamente — só entra após aprovação
        await supabase.auth.signOut();

        // Abre WhatsApp do admin
        const adminUrl = 'https://aogimconectinhumas.site/#/admin';
        const msg = `🔔 *Novo cadastro de membro no site!*\n\n👤 *Nome:* ${fullName}\n📧 *E-mail:* ${email}\n📱 *Telefone:* ${telefone}\n\n✅ Acesse a área Admin para aprovar:\n${adminUrl}`;
        const waUrl = `https://web.whatsapp.com/send?phone=${ADMIN_WHATSAPP}&text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');

        setSuccessMsg('✅ Cadastro enviado! Aguarde a aprovação da liderança para fazer login.');
        setIsSignUp(false);
        setFullName(''); setTelefone(''); setEmail(''); setPassword('');
        return;
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      // Verifica aprovação
      const { data: membroData } = await supabase
        .from('membros')
        .select('status')
        .eq('id', signInData.user.id)
        .maybeSingle();

      if (membroData?.status === 'pendente') {
        await supabase.auth.signOut();
        throw new Error('Seu cadastro ainda está aguardando aprovação da liderança.');
      }
      if (membroData?.status === 'reprovado') {
        await supabase.auth.signOut();
        throw new Error('Seu cadastro não foi aprovado. Entre em contato com a liderança.');
      }

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  // ── Salvar Ficha ──────────────────────────────────────────────────────────
  const handleSaveFicha = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    setLoading(true); setError(null); setSuccessMsg(null);

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
        { user_id: session.user.id, ...payload, photo_path: photoPath },
        { onConflict: 'user_id' },
      );
      if (upsertError) throw upsertError;

      // Marca ficha preenchida na tabela membros
      await supabase.from('membros').update({ ficha_preenchida: true }).eq('id', session.user.id);

      const nextDetails = { ...payload, photo_path: photoPath || '' };
      setMemberDetails(nextDetails); setHasFicha(true); setShowFichaForm(false);
      setSelectedPhoto(null); setSuccessMsg('Ficha cadastral salva com sucesso!');
      if (photoPath) await refreshPhotoUrl(photoPath);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar ficha cadastral.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  // ── Gerar Cartão CNH ──────────────────────────────────────────────────────
  const handleGerarCartao = async () => {
    if (!session) return;
    setGerandoCartao(true);
    try {
      const img = await gerarCartaoCNH(memberDetails, photoUrl, session.user.id);
      setCartaoImg(img);
    } finally {
      setGerandoCartao(false);
    }
  };

  const handleDownloadCartao = () => {
    if (!cartaoImg) return;
    const a = document.createElement('a');
    a.href = cartaoImg;
    a.download = `cartao-membro-${memberDetails.full_name.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
  };

  const handleCompartilharCartao = async () => {
    if (!cartaoImg) return;
    try {
      const blob = await (await fetch(cartaoImg)).blob();
      const file = new File([blob], 'cartao-membro.png', { type: 'image/png' });
      const nav = navigator as any;
      if (nav.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
        await nav.share({ files: [file], title: 'Cartão de Membro — AOGIM' });
      } else {
        handleDownloadCartao();
      }
    } catch { handleDownloadCartao(); }
  };

  // ── Render: Logado ────────────────────────────────────────────────────────
  if (session) {
    const userDisplayName = memberDetails.full_name || session.user.user_metadata?.full_name || 'Membro';
    const photoToRender = photoPreview || photoUrl;

    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-blue-600 shadow-inner border border-blue-100 overflow-hidden bg-blue-50">
          {photoToRender
            ? <img src={photoToRender} alt="Foto do membro" className="w-full h-full object-cover" />
            : <User className="w-12 h-12" />
          }
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Olá, {userDisplayName.split(' ')[0]}!</h2>
          <p className="text-slate-500 font-medium text-sm">{session.user.email}</p>
        </div>

        {fetchingDetails && (
          <div className="w-full max-w-xl bg-blue-50 text-blue-700 p-4 rounded-2xl text-sm font-semibold border border-blue-100 flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Carregando seus dados...
          </div>
        )}

        {successMsg && (
          <div className="w-full max-w-xl bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-semibold border border-green-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> {successMsg}
          </div>
        )}

        {error && (
          <div className="w-full max-w-xl bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-semibold border border-red-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
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
            onClick={() => hasFicha ? setShowCard(true) : setShowFichaForm(true)}
            className={`w-full text-white font-bold py-5 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${
              hasFicha ? 'bg-blue-700 hover:bg-blue-800' : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {hasFicha
              ? <><CreditCard className="w-6 h-6" /> Acessar Cartão de Membro</>
              : <><UserCircle className="w-6 h-6" /> Preencher Ficha Cadastral</>
            }
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-500 font-bold py-4 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all border border-slate-100"
          >
            <LogOut className="w-5 h-5" /> Sair da Conta
          </button>
        </div>

        {/* ── Modal Ficha ── */}
        {showFichaForm && (
          <div className="fixed inset-0 top-16 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white w-full max-w-3xl rounded-3xl p-8 shadow-2xl relative my-6">
              <button onClick={() => setShowFichaForm(false)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-black text-blue-900 mb-1">Ficha Cadastral de Membro</h2>
              <p className="text-slate-500 text-sm mb-6">Preencha os dados e envie/capture sua foto.</p>

              <form onSubmit={handleSaveFicha} className="space-y-5">
                {/* Foto */}
                <div className="space-y-2 border border-slate-200 rounded-2xl p-4 bg-slate-50">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Foto do Membro</label>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                      {photoToRender
                        ? <img src={photoToRender} alt="Pré-visualização" className="w-full h-full object-cover" />
                        : <User className="w-8 h-8 text-slate-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-[220px]">
                      <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-white cursor-pointer hover:bg-slate-100 text-sm font-semibold text-slate-700">
                        <Upload className="w-4 h-4" /> Enviar foto da galeria
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                      </label>
                      <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-white cursor-pointer hover:bg-slate-100 text-sm font-semibold text-slate-700 mt-2">
                        <Camera className="w-4 h-4" /> Tirar foto agora
                        <input type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoChange} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Nome Completo" value={memberDetails.full_name} onChange={(v) => updateMemberField('full_name', v)} icon={<UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />} required full />
                  <SelectField label="Sexo" value={memberDetails.gender} onChange={(v) => updateMemberField('gender', v)} options={['Masculino', 'Feminino']} />
                  <DateField label="Data de Nascimento" value={memberDetails.birth_date} onChange={(v) => updateMemberField('birth_date', v)} />
                  <SelectField label="Estado Civil" value={memberDetails.marital_status} onChange={(v) => updateMemberField('marital_status', v)} options={['Solteiro(a)', 'Casado(a)', 'Viúvo(a)', 'Divorciado(a)', 'União Estável']} />
                  <InputField label="Telefone" value={memberDetails.phone} onChange={(v) => updateMemberField('phone', v)} icon={<Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />} required />
                  <InputField label="E-mail" value={memberDetails.email} onChange={(v) => updateMemberField('email', v)} icon={<Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />} required type="email" />
                  <InputField label="Rua / Logradouro" value={memberDetails.address_street} onChange={(v) => updateMemberField('address_street', v)} required />
                  <InputField label="Quadra" value={memberDetails.address_block} onChange={(v) => updateMemberField('address_block', v)} required />
                  <InputField label="Lote / Número" value={memberDetails.address_lot} onChange={(v) => updateMemberField('address_lot', v)} required />
                  <InputField label="Setor / Bairro" value={memberDetails.address_sector} onChange={(v) => updateMemberField('address_sector', v)} required />
                  <InputField label="Cidade" value={memberDetails.address_city} onChange={(v) => updateMemberField('address_city', v)} required />
                  <InputField label="Estado (UF)" value={memberDetails.address_state} onChange={(v) => updateMemberField('address_state', v.toUpperCase())} required />
                  <InputField label="Informações Eclesiásticas" value={memberDetails.church_role_info} onChange={(v) => updateMemberField('church_role_info', v)} icon={<Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />} required />
                  <SelectField label="Função na Igreja" value={memberDetails.church_function} onChange={(v) => updateMemberField('church_function', v)} options={['Membro','Diácono','Diáconisa','Presbítero','Evangelista','Pastor','Auxiliar','Líder de Jovens','Líder de Louvor','Outro']} />
                  <DateField label="Data de Entrada na Igreja" value={memberDetails.church_entry_date} onChange={(v) => updateMemberField('church_entry_date', v)} />
                  <DateField label="Data de Batismo" value={memberDetails.baptism_date} onChange={(v) => updateMemberField('baptism_date', v)} />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Ficha Cadastral</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal Cartão CNH Digital ── */}
        {showCard && (
          <div className="fixed inset-0 top-16 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl my-6">
              <div className="bg-gradient-to-br from-[#0a1628] to-[#061020] rounded-3xl p-6 shadow-2xl border border-blue-900/40 relative">
                <button onClick={() => { setShowCard(false); setCartaoImg(null); }} className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>

                <h2 className="text-white font-black text-xl mb-1">Cartão de Membro</h2>
                <p className="text-blue-300/60 text-sm mb-5">Assembléia de Deus — Ministério Irlanda</p>

                {/* Preview ou placeholder */}
                {cartaoImg ? (
                  <div className="rounded-2xl overflow-hidden border border-blue-500/30 shadow-2xl mb-5">
                    <img src={cartaoImg} alt="Cartão de Membro" className="w-full block" />
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/5 border border-blue-500/20 p-8 mb-5 flex flex-col items-center gap-3 text-center">
                    <CreditCard className="w-12 h-12 text-blue-400/50" />
                    <p className="text-blue-200/60 text-sm">Clique em "Gerar Cartão" para criar sua carteira digital no formato CNH com seus dados e foto.</p>
                    <p className="text-blue-300/40 text-xs">Validade: 1 ano a partir da emissão</p>
                  </div>
                )}

                {/* Ações */}
                <div className="flex gap-3 flex-wrap">
                  {!cartaoImg ? (
                    <button
                      onClick={handleGerarCartao}
                      disabled={gerandoCartao}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                    >
                      {gerandoCartao
                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Gerando…</>
                        : <><CreditCard className="w-5 h-5" /> Gerar Cartão</>
                      }
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleDownloadCartao}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                      >
                        <Download className="w-5 h-5" /> Baixar PNG
                      </button>
                      <button
                        onClick={handleCompartilharCartao}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-white/10"
                      >
                        <Share2 className="w-5 h-5" /> Compartilhar
                      </button>
                      <button
                        onClick={() => setCartaoImg(null)}
                        className="px-5 py-4 bg-white/5 hover:bg-white/10 text-white/60 font-bold rounded-2xl transition-all border border-white/10 text-sm"
                      >
                        Refazer
                      </button>
                    </>
                  )}
                </div>

                <p className="text-center text-blue-400/30 text-xs mt-4">
                  Formato 856×540px — compatível com carteira digital
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Render: Não logado ────────────────────────────────────────────────────
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <h2 className="text-2xl font-black text-center text-slate-800 mb-2">
          {isSignUp ? 'Solicitar Cadastro de Membro' : 'Entrar na área de membros'}
        </h2>
        <p className="text-center text-sm text-slate-500 mb-6">
          {isSignUp
            ? 'Após o cadastro, a liderança receberá uma notificação para aprovar seu acesso.'
            : 'Todos os dados são salvos no Supabase e cada membro vê apenas a própria ficha.'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(62) 99999-9999" className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4" required />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4" required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4" required />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /> <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> <span>{successMsg}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : isSignUp ? 'Solicitar Cadastro' : 'Entrar'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setIsSignUp((p) => !p); setError(null); setSuccessMsg(null); }}
          className="w-full mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          {isSignUp ? 'Já tem conta? Entre aqui' : 'Não tem conta? Solicitar cadastro'}
        </button>
      </div>
    </div>
  );
};

// ─── Helpers de campos ────────────────────────────────────────────────────────
const InputField = ({ label, value, onChange, required = true, type = 'text', icon, full = false }: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; type?: string; icon?: ReactNode; full?: boolean;
}) => (
  <div className={`space-y-1 ${full ? 'md:col-span-2' : ''}`}>
    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">{label}</label>
    <div className="relative">
      {icon}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-white border border-slate-200 rounded-2xl py-4 ${icon ? 'pl-12' : 'pl-4'} pr-4`}
        required={required} />
    </div>
  </div>
);

const SelectField = ({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4" required>
      <option value="">Selecione</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const DateField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">{label}</label>
    <div className="relative">
      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4" required />
    </div>
  </div>
);

export default MemberArea;