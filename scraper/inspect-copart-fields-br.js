/**
 * Mapeia todos os campos dos lotes brasileiros da Copart
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

  await page.goto("https://www.copart.com.br/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  const result = await page.evaluate(async () => {
    const r = await fetch("https://www.copart.com.br/public/lots/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: ["categoria:Automóveis"],
        filter: {},
        sort: ["auction_date_type asc"],
        page: 0,
        rows: 2,
        start: 0,
        showUpComing: true,
      }),
    });
    return r.json();
  });

  const lots = result.data.results.content;
  console.log("Total:", result.data.results.totalElements);
  console.log("\n=== PRIMEIRO LOTE (todos os campos) ===");
  console.log(JSON.stringify(lots[0], null, 2));
  console.log("\n=== SEGUNDO LOTE ===");
  console.log(JSON.stringify(lots[1], null, 2));

  await browser.close();
}

main().catch(console.error);
