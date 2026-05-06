/**
 * Explora os campos da API pública da Copart Brasil via browser (bypass Incapsula)
 */
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

puppeteer.use(StealthPlugin());

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36");

  // Primeiro visita o site para pegar cookies anti-bot
  await page.goto("https://www.copart.com/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  const result = await page.evaluate(async () => {
    const res = await fetch("https://www.copart.com/public/lots/search-results", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: ["*"],
        filter: { COUNTRY: ["Brazil"] },
        sort: ["auction_date_type asc", "auction_date_utc asc"],
        page: 0,
        size: 3,
        start: 0,
      }),
    });
    return res.json();
  });

  const { data } = result;
  const total = data?.results?.totalElements;
  console.log("Total de veículos no Brasil:", total);

  const first = data?.results?.content?.[0];
  if (!first) {
    console.log("Nenhum resultado:", JSON.stringify(result).slice(0, 300));
    await browser.close();
    return;
  }

  console.log("\n=== CAMPOS DO PRIMEIRO LOTE ===");
  console.log(JSON.stringify(first, null, 2));

  await browser.close();
}

main().catch(console.error);
