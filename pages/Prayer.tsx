import React, { useState } from "react";
import { supabase } from "../lib/supabase";

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
      setSubmitted(true);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #060d22 0%, #0b1535 50%, #0a1a4a 100%)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Lato:wght@300;400;700&display=swap');
        .pr-page { font-family: 'Lato', sans-serif; color: #e8f0ff; padding: 32px 20px 80px; max-width: 560px; margin: 0 auto; }
        .pr-hero { text-align: center; padding: 40px 0 36px; }
        .pr-icon-wrap { width: 72px; height: 72px; border-radius: 50%; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .pr-title { font-family: 'Playfair Display', serif; font-size: clamp(26px, 6vw, 34px); font-weight: 700; color: #fff; margin: 0 0 10px; }
        .pr-subtitle { font-size: 15px; color: rgba(200,220,255,0.7); line-height: 1.6; margin: 0; }
        .pr-verse { font-style: italic; font-size: 13px; color: rgba(180,205,255,0.55); margin: 16px 0 0; }

        .pr-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px 28px; }
        .pr-field { margin-bottom: 20px; }
        .pr-label { display: block; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; color: rgba(180,210,255,0.7); text-transform: uppercase; margin-bottom: 8px; }
        .pr-label span { font-weight: 400; color: rgba(180,210,255,0.4); text-transform: none; letter-spacing: 0; font-size: 12px; margin-left: 6px; }
        .pr-input, .pr-textarea {
          width: 100%; box-sizing: border-box;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          color: #e8f0ff;
          font-family: 'Lato', sans-serif;
          font-size: 15px;
          padding: 13px 16px;
          outline: none;
          transition: border-color .2s, background .2s;
        }
        .pr-input::placeholder, .pr-textarea::placeholder { color: rgba(180,210,255,0.3); }
        .pr-input:focus, .pr-textarea:focus { border-color: rgba(80,140,255,0.6); background: rgba(255,255,255,0.08); }
        .pr-textarea { resize: vertical; min-height: 130px; line-height: 1.6; }
        .pr-counter { font-size: 11px; color: rgba(180,210,255,0.35); text-align: right; margin-top: 5px; }

        .pr-btn {
          width: 100%; padding: 15px; border: none; border-radius: 14px;
          background: linear-gradient(130deg, #1a55d0, #0090ff);
          color: #fff; font-family: 'Lato', sans-serif; font-size: 16px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: transform .2s, box-shadow .2s; margin-top: 8px;
          box-shadow: 0 8px 28px rgba(0,100,255,0.3);
        }
        .pr-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(0,100,255,0.45); }
        .pr-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .pr-success { text-align: center; padding: 48px 24px; }
        .pr-success-icon { width: 80px; height: 80px; border-radius: 50%; background: rgba(80,200,120,0.12); border: 1px solid rgba(80,200,120,0.3); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .pr-success-title { font-family: 'Playfair Display', serif; font-size: 26px; color: #fff; margin: 0 0 12px; }
        .pr-success-msg { font-size: 15px; color: rgba(200,220,255,0.7); line-height: 1.7; margin: 0 0 32px; }
        .pr-back-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 28px; border-radius: 50px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15);
          color: rgba(200,220,255,0.85); font-family: 'Lato', sans-serif; font-size: 15px;
          cursor: pointer; text-decoration: none; transition: background .2s;
        }
        .pr-back-btn:hover { background: rgba(255,255,255,0.13); }
        .pr-error { background: rgba(220,60,60,0.12); border: 1px solid rgba(220,80,80,0.3); border-radius: 10px; padding: 12px 16px; font-size: 14px; color: #ffaaaa; margin-top: 12px; }
      `}</style>

      <div className="pr-page">
        {submitted ? (
          <div className="pr-success">
            <div className="pr-success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(80,200,120,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 36, height: 36 }}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h2 className="pr-success-title">Pedido recebido! 🙏</h2>
            <p className="pr-success-msg">
              Recebemos seu pedido de oração.<br />
              Estamos orando por você com todo amor e fé.<br />
              <em style={{ color: "rgba(180,210,255,0.5)", fontSize: 13 }}>"O SENHOR está perto dos que têm o coração quebrantado." — Sl 34:18</em>
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
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(150,190,255,0.8)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 32, height: 32 }}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h1 className="pr-title">Pedido de Oração</h1>
              <p className="pr-subtitle">Compartilhe seu pedido conosco.<br />Oraremos por você com amor e fé.</p>
              <p className="pr-verse">"Orai uns pelos outros." — Tiago 5:16</p>
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
    </div>
  );
}
