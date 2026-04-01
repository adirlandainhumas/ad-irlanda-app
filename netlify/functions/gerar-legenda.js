const https = require("https");

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const req = https.request(
      {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          try {
            const data = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
            resolve(data?.content?.[0]?.text ?? "");
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { title, verseText, verseRef, body } = JSON.parse(event.body || "{}");

    if (!title || !verseText) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Campos obrigatórios ausentes." }),
      };
    }

    const prompt = `Você é um redator criativo e evangélico para redes sociais da Igreja AOGIM Conect.

Com base no devocional abaixo, escreva UMA legenda para Instagram com:
- Abertura impactante (1-2 frases que prendem a atenção)
- Conexão com o versículo e a reflexão (2-3 frases)
- CTA convidativo ao final (ex: "Salva pra ler depois 💾", "Manda pra alguém que precisa 🙏", etc.)
- EXATAMENTE 5 hashtags relevantes ao tema, misturando português e inglês
- Use emojis com moderação para dar leveza
- Tom: inspirador, acolhedor, autêntico — não exagerado ou forçado
- Máximo 280 caracteres na legenda principal (sem contar hashtags)

Devocional:
Título: ${title}
Versículo: "${verseText}" — ${verseRef}
Reflexão: ${body?.slice(0, 400) ?? ""}

Responda APENAS com a legenda pronta (com os 5 hashtags no final). Sem explicações, sem prefixos.`;

    const legenda = await callClaude(prompt);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ legenda: legenda.trim() }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
