import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Cadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", senha: "", confirmar: "" });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [etapa, setEtapa] = useState<"form" | "aguardando">("form");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setErro("");
    if (!form.nome || !form.email || !form.telefone || !form.senha) {
      setErro("Preencha todos os campos."); return;
    }
    if (form.senha !== form.confirmar) {
      setErro("As senhas não coincidem."); return;
    }
    if (form.senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres."); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/membro-cadastro", {
        method: "POST",
        body: JSON.stringify({ nome: form.nome, email: form.email, telefone: form.telefone, senha: form.senha }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      // Abre WhatsApp do admin com a mensagem pronta
      window.open(data.waLink, "_blank");
      setEtapa("aguardando");
    } catch (e: any) {
      setErro(e.message || "Erro ao cadastrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Lato:wght@300;400;700;900&display=swap');
        * { box-sizing: border-box; }
        .cad-root { font-family:'Lato',sans-serif; min-height:100vh; background:linear-gradient(155deg,#060d20 0%,#0a1535 40%,#0e1d50 70%,#050f28 100%); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px 16px 60px; }
        .cad-card { width:100%; max-width:420px; background:rgba(255,255,255,0.04); border:1px solid rgba(60,140,255,0.15); border-radius:24px; padding:32px 24px; }
        .cad-logo { display:flex; justify-content:center; margin-bottom:24px; }
        .cad-logo img { width:72px; filter:drop-shadow(0 0 14px rgba(80,160,255,0.3)); }
        .cad-title { font-family:'Playfair Display',Georgia,serif; font-size:22px; font-weight:700; color:#ddeeff; text-align:center; margin:0 0 4px; }
        .cad-sub { font-size:13px; color:rgba(120,180,255,0.5); text-align:center; font-style:italic; margin:0 0 28px; font-family:'Playfair Display',Georgia,serif; }
        .cad-label { font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:rgba(80,160,255,0.7); margin:0 0 6px; display:block; }
        .cad-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(60,140,255,0.2); border-radius:12px; padding:12px 14px; font-size:15px; color:#ddeeff; font-family:'Lato',sans-serif; outline:none; transition:border-color .18s; margin-bottom:16px; }
        .cad-input:focus { border-color:rgba(80,160,255,0.5); background:rgba(255,255,255,0.07); }
        .cad-input::placeholder { color:rgba(120,160,220,0.3); }
        .cad-btn { width:100%; padding:15px; border:none; border-radius:14px; background:linear-gradient(130deg,#1a55d0,#0090ff); color:#fff; font-size:15px; font-weight:700; font-family:'Lato',sans-serif; cursor:pointer; transition:transform .18s,box-shadow .18s; box-shadow:0 6px 24px rgba(26,85,208,0.35); margin-top:4px; }
        .cad-btn:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(26,85,208,0.5); }
        .cad-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        .cad-erro { background:rgba(220,50,50,0.12); border:1px solid rgba(220,50,50,0.25); border-radius:10px; padding:10px 14px; font-size:13px; color:rgba(255,120,120,0.9); margin-bottom:16px; }
        .cad-link { text-align:center; margin-top:20px; font-size:13px; color:rgba(100,160,255,0.55); }
        .cad-link button { background:none; border:none; color:rgba(100,180,255,0.8); font-weight:700; cursor:pointer; font-family:'Lato',sans-serif; font-size:13px; }

        /* Aguardando */
        .cad-wait { text-align:center; display:flex; flex-direction:column; align-items:center; gap:16px; }
        @keyframes cadPulse { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.08);opacity:1} }
        .cad-wait-icon { width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg,#1a55d0,#0090ff); display:grid; place-items:center; animation:cadPulse 2s ease-in-out infinite; box-shadow:0 8px 28px rgba(26,85,208,0.4); }
        .cad-wait-title { font-family:'Playfair Display',Georgia,serif; font-size:20px; font-weight:700; color:#ddeeff; margin:0; }
        .cad-wait-text { font-size:14px; color:rgba(160,200,255,0.65); line-height:1.7; margin:0; max-width:300px; }
        .cad-wait-badge { background:rgba(26,85,208,0.15); border:1px solid rgba(60,140,255,0.2); border-radius:999px; padding:6px 16px; font-size:12px; font-weight:700; color:rgba(80,180,255,0.8); letter-spacing:.08em; }
      `}</style>

      <main className="cad-root">
        <div className="cad-card">
          <div className="cad-logo">
            <img src="https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png" alt="AOGIM" />
          </div>

          {etapa === "form" ? (
            <>
              <h1 className="cad-title">Cadastro de Membro</h1>
              <p className="cad-sub">Assembléia de Deus — Ministério Irlanda</p>

              {erro && <div className="cad-erro">⚠️ {erro}</div>}

              <label className="cad-label">Nome completo</label>
              <input className="cad-input" placeholder="Seu nome completo" value={form.nome} onChange={e=>set("nome",e.target.value)} />

              <label className="cad-label">E-mail</label>
              <input className="cad-input" type="email" placeholder="seu@email.com" value={form.email} onChange={e=>set("email",e.target.value)} />

              <label className="cad-label">Telefone</label>
              <input className="cad-input" type="tel" placeholder="(62) 99999-9999" value={form.telefone} onChange={e=>set("telefone",e.target.value)} />

              <label className="cad-label">Senha</label>
              <input className="cad-input" type="password" placeholder="Mínimo 6 caracteres" value={form.senha} onChange={e=>set("senha",e.target.value)} />

              <label className="cad-label">Confirmar senha</label>
              <input className="cad-input" type="password" placeholder="Repita a senha" value={form.confirmar} onChange={e=>set("confirmar",e.target.value)} />

              <button className="cad-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? "Enviando…" : "Solicitar cadastro"}
              </button>

              <div className="cad-link">
                Já tem conta? <button onClick={()=>navigate("/login")}>Entrar</button>
              </div>
            </>
          ) : (
            <div className="cad-wait">
              <div className="cad-wait-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{width:28,height:28}}>
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="cad-wait-badge">⏳ Aguardando aprovação</span>
              <h2 className="cad-wait-title">Cadastro enviado!</h2>
              <p className="cad-wait-text">
                Seu cadastro foi recebido e está sendo analisado pela liderança. Você será notificado assim que for aprovado.
              </p>
              <button className="cad-btn" style={{marginTop:8}} onClick={()=>navigate("/login")}>
                Ir para o login
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}