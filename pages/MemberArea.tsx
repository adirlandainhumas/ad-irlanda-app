import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FC, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  AlertCircle, Calendar, Camera, CheckCircle2, CreditCard,
  FileText, Loader2, Lock, LogOut, Mail, Phone, Save, Upload,
  User, UserCircle, Users, X, Download, Share2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { emptyMemberDetails, formatDate, isFichaComplete, type MemberDetails } from '../types';

const PHOTO_BUCKET = 'member-photos';
const ADMIN_WHATSAPP = '556294478817';
const LOGO_URL = 'https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png';

// ─── QR Code simples via canvas ──────────────────────────────────────────────
function desenharQR(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, texto: string) {
  // QR Code simplificado decorativo com dados codificados visualmente
  const cells = 10;
  const cell = size / cells;
  const seed = texto.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (i: number) => ((seed * (i + 1) * 2654435761) >>> 0) % 2 === 0;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, size, size);

  ctx.fillStyle = '#0a1628';
  // Padrão de células
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      // Cantos de alinhamento fixos
      const isCorner =
        (r < 3 && c < 3) || (r < 3 && c >= cells-3) || (r >= cells-3 && c < 3);
      if (isCorner || rand(r * cells + c)) {
        ctx.fillRect(x + c * cell, y + r * cell, cell - 0.5, cell - 0.5);
      }
    }
  }
  // Borda branca interna nos cantos
  ctx.fillStyle = '#ffffff';
  [[0,0],[0,cells-3],[cells-3,0]].forEach(([r,c]) => {
    ctx.fillRect(x + (c+1)*cell, y + (r+1)*cell, cell, cell);
  });
  ctx.fillStyle = '#0a1628';
  [[0,0],[0,cells-3],[cells-3,0]].forEach(([r,c]) => {
    ctx.fillRect(x + (c+1.25)*cell, y + (r+1.25)*cell, cell*0.5, cell*0.5);
  });
  ctx.restore();
}

