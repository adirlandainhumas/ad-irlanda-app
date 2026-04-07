const https = require("https");

const FOLDER_ID = "1rvTtzvidSVv-95O14-z90W6Foz1K9l7n";

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(e); }
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

exports.handler = async () => {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "GOOGLE_API_KEY não configurada" }),
    };
  }

  const query = encodeURIComponent(`'${FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`);
  const fields = encodeURIComponent("files(id,name,mimeType)");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&key=${apiKey}&fields=${fields}&pageSize=20&orderBy=createdTime+desc`;

  try {
    const data = await fetchJson(url);

    if (!data.files || data.files.length === 0) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ fotos: [] }),
      };
    }

    const fotos = data.files.map((f) => ({
      id: f.id,
      name: f.name,
      // URL direta para exibição — funciona em pastas públicas do Drive
      url: `https://drive.google.com/thumbnail?id=${f.id}&sz=w1200`,
    }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300", // cache 5 min
      },
      body: JSON.stringify({ fotos }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) }),
    };
  }
};
