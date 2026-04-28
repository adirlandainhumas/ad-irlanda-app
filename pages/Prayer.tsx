import React, { useState } from "react";
import { supabase } from "../lib/supabase";

const ADMIN_WHATSAPP = "556294478817";

export default function Prayer() {
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [pedido, setPedido] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !pedido.trim()) return;
    setLoading(true);
    setError(null);
    const { error: dbError } = await supabase.from("prayer_requests").insert({
      nome: nome.trim(),
      contato: contato.trim() || null,
      pedido: pedido.trim(),
    });
    setLoading(false);
    if (dbError) {
      setError("Erro ao enviar. Tente novamente.");
    } else {
      // Notifica o admin via WhatsApp (grátis, sem API paga)
      const msg = `🙏 *Novo pedido de oração recebido!*\n\n👤 *Nome:* ${nome.trim()}${contato.trim() ? `\n📱 *Contato:* ${contato.trim()}` : ""}\n\n📖 *Pedido:*\n${pedido.trim()}\n\n_Ver todos em:_ https://aogimconectinhumas.site/#/admin`;
      window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
      setSubmitted(true);
    }
  }

  return (
    <>
      <style>{`
        .pr-page { font-family: var(--font-sans, 'Lato', sans-serif); color: var(--ink, #1C1917); padding: 32px 20px 80px; max-width: 560px; margin: 0 auto; }
        .pr-hero { text-align: center; padding: 32px 0 28px; }
        .pr-icon-wrap { width: 64px; height: 64px; border-radius: 50%; background: var(--green-light, #EFF6FF); border: 1px solid var(--green-border, #BFDBFE); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
        .pr-title { font-family: var(--font-serif, 'Playfair Display', serif); font-size: clamp(24px, 6vw, 30px); font-weight: 700; color: var(--ink, #1C1917); margin: 0 0 10px; }
        .pr-subtitle { font-size: 15px; color: var(--ink-2, #57534E); line-height: 1.6; margin: 0; }
        .pr-verse { font-style: italic; font-size: 13px; color: var(--amber, #B45309); margin: 14px 0 0; border-left: 2px solid var(--amber-border, #FDE68A); padding-left: 12px; text-align: left; display: inline-block; }

        .pr-card { background: var(--surface, #fff); border: 1px solid var(--border, #E8E5E0); border-radius: 16px; padding: 28px 24px; box-shadow: 0 1px 4px rgba(28,25,23,0.06); }
        .pr-field { margin-bottom: 18px; }
        .pr-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: var(--ink-3, #A8A29E); text-transform: uppercase; margin-bottom: 6px; }
        .pr-label span { font-weight: 400; color: var(--ink-4, #D6D3D1); text-transform: none; letter-spacing: 0; font-size: 12px; margin-left: 6px; }
        .pr-input, .pr-textarea {
          width: 100%; box-sizing: border-box;
          background: var(--surface-2, #F5F2EE);
          border: 1px solid var(--border, #E8E5E0);
          border-radius: 10px;
          color: var(--ink, #1C1917);
          font-family: var(--font-sans, 'Lato', sans-serif);
          font-size: 15px;
          padding: 12px 14px;
          outline: none;
          transition: border-color .18s, background .18s;
        }
        .pr-input::placeholder, .pr-textarea::placeholder { color: var(--ink-4, #D6D3D1); }
        .pr-input:focus, .pr-textarea:focus { border-color: var(--green, #1E40AF); background: var(--surface, #fff); }
        .pr-textarea { resize: vertical; min-height: 130px; line-height: 1.6; }
        .pr-counter { font-size: 11px; color: var(--ink-4, #D6D3D1); text-align: right; margin-top: 5px; }

        .pr-btn {
          width: 100%; padding: 14px; border: none; border-radius: 12px;
          background: var(--green, #1E40AF);
          color: #fff; font-family: var(--font-sans, 'Lato', sans-serif); font-size: 15px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background .18s; margin-top: 8px;
        }
        .pr-btn:hover:not(:disabled) { background: var(--green-hover, #1D4ED8); }
        .pr-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .pr-success { text-align: center; padding: 48px 24px; }
        .pr-success-icon { width: 72px; height: 72px; border-radius: 50%; background: var(--green-light, #EFF6FF); border: 1px solid var(--green-border, #BFDBFE); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .pr-success-title { font-family: var(--font-serif, 'Playfair Display', serif); font-size: 26px; color: var(--ink, #1C1917); margin: 0 0 12px; }
        .pr-success-msg { font-size: 15px; color: var(--ink-2, #57534E); line-height: 1.7; margin: 0 0 28px; }
        .pr-back-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 24px; border-radius: 10px;
          background: var(--surface, #fff); border: 1px solid var(--border, #E8E5E0);
          color: var(--ink-2, #57534E); font-family: var(--font-sans, 'Lato', sans-serif); font-size: 14px; font-weight: 700;
          cursor: pointer; text-decoration: none; transition: border-color .18s, color .18s;
        }
        .pr-back-btn:hover { border-color: var(--ink-3, #A8A29E); color: var(--ink, #1C1917); }
        .pr-error { background: var(--danger-light, #FEF2F2); border: 1px solid var(--danger-border, #FECACA); border-radius: 10px; padding: 10px 14px; font-size: 13px; color: var(--danger, #991B1B); margin-top: 12px; }
      `}</style>

      <div className="pr-page">
        {submitted ? (
          <div className="pr-success">
            <div className="pr-success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 32, height: 32 }}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h2 className="pr-success-title">Pedido recebido!</h2>
            <p className="pr-success-msg">
              Recebemos seu pedido de oração.<br />
              Estamos orando por você com todo amor e fé.<br />
              <em style={{ color: "#B45309", fontSize: 13 }}>"O SENHOR está perto dos que têm o coração quebrantado." — Sl 34:18</em>
            </p>
            <a href="/#/" className="pr-back-btn">
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Voltar à página inicial
            </a>
          </div>
        ) : (
          <>
            <div className="pr-hero">
              <div className="pr-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h1 className="pr-title">Pedido de Oração</h1>
              <p className="pr-subtitle">Compartilhe seu pedido conosco.<br />Oraremos por você com amor e fé.</p>
              <p className="pr-verse">"Orai uns pelos outros." — Tiago 5:16</p>
            </div>

            <div style={{
              display:"flex", alignItems:"flex-start", gap:14,
              background:"#F0FDF4", border:"1.5px solid #86EFAC",
              borderRadius:14, padding:"16px 18px", marginBottom:16,
            }}>
              <div style={{
                width:36, height:36, borderRadius:"50%",
                background:"#DCFCE7", border:"1px solid #86EFAC",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width:18, height:18 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <p style={{ margin:"0 0 3px", fontSize:13, fontWeight:700, color:"#15803d", letterSpacing:".02em" }}>
                  Sigilo garantido
                </p>
                <p style={{ margin:0, fontSize:13, color:"#166534", lineHeight:1.55 }}>
                  Seu pedido será lido <strong>somente pelo pastor</strong>, com total discrição e sigilo. Nenhuma informação é compartilhada com terceiros.
                </p>
              </div>
            </div>

            <div className="pr-card">
              <form onSubmit={handleSubmit}>
                <div className="pr-field">
                  <label className="pr-label">Seu nome</label>
                  <input
                    className="pr-input"
                    type="text"
                    placeholder="Como você se chama?"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    required
                    maxLength={100}
                  />
                </div>

                <div className="pr-field">
                  <label className="pr-label">
                    Contato
                    <span>(opcional)</span>
                  </label>
                  <input
                    className="pr-input"
                    type="text"
                    placeholder="Telefone ou e-mail"
                    value={contato}
                    onChange={e => setContato(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="pr-field">
                  <label className="pr-label">Pedido de oração</label>
                  <textarea
                    className="pr-textarea"
                    placeholder="Conte-nos como podemos orar por você..."
                    value={pedido}
                    onChange={e => setPedido(e.target.value)}
                    required
                    maxLength={1000}
                  />
                  <div className="pr-counter">{pedido.length}/1000</div>
                </div>

                {error && <div className="pr-error">{error}</div>}

                <button type="submit" className="pr-btn" disabled={loading || !nome.trim() || !pedido.trim()}>
                  {loading ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }}>
                        <circle cx="12" cy="12" r="10" opacity=".25" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      Enviar pedido de oração
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
}
