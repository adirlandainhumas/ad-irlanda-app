const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // chave service_role (não a anon!)
);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { nome, email, telefone, senha } = JSON.parse(event.body);

    // 1. Cria usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true, // já confirma direto, aprovação é manual
    });

    if (authError) throw new Error(authError.message);

    const userId = authData.user.id;

    // 2. Insere na tabela membros com status pendente
    const { error: membroError } = await supabase
      .from("membros")
      .insert({ id: userId, nome, email, telefone, status: "pendente" });

    if (membroError) throw new Error(membroError.message);

    // 3. Monta link do WhatsApp para o admin
    const adminNum = "5562944788817";
    const adminUrl = "https://aogimconectinhumas.site/#/admin";
    const msg = `🔔 *Novo cadastro de membro no site!*\n\n👤 *Nome:* ${nome}\n📧 *E-mail:* ${email}\n📱 *Telefone:* ${telefone}\n\n✅ Acesse a área Admin para aprovar ou reprovar:\n${adminUrl}`;
    const waLink = `https://wa.me/${adminNum}?text=${encodeURIComponent(msg)}`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, waLink }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};