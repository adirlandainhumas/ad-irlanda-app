const https = require("https");

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9",
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    }).on("error", reject);
  });
}

function stripHtml(str) {
  return str
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim();
}

exports.handler = async () => {
  try {
    const now = new Date();
    const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                       "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    const dateLabel = `${now.getDate()} de ${MONTHS_PT[now.getMonth()]} de ${now.getFullYear()}`;

    const html = await fetchUrl("https://www.bibliaon.com/devocional_diario/");

    // ── Título ────────────────────────────────────────────────────────────
    // Está em <h3> dentro da seção "Devocional de Hoje"
    const titleMatch = html.match(/Devocional de Hoje[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/i);
    const title = titleMatch ? stripHtml(titleMatch[1]).trim() : "";

    // ── Versículo ─────────────────────────────────────────────────────────
    // Está em <blockquote> logo após o primeiro parágrafo
    // Formato: texto <br> - Livro X:Y
    const blockquoteMatch = html.match(/Devocional de Hoje[\s\S]*?<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i);
    let verseText = "";
    let verseRef  = "";

    if (blockquoteMatch) {
      const bq = stripHtml(blockquoteMatch[1]);
      // Separa na referência: "- Livro X:Y" no final
      const refMatch = bq.match(/^([\s\S]+?)\s*[-–]\s*((?:\d\s)?[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][\wÀ-ÿ\s]+\d+:\d+[\d\-,\s]*)$/);
      if (refMatch) {
        verseText = refMatch[1].trim();
        verseRef  = refMatch[2].trim();
      } else {
        verseText = bq;
      }
    }

    // ── Corpo (reflexão) ──────────────────────────────────────────────────
    // Parágrafos entre o blockquote e a seção de pontos/oração
    // Pega tudo entre </blockquote> e "#### Para orar" dentro da seção de hoje
    const bodyMatch = html.match(/<\/blockquote>([\s\S]*?)(?=<h4|Para orar:|Devocional de Ontem)/i);
    let body = "";
    if (bodyMatch) {
      // Remove listas de reflexão (bullet points) — pega só parágrafos <p>
      const paragraphs = [...bodyMatch[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(m => stripHtml(m[1]).trim())
        .filter(p => p.length > 20 && !p.startsWith("Veja também"));
      body = paragraphs.join("\n\n");
    }

    // ── Oração ────────────────────────────────────────────────────────────
    // Após "Para orar:" até próximo bloco
    const prayerMatch = html.match(/Para orar:([\s\S]*?)(?=Veja também:|Devocional de Ontem|<\/section|<h2)/i);
    let prayer = "";
    if (prayerMatch) {
      prayer = stripHtml(prayerMatch[1]).trim();
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
      body: JSON.stringify({
        ok: true,
        dateLabel,
        title:     title     || "Devocional do Dia",
        verseText: verseText || "",
        verseRef:  verseRef  || "",
        body:      body      || "",
        prayer:    prayer    || "",
        source: "bibliaon.com",
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};