/**
 * Analisa o JS do Copart Brasil para encontrar endpoints de busca
 */
const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

async function main() {
  // Baixa o arquivo de controllers (contém as rotas/endpoints do Angular)
  const jsUrl = "https://www.copart.com.br/wro/controllers-0336c7efee840df3f39062d21cb07fbd.js";
  
  console.log("Baixando controllers.js...");
  let jsCode = "";
  try {
    const r = await axios.get(jsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        Referer: "https://www.copart.com.br/",
      },
      timeout: 15000,
    });
    jsCode = r.data;
    console.log(`Downloaded ${jsCode.length} chars`);
  } catch (e) {
    console.log("Erro:", e.message);
    return;
  }

  // Busca por padrões de endpoints
  const patterns = [
    /\/public\/[a-zA-Z0-9\/\-_]+/g,
    /\/data\/[a-zA-Z0-9\/\-_]+/g,
    /\/lots\/[a-zA-Z0-9\/\-_]+/g,
    /search[\-_]?[Rr]esults/g,
    /searchLots/g,
    /vehicleFinder/g,
    /"(\/[a-zA-Z][^"]{5,50})"/g,
  ];

  const found = new Set();
  for (const pattern of patterns) {
    const matches = jsCode.matchAll(pattern);
    for (const m of matches) {
      const match = m[1] || m[0];
      if (match.startsWith("/") || match.includes("search") || match.includes("lot")) {
        found.add(match);
      }
    }
  }

  console.log("\n=== ENDPOINTS/PATHS ENCONTRADOS ===");
  [...found]
    .filter((s) => s.length > 5 && s.length < 80)
    .filter((s) => s.includes("lot") || s.includes("search") || s.includes("vehicl") || s.includes("public"))
    .sort()
    .forEach((s) => console.log(s));

  // Busca especificamente por "search" no contexto
  console.log("\n=== CONTEXTO DE 'search' ===");
  const searchIdx = [];
  let pos = 0;
  while ((pos = jsCode.indexOf("search", pos)) !== -1) {
    const ctx = jsCode.slice(Math.max(0, pos - 50), pos + 80);
    if (ctx.includes("http") || ctx.includes("fetch") || ctx.includes("$http") || ctx.includes("ajax")) {
      searchIdx.push(ctx.trim());
    }
    pos++;
  }
  [...new Set(searchIdx)].slice(0, 10).forEach((c) => console.log("\n" + c));
}

main().catch(console.error);
