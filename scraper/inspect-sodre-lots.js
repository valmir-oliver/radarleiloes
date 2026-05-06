const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json",
  Referer: "https://www.sodresantoro.com.br/",
};

async function testar() {
  // Tenta buscar lotes do leilão 28553
  const endpoints = [
    "https://prd-api.sodresantoro.com.br/api/v1/auctions/28553/lots?limit=200",
    "https://prd-api.sodresantoro.com.br/api/v1/lots?auction_id=28553&limit=50",
    "https://prd-api.sodresantoro.com.br/api/v1/lots?auctionId=28553&limit=50",
    "https://prd-api.sodresantoro.com.br/api/v1/auctions/28553/lots?page=1&limit=50",
    "https://prd-api.sodresantoro.com.br/api/v1/lots?segment=veiculos&limit=50",
    "https://prd-api.sodresantoro.com.br/api/v1/lots?segmentName=veiculos&limit=50",
    "https://prd-api.sodresantoro.com.br/api/v1/lots?limit=50&status=online",
    "https://prd-api.sodresantoro.com.br/api/v1/segments/veiculos/lots?limit=50",
  ];

  for (const url of endpoints) {
    try {
      const r = await axios.get(url, { headers, timeout: 8000 });
      console.log(`✅ [${r.status}] ${url}`);
      console.log("   Body:", JSON.stringify(r.data).slice(0, 300));
    } catch (e) {
      console.log(`❌ [${e.response?.status || e.code}] ${url}`);
    }
  }

  // Também tenta buscar leilões sem filtro para ver mais
  console.log("\n--- Todos leilões sem filtro ---");
  try {
    const r = await axios.get("https://prd-api.sodresantoro.com.br/api/v1/auctions?limit=20&status=online", { headers });
    console.log("Total leilões:", r.data.data?.length);
    r.data.data?.forEach(a => {
      console.log(`  ID: ${a.id}, Nome: ${a.name}, Qtd: ${a.quantity}, Seg: ${a.segmentName}`);
    });
  } catch (e) { console.log("ERRO:", e.message); }
}

testar().catch(console.error);
