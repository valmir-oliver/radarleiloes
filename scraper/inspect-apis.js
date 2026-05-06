const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
  Accept: "application/json, text/plain, */*",
  Referer: "https://www.sodresantoro.com.br/",
};

const apis = [
  "https://www.sodresantoro.com.br/api/lotes?categoria=veiculos&page=1",
  "https://www.sodresantoro.com.br/api/lotes?tipo=veiculo",
  "https://www.sodresantoro.com.br/api/veiculos",
  "https://www.sodresantoro.com.br/api/v1/lotes",
  "https://api.sodresantoro.com.br/lotes",
  "https://www.sodresantoro.com.br/lotes.json",
  "https://www.megaleiloes.com.br/api/lotes",
  "https://www.megaleiloes.com.br/veiculos/carros?format=json",
  "https://www.megaleiloes.com.br/api/v1/lotes?categoria=veiculos",
];

async function testar() {
  for (const url of apis) {
    try {
      const r = await axios.get(url, { headers, timeout: 8000 });
      const tipo = r.headers["content-type"] || "";
      console.log(`✅ [${r.status}] ${url}`);
      console.log(`   Content-Type: ${tipo}`);
      if (tipo.includes("json")) {
        console.log(`   Dados: ${JSON.stringify(r.data).slice(0, 200)}`);
      }
    } catch (e) {
      console.log(`❌ [${e.response?.status || e.code}] ${url}`);
    }
  }
}

testar();
