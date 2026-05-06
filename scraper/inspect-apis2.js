/**
 * Inspeciona estrutura das APIs do Sodre Santoro e Superbid
 */
const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
  Accept: "application/json",
};

async function inspecionarSodre() {
  console.log("\n=== SODRE SANTORO API ===");

  // 1. Destaques com lotes
  try {
    const r = await axios.get(
      "https://prd-api.sodresantoro.com.br/api/v1/site/highlights?segmentName=veiculos&limit=50",
      { headers }
    );
    console.log(`\n[highlights] Total: ${r.data.data?.length}`);
    if (r.data.data?.[0]) {
      console.log("Exemplo:", JSON.stringify(r.data.data[0], null, 2));
    }
  } catch (e) { console.log("[highlights] ERRO:", e.message); }

  // 2. Leilões ativos
  try {
    const r = await axios.get(
      "https://prd-api.sodresantoro.com.br/api/v1/auctions?segmentName=veiculos&status=online&limit=10",
      { headers }
    );
    console.log(`\n[auctions] Total: ${r.data.data?.length}`);
    if (r.data.data?.[0]) {
      console.log("IDs de leilões:", r.data.data.map((a) => a.id).join(", "));
      console.log("Primeiro leilão:", JSON.stringify(r.data.data[0]).slice(0, 300));
    }
  } catch (e) { console.log("[auctions] ERRO:", e.message); }

  // 3. Search lots
  try {
    const r = await axios.get(
      "https://www.sodresantoro.com.br/api/search-lots?segment=veiculos&size=50",
      { headers: { ...headers, Referer: "https://www.sodresantoro.com.br/" } }
    );
    console.log(`\n[search-lots GET] Total: ${r.data.results?.length}`);
    if (r.data.results?.[0]) console.log("Exemplo:", JSON.stringify(r.data.results[0]).slice(0, 400));
  } catch (e) { console.log("[search-lots GET] ERRO:", e.message); }

  // 4. Search lots POST
  try {
    const r = await axios.post(
      "https://www.sodresantoro.com.br/api/search-lots",
      { segment: "veiculos", size: 50 },
      { headers: { ...headers, "Content-Type": "application/json", Referer: "https://www.sodresantoro.com.br/" } }
    );
    console.log(`\n[search-lots POST] Total: ${r.data.results?.length}`);
    if (r.data.results?.[0]) console.log("Exemplo:", JSON.stringify(r.data.results[0]).slice(0, 400));
  } catch (e) { console.log("[search-lots POST] ERRO:", e.message); }
}

async function inspecionarSuperbid() {
  console.log("\n\n=== SUPERBID API ===");

  // 1. Eventos/leilões de veículos
  try {
    const url = "https://event-query.superbid.net/events/v2/?portalId=[2,15]&locale=pt_BR&timeZoneId=America%2FSao_Paulo&filter=modalityId:[1,4,5,7]%20AND%20productTypeId:68&pageNumber=1&pageSize=20";
    const r = await axios.get(url, { headers });
    console.log(`\n[events veiculos] Total: ${r.data.total}`);
    if (r.data.events?.[0]) console.log("Primeiro evento:", JSON.stringify(r.data.events[0]).slice(0, 400));
  } catch (e) { console.log("[events veiculos] ERRO:", e.message); }

  // 2. Offer query (produtos individuais)
  try {
    const url = "https://offer-query.superbid.net/products/?portalId=[2,15]&locale=pt_BR&filter=productTypeId:68&pageNumber=1&pageSize=20";
    const r = await axios.get(url, { headers });
    console.log(`\n[products veiculos] Total: ${r.data.count || r.data.total}`);
    if (r.data.products?.[0] || r.data.results?.[0]) {
      console.log("Primeiro produto:", JSON.stringify((r.data.products || r.data.results)?.[0]).slice(0, 400));
    } else {
      console.log("Body:", JSON.stringify(r.data).slice(0, 400));
    }
  } catch (e) { console.log("[products veiculos] ERRO:", e.message); }

  // 3. Tentar com category filter
  try {
    const url = "https://offer-query.superbid.net/products/?portalId=[2,15]&locale=pt_BR&requestOrigin=marketplace&filter=productTypeId:68%20AND%20subCategoryId:68&pageNumber=1&pageSize=20";
    const r = await axios.get(url, { headers });
    console.log(`\n[products cat68] Body:`, JSON.stringify(r.data).slice(0, 500));
  } catch (e) { console.log("[products cat68] ERRO:", e.message); }
}

async function main() {
  await inspecionarSodre();
  await inspecionarSuperbid();
}
main().catch(console.error);
