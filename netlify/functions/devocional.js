import * as cheerio from "cheerio";

function cleanText(t = "") {
  return t.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
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

    if (!response.ok) {
      throw new Error("Erro ao acessar fonte externa");
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const main =
      $("main").first().length
        ? $("main").first()
        : $("#content").first().length
        ? $("#content").first()
        : $("body");

    let title =
      main.find("h2").first().text().trim() ||
      main.find("h1").first().text().trim();

    if (!title || title.toLowerCase().includes("bíblia")) {
      title = "Devocional do Dia";
    }

    let verseText = "";
    let verseRef = "";

    const candidates = main.find("p").toArray();

    for (const el of candidates) {
      const text = cleanText($(el).text());

      const refMatch = text.match(/([1-3]?\s?[A-Za-zÀ-ÿ]+)\s(\d{1,3}:\d{1,3})/);

      if (refMatch) {
        verseRef = refMatch[0];
        verseText = text.replace(refMatch[0], "").replace(/^\d+\s+/, "").trim();
        break;
      }
    }

    const paragraphs = main
      .find("p")
      .toArray()
      .map((p) => cleanText($(p).text()))
      .filter((t) => t.length > 60);

    const body = paragraphs.join("\n\n");

    return {
      statusCode: 200,
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
        body: body.slice(0, 2000),
      }),
    };
  } catch (error) {

    // 🔥 Fallback automático se der erro externo
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        dateLabel: new Date().toLocaleDateString("pt-BR"),
        title: "Confie no Senhor",
        verseText: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.",
        verseRef: "Salmos 37:5",
        body:
          "Mesmo quando algo falha tecnicamente, Deus continua no controle. A fé não depende de conexões externas, mas da nossa confiança nEle. Hoje, entregue seu caminho ao Senhor e descanse.",
      }),
    };
  }
};