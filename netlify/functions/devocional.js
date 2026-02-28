import * as cheerio from "cheerio";

function cleanText(t = "") {
  return t
    .replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeDateLabel() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function firstNonEmpty(values = []) {
  return values.map((v) => cleanText(v || "")).find(Boolean) || "";
}

function extractVerseFromText(text = "") {
  const normalized = cleanText(text);
  const refRegex = /((?:[1-3]\s*)?[A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+){0,3})\s(\d{1,3}:\d{1,3}(?:-\d{1,3})?)/;
  const refMatch = normalized.match(refRegex);

  if (!refMatch) return null;

  const verseRef = cleanText(refMatch[0]);
  const verseText = cleanText(
    normalized
      .replace(refMatch[0], "")
      .replace(/^[-–—:\s]+/, "")
      .replace(/["“”]/g, "")
  );

  return {
    verseRef,
    verseText,
  };
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ao acessar fonte externa: ${url}`);
  }

  return response.text();
}

function parseFromBibliaOn(html) {
  const $ = cheerio.load(html);
  const root = $("main").first().length ? $("main").first() : $("article").first().length ? $("article").first() : $("body");

  const title = firstNonEmpty([
    root.find("h1").first().text(),
    root.find("h2").first().text(),
  ]) || "Devocional do Dia";

  const verseCandidates = [
    root.find("blockquote").first().text(),
    root.find(".versiculo").first().text(),
    ...root.find("p").toArray().slice(0, 8).map((el) => $(el).text()),
  ];

  let verseText = "";
  let verseRef = "";

  for (const candidate of verseCandidates) {
    const extracted = extractVerseFromText(candidate);
    if (extracted) {
      verseText = extracted.verseText;
      verseRef = extracted.verseRef;
      break;
    }
  }

  const paragraphs = root
    .find("p")
    .toArray()
    .map((el) => cleanText($(el).text()))
    .filter((text) => text.length > 60)
    .filter((text) => !text.includes("Compartilhar"))
    .filter((text) => !text.includes("Leia também"));

  const body = cleanText(paragraphs.join("\n\n"));

  if (!body) {
    throw new Error("Fonte primária sem conteúdo suficiente");
  }

  return {
    title,
    verseText,
    verseRef,
    body,
  };
}

function parseFromBibliaOnline(html) {
  const $ = cheerio.load(html);

  const main =
    $("main").first().length
      ? $("main").first()
      : $("#content").first().length
      ? $("#content").first()
      : $("body");

  let title = firstNonEmpty([
    main.find("h2").first().text(),
    main.find("h1").first().text(),
  ]);

  if (!title || title.toLowerCase().includes("bíblia")) {
    title = "Devocional do Dia";
  }

  let verseText = "";
  let verseRef = "";

  const candidates = main.find("p").toArray();

  for (const el of candidates) {
    const extracted = extractVerseFromText($(el).text());
    if (extracted) {
      verseRef = extracted.verseRef;
      verseText = extracted.verseText;
      break;
    }
  }

  const paragraphs = main
    .find("p")
    .toArray()
    .map((p) => cleanText($(p).text()))
    .filter((t) => t.length > 60);

  const body = cleanText(paragraphs.join("\n\n"));

  if (!body) {
    throw new Error("Fonte secundária sem conteúdo suficiente");
  }

  return {
    title,
    verseText,
    verseRef,
    body,
  };
}

export const handler = async (event) => {
  try {
    const version = event.queryStringParameters?.b || "acf";

    const sources = [
      {
        name: "BibliaOn",
        url: "https://www.bibliaon.com/devocional_diario/",
        parse: parseFromBibliaOn,
      },
      {
        name: "BibliaOnline",
        url: `https://www.bibliaonline.com.br/devocional-diario?b=${version}`,
        parse: parseFromBibliaOnline,
      },
    ];

    let data = null;

    for (const source of sources) {
      try {
        const html = await fetchHtml(source.url);
        data = source.parse(html);
        if (data?.body) {
          break;
        }
      } catch (_error) {
        // Tenta a próxima fonte automaticamente.
      }
    }

    if (!data) {
      throw new Error("Não foi possível carregar nenhuma fonte de devocional");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        dateLabel: normalizeDateLabel(),
        title: data.title,
        verseText: data.verseText,
        verseRef: data.verseRef,
        body: data.body,
      }),
    };
  } catch (_error) {
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
