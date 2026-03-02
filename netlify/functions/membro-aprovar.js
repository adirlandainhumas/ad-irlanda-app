const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405 };

  try {
    const { membroId, acao } = JSON.parse(event.body); // acao: "aprovar" | "reprovar"

    const novoStatus = acao === "aprovar" ? "aprovado" : "reprovado";

    const { error } = await supabase
      .from("membros")
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq("id", membroId);

    if (error) throw new Error(error.message);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, status: novoStatus }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};