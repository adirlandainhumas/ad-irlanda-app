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
        @keyframes cadPulse { 0%,100%{transform:scale(1);opacity:.85} 50%{transform:scale(1.06);opacity:1} }
        .cad-wait-icon { animation: cadPulse 2s ease-in-out infinite; }
      `}</style>

      <main className="page-center">
        <div className="form-card">
          <div className="form-logo">
            <img src="https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png" alt="AOGIM" />
          </div>

          {etapa === "form" ? (
            <>
              <h1 className="form-title">Cadastro de Membro</h1>
              <p className="form-sub" style={{ marginBottom: 28 }}>Assembléia de Deus — Ministério Irlanda</p>

              {erro && <div className="msg-erro">⚠️ {erro}</div>}

              <label className="field-label">Nome completo</label>
              <input className="field-input" placeholder="Seu nome completo" value={form.nome} onChange={e=>set("nome",e.target.value)} />

              <label className="field-label">E-mail</label>
              <input className="field-input" type="email" placeholder="seu@email.com" value={form.email} onChange={e=>set("email",e.target.value)} />

              <label className="field-label">Telefone</label>
              <input className="field-input" type="tel" placeholder="(62) 99999-9999" value={form.telefone} onChange={e=>set("telefone",e.target.value)} />

              <label className="field-label">Senha</label>
              <input className="field-input" type="password" placeholder="Mínimo 6 caracteres" value={form.senha} onChange={e=>set("senha",e.target.value)} />

              <label className="field-label">Confirmar senha</label>
              <input className="field-input" type="password" placeholder="Repita a senha" value={form.confirmar} onChange={e=>set("confirmar",e.target.value)} />

              <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginTop: 4 }}>
                {loading ? "Enviando…" : "Solicitar cadastro"}
              </button>

              <div className="form-nav">
                Já tem conta? <button onClick={()=>navigate("/login")}>Entrar</button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div
                className="cad-wait-icon"
                style={{ width: 64, height: 64, borderRadius: "50%", background: "#EFF6FF", border: "1px solid #BFDBFE", display: "grid", placeItems: "center" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth="2" style={{ width: 28, height: 28 }}>
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 999, padding: "5px 16px", fontSize: 12, fontWeight: 700, color: "#1E40AF", letterSpacing: ".06em" }}>
                Aguardando aprovação
              </span>
              <h2 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: 20, fontWeight: 700, color: "var(--ink, #1C1917)", margin: 0 }}>
                Cadastro enviado!
              </h2>
              <p style={{ fontSize: 14, color: "var(--ink-2, #57534E)", lineHeight: 1.7, margin: 0, maxWidth: 300 }}>
                Seu cadastro foi recebido e está sendo analisado pela liderança. Você será notificado assim que for aprovado.
              </p>
              <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => navigate("/login")}>
                Ir para o login
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}