// ─── Verso do Cartão ─────────────────────────────────────────────────────────
async function gerarCartaoVerso(details: MemberDetails, numRegistro: string, dataEmissao: string): Promise<string> {
  return new Promise((resolve) => {
    const W = 900, H = 580;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Fundo
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#08122a'); bg.addColorStop(1, '#0b1c3e');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Padrão pontos
    ctx.save(); ctx.globalAlpha = 0.04;
    for (let x = 20; x < W; x += 28)
      for (let y = 20; y < H; y += 28) {
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI*2);
        ctx.fillStyle = '#4a90e2'; ctx.fill();
      }
    ctx.restore();

    // Faixa superior
    const fg = ctx.createLinearGradient(0, 0, W, 80);
    fg.addColorStop(0, '#1040b0'); fg.addColorStop(1, '#0d3a9e');
    ctx.fillStyle = fg; ctx.fillRect(0, 0, W, 80);
    const lg = ctx.createLinearGradient(0, 78, W, 78);
    lg.addColorStop(0,'transparent'); lg.addColorStop(0.2,'#5090ff'); lg.addColorStop(0.8,'#5090ff'); lg.addColorStop(1,'transparent');
    ctx.fillStyle = lg; ctx.fillRect(0, 78, W, 2);

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 15px Georgia,serif';
    ctx.fillText('ASSEMBLÉIA DE DEUS — MINISTÉRIO IRLANDA', 30, 36);
    ctx.font = '12px sans-serif'; ctx.fillStyle = 'rgba(180,210,255,0.8)';
    ctx.fillText('VERSO DO CARTÃO DE MEMBRO', 30, 58);
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px sans-serif';
    ctx.fillText('Registro Nº ' + numRegistro, W - 30, 48);
    ctx.restore();

    // ── DECLARAÇÃO DE FÉ ─────────────────────────────────────────────────────
    const faixaDecH = 200;
    ctx.save();
    ctx.fillStyle = 'rgba(26,85,208,0.15)';
    ctx.beginPath(); ctx.roundRect(30, 100, W - 60, faixaDecH, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(80,140,255,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(30, 100, W - 60, faixaDecH, 12); ctx.stroke();

    ctx.fillStyle = 'rgba(120,180,255,0.9)'; ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DECLARAÇÃO DE FÉ', 50, 122);

    const declaracao = [
      'Cremos na Santa Trindade — Pai, Filho e Espírito Santo.',
      'Cremos na inspiração divina das Sagradas Escrituras.',
      'Cremos na salvação pela graça mediante a fé em Jesus Cristo.',
      'Cremos no batismo nas águas e no batismo com o Espírito Santo.',
      'Cremos na segunda vinda de Jesus Cristo em glória.',
    ];

    ctx.font = '13px Georgia, serif'; ctx.fillStyle = 'rgba(200,225,255,0.85)';
    declaracao.forEach((linha, i) => {
      ctx.fillText(`• ${linha}`, 50, 146 + i * 26);
    });
    ctx.restore();

    // ── INFORMAÇÕES DA SEDE ───────────────────────────────────────────────────
    ctx.save();
    ctx.fillStyle = 'rgba(120,180,255,0.9)'; ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SEDE INTERNACIONAL', 30, 330);

    ctx.font = '13px Georgia, serif'; ctx.fillStyle = 'rgba(200,225,255,0.8)';
    ctx.fillText('Assembléia de Deus — Ministério Irlanda', 30, 352);
    ctx.fillText('Inhumas — Goiás — Brasil  •  Vinculada à sede: Irlanda, Europa', 30, 372);
    ctx.fillText('Site: aogimconectinhumas.site', 30, 392);
    ctx.restore();

    // ── QR CODE ───────────────────────────────────────────────────────────────
    const qrSize = 100;
    const qrX = W - qrSize - 40;
    const qrY = 310;
    desenharQR(ctx, qrX, qrY, qrSize, numRegistro);

    ctx.save();
    ctx.fillStyle = 'rgba(120,180,255,0.7)'; ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VALIDAÇÃO', qrX + qrSize/2, qrY + qrSize + 14);
    ctx.fillStyle = 'rgba(150,200,255,0.5)'; ctx.font = '9px sans-serif';
    ctx.fillText(numRegistro, qrX + qrSize/2, qrY + qrSize + 26);
    ctx.restore();

    // ── RODAPÉ ────────────────────────────────────────────────────────────────
    const rg = ctx.createLinearGradient(0, H-55, 0, H);
    rg.addColorStop(0,'rgba(10,20,60,0)'); rg.addColorStop(1,'rgba(10,20,60,0.9)');
    ctx.fillStyle = rg; ctx.fillRect(0, H-55, W, 55);

    const rl = ctx.createLinearGradient(0, 0, W, 0);
    rl.addColorStop(0,'transparent'); rl.addColorStop(0.3,'rgba(60,120,255,0.35)');
    rl.addColorStop(0.7,'rgba(60,120,255,0.35)'); rl.addColorStop(1,'transparent');
    ctx.fillStyle = rl; ctx.fillRect(0, H-55, W, 1);

    ctx.save();
    ctx.textAlign = 'left'; ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = 'rgba(80,160,255,0.65)';
    ctx.fillText('EMISSÃO', 30, H-30);
    ctx.font = 'bold 14px Courier New,monospace'; ctx.fillStyle = 'rgba(180,220,255,0.9)';
    ctx.fillText(dataEmissao, 30, H-13);

    ctx.textAlign = 'center'; ctx.font = '10px sans-serif'; ctx.fillStyle = 'rgba(120,170,255,0.4)';
    ctx.fillText('Este documento é propriedade da Assembléia de Deus — Ministério Irlanda. Em caso de perda, comunique imediatamente à liderança.', W/2, H-13);
    ctx.restore();

    // Borda
    ctx.save();
    ctx.strokeStyle = 'rgba(60,140,255,0.25)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(1,1,W-2,H-2,16); ctx.stroke();
    ctx.restore();

    resolve(canvas.toDataURL('image/png', 0.95));
  });
}

// ─── Gerar PDF com frente + verso ────────────────────────────────────────────
async function gerarPDF(frente: string, verso: string, nomeArquivo: string): Promise<void> {
  // Cria PDF A4 landscape usando canvas → imagem
  const W = 900, H = 580;
  const marginMm = 10;
  const a4wPx = 297 - marginMm * 2; // mm
  const a4hPx = 210 - marginMm * 2;
  const escala = Math.min(a4wPx / W, a4hPx / H); // fator escala mm/px
  const cardWmm = W * escala;
  const cardHmm = H * escala;
  const offsetX = marginMm + (a4wPx - cardWmm) / 2;

  const linhas: string[] = [
    '%PDF-1.4',
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
  ];

  // Converte dataURL → base64 puro
  const toB64 = (dataUrl: string) => dataUrl.split(',')[1];
  const frenteB64 = toB64(frente);
  const versoB64 = toB64(verso);
  const frenteLen = Math.ceil(frenteB64.length * 3/4);
  const versoLen = Math.ceil(versoB64.length * 3/4);

  // Usa jsPDF via CDN carregado dinamicamente
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  document.head.appendChild(script);

  await new Promise<void>((res) => { script.onload = () => res(); });

  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Página 1 — Frente
  doc.addImage(frente, 'PNG', offsetX, marginMm + (a4hPx - cardHmm)/2, cardWmm, cardHmm);
  doc.text('FRENTE', 148.5, marginMm + a4hPx + 6, { align: 'center' });

  // Página 2 — Verso
  doc.addPage();
  doc.addImage(verso, 'PNG', offsetX, marginMm + (a4hPx - cardHmm)/2, cardWmm, cardHmm);
  doc.text('VERSO', 148.5, marginMm + a4hPx + 6, { align: 'center' });

  doc.save(`${nomeArquivo}.pdf`);
}
async function checarStatus(userId: string): Promise<'aprovado'|'pendente'|'reprovado'|'livre'> {
  const { data } = await supabase.from('membros').select('status').eq('id', userId).maybeSingle();
  if (!data) return 'livre'; // admin ou usuário sem registro
  return data.status as any;
}

// ─── Geração do Cartão CNH Digital ───────────────────────────────────────────
async function gerarCartaoCNH(details: MemberDetails, photoUrl: string | null, memberId: string, numRegistro: string, dataEmissao: string): Promise<string> {
  return new Promise(async (resolve) => {
    const W = 900, H = 580;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // ── Fundo ────────────────────────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#08122a'); bgGrad.addColorStop(1, '#0b1c3e');
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);

    // Padrão de pontos
    ctx.save(); ctx.globalAlpha = 0.04;
    for (let x = 20; x < W; x += 28)
      for (let y = 20; y < H; y += 28) {
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI*2);
        ctx.fillStyle = '#4a90e2'; ctx.fill();
      }
    ctx.restore();

    // ── FAIXA SUPERIOR ───────────────────────────────────────────────────────
    const faixaH = 110;
    const faixaGrad = ctx.createLinearGradient(0, 0, W, faixaH);
    faixaGrad.addColorStop(0, '#1040b0'); faixaGrad.addColorStop(0.6, '#1a55d0'); faixaGrad.addColorStop(1, '#0d3a9e');
    ctx.fillStyle = faixaGrad; ctx.fillRect(0, 0, W, faixaH);

    // Ondas decorativas
    ctx.save(); ctx.globalAlpha = 0.08;
    for (let r = 80; r <= 320; r += 55) {
      ctx.beginPath(); ctx.arc(W - 60, -20, r, 0, Math.PI*2);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 22; ctx.stroke();
    }
    ctx.restore();

    // Linha divisória
    const lineGrad = ctx.createLinearGradient(0, faixaH, W, faixaH);
    lineGrad.addColorStop(0, 'transparent'); lineGrad.addColorStop(0.2, '#5090ff');
    lineGrad.addColorStop(0.8, '#5090ff'); lineGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = lineGrad; ctx.fillRect(0, faixaH - 2, W, 3);

    // Logo
    try {
      const logo = new Image(); logo.crossOrigin = 'anonymous';
      await new Promise<void>((res) => { logo.onload=()=>res(); logo.onerror=()=>res(); logo.src=LOGO_URL; });
      if (logo.complete && logo.naturalWidth > 0) ctx.drawImage(logo, 24, 14, 80, 80);
    } catch {}

    // Textos da faixa
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = 'bold 23px Georgia, serif';
    ctx.fillText('ASSEMBLÉIA DE DEUS', 122, 46);
    ctx.font = '14px sans-serif'; ctx.fillStyle = 'rgba(180,210,255,0.85)';
    ctx.fillText('MINISTÉRIO IRLANDA  •  INHUMAS - GO', 122, 68);
    ctx.restore();

    // Badge "CARTÃO DE MEMBRO"
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.roundRect(W - 215, 28, 190, 52, 26); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(W - 215, 28, 190, 52, 26); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('CARTÃO DE MEMBRO', W - 120, 60);
    ctx.restore();

    // ── FOTO ─────────────────────────────────────────────────────────────────
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

    // Nome e badge de função sob a foto
    ctx.save(); ctx.textAlign = 'center';
    let nomeDisplay = details.full_name || 'MEMBRO';
    if (nomeDisplay.split(' ').length > 2) {
      const p = nomeDisplay.split(' '); nomeDisplay = `${p[0]} ${p[p.length-1]}`;
    }
    ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#e8f4ff';
    ctx.fillText(nomeDisplay.toUpperCase(), photoX + photoW/2, photoY + photoH + 22);

    const funcao = details.church_function || 'Membro';
    const badgeW = Math.min(photoW, ctx.measureText(funcao).width + 28);
    ctx.fillStyle = 'rgba(26,85,208,0.6)';
    ctx.beginPath(); ctx.roundRect(photoX + photoW/2 - badgeW/2, photoY + photoH + 30, badgeW, 24, 12); ctx.fill();
    ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = 'rgba(180,220,255,0.95)';
    ctx.fillText(funcao, photoX + photoW/2, photoY + photoH + 46);
    ctx.restore();

    // ── DADOS ─────────────────────────────────────────────────────────────────
    const dx = photoX + photoW + 26;
    const dy = faixaH + 16;
    const colW = (W - dx - 20) / 2;

    const drawField = (label: string, value: string, x: number, y: number, maxW = colW - 12) => {
      ctx.save();
      ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = 'rgba(80,160,255,0.75)';
      ctx.textAlign = 'left';
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
      const g = ctx.createLinearGradient(dx, 0, W-20, 0);
      g.addColorStop(0,'rgba(80,140,255,0.5)'); g.addColorStop(1,'transparent');
      ctx.fillStyle = g; ctx.fillRect(dx, y, W - dx - 20, 1);
    };

    let sy2 = dy + 10;

    // PESSOAL
    drawSectionHeader('DADOS PESSOAIS', dx, sy2, W - dx - 20);
    sy2 += 20;
    drawField('Nome Completo', details.full_name || '—', dx, sy2, W - dx - 20);
    sy2 += 36;
    drawField('Nascimento', formatDate(details.birth_date), dx, sy2);
    drawField('Estado Civil', details.marital_status || '—', dx + colW, sy2);
    sy2 += 36;
    drawField('Cidade / Estado', `${details.address_city||'—'} / ${details.address_state||'—'}`, dx, sy2, W - dx - 20);
    sy2 += 40;

    sepLine(sy2 - 6);

    // CONTATO
    drawSectionHeader('CONTATO', dx, sy2 + 10, W - dx - 20);
    sy2 += 28;
    drawField('Telefone', details.phone || '—', dx, sy2);
    drawField('E-mail', details.email || '—', dx + colW, sy2, colW - 12);
    sy2 += 40;

    sepLine(sy2 - 6);

    // ECLESIÁSTICO — sem repetir Função (já está no badge da foto)
    drawSectionHeader('DADOS ECLESIÁSTICOS', dx, sy2 + 10, W - dx - 20);
    sy2 += 28;
    drawField('Entrada na Igreja', formatDate(details.church_entry_date), dx, sy2);
    drawField('Data de Batismo', formatDate(details.baptism_date), dx + colW, sy2);
    sy2 += 36;
    drawField('Informações Eclesiásticas', details.church_role_info || '—', dx, sy2, W - dx - 20);
    sy2 += 40;

    // ── SELO CIRCULAR DE AUTORIDADE ───────────────────────────────────────────
    const seloX = W - 95, seloY = H - 148, seloR = 52;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.beginPath(); ctx.arc(seloX, seloY, seloR, 0, Math.PI*2);
    ctx.fillStyle = '#2060d0'; ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(100,170,255,0.5)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(seloX, seloY, seloR - 5, 0, Math.PI*2); ctx.stroke();
    ctx.strokeStyle = 'rgba(100,170,255,0.3)'; ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(seloX, seloY, seloR, 0, Math.PI*2); ctx.stroke();
    ctx.restore();

    // Texto circular no selo
    ctx.save();
    ctx.font = 'bold 8px sans-serif'; ctx.fillStyle = 'rgba(150,210,255,0.8)';
    ctx.textAlign = 'center';
    const textoSelo = 'MINISTÉRIO IRLANDA • INHUMAS-GO •';
    const angStep = (Math.PI * 2) / textoSelo.length;
    for (let i = 0; i < textoSelo.length; i++) {
      ctx.save();
      ctx.translate(seloX, seloY);
      ctx.rotate(i * angStep - Math.PI/2);
      ctx.translate(0, -(seloR - 10));
      ctx.rotate(Math.PI/2);
      ctx.fillText(textoSelo[i], 0, 0);
      ctx.restore();
    }
    // Cruz central no selo
    ctx.fillStyle = 'rgba(150,210,255,0.7)'; ctx.font = 'bold 22px Georgia,serif';
    ctx.fillText('✝', seloX, seloY + 8);
    ctx.restore();

    // ── RODAPÉ ────────────────────────────────────────────────────────────────
    const ano = new Date().getFullYear();
    const validade = `${String(new Date().getMonth()+1).padStart(2,'0')}/${ano+1}`;

    const rodapeGrad = ctx.createLinearGradient(0, H-55, 0, H);
    rodapeGrad.addColorStop(0,'rgba(10,20,60,0)'); rodapeGrad.addColorStop(1,'rgba(10,20,60,0.8)');
    ctx.fillStyle = rodapeGrad; ctx.fillRect(0, H-55, W, 55);

    const lineRodape = ctx.createLinearGradient(0, 0, W, 0);
    lineRodape.addColorStop(0,'transparent'); lineRodape.addColorStop(0.3,'rgba(60,120,255,0.4)');
    lineRodape.addColorStop(0.7,'rgba(60,120,255,0.4)'); lineRodape.addColorStop(1,'transparent');
    ctx.fillStyle = lineRodape; ctx.fillRect(0, H-55, W, 1);

    ctx.save(); ctx.textAlign = 'left';
    ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = 'rgba(80,160,255,0.65)';
    ctx.fillText('Nº DE REGISTRO', 28, H-30);
    ctx.font = 'bold 15px Courier New, monospace'; ctx.fillStyle = 'rgba(180,220,255,0.95)';
    ctx.fillText(numRegistro, 28, H-13);

    ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = 'rgba(80,160,255,0.65)';
    ctx.fillText('EMISSÃO', 230, H-30);
    ctx.font = 'bold 15px Courier New, monospace'; ctx.fillStyle = 'rgba(180,220,255,0.95)';
    ctx.fillText(dataEmissao, 230, H-13);

    ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = 'rgba(80,160,255,0.65)';
    ctx.fillText('VALIDADE', 380, H-30);
    ctx.font = 'bold 15px Courier New, monospace'; ctx.fillStyle = 'rgba(180,220,255,0.95)';
    ctx.fillText(validade, 380, H-13);

    ctx.textAlign = 'right'; ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = 'rgba(80,160,255,0.5)';
    ctx.fillText('DOCUMENTO ECLESIÁSTICO — AOGIM', W-20, H-13);
    ctx.restore();

    // Borda externa
    ctx.save();
    ctx.strokeStyle = 'rgba(60,140,255,0.25)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(1,1,W-2,H-2,16); ctx.stroke();
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
  const [error, setError]                   = useState<string | null>(null);
  const [successMsg, setSuccessMsg]         = useState<string | null>(null);
  const [hasFicha, setHasFicha]             = useState(false);
  const [memberDetails, setMemberDetails]   = useState<MemberDetails>(emptyMemberDetails);
  const [selectedPhoto, setSelectedPhoto]   = useState<File | null>(null);
  const [photoPreview, setPhotoPreview]     = useState<string | null>(null);
  const [photoUrl, setPhotoUrl]             = useState<string | null>(null);
  const [cartaoImg, setCartaoImg]           = useState<string | null>(null);
  const [versoImg, setVersoImg]             = useState<string | null>(null);
  const [gerandoCartao, setGerandoCartao]   = useState(false);

  // Flag para evitar loop no onAuthStateChange
  const bloqueandoAuth = useRef(false);

  const limparEstado = useCallback(() => {
    setSession(null);
    setShowFichaForm(false); setHasFicha(false); setShowCard(false);
    setMemberDetails(emptyMemberDetails); setSelectedPhoto(null);
    setPhotoPreview(null); setPhotoUrl(null); setCartaoImg(null);
  }, []);

  const carregarDetalhes = useCallback(async (userId: string, profileName?: string, profileEmail?: string) => {
    setFetchingDetails(true);
    try {
      const { data } = await supabase.from('member_details').select('*').eq('user_id', userId).maybeSingle();
      const merged: MemberDetails = { ...emptyMemberDetails, full_name: profileName||'', email: profileEmail||'', ...(data||{}) };
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

  // Verifica status e decide se abre sessão ou bloqueia
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

    // aprovado ou livre (admin) — deixa entrar
    setSession(sess);
    await carregarDetalhes(sess.user.id, sess.user.user_metadata?.full_name, sess.user.email);
    return true;
  }, [carregarDetalhes]);

  // ── Inicialização ─────────────────────────────────────────────────────────
  useEffect(() => {
    let montado = true;

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!montado) return;
      if (s) await processarSessao(s);
      setAppLoading(false);
    });

    // onAuthStateChange APENAS para logout real (usuário clicou em sair)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (bloqueandoAuth.current) return; // ignora signOut programático
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
      // CADASTRO
      if (isSignUp) {
        if (!fullName.trim()) throw new Error('O nome completo é obrigatório.');
        if (!telefone.trim()) throw new Error('O telefone é obrigatório.');

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;

        if (signUpData.user) {
          await supabase.from('membros').insert({
            id: signUpData.user.id, nome: fullName, email, telefone, status: 'pendente',
          });
        }

        bloqueandoAuth.current = true;
        await supabase.auth.signOut();
        bloqueandoAuth.current = false;

        const msg = `🔔 *Novo cadastro de membro!*\n\n👤 *Nome:* ${fullName}\n📧 *E-mail:* ${email}\n📱 *Telefone:* ${telefone}\n\n✅ Aprovar em:\nhttps://aogimconectinhumas.site/#/admin`;
        window.open(`https://web.whatsapp.com/send?phone=${ADMIN_WHATSAPP}&text=${encodeURIComponent(msg)}`, '_blank');

        setSuccessMsg('✅ Cadastro enviado! Aguarde a aprovação da liderança para fazer login.');
        setIsSignUp(false);
        setFullName(''); setTelefone(''); setEmail(''); setPassword('');
        return;
      }

      // LOGIN
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
      // Busca ou gera número de registro permanente
      const { data: detData } = await supabase
        .from('member_details').select('numero_registro, data_emissao').eq('user_id', session.user.id).maybeSingle();

      let numRegistro = detData?.numero_registro;
      let dataEmissao = detData?.data_emissao;

      if (!numRegistro) {
        // Gera número único e salva
        const { data: countData } = await supabase
          .from('member_details').select('id', { count: 'exact' }).not('numero_registro', 'is', null);
        const seq = ((countData as any)?.length ?? 0) + 1;
        numRegistro = `ADI-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;
        dataEmissao = new Date().toISOString().split('T')[0];
        await supabase.from('member_details').update({ numero_registro: numRegistro, data_emissao: dataEmissao }).eq('user_id', session.user.id);
      }

      const dataEmissaoFormatada = formatDate(dataEmissao || new Date().toISOString().split('T')[0]);

      const [frente, verso] = await Promise.all([
        gerarCartaoCNH(memberDetails, photoUrl, session.user.id, numRegistro, dataEmissaoFormatada),
        gerarCartaoVerso(memberDetails, numRegistro, dataEmissaoFormatada),
      ]);
      setCartaoImg(frente);
      setVersoImg(verso);
    } finally {
      setGerandoCartao(false);
    }
  };

  const nomeArquivo = `cartao-${memberDetails.full_name.replace(/\s+/g,'-').toLowerCase()}`;

  const handleDownloadPNG = () => {
    if (!cartaoImg || !versoImg) return;
    [cartaoImg, versoImg].forEach((img, i) => {
      const a = document.createElement('a');
      a.href = img; a.download = `${nomeArquivo}-${i === 0 ? 'frente' : 'verso'}.png`; a.click();
    });
  };

  const handleDownloadPDF = async () => {
    if (!cartaoImg || !versoImg) return;
    await gerarPDF(cartaoImg, versoImg, nomeArquivo);
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

  // ── Loading inicial ───────────────────────────────────────────────────────
  if (appLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // ── Logado ────────────────────────────────────────────────────────────────
  if (session) {
    const nome = memberDetails.full_name || session.user.user_metadata?.full_name || 'Membro';
    const fotoRender = photoPreview || photoUrl;

    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-blue-600 shadow-inner border border-blue-100 overflow-hidden bg-blue-50">
          {fotoRender ? <img src={fotoRender} alt="Foto" className="w-full h-full object-cover" /> : <User className="w-12 h-12" />}
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-slate-800">Olá, {nome.split(' ')[0]}!</h2>
          <p className="text-slate-500 text-sm">{session.user.email}</p>
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

        <div className="w-full max-w-xl space-y-4">
          {!hasFicha && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">Ficha cadastral pendente</p>
                <p className="text-sm text-amber-700 mt-1">Complete sua ficha para liberar seu cartão de membro.</p>
              </div>
            </div>
          )}
          <button
            onClick={() => hasFicha ? setShowCard(true) : setShowFichaForm(true)}
            className={`w-full text-white font-bold py-5 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${hasFicha ? 'bg-blue-700 hover:bg-blue-800' : 'bg-amber-500 hover:bg-amber-600'}`}
          >
            {hasFicha ? <><CreditCard className="w-6 h-6" /> Acessar Cartão de Membro</> : <><UserCircle className="w-6 h-6" /> Preencher Ficha Cadastral</>}
          </button>
          <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-500 font-bold py-4 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all border border-slate-100">
            <LogOut className="w-5 h-5" /> Sair da Conta
          </button>
        </div>

        {/* Modal Ficha */}
        {showFichaForm && (
          <div className="fixed inset-0 top-16 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white w-full max-w-3xl rounded-3xl p-8 shadow-2xl relative my-6">
              <button onClick={() => setShowFichaForm(false)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full"><X className="w-5 h-5" /></button>
              <h2 className="text-2xl font-black text-blue-900 mb-1">Ficha Cadastral de Membro</h2>
              <p className="text-slate-500 text-sm mb-6">Preencha os dados e envie sua foto.</p>
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
                  <InputField label="Informações Eclesiásticas" value={memberDetails.church_role_info} onChange={v=>updateField('church_role_info',v)} icon={<Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>} required />
                  <SelectField label="Função na Igreja" value={memberDetails.church_function} onChange={v=>updateField('church_function',v)} options={['Membro','Diácono','Diáconisa','Presbítero','Evangelista','Pastor','Cooperador(a)']} />
                  <DateField label="Data de Entrada na Igreja" value={memberDetails.church_entry_date} onChange={v=>updateField('church_entry_date',v)} />
                  <DateField label="Data de Batismo" value={memberDetails.baptism_date} onChange={v=>updateField('baptism_date',v)} />
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
              <div className="bg-gradient-to-br from-[#0a1628] to-[#061020] rounded-3xl p-6 shadow-2xl border border-blue-900/40 relative">
                <button onClick={() => { setShowCard(false); setCartaoImg(null); setVersoImg(null); }} className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full"><X className="w-5 h-5" /></button>
                <h2 className="text-white font-black text-xl mb-1">Cartão de Membro</h2>
                <p className="text-blue-300/60 text-sm mb-5">Assembléia de Deus — Ministério Irlanda</p>

                {cartaoImg ? (
                  <div className="space-y-3 mb-5">
                    <p className="text-blue-300/50 text-xs font-bold uppercase tracking-wider">Frente</p>
                    <div className="rounded-2xl overflow-hidden border border-blue-500/30 shadow-2xl">
                      <img src={cartaoImg} alt="Frente" className="w-full block" />
                    </div>
                    {versoImg && (
                      <>
                        <p className="text-blue-300/50 text-xs font-bold uppercase tracking-wider mt-4">Verso</p>
                        <div className="rounded-2xl overflow-hidden border border-blue-500/30 shadow-2xl">
                          <img src={versoImg} alt="Verso" className="w-full block" />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/5 border border-blue-500/20 p-8 mb-5 flex flex-col items-center gap-3 text-center">
                    <CreditCard className="w-12 h-12 text-blue-400/50" />
                    <p className="text-blue-200/60 text-sm">Gere seu cartão com frente e verso — número de registro permanente, selo de autoridade e declaração de fé.</p>
                    <p className="text-blue-300/40 text-xs">Número de registro gerado uma única vez e salvo permanentemente</p>
                  </div>
                )}

                <div className="flex gap-3 flex-wrap">
                  {!cartaoImg ? (
                    <button onClick={handleGerarCartao} disabled={gerandoCartao} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
                      {gerandoCartao ? <><Loader2 className="w-5 h-5 animate-spin" /> Gerando…</> : <><CreditCard className="w-5 h-5" /> Gerar Cartão</>}
                    </button>
                  ) : (
                    <>
                      <button onClick={handleDownloadPDF} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
                        <FileText className="w-5 h-5" /> Salvar PDF
                      </button>
                      <button onClick={handleDownloadPNG} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 border border-white/10">
                        <Download className="w-5 h-5" /> Baixar PNG
                      </button>
                      <button onClick={handleCompartilharCartao} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 border border-white/10">
                        <Share2 className="w-5 h-5" /> Compartilhar
                      </button>
                      <button onClick={() => { setCartaoImg(null); setVersoImg(null); }} className="w-full px-5 py-3 bg-white/5 hover:bg-white/10 text-white/50 font-bold rounded-2xl border border-white/10 text-sm">
                        Refazer
                      </button>
                    </>
                  )}
                </div>
                <p className="text-center text-blue-400/30 text-xs mt-4">PDF: frente + verso em A4 landscape • PNG: imagens separadas</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Não logado ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <h2 className="text-2xl font-black text-center text-slate-800 mb-2">
          {isSignUp ? 'Solicitar Cadastro de Membro' : 'Entrar na área de membros'}
        </h2>
        <p className="text-center text-sm text-slate-500 mb-6">
          {isSignUp ? 'Após o cadastro, a liderança receberá uma notificação para aprovar seu acesso.' : 'Acesse sua ficha e cartão de membro.'}
        </p>
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Nome completo</label>
                <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Telefone</label>
                <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="tel" value={telefone} onChange={e=>setTelefone(e.target.value)} placeholder="(62) 99999-9999" className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4" required />
                </div>
              </div>
            </>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">E-mail</label>
            <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4" required />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Senha</label>
            <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4" required />
            </div>
          </div>
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100"><AlertCircle className="w-5 h-5 flex-shrink-0" /> <span>{error}</span></div>}
          {successMsg && <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100"><CheckCircle2 className="w-5 h-5 flex-shrink-0" /> <span>{successMsg}</span></div>}
          <button type="submit" disabled={loading} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : isSignUp ? 'Solicitar Cadastro' : 'Entrar'}
          </button>
        </form>
        <button type="button" onClick={() => { setIsSignUp(p=>!p); setError(null); setSuccessMsg(null); }} className="w-full mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900">
          {isSignUp ? 'Já tem conta? Entre aqui' : 'Não tem conta? Solicitar cadastro'}
        </button>
      </div>
    </div>
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

const DateField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">{label}</label>
    <div className="relative">
      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      <input type="date" value={value} onChange={e=>onChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4" required />
    </div>
  </div>
);

export default MemberArea;