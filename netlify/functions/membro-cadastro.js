const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Variáveis de ambiente não configuradas." }),
    };
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { nome, email, telefone, senha } = JSON.parse(event.body);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    });

    if (authError) throw new Error(authError.message);

    const userId = authData.user.id;

    const { error: membroError } = await supabase
      .from("membros")
      .insert({ id: userId, nome, email, telefone, status: "pendente" });

    if (membroError) throw new Error(membroError.message);

    const adminNum = "556294478817";
    const adminUrl = "https://aogimconectinhumas.site/#/admin";
    const msg = `🔔 *Novo cadastro de membro no site!*\n\n👤 *Nome:* ${nome}\n📧 *E-mail:* ${email}\n📱 *Telefone:* ${telefone}\n\n✅ Acesse a área Admin para aprovar:\n${adminUrl}`;
    const waLink = `https://web.whatsapp.com/send?phone=${adminNum}&text=${encodeURIComponent(msg)}`;

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