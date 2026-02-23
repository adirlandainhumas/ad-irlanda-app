import * as cheerio from "cheerio";

function cleanText(t = "") {
  return t
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const handler = async (event) => {
  try {
    const version = event.queryStringParameters?.b || "acf";
    const url = `https://www.bibliaonline.com.br/devocional-diario?b=${version}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const main =
      $("main").first().length
        ? $("main").first()
        : $("#content").first().length
        ? $("#content").first()
        : $("body");

    // Título do devocional (mais específico)
    let title = main.find("h2").first().text().trim() || main.find("h1").first().text().trim();
    if (!title || title.toLowerCase() === "bíblia online") title = "Devocional do Dia";

    // Heurística para achar versículo e referência
    let verseText = "";
    let verseRef = "";

    const candidates = main.find("p, h3, h4, blockquote, div").toArray();
    for (const el of candidates) {
      const text = cleanText($(el).text());
      if (!verseText && text.length > 20 && text.length < 400) {
        const refMatch = text.match(/([1-3]?\s?[A-Za-zÀ-ÿ]+)\s(\d{1,3}:\d{1,3})/);
        if (refMatch) {
          verseRef = refMatch[0].trim();
          verseText = text.replace(refMatch[0], "").replace(/[—-]\s*$/, "").trim();
          break;
        }
      }
    }

    // Limpa número do versículo no começo (ex: "46 ")
    verseText = verseText.replace(/^\d+\s+/, "").trim();

    // Monta texto principal pegando parágrafos longos
    const paragraphs = main
      .find("p")
      .toArray()
      .map((p) => cleanText($(p).text()))
      .filter(Boolean);

    const longOnes = paragraphs.filter((t) => t.length > 60);
    const body = cleanText(longOnes.join("\n\n"));

    // Limita tamanho do body para leitura confortável
    const MAX = 2200;
    const safeBody = body.length > MAX ? body.slice(0, MAX).trim() + "..." : body;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        ok: true,
        dateLabel: new Date().toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        title,
        verseText,
        verseRef,
        body: safeBody,
        sourceUrl: url,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        ok: false,
        error: String(error?.message || error),
      }),
    };
  }
};  s