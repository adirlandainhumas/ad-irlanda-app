const https = require("https");

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

exports.handler = async () => {
  try {
    const now = new Date();
    const day   = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year  = now.getFullYear();

    const html = await fetchUrl("https://www.devocionaldiario.com.br/");

    // Extrai o primeiro devocional do dia (o mais recente)
    // Versículo: está em <em><strong>...</strong></em>
    const verseMatch = html.match(/<em><strong>([\s\S]*?)<\/strong><\/em>/);
    const verseRaw = verseMatch
      ? verseMatch[1].replace(/<[^>]+>/g, "").trim()
      : "";

    // Separa texto do versículo da referência
    // Formato: "texto do versículo" Livro X:Y
    const verseRefMatch = verseRaw.match(/^([\s\S]+?)\s+([\w\s]+\d+:\d+[\d\-,]*)\s*$/);
    const verseText = verseRefMatch ? verseRefMatch[1].replace(/^"|"$/g, "").trim() : verseRaw;
    const verseRef  = verseRefMatch ? verseRefMatch[2].trim() : "";

    // Pensamento: entre <strong>Pensamento:</strong> e <strong>Oração:</strong>
    const thoughtMatch = html.match(/<strong>Pensamento:<\/strong>([\s\S]*?)<strong>Ora/);
    const thought = thoughtMatch
      ? thoughtMatch[1].replace(/<[^>]+>/g, "").trim()
      : "";

    // Oração: entre <strong>Oração:</strong> e próximo bloco
    const prayerMatch = html.match(/<strong>Ora[çc][ãa]o:<\/strong>([\s\S]*?)<\/p>/);
    const prayer = prayerMatch
      ? prayerMatch[1].replace(/<[^>]+>/g, "").trim()
      : "";

    const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    const dateLabel = `${parseInt(day)} de ${MONTHS_PT[now.getMonth()]} de ${year}`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        ok: true,
        dateLabel,
        verseText,
        verseRef,
        thought,
        prayer,
        source: "devocionaldiario.com.br",
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};