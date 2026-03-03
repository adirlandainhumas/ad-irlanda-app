const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Pega as variáveis de ambiente
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
    const { membroId, acao } = JSON.parse(event.body);

    if (!membroId || !["aprovar", "reprovar"].includes(acao)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Parâmetros inválidos." }),
      };
    }

    const novoStatus = acao === "aprovar" ? "aprovado" : "reprovado";

    const { error } = await supabase
      .from("membros")
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq("id", membroId);

    if (error) throw new Error(error.message);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ ok: true, status: novoStatus }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};