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
    <main className="page-center">
      <div className="form-card">
        <div className="form-logo">
          <img src="https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png" alt="AOGIM" />
        </div>
        <h1 className="form-title">Área do Membro</h1>
        <p className="form-sub" style={{ marginBottom: 28 }}>Assembléia de Deus — Ministério Irlanda</p>

        {erro && <div className="msg-erro">⚠️ {erro}</div>}

        <label className="field-label">E-mail</label>
        <input className="field-input" type="email" placeholder="seu@email.com" value={form.email} onChange={e=>set("email",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} />

        <label className="field-label">Senha</label>
        <input className="field-input" type="password" placeholder="Sua senha" value={form.senha} onChange={e=>set("senha",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} />

        <button className="btn-primary" onClick={handleLogin} disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <div className="form-nav">
          Ainda não é membro? <button onClick={()=>navigate("/cadastro")}>Solicitar cadastro</button>
        </div>
      </div>
    </main>
  );
}