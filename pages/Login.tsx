import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", senha: "" });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async () => {
    setErro("");
    if (!form.email || !form.senha) { setErro("Preencha e-mail e senha."); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.senha,
      });
      if (error) throw new Error("E-mail ou senha incorretos.");

      // Verifica status do membro
      const { data: membro } = await supabase
        .from("membros")
        .select("status, ficha_preenchida")
        .eq("id", data.user.id)
        .single();

      if (!membro || membro.status === "pendente") {
        await supabase.auth.signOut();
        setErro("Seu cadastro ainda está aguardando aprovação da liderança.");
        return;
      }
      if (membro.status === "reprovado") {
        await supabase.auth.signOut();
        setErro("Seu cadastro não foi aprovado. Entre em contato com a liderança.");
        return;
      }

      // Aprovado — redireciona
      if (!membro.ficha_preenchida) {
        navigate("/ficha");
      } else {
        navigate("/membro");
      }
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Lato:wght@300;400;700&display=swap');
        * { box-sizing:border-box; }
        .lg-root { font-family:'Lato',sans-serif; min-height:100vh; background:linear-gradient(155deg,#060d20 0%,#0a1535 40%,#0e1d50 70%,#050f28 100%); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px 16px; }
        .lg-card { width:100%; max-width:400px; background:rgba(255,255,255,0.04); border:1px solid rgba(60,140,255,0.15); border-radius:24px; padding:32px 24px; }
        .lg-logo { display:flex; justify-content:center; margin-bottom:24px; }
        .lg-logo img { width:72px; filter:drop-shadow(0 0 14px rgba(80,160,255,0.3)); }
        .lg-title { font-family:'Playfair Display',Georgia,serif; font-size:22px; font-weight:700; color:#ddeeff; text-align:center; margin:0 0 4px; }
        .lg-sub { font-size:13px; color:rgba(120,180,255,0.5); text-align:center; font-style:italic; margin:0 0 28px; font-family:'Playfair Display',Georgia,serif; }
        .lg-label { font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:rgba(80,160,255,0.7); margin:0 0 6px; display:block; }
        .lg-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(60,140,255,0.2); border-radius:12px; padding:12px 14px; font-size:15px; color:#ddeeff; font-family:'Lato',sans-serif; outline:none; transition:border-color .18s; margin-bottom:16px; }
        .lg-input:focus { border-color:rgba(80,160,255,0.5); }
        .lg-input::placeholder { color:rgba(120,160,220,0.3); }
        .lg-btn { width:100%; padding:15px; border:none; border-radius:14px; background:linear-gradient(130deg,#1a55d0,#0090ff); color:#fff; font-size:15px; font-weight:700; font-family:'Lato',sans-serif; cursor:pointer; transition:transform .18s,box-shadow .18s; box-shadow:0 6px 24px rgba(26,85,208,0.35); }
        .lg-btn:hover { transform:translateY(-2px); }
        .lg-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        .lg-erro { background:rgba(220,50,50,0.12); border:1px solid rgba(220,50,50,0.25); border-radius:10px; padding:10px 14px; font-size:13px; color:rgba(255,120,120,0.9); margin-bottom:16px; }
        .lg-link { text-align:center; margin-top:20px; font-size:13px; color:rgba(100,160,255,0.55); }
        .lg-link button { background:none; border:none; color:rgba(100,180,255,0.8); font-weight:700; cursor:pointer; font-family:'Lato',sans-serif; font-size:13px; }
      `}</style>

      <main className="lg-root">
        <div className="lg-card">
          <div className="lg-logo">
            <img src="https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png" alt="AOGIM" />
          </div>
          <h1 className="lg-title">Área do Membro</h1>
          <p className="lg-sub">Assembléia de Deus — Ministério Irlanda</p>

          {erro && <div className="lg-erro">⚠️ {erro}</div>}

          <label className="lg-label">E-mail</label>
          <input className="lg-input" type="email" placeholder="seu@email.com" value={form.email} onChange={e=>set("email",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} />

          <label className="lg-label">Senha</label>
          <input className="lg-input" type="password" placeholder="Sua senha" value={form.senha} onChange={e=>set("senha",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} />

          <button className="lg-btn" onClick={handleLogin} disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <div className="lg-link">
            Ainda não é membro? <button onClick={()=>navigate("/cadastro")}>Solicitar cadastro</button>
          </div>
        </div>
      </main>
    </>
  );
}