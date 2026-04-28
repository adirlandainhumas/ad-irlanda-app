import React, { useCallback, useEffect, useRef, useState, type ChangeEvent, type FC, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  AlertCircle, Calendar, Camera, CheckCircle2, CreditCard,
  FileText, Loader2, Lock, LogOut, Mail, MapPin, Phone, Save, Upload,
  User, UserCircle, Users, X, Download, Share2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { emptyMemberDetails, formatDate, isFichaComplete, type MemberDetails } from '../types';

const PHOTO_BUCKET = 'member-photos';
const ADMIN_WHATSAPP = '556294478817';
const LOGO_URL = 'https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png';

// ─── Congregações disponíveis ─────────────────────────────────────────────────
const CONGREGACOES = [
  'Inhumas - GO',
  'Uruana - GO',
  'Belo Horizonte - MG',
];

// ─── Gerar PDF ────────────────────────────────────────────────────────────────
async function gerarPDF(frente: string, nomeArquivo: string): Promise<void> {
  const W = 900, H = 580;
  const marginMm = 10;
  const a4wMm = 297 - marginMm * 2;
  const a4hMm = 210 - marginMm * 2;
  const escala = Math.min(a4wMm / W, a4hMm / H);
  const cardWmm = W * escala;
  const cardHmm = H * escala;
  const offsetX = marginMm + (a4wMm - cardWmm) / 2;
  const offsetY = marginMm + (a4hMm - cardHmm) / 2;

  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  document.head.appendChild(script);
  await new Promise<void>((res) => { script.onload = () => res(); });

  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.addImage(frente, 'PNG', offsetX, offsetY, cardWmm, cardHmm);
  doc.save(`${nomeArquivo}.pdf`);
}

// ─── Verifica status ──────────────────────────────────────────────────────────
async function checarStatus(userId: string): Promise<'aprovado'|'pendente'|'reprovado'|'livre'> {
  const { data } = await supabase.from('membros').select('status').eq('id', userId).maybeSingle();
  if (!data) return 'livre';
  return data.status as any;
}

// ─── Geração do Cartão — congregação dinâmica ─────────────────────────────────
async function gerarCartaoCNH(
  details: MemberDetails,
  photoUrl: string | null,
  memberId: string,
  numRegistro: string,
  dataEmissao: string,
  congregacao: string,
): Promise<string> {
  return new Promise(async (resolve) => {
    const W = 1800, H = 1160, S = 2;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(S, S);
    const LW = W / S, LH = H / S;

    // Fundo
    const bgGrad = ctx.createLinearGradient(0, 0, LW, LH);
    bgGrad.addColorStop(0, '#08122a'); bgGrad.addColorStop(1, '#0b1c3e');
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, LW, LH);

    ctx.save(); ctx.globalAlpha = 0.04;
    for (let x = 20; x < LW; x += 28)
      for (let y = 20; y < LH; y += 28) {
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI*2);
        ctx.fillStyle = '#4a90e2'; ctx.fill();
      }
    ctx.restore();

    // Faixa superior
    const faixaH = 110;
    const faixaGrad = ctx.createLinearGradient(0, 0, LW, faixaH);
    faixaGrad.addColorStop(0, '#1040b0'); faixaGrad.addColorStop(0.6, '#1a55d0'); faixaGrad.addColorStop(1, '#0d3a9e');
    ctx.fillStyle = faixaGrad; ctx.fillRect(0, 0, LW, faixaH);

    ctx.save(); ctx.globalAlpha = 0.08;
    for (let r = 80; r <= 320; r += 55) {
      ctx.beginPath(); ctx.arc(LW - 60, -20, r, 0, Math.PI*2);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 22; ctx.stroke();
    }
    ctx.restore();

    const lineGrad = ctx.createLinearGradient(0, faixaH, LW, faixaH);
    lineGrad.addColorStop(0, 'transparent'); lineGrad.addColorStop(0.2, '#5090ff');
    lineGrad.addColorStop(0.8, '#5090ff'); lineGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = lineGrad; ctx.fillRect(0, faixaH - 2, LW, 3);

    // Logo
    try {
      const logo = new Image(); logo.crossOrigin = 'anonymous';
      await new Promise<void>((res) => { logo.onload=()=>res(); logo.onerror=()=>res(); logo.src=LOGO_URL; });
      if (logo.complete && logo.naturalWidth > 0) ctx.drawImage(logo, 24, 14, 80, 80);
    } catch {}

    // ── Título + congregação dinâmica no topo ────────────────────────────────
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.font = 'bold 23px Georgia, serif';
    ctx.fillText('ASSEMBLÉIA DE DEUS', 122, 46);
    ctx.font = '14px sans-serif'; ctx.fillStyle = 'rgba(180,210,255,0.85)';
    ctx.fillText(`MINISTÉRIO IRLANDA  •  ${(congregacao || 'INHUMAS - GO').toUpperCase()}`, 122, 68);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.roundRect(LW - 215, 28, 190, 52, 26); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(LW - 215, 28, 190, 52, 26); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('CARTÃO DE MEMBRO', LW - 120, 60);
    ctx.restore();

    // Foto
    const photoW = 158, photoH = 198;
    const photoX = 22, photoY = faixaH + 18;

    ctx.save();
    ctx.shadowColor = 'rgba(20,80,220,0.5)'; ctx.shadowBlur = 20;
    ctx.strokeStyle = 'rgba(80,150,255,0.6)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(photoX - 2, photoY - 2, photoW + 4, photoH + 4, 10); ctx.stroke();
    ctx.restore();

    ctx.save(); ctx.beginPath(); ctx.roundRect(photoX, photoY, photoW, photoH, 8); ctx.clip();
    if (photoUrl) {
      try {
        const img = new Image(); img.crossOrigin = 'anonymous';
        await new Promise<void>((res) => { img.onload=()=>res(); img.onerror=()=>res(); img.src=photoUrl; });
        if (img.complete && img.naturalWidth > 0) {
          const aspect = img.naturalWidth/img.naturalHeight, boxAspect = photoW/photoH;
          let sx=0,sy=0,sw=img.naturalWidth,sh=img.naturalHeight;
          if(aspect>boxAspect){sw=sh*boxAspect;sx=(img.naturalWidth-sw)/2;}
          else{sh=sw/boxAspect;sy=(img.naturalHeight-sh)/2;}
          ctx.drawImage(img,sx,sy,sw,sh,photoX,photoY,photoW,photoH);
        } else { ctx.fillStyle='#1a3060'; ctx.fillRect(photoX,photoY,photoW,photoH); }
      } catch { ctx.fillStyle='#1a3060'; ctx.fillRect(photoX,photoY,photoW,photoH); }
    } else { ctx.fillStyle='#1a3060'; ctx.fillRect(photoX,photoY,photoW,photoH); }
    ctx.restore();

    ctx.save(); ctx.textAlign = 'center';
    let nomeDisplay = details.full_name || 'MEMBRO';
    if (nomeDisplay.split(' ').length > 2) {
      const p = nomeDisplay.split(' '); nomeDisplay = `${p[0]} ${p[p.length-1]}`;
    }
    ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#e8f4ff';
    ctx.fillText(nomeDisplay.toUpperCase(), photoX + photoW/2, photoY + photoH + 20);

    const funcao = details.church_function || 'Membro';
    ctx.font = 'bold 11px sans-serif';
    const badgeW = Math.min(photoW, ctx.measureText(funcao).width + 24);
    ctx.fillStyle = 'rgba(26,85,208,0.7)';
    ctx.beginPath(); ctx.roundRect(photoX + photoW/2 - badgeW/2, photoY + photoH + 28, badgeW, 22, 11); ctx.fill();
    ctx.fillStyle = 'rgba(180,220,255,0.95)';
    ctx.fillText(funcao, photoX + photoW/2, photoY + photoH + 43);
    ctx.restore();

    // ── Selo: ícone da pomba/globo ────────────────────────────────────────────
    const seloX = photoX + photoW / 2;
    const seloY = photoY + photoH + 120;
    const seloR = 56;

    try {
      const seloImg = new Image();
      seloImg.crossOrigin = 'anonymous';
      await new Promise<void>((res) => { seloImg.onload = () => res(); seloImg.onerror = () => res(); seloImg.src = '/selo.png'; });
      if (seloImg.complete && seloImg.naturalWidth > 0) {
        ctx.save();
        // Clip em círculo para manter proporção arredondada
        ctx.beginPath(); ctx.arc(seloX, seloY, seloR, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(seloImg, seloX - seloR, seloY - seloR, seloR * 2, seloR * 2);
        ctx.restore();
        // Anel externo sutil
        ctx.save();
        ctx.beginPath(); ctx.arc(seloX, seloY, seloR + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(180,210,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
      }
    } catch {}

    // Dados
    const dx = photoX + photoW + 26;
    const dy = faixaH + 16;
    const colW = (LW - dx - 20) / 2;

    const drawField = (label: string, value: string, x: number, y: number, maxW = colW - 12) => {
      ctx.save();
      ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = 'rgba(80,160,255,0.75)'; ctx.textAlign = 'left';
      ctx.fillText(label.toUpperCase(), x, y);
      ctx.font = '15px Georgia, serif'; ctx.fillStyle = 'rgba(220,235,255,0.95)';
      let val = value;
      while (ctx.measureText(val).width > maxW && val.length > 4) val = val.slice(0,-1);
      if (val !== value) val += '…';
      ctx.fillText(val, x, y + 19);
      ctx.restore();
    };

    const drawSectionHeader = (label: string, x: number, y: number, w: number) => {
      ctx.save();
      ctx.fillStyle = 'rgba(26,85,208,0.35)';
      ctx.beginPath(); ctx.roundRect(x, y - 14, w, 22, 4); ctx.fill();
      ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = 'rgba(120,180,255,0.9)';
      ctx.textAlign = 'left'; ctx.fillText(label, x + 10, y + 3);
      ctx.restore();
    };

    const sepLine = (y: number) => {
      const g = ctx.createLinearGradient(dx, 0, LW-20, 0);
      g.addColorStop(0,'rgba(80,140,255,0.5)'); g.addColorStop(1,'transparent');
      ctx.fillStyle = g; ctx.fillRect(dx, y, LW - dx - 20, 1);
    };

    let sy2 = dy + 10;

    drawSectionHeader('DADOS PESSOAIS', dx, sy2, LW - dx - 20);
    sy2 += 20;
    drawField('Nome Completo', details.full_name || '—', dx, sy2, LW - dx - 20);
    sy2 += 36;
    drawField('Nascimento', formatDate(details.birth_date), dx, sy2);
    drawField('Estado Civil', details.marital_status || '—', dx + colW, sy2);
    sy2 += 36;
    drawField('Endereço', `${details.address_street||'—'}, ${details.address_lot||''} — ${details.address_sector||''}`, dx, sy2, LW - dx - 20);
    sy2 += 36;
    drawField('Cidade / Estado', `${details.address_city||'—'} / ${details.address_state||'—'}`, dx, sy2, LW - dx - 20);
    sy2 += 40;

    sepLine(sy2 - 6);

    drawSectionHeader('CONTATO', dx, sy2 + 10, LW - dx - 20);
    sy2 += 28;
    drawField('Telefone', details.phone || '—', dx, sy2);
    drawField('E-mail', details.email || '—', dx + colW, sy2, colW - 12);
    sy2 += 40;

    sepLine(sy2 - 6);

    drawSectionHeader('DADOS ECLESIÁSTICOS', dx, sy2 + 10, LW - dx - 20);
    sy2 += 28;
    drawField('Entrada na Igreja', formatDate(details.church_entry_date), dx, sy2);
    drawField('Data de Batismo', formatDate(details.baptism_date), dx + colW, sy2);
    sy2 += 36;

    // ── Texto ministerial com congregação dinâmica ───────────────────────────
    ctx.save();
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = 'rgba(140,190,255,0.65)';
    ctx.textAlign = 'left';
    ctx.fillText(`Assembléia de Deus — Ministério Internacional • Irlanda • ${congregacao || 'Inhumas-GO'} • Brasil`, dx, sy2 + 14);
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = 'rgba(120,175,255,0.55)';
    ctx.fillText('AOGIM — Assembly of God Ireland Ministry', dx, sy2 + 30);
    ctx.restore();

    // Rodapé
    const ano = new Date().getFullYear();
    const validade = `${String(new Date().getMonth()+1).padStart(2,'0')}/${ano+1}`;

    const rodapeGrad = ctx.createLinearGradient(0, LH-55, 0, LH);
    rodapeGrad.addColorStop(0,'rgba(10,20,60,0)'); rodapeGrad.addColorStop(1,'rgba(10,20,60,0.8)');
    ctx.fillStyle = rodapeGrad; ctx.fillRect(0, LH-55, LW, 55);

    const lineRodape = ctx.createLinearGradient(0, 0, LW, 0);
    lineRodape.addColorStop(0,'transparent'); lineRodape.addColorStop(0.3,'rgba(60,120,255,0.4)');
    lineRodape.addColorStop(0.7,'rgba(60,120,255,0.4)'); lineRodape.addColorStop(1,'transparent');
    ctx.fillStyle = lineRodape; ctx.fillRect(0, LH-55, LW, 1);

    ctx.save(); ctx.textAlign = 'left';
    ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = 'rgba(80,160,255,0.65)';
    ctx.fillText('Nº DE REGISTRO', 28, LH-30);
    ctx.font = 'bold 15px Courier New, monospace'; ctx.fillStyle = 'rgba(180,220,255,0.95)';
    ctx.fillText(numRegistro, 28, LH-13);

    ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = 'rgba(80,160,255,0.65)';
    ctx.fillText('EMISSÃO', 230, LH-30);
    ctx.font = 'bold 15px Courier New, monospace'; ctx.fillStyle = 'rgba(180,220,255,0.95)';
    ctx.fillText(dataEmissao, 230, LH-13);

    ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = 'rgba(80,160,255,0.65)';
    ctx.fillText('VALIDADE', 380, LH-30);
    ctx.font = 'bold 15px Courier New, monospace'; ctx.fillStyle = 'rgba(180,220,255,0.95)';
    ctx.fillText(validade, 380, LH-13);

    // ── Congregação no rodapé direito ────────────────────────────────────────
    ctx.textAlign = 'right';
    ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = 'rgba(80,160,255,0.65)';
    ctx.fillText('CONGREGAÇÃO', LW-20, LH-30);
    ctx.font = 'bold 13px Courier New, monospace'; ctx.fillStyle = 'rgba(180,220,255,0.9)';
    ctx.fillText((congregacao || 'INHUMAS - GO').toUpperCase(), LW-20, LH-13);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(60,140,255,0.25)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(1, 1, LW-2, LH-2, 16); ctx.stroke();
    ctx.restore();

    resolve(canvas.toDataURL('image/png', 0.95));
  });
}

// ─── Componente ───────────────────────────────────────────────────────────────
const MemberArea: FC = () => {
  const [session, setSession]               = useState<Session | null>(null);
  const [appLoading, setAppLoading]         = useState(true);
  const [loading, setLoading]               = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [isSignUp, setIsSignUp]             = useState(false);
  const [showFichaForm, setShowFichaForm]   = useState(false);
  const [showCard, setShowCard]             = useState(false);
  const [fullName, setFullName]             = useState('');
  const [email, setEmail]                   = useState('');
  const [telefone, setTelefone]             = useState('');
  const [password, setPassword]             = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [funcaoSignup, setFuncaoSignup]     = useState('Membro');
  const [congregacaoSignup, setCongregacaoSignup] = useState('Inhumas - GO');
  const [error, setError]                   = useState<string | null>(null);
  const [successMsg, setSuccessMsg]         = useState<string | null>(null);
  const [hasFicha, setHasFicha]             = useState(false);
  const [memberDetails, setMemberDetails]   = useState<MemberDetails>(emptyMemberDetails);
  const [selectedPhoto, setSelectedPhoto]   = useState<File | null>(null);
  const [photoPreview, setPhotoPreview]     = useState<string | null>(null);
  const [photoUrl, setPhotoUrl]             = useState<string | null>(null);
  const [cartaoImg, setCartaoImg]           = useState<string | null>(null);
  const [gerandoCartao, setGerandoCartao]   = useState(false);
  // ── Congregação do membro logado (carregada do banco, imutável pelo membro)
  const [congregacaoMembro, setCongregacaoMembro] = useState('Inhumas - GO');

  const bloqueandoAuth = useRef(false);

  const limparEstado = useCallback(() => {
    setSession(null);
    setShowFichaForm(false); setHasFicha(false); setShowCard(false);
    setMemberDetails(emptyMemberDetails); setSelectedPhoto(null);
    setPhotoPreview(null); setPhotoUrl(null); setCartaoImg(null);
    setCongregacaoMembro('Inhumas - GO');
  }, []);

  const carregarDetalhes = useCallback(async (userId: string, profileName?: string, profileEmail?: string) => {
    setFetchingDetails(true);
    try {
      const [{ data }, { data: membroData }] = await Promise.all([
        supabase.from('member_details').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('membros').select('funcao, congregacao').eq('id', userId).maybeSingle(),
      ]);
      const funcaoDoSignup = membroData?.funcao || 'Membro';
      // Carrega congregação — fonte primária: tabela membros
      const congCarregada = membroData?.congregacao || (data as any)?.congregacao || 'Inhumas - GO';
      setCongregacaoMembro(congCarregada);

      const merged: MemberDetails = {
        ...emptyMemberDetails,
        full_name: profileName||'',
        email: profileEmail||'',
        church_function: funcaoDoSignup,
        ...(data||{}),
        ...(data?.church_function ? {} : { church_function: funcaoDoSignup }),
      };
      setMemberDetails(merged);
      const completo = isFichaComplete(merged);
      setHasFicha(completo);
      setShowFichaForm(!completo);
      if (merged.photo_path) {
        const { data: urlData } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(merged.photo_path, 3600);
        setPhotoUrl(urlData?.signedUrl ?? null);
      } else {
        setPhotoUrl(null);
      }
    } catch {
      setMemberDetails({ ...emptyMemberDetails, full_name: profileName||'', email: profileEmail||'' });
      setHasFicha(false); setShowFichaForm(true); setPhotoUrl(null);
    } finally {
      setFetchingDetails(false);
    }
  }, []);

  const processarSessao = useCallback(async (sess: Session) => {
    const status = await checarStatus(sess.user.id);
    if (status === 'pendente') {
      bloqueandoAuth.current = true;
      await supabase.auth.signOut();
      bloqueandoAuth.current = false;
      setError('⏳ Seu cadastro ainda está aguardando aprovação da liderança.');
      return false;
    }
    if (status === 'reprovado') {
      bloqueandoAuth.current = true;
      await supabase.auth.signOut();
      bloqueandoAuth.current = false;
      setError('⚠️ Seu cadastro contém itens a serem verificados, entre em contato com sua liderança.');
      return false;
    }
    setSession(sess);
    await carregarDetalhes(sess.user.id, sess.user.user_metadata?.full_name, sess.user.email);
    return true;
  }, [carregarDetalhes]);

  useEffect(() => {
    let montado = true;
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!montado) return;
      if (s) await processarSessao(s);
      setAppLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (bloqueandoAuth.current) return;
      if (!s) limparEstado();
    });
    return () => { montado = false; subscription.unsubscribe(); };
  }, [processarSessao, limparEstado]);

  useEffect(() => {
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview); };
  }, [photoPreview]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccessMsg(null);
    try {
      if (isSignUp) {
        if (!fullName.trim()) throw new Error('O nome completo é obrigatório.');
        if (!telefone.trim()) throw new Error('O telefone é obrigatório.');
        if (!congregacaoSignup) throw new Error('Selecione sua congregação.');
        if (!funcaoSignup) throw new Error('Selecione sua função na igreja.');

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;

        if (signUpData.user) {
          await supabase.from('membros').insert({
            id: signUpData.user.id, nome: fullName, email, telefone,
            status: 'pendente', funcao: funcaoSignup,
            congregacao: congregacaoSignup,  // ← salva a congregação
          });
        }

        bloqueandoAuth.current = true;
        await supabase.auth.signOut();
        bloqueandoAuth.current = false;

        const msg = `🔔 *Novo cadastro de membro!*\n\n👤 *Nome:* ${fullName}\n📧 *E-mail:* ${email}\n📱 *Telefone:* ${telefone}\n🏛 *Congregação:* ${congregacaoSignup}\n⛪ *Função:* ${funcaoSignup}\n\n✅ Aprovar em:\nhttps://aogimconectinhumas.site/#/admin`;
        window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');

        setSuccessMsg('✅ Cadastro enviado! Aguarde a aprovação da liderança para fazer login.');
        setIsSignUp(false);
        setFullName(''); setTelefone(''); setEmail(''); setPassword('');
        setFuncaoSignup('Membro'); setCongregacaoSignup('Inhumas - GO');
        return;
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error('E-mail ou senha incorretos.');
      await processarSessao(signInData.session!);

    } catch (err: any) {
      bloqueandoAuth.current = true;
      await supabase.auth.signOut();
      bloqueandoAuth.current = false;
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    bloqueandoAuth.current = true;
    await supabase.auth.signOut();
    bloqueandoAuth.current = false;
    limparEstado();
  };

  // ── Foto ──────────────────────────────────────────────────────────────────
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Selecione apenas arquivos de imagem.'); return; }
    if (file.size > 5*1024*1024) { setError('A imagem deve ter no máximo 5MB.'); return; }
    setError(null); setSelectedPhoto(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadFoto = async (userId: string) => {
    if (!selectedPhoto) return memberDetails.photo_path || null;
    const ext = selectedPhoto.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, selectedPhoto, { upsert: false });
    if (uploadError) throw uploadError;
    if (memberDetails.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([memberDetails.photo_path]);
    return path;
  };

  // ── Salvar Ficha ──────────────────────────────────────────────────────────
  const handleSaveFicha = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setLoading(true); setError(null); setSuccessMsg(null);

    const payload: MemberDetails = {
      ...memberDetails,
      full_name: memberDetails.full_name || session.user.user_metadata?.full_name || 'Membro',
      email: memberDetails.email || session.user.email || '',
    };

    if (!isFichaComplete(payload)) {
      setLoading(false); setError('Preencha todos os campos obrigatórios.'); return;
    }

    try {
      const photoPath = await uploadFoto(session.user.id);
      const { error: upsertError } = await supabase.from('member_details').upsert(
        { user_id: session.user.id, ...payload, photo_path: photoPath },
        { onConflict: 'user_id' },
      );
      if (upsertError) throw upsertError;
      await supabase.from('membros').update({ ficha_preenchida: true }).eq('id', session.user.id);

      setMemberDetails({ ...payload, photo_path: photoPath||'' });
      setHasFicha(true); setShowFichaForm(false); setSelectedPhoto(null);
      setSuccessMsg('Ficha cadastral salva com sucesso!');
      if (photoPath) {
        const { data: urlData } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(photoPath, 3600);
        setPhotoUrl(urlData?.signedUrl ?? null);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar ficha.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof MemberDetails, value: string) =>
    setMemberDetails(prev => ({ ...prev, [field]: value }));

  // ── Cartão ────────────────────────────────────────────────────────────────
  const handleGerarCartao = async () => {
    if (!session) return;
    setGerandoCartao(true);
    try {
      const { data: detData } = await supabase
        .from('member_details').select('numero_registro, data_emissao').eq('user_id', session.user.id).maybeSingle();

      let numRegistro = detData?.numero_registro;
      let dataEmissao = detData?.data_emissao;

      if (!numRegistro) {
        // Gera número único e permanente derivado do UUID do usuário
        const hex = session.user.id.replace(/-/g, '').slice(0, 9);
        const seq = (parseInt(hex, 16) % 900000) + 100000;
        numRegistro = `ADI-${new Date().getFullYear()}-${seq}`;
        dataEmissao = new Date().toISOString().split('T')[0];
        await supabase.from('member_details').update({ numero_registro: numRegistro, data_emissao: dataEmissao }).eq('user_id', session.user.id);
      }

      const dataEmissaoFormatada = formatDate(dataEmissao || new Date().toISOString().split('T')[0]);
      // ← Passa congregacaoMembro para o cartão
      setCartaoImg(await gerarCartaoCNH(memberDetails, photoUrl, session.user.id, numRegistro, dataEmissaoFormatada, congregacaoMembro));
    } finally {
      setGerandoCartao(false);
    }
  };

  const nomeArquivo = `cartao-${memberDetails.full_name.replace(/\s+/g,'-').toLowerCase()}`;

  const handleDownloadPNG = () => {
    if (!cartaoImg) return;
    const a = document.createElement('a');
    a.href = cartaoImg; a.download = `${nomeArquivo}.png`; a.click();
  };

  const handleDownloadPDF = async () => {
    if (!cartaoImg) return;
    await gerarPDF(cartaoImg, nomeArquivo);
  };

  const handleCompartilharCartao = async () => {
    if (!cartaoImg) return;
    try {
      const blob = await (await fetch(cartaoImg)).blob();
      const file = new File([blob], `${nomeArquivo}.png`, { type: 'image/png' });
      const nav = navigator as any;
      if (nav.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
        await nav.share({ files: [file], title: 'Cartão de Membro — AOGIM' });
      } else handleDownloadPNG();
    } catch { handleDownloadPNG(); }
  };

  if (appLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-700 animate-spin" />
      </div>
    );
  }

  // ── Logado ────────────────────────────────────────────────────────────────
  if (session) {
    const nome = memberDetails.full_name || session.user.user_metadata?.full_name || 'Membro';
    const fotoRender = photoPreview || photoUrl;
    const primeiroNome = nome.split(' ')[0];

    return (
      <>
        <style>{`
          @keyframes maFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
          @keyframes maSpin   { to{transform:rotate(360deg)} }
          .ma-root { font-family:'Lato',sans-serif; min-height:100vh; background:#F8F7F4; }
          .ma-accent { height:3px; background:linear-gradient(90deg,transparent,#C49A22 18%,#E8B84B 50%,#C49A22 82%,transparent); }
          .ma-in   { opacity:0; animation:maFadeUp .42s cubic-bezier(.22,.61,.36,1) forwards; }
          .ma-in-1 { animation-delay:.06s } .ma-in-2 { animation-delay:.16s } .ma-in-3 { animation-delay:.28s }
          .ma-card {
            background:#fff; border-radius:20px;
            border:1px solid rgba(0,0,0,0.06);
            box-shadow:0 1px 3px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.03);
            padding:24px 20px;
          }
          .ma-photo {
            width:84px; height:84px; border-radius:50%;
            border:2.5px solid rgba(196,154,34,0.38);
            box-shadow:0 0 0 5px rgba(196,154,34,0.09);
            overflow:hidden; background:#F0EAD8;
            display:flex; align-items:center; justify-content:center; flex-shrink:0;
          }
          .ma-photo img { width:100%; height:100%; object-fit:cover; }
          .ma-badge { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:700; letter-spacing:.06em; border-radius:999px; padding:4px 11px; }
          .ma-badge-gold  { background:rgba(196,154,34,0.12); color:#8B6208; border:1px solid rgba(196,154,34,0.24); }
          .ma-badge-blue  { background:rgba(26,63,187,0.08);  color:#1A3FBB; border:1px solid rgba(26,63,187,0.14); }
          .ma-badge-green { background:rgba(22,163,74,0.08);  color:#15803D; border:1px solid rgba(22,163,74,0.14); }
          .ma-badge-amber { background:rgba(217,119,6,0.10);  color:#B45309; border:1px solid rgba(217,119,6,0.19); }
          .ma-divider { height:1px; background:linear-gradient(90deg,transparent,rgba(0,0,0,0.07),transparent); margin:18px 0; }
          .ma-progress { height:4px; border-radius:999px; background:#EDE8DF; overflow:hidden; margin-top:8px; }
          .ma-progress-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,#C49A22,#E8B84B); }
          .ma-btn-primary {
            width:100%; display:flex; align-items:center; justify-content:center; gap:10px;
            background:#1E40AF; color:#fff; border:none; border-radius:14px;
            padding:15px 0; font-family:'Lato',sans-serif; font-size:15px; font-weight:700;
            cursor:pointer; transition:opacity .18s,transform .18s;
          }
          .ma-btn-primary:hover  { opacity:.9; transform:translateY(-1px); }
          .ma-btn-primary:active { transform:none; }
          .ma-btn-secondary {
            width:100%; display:flex; align-items:center; justify-content:center; gap:9px;
            background:transparent; color:#574A3E; border:1px solid rgba(0,0,0,0.09);
            border-radius:14px; padding:13px 0; font-family:'Lato',sans-serif;
            font-size:14px; font-weight:700; cursor:pointer; transition:border-color .18s,color .18s;
          }
          .ma-btn-secondary:hover { border-color:#9E958E; color:#17130E; }
          .ma-btn-ghost {
            width:100%; display:flex; align-items:center; justify-content:center; gap:9px;
            background:transparent; color:#9E958E; border:none; border-radius:14px;
            padding:11px 0; font-family:'Lato',sans-serif; font-size:13px; font-weight:700;
            cursor:pointer; transition:color .18s;
          }
          .ma-btn-ghost:hover { color:#DC2626; }
          .ma-msg { border-radius:14px; padding:13px 15px; display:flex; align-items:flex-start; gap:10px; margin-bottom:12px; }
          .ma-msg-info  { background:rgba(26,63,187,0.06);  border:1px solid rgba(26,63,187,0.12); }
          .ma-msg-error { background:rgba(220,38,38,0.07);  border:1px solid rgba(220,38,38,0.17); }
        `}</style>

        <div className="ma-accent" />
        <main className="ma-root">

          <div style={{ display:"flex", justifyContent:"center", paddingTop:20, paddingBottom:2 }}>
            <img src={LOGO_URL} alt="AOGIM" style={{ width:56, objectFit:"contain" }} />
          </div>

          <div style={{ width:"100%", maxWidth:480, margin:"0 auto", padding:"0 18px 88px" }}>

            {/* Header */}
            <div className="ma-in ma-in-1" style={{ textAlign:"center", padding:"10px 0 20px" }}>
              <span style={{ fontSize:10, letterSpacing:".24em", color:"#1A3FBB", textTransform:"uppercase", fontWeight:700 }}>
                Área do Membro
              </span>
              <h1 style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:"clamp(20px,5vw,24px)", fontWeight:700, color:"#17130E", margin:"7px 0 0", lineHeight:1.22 }}>
                Olá, {primeiroNome}!
              </h1>
            </div>

            {/* Feedback */}
            {fetchingDetails && (
              <div className="ma-msg ma-msg-info ma-in ma-in-1">
                <div style={{ width:16,height:16,border:"2px solid rgba(26,63,187,0.2)",borderTopColor:"#1A3FBB",borderRadius:"50%",animation:"maSpin .85s linear infinite",flexShrink:0,marginTop:1 }} />
                <span style={{ fontSize:13, color:"#1A3FBB", fontWeight:600 }}>Carregando seus dados…</span>
              </div>
            )}
            {successMsg && (
              <div className="ma-msg ma-msg-info ma-in ma-in-1">
                <svg viewBox="0 0 20 20" fill="currentColor" style={{ width:16,height:16,color:"#1A3FBB",flexShrink:0,marginTop:1 }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span style={{ fontSize:13, color:"#1A3FBB", fontWeight:600 }}>{successMsg}</span>
              </div>
            )}
            {error && (
              <div className="ma-msg ma-msg-error ma-in ma-in-1">
                <svg viewBox="0 0 20 20" fill="currentColor" style={{ width:16,height:16,color:"#DC2626",flexShrink:0,marginTop:1 }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <span style={{ fontSize:13, color:"#DC2626", fontWeight:600 }}>{error}</span>
              </div>
            )}

            {/* Card do membro */}
            <div className="ma-card ma-in ma-in-2" style={{ marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <div className="ma-photo">
                  {fotoRender
                    ? <img src={fotoRender} alt="Foto" />
                    : <svg viewBox="0 0 24 24" fill="none" stroke="rgba(155,108,14,0.38)" strokeWidth="1.5" style={{ width:30,height:30 }}>
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                  }
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:17, fontWeight:700, color:"#17130E", margin:"0 0 2px", lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {nome}
                  </p>
                  <p style={{ fontSize:12, color:"#9E958E", margin:"0 0 9px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {session.user.email}
                  </p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    <span className="ma-badge ma-badge-gold">⛪ {memberDetails.church_function || 'Membro'}</span>
                    <span className="ma-badge ma-badge-blue">📍 {congregacaoMembro}</span>
                  </div>
                </div>
              </div>

              <div className="ma-divider" />

              {!hasFicha ? (
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, fontWeight:700, color:"#B45309" }}>Ficha cadastral</span>
                    <span className="ma-badge ma-badge-amber">Pendente</span>
                  </div>
                  <div className="ma-progress"><div className="ma-progress-fill" style={{ width:"25%" }} /></div>
                  <p style={{ fontSize:11, color:"#9E958E", marginTop:6, fontStyle:"italic", fontFamily:"Georgia,serif" }}>
                    Preencha a ficha para liberar o cartão de membro.
                  </p>
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#574A3E" }}>Ficha cadastral</span>
                  <span className="ma-badge ma-badge-green">
                    <svg viewBox="0 0 12 12" fill="currentColor" style={{ width:9,height:9 }}>
                      <path fillRule="evenodd" d="M10.354 3.146a.5.5 0 010 .708l-5 5a.5.5 0 01-.708 0l-2.5-2.5a.5.5 0 11.708-.708L5 7.793l4.646-4.647a.5.5 0 01.708 0z" clipRule="evenodd"/>
                    </svg>
                    Completa
                  </span>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="ma-in ma-in-3" style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {!hasFicha ? (
                <button className="ma-btn-primary" onClick={() => setShowFichaForm(true)}>
                  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width:17,height:17,flexShrink:0 }}>
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                  </svg>
                  Preencher Ficha Cadastral
                </button>
              ) : (
                <button className="ma-btn-primary" onClick={() => setShowCard(true)}>
                  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width:17,height:17,flexShrink:0 }}>
                    <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2H2V5zM2 9h16v6a2 2 0 01-2 2H4a2 2 0 01-2-2V9zm4 2a1 1 0 000 2h1a1 1 0 100-2H6zm4 0a1 1 0 000 2h4a1 1 0 100-2h-4z"/>
                  </svg>
                  Acessar Cartão de Membro
                </button>
              )}
              {hasFicha && (
                <button className="ma-btn-secondary" onClick={() => setShowFichaForm(true)}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:15,height:15,flexShrink:0 }}>
                    <path d="M11 5H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-5M18.364 3.636a2 2 0 010 2.828L10 15l-4 1 1-4 8.364-8.364a2 2 0 012.828 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Editar Ficha Cadastral
                </button>
              )}
              <button className="ma-btn-ghost" onClick={handleSignOut}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:15,height:15,flexShrink:0 }}>
                  <path d="M13 7l5 5m0 0l-5 5m5-5H8M9 3H4a1 1 0 00-1 1v12a1 1 0 001 1h5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sair da Conta
              </button>
            </div>

          </div>
        </main>

        {/* Modal Ficha */}
        {showFichaForm && (
          <div className="fixed inset-0 top-16 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white w-full max-w-3xl rounded-3xl p-8 shadow-2xl relative my-6">
              <button onClick={() => setShowFichaForm(false)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full"><X className="w-5 h-5" /></button>
              <h2 className="text-2xl font-black text-slate-800 mb-1">{hasFicha ? 'Editar Ficha Cadastral' : 'Ficha Cadastral de Membro'}</h2>
              <p className="text-slate-500 text-sm mb-6">{hasFicha ? 'Dados pessoais e de contato podem ser atualizados. Função, congregação e datas do cartão são bloqueadas.' : 'Preencha os dados e envie sua foto.'}</p>

              {/* Função bloqueada */}
              <div className="mb-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-700 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Função na Igreja</p>
                  <p className="text-base font-black text-slate-800">{memberDetails.church_function || 'Membro'}</p>
                </div>
                <Lock className="w-4 h-4 text-blue-400 ml-auto" />
              </div>

              {/* Congregação bloqueada */}
              <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-700 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Congregação</p>
                  <p className="text-base font-black text-slate-800">{congregacaoMembro}</p>
                </div>
                <Lock className="w-4 h-4 text-blue-400 ml-auto" />
              </div>

              <form onSubmit={handleSaveFicha} className="space-y-5">
                <div className="space-y-2 border border-slate-200 rounded-2xl p-4 bg-slate-50">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Foto do Membro</label>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center flex-shrink-0">
                      {(photoPreview||photoUrl) ? <img src={photoPreview||photoUrl!} alt="preview" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-slate-500" />}
                    </div>
                    <div className="flex-1 min-w-[220px] space-y-2">
                      <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-white cursor-pointer hover:bg-slate-100 text-sm font-semibold text-slate-700">
                        <Upload className="w-4 h-4" /> Enviar foto da galeria
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                      </label>
                      <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-white cursor-pointer hover:bg-slate-100 text-sm font-semibold text-slate-700">
                        <Camera className="w-4 h-4" /> Tirar foto agora
                        <input type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoChange} />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Nome Completo" value={memberDetails.full_name} onChange={v=>updateField('full_name',v)} icon={<UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>} required full />
                  <SelectField label="Sexo" value={memberDetails.gender} onChange={v=>updateField('gender',v)} options={['Masculino','Feminino']} />
                  <DateField label="Data de Nascimento" value={memberDetails.birth_date} onChange={v=>updateField('birth_date',v)} />
                  <SelectField label="Estado Civil" value={memberDetails.marital_status} onChange={v=>updateField('marital_status',v)} options={['Solteiro(a)','Casado(a)','Viúvo(a)','Divorciado(a)','União Estável']} />
                  <InputField label="Telefone" value={memberDetails.phone} onChange={v=>updateField('phone',v)} icon={<Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>} required />
                  <InputField label="E-mail" value={memberDetails.email} onChange={v=>updateField('email',v)} icon={<Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>} required type="email" />
                  <InputField label="Rua / Logradouro" value={memberDetails.address_street} onChange={v=>updateField('address_street',v)} required />
                  <InputField label="Quadra" value={memberDetails.address_block} onChange={v=>updateField('address_block',v)} required />
                  <InputField label="Lote / Número" value={memberDetails.address_lot} onChange={v=>updateField('address_lot',v)} required />
                  <InputField label="Setor / Bairro" value={memberDetails.address_sector} onChange={v=>updateField('address_sector',v)} required />
                  <InputField label="Cidade" value={memberDetails.address_city} onChange={v=>updateField('address_city',v)} required />
                  <InputField label="Estado (UF)" value={memberDetails.address_state} onChange={v=>updateField('address_state',v.toUpperCase())} required />
                  <DateField label="Data de Entrada na Igreja" value={memberDetails.church_entry_date} onChange={v=>updateField('church_entry_date',v)} />
                  <DateField label="Data de Batismo" value={memberDetails.baptism_date} onChange={v=>updateField('baptism_date',v)} required={false} />
                </div>
                {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100"><AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}</div>}
                <button type="submit" disabled={loading} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Ficha Cadastral</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Cartão */}
        {showCard && (
          <div className="fixed inset-0 top-16 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl my-6">
              <div className="bg-gradient-to-br from-[#0d1a3a] to-[#071020] rounded-3xl p-6 shadow-2xl border border-blue-900/30 relative">
                <button onClick={() => { setShowCard(false); setCartaoImg(null); }} className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full"><X className="w-5 h-5" /></button>
                <h2 className="text-white font-black text-xl mb-1">Cartão de Membro</h2>
                <p className="text-white/50 text-sm mb-5">Assembléia de Deus — Ministério Irlanda • {congregacaoMembro}</p>

                {cartaoImg ? (
                  <div className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl mb-5">
                    <img src={cartaoImg} alt="Cartão de Membro" className="w-full block" />
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/5 border border-white/15 p-8 mb-5 flex flex-col items-center gap-3 text-center">
                    <CreditCard className="w-12 h-12 text-white/40" />
                    <p className="text-white/60 text-sm">Gere seu cartão com número de registro permanente e selo de autoridade.</p>
                    <p className="text-white/40 text-xs">Congregação: {congregacaoMembro} • Número de registro permanente</p>
                  </div>
                )}

                <div className="flex gap-3 flex-wrap">
                  {!cartaoImg ? (
                    <button onClick={handleGerarCartao} disabled={gerandoCartao} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
                      {gerandoCartao ? <><Loader2 className="w-5 h-5 animate-spin" /> Gerando…</> : <><CreditCard className="w-5 h-5" /> Gerar Cartão</>}
                    </button>
                  ) : (
                    <>
                      <button onClick={handleDownloadPDF} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
                        <FileText className="w-5 h-5" /> Salvar PDF
                      </button>
                      <button onClick={handleDownloadPNG} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 border border-white/10">
                        <Download className="w-5 h-5" /> Baixar PNG
                      </button>
                      <button onClick={handleCompartilharCartao} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 border border-white/10">
                        <Share2 className="w-5 h-5" /> Compartilhar
                      </button>
                      <button onClick={() => setCartaoImg(null)} className="w-full px-5 py-3 bg-white/5 hover:bg-white/10 text-white/50 font-bold rounded-2xl border border-white/10 text-sm">
                        Refazer
                      </button>
                    </>
                  )}
                </div>
                <p className="text-center text-white/25 text-xs mt-4">PDF em A4 landscape • PNG para compartilhar</p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── Não logado ────────────────────────────────────────────────────────────
  const fieldStyle: React.CSSProperties = {
    width:"100%", background:"#FAFAF8", border:"1px solid rgba(0,0,0,0.09)",
    borderRadius:12, padding:"13px 14px 13px 42px",
    fontFamily:"'Lato',sans-serif", fontSize:15, color:"#17130E", outline:"none",
  };
  const labelStyle: React.CSSProperties = {
    fontSize:11, fontWeight:700, letterSpacing:".13em", textTransform:"uppercase",
    color:"#9E958E", display:"block", marginBottom:6,
  };

  return (
    <>
      <style>{`
        .ma-login-root { font-family:'Lato',sans-serif; min-height:88vh; background:#F8F7F4; display:flex; align-items:center; justify-content:center; padding:24px 18px 60px; }
        .ma-login-card { width:100%; max-width:436px; background:#fff; border-radius:22px; border:1px solid rgba(0,0,0,0.06); box-shadow:0 2px 4px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.04); padding:34px 28px 30px; }
        .ma-accent { height:3px; background:linear-gradient(90deg,transparent,#C49A22 18%,#E8B84B 50%,#C49A22 82%,transparent); }
        .ma-field:focus { border-color:rgba(26,63,187,0.35) !important; background:#fff !important; }
      `}</style>

      <div className="ma-accent" />
      <div className="ma-login-root">
        <div className="ma-login-card">

          <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
            <img src={LOGO_URL} alt="AOGIM" style={{ width:54, objectFit:"contain" }} />
          </div>

          <div style={{ textAlign:"center", marginBottom:24 }}>
            <span style={{ fontSize:10, letterSpacing:".24em", color:"#1A3FBB", textTransform:"uppercase", fontWeight:700 }}>
              {isSignUp ? 'Solicitar Cadastro' : 'Área do Membro'}
            </span>
            <h1 style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:"clamp(19px,5vw,22px)", fontWeight:700, color:"#17130E", margin:"7px 0 4px", lineHeight:1.22 }}>
              {isSignUp ? 'Cadastro de Membro' : 'Entrar na conta'}
            </h1>
            <p style={{ fontFamily:"Georgia,serif", fontStyle:"italic", fontSize:13, color:"#9E958E", margin:0 }}>
              {isSignUp ? 'A liderança receberá notificação para aprovar.' : 'Acesse sua ficha e cartão de membro.'}
            </p>
          </div>

          {error && (
            <div style={{ borderRadius:12, padding:"12px 14px", background:"rgba(220,38,38,0.07)", border:"1px solid rgba(220,38,38,0.17)", display:"flex", gap:9, alignItems:"flex-start", marginBottom:16 }}>
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width:15,height:15,color:"#DC2626",flexShrink:0,marginTop:1 }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <span style={{ fontSize:13, color:"#DC2626", fontWeight:600 }}>{error}</span>
            </div>
          )}
          {successMsg && (
            <div style={{ borderRadius:12, padding:"12px 14px", background:"rgba(26,63,187,0.06)", border:"1px solid rgba(26,63,187,0.12)", display:"flex", gap:9, alignItems:"flex-start", marginBottom:16 }}>
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width:15,height:15,color:"#1A3FBB",flexShrink:0,marginTop:1 }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span style={{ fontSize:13, color:"#1A3FBB", fontWeight:600 }}>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {isSignUp && (
              <>
                <div>
                  <label style={labelStyle}>Nome completo</label>
                  <div style={{ position:"relative" }}>
                    <User style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", width:16, height:16, color:"#C0B8B0" }} />
                    <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} className="ma-field" style={fieldStyle} required />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Telefone</label>
                  <div style={{ position:"relative" }}>
                    <Phone style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", width:16, height:16, color:"#C0B8B0" }} />
                    <input type="tel" value={telefone} onChange={e=>setTelefone(e.target.value)} placeholder="(62) 99999-9999" className="ma-field" style={fieldStyle} required />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Congregação</label>
                  <div style={{ position:"relative" }}>
                    <MapPin style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", width:16, height:16, color:"#C0B8B0", zIndex:1 }} />
                    <select value={congregacaoSignup} onChange={e=>setCongregacaoSignup(e.target.value)} className="ma-field" style={{ ...fieldStyle, appearance:"none" as const }} required>
                      {CONGREGACOES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Função na Igreja</label>
                  <div style={{ position:"relative" }}>
                    <Users style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", width:16, height:16, color:"#C0B8B0", zIndex:1 }} />
                    <select value={funcaoSignup} onChange={e=>setFuncaoSignup(e.target.value)} className="ma-field" style={{ ...fieldStyle, appearance:"none" as const }} required>
                      {['Membro','Diácono','Diáconisa','Presbítero','Evangelista','Pastor','Cooperador(a)'].map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <p style={{ fontSize:11, color:"#9E958E", marginTop:4 }}>Será confirmada pela liderança após aprovação.</p>
                </div>
              </>
            )}
            <div>
              <label style={labelStyle}>E-mail</label>
              <div style={{ position:"relative" }}>
                <Mail style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", width:16, height:16, color:"#C0B8B0" }} />
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="ma-field" style={fieldStyle} required />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Senha</label>
              <div style={{ position:"relative" }}>
                <Lock style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", width:16, height:16, color:"#C0B8B0" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  className="ma-field"
                  style={{ ...fieldStyle, paddingRight:42 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#C0B8B0", padding:2, display:"flex", alignItems:"center" }}
                  tabIndex={-1}
                >
                  {showPassword
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:17,height:17 }}>
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:17,height:17 }}>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                  }
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{
              width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:9,
              background:"#1E40AF", color:"#fff", border:"none", borderRadius:13,
              padding:"14px 0", fontFamily:"'Lato',sans-serif", fontSize:15, fontWeight:700,
              cursor:loading?"not-allowed":"pointer", opacity:loading?.6:1, marginTop:2,
            }}>
              {loading
                ? <><div style={{ width:17,height:17,border:"2px solid rgba(255,255,255,0.25)",borderTopColor:"#fff",borderRadius:"50%",animation:"maSpin .85s linear infinite" }} /> Aguarde…</>
                : isSignUp ? 'Solicitar Cadastro' : 'Entrar'
              }
            </button>
          </form>

          <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(0,0,0,0.07),transparent)", margin:"20px 0" }} />

          <button type="button" onClick={() => { setIsSignUp(p=>!p); setError(null); setSuccessMsg(null); }}
            style={{ width:"100%", background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:700, color:"#1A3FBB", fontFamily:"'Lato',sans-serif", padding:"4px 0" }}>
            {isSignUp ? 'Já tem conta? Entre aqui' : 'Não tem conta? Solicitar cadastro'}
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const InputField = ({ label, value, onChange, required=true, type='text', icon, full=false }: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; type?: string; icon?: ReactNode; full?: boolean;
}) => (
  <div className={`space-y-1 ${full ? 'md:col-span-2' : ''}`}>
    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">{label}</label>
    <div className="relative">
      {icon}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        className={`w-full bg-white border border-slate-200 rounded-2xl py-4 ${icon?'pl-12':'pl-4'} pr-4`} required={required} />
    </div>
  </div>
);

const SelectField = ({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">{label}</label>
    <select value={value} onChange={e=>onChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4" required>
      <option value="">Selecione</option>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const DateField = ({ label, value, onChange, required = true }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">{label}{!required && <span className="text-slate-400 font-normal normal-case ml-1">(opcional)</span>}</label>
    <div className="relative">
      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      <input type="date" value={value} onChange={e=>onChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4" required={required} />
    </div>
  </div>
);

export default MemberArea;
