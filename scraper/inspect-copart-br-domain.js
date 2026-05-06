/**
 * Verifica domínio Copart Brasil e busca lotes com locCountry=BR
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

  // Verifica domínios alternativos da Copart Brasil
  const domainTests = [
    "https://copart.com.br",
    "https://www.copart.com.br",
    "https://br.copart.com",
    "https://brasil.copart.com",
  ];

  for (const domain of domainTests) {
    try {
      await page.goto(domain, { waitUntil: "domcontentloaded", timeout: 10000 });
      console.log(`${domain} → ${page.url()} (${await page.title()})`);
    } catch (e) {
      console.log(`${domain} → ERRO: ${e.message.split("\n")[0]}`);
    }
  }

  // Acessa o copart.com normal e busca com query text "brazil"
  console.log("\n--- Buscando lotes com texto 'brazil' na API ---");
  await page.goto("https://www.copart.com/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Testa busca textual por cidade brasileira
  const result = await page.evaluate(async () => {
    const res = await fetch("https://www.copart.com/public/lots/search-results", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: ["brazil"],
        filter: {},
        sort: [],
        page: 0,
        size: 3,
        start: 0,
        freeFormSearch: true,
      }),
    });
    const j = await res.json();
    const content = j?.data?.results?.content || [];
    return content.map((l) => ({
      ld: l.ld,
      yn: l.yn,
      locCountry: l.locCountry,
      ts: l.ts,
      cuc: l.cuc,
      hb: l.hb,
      tims: l.tims,
      ln: l.ln,
    }));
  });

  console.log("Resultados com query 'brazil':");
  result.forEach((r) => console.log(JSON.stringify(r)));

  // Busca lotes com moeda BRL
  const brlResult = await page.evaluate(async () => {
    const res = await fetch("https://www.copart.com/public/lots/search-results", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: ["*"],
        filter: { CURRENCY: ["BRL"] },
        sort: [],
        page: 0,
        size: 3,
        start: 0,
      }),
    });
    const j = await res.json();
    const total = j?.data?.results?.totalElements;
    const content = j?.data?.results?.content || [];
    return { total, items: content.map((l) => ({ ld: l.ld, yn: l.yn, locCountry: l.locCountry, cuc: l.cuc, hb: l.hb, tims: l.tims, ln: l.ln })) };
  });

  console.log(`\nFiltro CURRENCY=BRL: total=${brlResult.total}`);
  brlResult.items.forEach((r) => console.log(JSON.stringify(r)));

  await browser.close();
}

main().catch(console.error);
