/**
 * Testa a API pública de busca de veículos da Copart (sem login)
 * Uso: node scraper/inspect-copart-api.js
 */
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

puppeteer.use(StealthPlugin());

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );

  const apiCalls = [];
  page.on("response", async (res) => {
    const url = res.url();
    const ct = res.headers()["content-type"] || "";
    if (
      ct.includes("json") &&
      (url.includes("copart.com/data") || url.includes("copart.com/public") || url.includes("copart.com/api"))
    ) {
      try {
        const body = await res.json();
        apiCalls.push({ url, status: res.status(), body });
        console.log(`[API] ${res.status()} ${url}`);
      } catch {}
    }
  });

  // Tenta acessar a busca de veículos do Brasil sem login
  console.log("[1] Acessando busca de veículos Brasil...");
  await page.goto(
    "https://www.copart.com/vehicleFinderSection/?displayStr=BRAZIL&countryCode=BR",
    { waitUntil: "networkidle2", timeout: 30000 }
  );
  await new Promise((r) => setTimeout(r, 3000));
  console.log("URL:", page.url());

  // Verifica se tem resultados visíveis
  const hasResults = await page.evaluate(() => {
    const count = document.querySelectorAll(".lot-details, .search-result, [class*='lot'], [class*='vehicle']").length;
    return { count, bodyText: document.body.innerText.slice(0, 500) };
  });
  console.log("Elementos de resultado:", hasResults.count);
  console.log("Texto da página:", hasResults.bodyText);

  // Testa a API REST diretamente (sem autenticação)
  console.log("\n[2] Testando API REST pública...");
  const testUrls = [
    "https://www.copart.com/public/lots/search-results/BR",
    "https://www.copart.com/data/lots/search/BR",
    "https://www.copart.com/public/vehicleFinder/search?query=&country=BR",
  ];

  for (const testUrl of testUrls) {
    try {
      const r = await page.evaluate(async (url) => {
        try {
          const res = await fetch(url, { headers: { "Accept": "application/json" } });
          const text = await res.text();
          return { status: res.status, body: text.slice(0, 300) };
        } catch (e) {
          return { error: e.message };
        }
      }, testUrl);
      console.log(`${testUrl} → ${JSON.stringify(r)}`);
    } catch {}
  }

  // Tenta POST na API de busca
  console.log("\n[3] Testando POST de busca...");
  const postResult = await page.evaluate(async () => {
    try {
      const res = await fetch("https://www.copart.com/public/lots/search-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          query: ["*"],
          filter: { COUNTRY: ["Brazil"] },
          sort: ["auction_date_type asc", "auction_date_utc asc"],
          page: 0,
          size: 100,
          start: 0,
        }),
      });
      const body = await res.json();
      return { status: res.status, keys: Object.keys(body), preview: JSON.stringify(body).slice(0, 500) };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log("POST result:", JSON.stringify(postResult, null, 2));

  console.log("\n[4] === CHAMADAS API COPART CAPTURADAS ===");
  for (const call of apiCalls) {
    console.log(`\n${call.status} ${call.url}`);
    console.log("Body:", JSON.stringify(call.body).slice(0, 400));
  }

  await browser.close();
}

main().catch(console.error);
