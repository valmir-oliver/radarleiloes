/**
 * Testa diferentes filtros para encontrar veículos do Brasil na API Copart
 */
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

puppeteer.use(StealthPlugin());

async function testFilter(page, filterName, filterBody) {
  const result = await page.evaluate(async (body) => {
    const res = await fetch("https://www.copart.com/public/lots/search-results", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }, filterBody);
  const total = result?.data?.results?.totalElements ?? 0;
  const first = result?.data?.results?.content?.[0];
  console.log(`\n[${filterName}] Total: ${total}`);
  if (first) {
    console.log(`  Primeiro: ${first.ld} | locCountry=${first.locCountry} | ts=${first.ts} | yn=${first.yn}`);
    console.log(`  Lance: ${first.hb} ${first.cuc} | Data: ${new Date(first.ad).toISOString()}`);
    console.log(`  Imagem: ${first.tims}`);
  }
  return { total, first };
}

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36");

  await page.goto("https://www.copart.com/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  const base = { query: ["*"], sort: ["auction_date_type asc", "auction_date_utc asc"], page: 0, size: 2, start: 0 };

  // Testa filtros diferentes para o Brasil
  await testFilter(page, "COUNTRY=Brazil", { ...base, filter: { COUNTRY: ["Brazil"] } });
  await testFilter(page, "COUNTRY=BRAZIL", { ...base, filter: { COUNTRY: ["BRAZIL"] } });
  await testFilter(page, "LOC_COUNTRY_CODE=BR", { ...base, filter: { LOC_COUNTRY_CODE: ["BR"] } });
  await testFilter(page, "LOCATION=Brazil", { ...base, filter: { LOCATION: ["Brazil"] } });
  await testFilter(page, "STATE=BR", { ...base, filter: { STATE: ["BR"] } });
  await testFilter(page, "YARD=Brazil", { ...base, filter: { YARD: ["Brazil"] } });

  // Testa filtro combinado com countryCode
  const r = await page.evaluate(async () => {
    const res = await fetch("https://www.copart.com/public/lots/search-results?displayStr=BRAZIL&countryCode=BR", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: ["*"],
        filter: {},
        sort: ["auction_date_type asc"],
        page: 0, size: 2, start: 0,
      }),
    });
    const j = await res.json();
    return { total: j?.data?.results?.totalElements, first: j?.data?.results?.content?.[0] };
  });
  console.log(`\n[URL params countryCode=BR] Total: ${r.total}`);
  if (r.first) console.log(`  Primeiro: ${r.first.ld} | locCountry=${r.first.locCountry}`);

  await browser.close();
}

main().catch(console.error);
