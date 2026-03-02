const https = require("https");
const http  = require("http");

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9",
      }
    }, (res) => {
      // Segue redirecionamentos
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("latin1")));
    }).on("error", reject);
  });
}

function cleanHtml(str) {
  return str
    .replace(/<[^>]+>/g, " ")   // remove tags
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
    const now   = new Date();
    const day   = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year  = now.getFullYear();

    const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                       "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    const dateLabel = `${parseInt(day)} de ${MONTHS_PT[now.getMonth()]} de ${year}`;

    const html = await fetchUrl("https://www.devocionaldiario.com.br/");

    // ── Versículo ──────────────────────────────────────────────────────────
    // No HTML vem como: <em><strong>"texto do verso" Livro X:Y</strong></em>
    // ou às vezes só com <strong><em>
    let verseRaw = "";
    const versePatterns = [
      /<em><strong>([\s\S]*?)<\/strong><\/em>/i,
      /<strong><em>([\s\S]*?)<\/em><\/strong>/i,
      /<i><b>([\s\S]*?)<\/b><\/i>/i,
      /<b><i>([\s\S]*?)<\/i><\/b>/i,
    ];
    for (const pat of versePatterns) {
      const m = html.match(pat);
      if (m && m[1] && m[1].length > 10) {
        verseRaw = cleanHtml(m[1]);
        break;
      }
    }

    // Se não achou pelas tags, tenta pelo padrão de texto: texto entre aspas + referência
    if (!verseRaw) {
      // Busca parágrafo que contém versículo bíblico (tem aspas e referência como "João 3:16")
      const pMatch = html.match(/<p[^>]*>([\s\S]*?[""][^<]{10,}[""]\s*[\w\s]+\d+:\d+[\d\-,\s]*)<\/p>/i);
      if (pMatch) verseRaw = cleanHtml(pMatch[1]);
    }

    // Separa texto da referência
    // Referência bíblica: palavra(s) seguida(s) de número:número (ex: "João 3:16", "Efésios 3:20-21")
    let verseText = verseRaw;
    let verseRef  = "";
    const refPattern = /^([\s\S]+?)\s+((?:\d\s)?[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)*\s+\d+:\d+[\d\-,\s]*(?:e\s+\w+\s+\d+:\d+[\d\-,\s]*)?)$/;
    const refMatch = verseRaw.match(refPattern);
    if (refMatch) {
      verseText = refMatch[1].replace(/^[""\u201C\u201D]+|[""\u201C\u201D]+$/g, "").trim();
      verseRef  = refMatch[2].trim();
    }

    // ── Pensamento ────────────────────────────────────────────────────────
    // Padrão: <strong>Pensamento:</strong> texto até <strong>Oração:</strong>
    let thought = "";
    const thoughtMatch = html.match(
      /<strong>Pensamento:<\/strong>([\s\S]*?)(?=<strong>Ora[çc][ãa]o:|<br\s*\/?>[\s\S]{0,20}<strong>|Papel de Parede)/i
    );
    if (thoughtMatch) {
      thought = cleanHtml(thoughtMatch[1]);
    }

    // ── Oração ────────────────────────────────────────────────────────────
    // Padrão: <strong>Oração:</strong> texto até próximo bloco
    let prayer = "";
    const prayerMatch = html.match(
      /<strong>Ora[çc][ãa]o:<\/strong>([\s\S]*?)(?=<strong>Enviado|<strong>Papel|Papel de Parede|\n\s*\n\s*\n)/i
    );
    if (prayerMatch) {
      prayer = cleanHtml(prayerMatch[1]);
    }

    // Fallback: tenta extrair do texto corrido
    if (!thought || !prayer) {
      const text = cleanHtml(html);
      if (!thought) {
        const tm = text.match(/Pensamento:\s*([\s\S]*?)(?=\s*Ora[çc][ãa]o:|Papel de Parede)/i);
        if (tm) thought = tm[1].trim();
      }
      if (!prayer) {
        const pm = text.match(/Ora[çc][ãa]o:\s*([\s\S]*?)(?=\s*Enviado por:|Papel de Parede|Download)/i);
        if (pm) prayer = pm[1].trim();
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        ok: true,
        dateLabel,
        verseText: verseText || "Versículo não disponível",
        verseRef:  verseRef  || "",
        thought:   thought   || "Pensamento não disponível",
        prayer:    prayer    || "Oração não disponível",
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