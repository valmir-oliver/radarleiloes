/**
 * Descobre o parâmetro correto de page size na API do Copart BR
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
    const BASE = "https://www.copart.com.br";
    const tests = [
      // Testa diferentes combinações de parâmetros de paginação
      { label: "size:100", body: { query: ["*"], filter: {}, sort: [], page: 0, size: 100 } },
      { label: "size:50,page:0", body: { query: ["*"], filter: {}, sort: [], page: 0, size: 50 } },
      { label: "draw+length", body: { query: ["*"], filter: {}, sort: [], draw: 1, start: 0, length: 100 } },
      { label: "pageNumber+pageSize", body: { query: ["*"], filter: {}, sort: [], pageNumber: 0, pageSize: 100 } },
      { label: "rows:100", body: { query: ["*"], filter: {}, sort: [], rows: 100 } },
      { label: "perPage:100", body: { query: ["*"], filter: {}, sort: [], perPage: 100 } },
      { label: "limit:100", body: { query: ["*"], filter: {}, sort: [], limit: 100 } },
      { label: "numRecords:100", body: { query: ["*"], filter: {}, sort: [], numRecords: 100 } },
    ];

    const out = {};
    for (const t of tests) {
      try {
        const r = await fetch(`${BASE}/public/lots/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(t.body),
        });
        const j = await r.json();
        const returned = j?.data?.results?.content?.length ?? 0;
        const echoedSize = j?.data?.query?.size ?? "?";
        out[t.label] = { returned, echoedSize };
      } catch (e) {
        out[t.label] = { error: e.message };
      }
    }
    return out;
  });

  for (const [k, v] of Object.entries(result)) {
    console.log(`${k}: returned=${v.returned} echoedSize=${v.echoedSize} ${v.error || ""}`);
  }

  await browser.close();
}

main().catch(console.error);
