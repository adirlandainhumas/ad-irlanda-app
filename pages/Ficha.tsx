import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const FUNCOES = ["Membro","Diácono","Diáconisa","Presbítero","Evangelista","Pastor","Auxiliar","Líder de Jovens","Líder de Louvor","Outro"];
const ESTADOS_CIVIS = ["Solteiro(a)","Casado(a)","Divorciado(a)","Viúvo(a)","União Estável"];
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function Ficha() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState(1); // 1: pessoal, 2: endereço, 3: eclesiastico + foto
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [fotoFile, setFotoFile] = useState<File|null>(null);
  const [fotoPreview, setFotoPreview] = useState<string|null>(null);

  const [form, setForm] = useState({
    nome_completo:"", sexo:"", data_nascimento:"", estado_civil:"",
    logradouro:"", numero:"", complemento:"", bairro:"", cep:"", cidade:"", uf:"",
    celular:"", email:"",
    data_entrada_igreja:"", data_batismo:"", funcao:"",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setFotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const buscarCep = async () => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (!d.erro) {
        setForm(f => ({ ...f, logradouro: d.logradouro||f.logradouro, bairro: d.bairro||f.bairro, cidade: d.localidade||f.cidade, uf: d.uf||f.uf }));
      }
    } catch {}
  };

  const handleSubmit = async () => {
    setErro(""); setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // Upload da foto
      let foto_url = "";
      if (fotoFile) {
        const ext = fotoFile.name.split(".").pop();
        const path = `${user.id}/perfil.${ext}`;
        const { error: upErr } = await supabase.storage.from("fotos-membros").upload(path, fotoFile, { upsert: true });
        if (upErr) throw new Error("Erro no upload da foto.");
        const { data: urlData } = supabase.storage.from("fotos-membros").getPublicUrl(path);
        foto_url = urlData.publicUrl;
      }

      // Salva ficha
      const { error: fichaErr } = await supabase.from("fichas_cadastrais").insert({
        membro_id: user.id, ...form, foto_url,
      });
      if (fichaErr) throw new Error(fichaErr.message);

      // Marca ficha como preenchida
      await supabase.from("membros").update({ ficha_preenchida: true }).eq("id", user.id);

      navigate("/membro");
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width:"100%", background:"#F5F2EE", border:"1px solid #E8E5E0",
    borderRadius:10, padding:"12px 14px", fontSize:15, color:"#1C1917",
    fontFamily:"'Lato',sans-serif", outline:"none", marginBottom:14,
    transition:"border-color .18s, background .18s",
  };
  const labelStyle: React.CSSProperties = {
    fontSize:11, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase" as const,
    color:"#A8A29E", marginBottom:6, display:"block",
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, appearance:"none" as const };

  return (
    <>
      <style>{`
        .fi-root { font-family:'Lato',sans-serif; min-height:100vh; background:#FAFAF8; padding:24px 16px 80px; }
        .fi-inner { max-width:500px; margin:0 auto; }
        .fi-logo { display:flex; justify-content:center; margin-bottom:20px; }
        .fi-logo img { width:64px; }
        .fi-title { font-family:'Playfair Display',Georgia,serif; font-size:20px; font-weight:700; color:#1C1917; text-align:center; margin:0 0 4px; }
        .fi-sub { font-size:13px; color:#A8A29E; text-align:center; font-style:italic; margin:0 0 24px; font-family:'Playfair Display',Georgia,serif; }
        .fi-steps { display:flex; justify-content:center; gap:8px; margin-bottom:28px; }
        .fi-step { width:32px; height:4px; border-radius:999px; background:#E8E5E0; transition:background .3s; }
        .fi-step-active { background:#166534; }
        .fi-step-done { background:#BBF7D0; }
        .fi-card { background:#FFFFFF; border:1px solid #E8E5E0; border-radius:16px; padding:24px; margin-bottom:16px; box-shadow:0 1px 4px rgba(28,25,23,0.05); }
        .fi-section { font-size:10px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:#A8A29E; margin:0 0 18px; display:flex; align-items:center; gap:8px; }
        .fi-section::after { content:''; flex:1; height:1px; background:#E8E5E0; }
        .fi-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .fi-erro { background:#FEF2F2; border:1px solid #FECACA; border-radius:10px; padding:10px 14px; font-size:13px; color:#991B1B; margin-bottom:16px; }
        .fi-btn { width:100%; padding:14px; border:none; border-radius:12px; background:#166534; color:#fff; font-size:15px; font-weight:700; font-family:'Lato',sans-serif; cursor:pointer; transition:background .18s; }
        .fi-btn:hover { background:#15803D; }
        .fi-btn:disabled { opacity:.5; cursor:not-allowed; }
        .fi-btn-sec { width:100%; padding:13px; border:1px solid #E8E5E0; border-radius:12px; background:transparent; color:#57534E; font-size:14px; font-weight:700; font-family:'Lato',sans-serif; cursor:pointer; margin-bottom:10px; transition:border-color .18s, color .18s; }
        .fi-btn-sec:hover { border-color:#A8A29E; color:#1C1917; }

        /* Foto upload */
        .fi-foto-area { display:flex; flex-direction:column; align-items:center; gap:14px; margin-bottom:16px; }
        .fi-foto-preview { width:100px; height:100px; border-radius:50%; overflow:hidden; border:2px solid #E8E5E0; background:#F5F2EE; display:grid; place-items:center; }
        .fi-foto-preview img { width:100%; height:100%; object-fit:cover; }
        .fi-foto-btn { display:inline-flex; align-items:center; gap:7px; background:#F0FDF4; border:1px solid #BBF7D0; border-radius:999px; padding:8px 18px; font-size:13px; font-weight:700; color:#166534; cursor:pointer; font-family:'Lato',sans-serif; transition:background .15s; }
        .fi-foto-btn:hover { background:#dcfce7; }
      `}</style>

      <main className="fi-root">
        <div className="fi-inner">
          <div className="fi-logo">
            <img src="https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png" alt="AOGIM" />
          </div>
          <h1 className="fi-title">Ficha Cadastral</h1>
          <p className="fi-sub">Assembléia de Deus — Ministério Irlanda</p>

          <div className="fi-steps">
            {[1,2,3].map(s=>(
              <div key={s} className={`fi-step ${s<etapa?"fi-step-done":s===etapa?"fi-step-active":""}`}/>
            ))}
          </div>

          {erro && <div className="fi-erro">⚠️ {erro}</div>}

          {/* Etapa 1 — Dados pessoais */}
          {etapa===1&&(
            <div className="fi-card">
              <p className="fi-section">Dados Pessoais</p>
              <label style={labelStyle}>Nome completo</label>
              <input style={inputStyle} placeholder="Nome completo" value={form.nome_completo} onChange={e=>set("nome_completo",e.target.value)} />
              <div className="fi-row">
                <div>
                  <label style={labelStyle}>Sexo</label>
                  <select style={selectStyle} value={form.sexo} onChange={e=>set("sexo",e.target.value)}>
                    <option value="">Selecione</option>
                    <option>Masculino</option><option>Feminino</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Data de nascimento</label>
                  <input style={inputStyle} type="date" value={form.data_nascimento} onChange={e=>set("data_nascimento",e.target.value)} />
                </div>
              </div>
              <label style={labelStyle}>Estado civil</label>
              <select style={selectStyle} value={form.estado_civil} onChange={e=>set("estado_civil",e.target.value)}>
                <option value="">Selecione</option>
                {ESTADOS_CIVIS.map(ec=><option key={ec}>{ec}</option>)}
              </select>
              <label style={labelStyle}>Celular</label>
              <input style={inputStyle} type="tel" placeholder="(62) 99999-9999" value={form.celular} onChange={e=>set("celular",e.target.value)} />
              <label style={labelStyle}>E-mail</label>
              <input style={inputStyle} type="email" placeholder="seu@email.com" value={form.email} onChange={e=>set("email",e.target.value)} />
              <button className="fi-btn" onClick={()=>{if(!form.nome_completo||!form.sexo||!form.data_nascimento||!form.estado_civil){setErro("Preencha todos os campos.");return;}setErro("");setEtapa(2);}}>
                Próximo →
              </button>
            </div>
          )}

          {/* Etapa 2 — Endereço */}
          {etapa===2&&(
            <div className="fi-card">
              <p className="fi-section">Endereço</p>
              <label style={labelStyle}>CEP</label>
              <input style={inputStyle} placeholder="00000-000" value={form.cep} onChange={e=>set("cep",e.target.value)} onBlur={buscarCep} />
              <label style={labelStyle}>Logradouro</label>
              <input style={inputStyle} placeholder="Rua, Avenida..." value={form.logradouro} onChange={e=>set("logradouro",e.target.value)} />
              <div className="fi-row">
                <div>
                  <label style={labelStyle}>Número</label>
                  <input style={inputStyle} placeholder="Nº" value={form.numero} onChange={e=>set("numero",e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Complemento</label>
                  <input style={inputStyle} placeholder="Apto, Bloco..." value={form.complemento} onChange={e=>set("complemento",e.target.value)} />
                </div>
              </div>
              <label style={labelStyle}>Bairro</label>
              <input style={inputStyle} placeholder="Bairro" value={form.bairro} onChange={e=>set("bairro",e.target.value)} />
              <div className="fi-row">
                <div>
                  <label style={labelStyle}>Cidade</label>
                  <input style={inputStyle} placeholder="Cidade" value={form.cidade} onChange={e=>set("cidade",e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>UF</label>
                  <select style={selectStyle} value={form.uf} onChange={e=>set("uf",e.target.value)}>
                    <option value="">UF</option>
                    {UFS.map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <button className="fi-btn-sec" onClick={()=>setEtapa(1)}>← Voltar</button>
              <button className="fi-btn" onClick={()=>{if(!form.logradouro||!form.cidade){setErro("Preencha pelo menos logradouro e cidade.");return;}setErro("");setEtapa(3);}}>
                Próximo →
              </button>
            </div>
          )}

          {/* Etapa 3 — Eclesiástico + Foto */}
          {etapa===3&&(
            <div className="fi-card">
              <p className="fi-section">Informações Eclesiásticas</p>
              <div className="fi-row">
                <div>
                  <label style={labelStyle}>Entrada na igreja</label>
                  <input style={inputStyle} type="date" value={form.data_entrada_igreja} onChange={e=>set("data_entrada_igreja",e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Data de batismo</label>
                  <input style={inputStyle} type="date" value={form.data_batismo} onChange={e=>set("data_batismo",e.target.value)} />
                </div>
              </div>
              <label style={labelStyle}>Função na igreja</label>
              <select style={selectStyle} value={form.funcao} onChange={e=>set("funcao",e.target.value)}>
                <option value="">Selecione</option>
                {FUNCOES.map(f=><option key={f}>{f}</option>)}
              </select>

              <p className="fi-section" style={{marginTop:8}}>Foto do Membro</p>
              <div className="fi-foto-area">
                <div className="fi-foto-preview">
                  {fotoPreview
                    ? <img src={fotoPreview} alt="preview"/>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="#D6D3D1" strokeWidth="1.5" style={{width:36,height:36}}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  }
                </div>
                <label className="fi-foto-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {fotoPreview ? "Trocar foto" : "Enviar foto"}
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={handleFoto} />
                </label>
                <p style={{fontSize:11,color:"#A8A29E",margin:0,textAlign:"center"}}>
                  Foto recente, fundo neutro. Será usada no cartão de membro.
                </p>
              </div>

              <button className="fi-btn-sec" onClick={()=>setEtapa(2)}>← Voltar</button>
              <button className="fi-btn" onClick={handleSubmit} disabled={loading||!fotoFile}>
                {loading ? "Salvando…" : "Concluir cadastro →"}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}