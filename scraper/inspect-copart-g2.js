/**
 * Testa a API de busca do backend Copart Brasil (g2services)
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

  // Pega cookies do site BR
  await page.goto("https://www.copart.com.br/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Testa vários endpoints possíveis do Copart BR
  const tests = [
    // Endpoint principal com query Solr
    {
      name: "public/lots/search-results (Solr query)",
      fn: async () => {
        const res = await fetch("https://www.copart.com.br/public/lots/search-results", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            query: ["categoria:Automóveis"],
            filter: {},
            sort: ["auction_date_type asc"],
            page: 0,
            size: 3,
            start: 0,
          }),
        });
        const ct = res.headers.get("content-type");
        if (!ct?.includes("json")) return { error: `HTML response (${ct})` };
        return res.json();
      },
    },
    // g2services
    {
      name: "g2services search",
      fn: async () => {
        const res = await fetch("https://g2services.copart.com.br/search", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ query: "categoria:Automóveis", page: 0, rows: 3 }),
        });
        const ct = res.headers.get("content-type");
        if (!ct?.includes("json")) return { error: `Non-JSON (${ct})`, status: res.status };
        return res.json();
      },
    },
    // DataTables endpoint
    {
      name: "public/lots/search-results (DataTable format)",
      fn: async () => {
        const params = new URLSearchParams({
          query: "categoria:Automóveis",
          rows: "3",
          start: "0",
          sort: "auction_date_type asc",
        });
        const res = await fetch(`https://www.copart.com.br/public/lots/search-results?${params}`, {
          headers: { Accept: "application/json" },
        });
        const ct = res.headers.get("content-type");
        if (!ct?.includes("json")) return { error: `Non-JSON (${ct})`, status: res.status };
        return res.json();
      },
    },
    // vehicleFinder/searchLots
    {
      name: "vehicleFinder/searchLots",
      fn: async () => {
        const res = await fetch("https://www.copart.com.br/public/vehicleFinder/searchLots", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ query: "categoria:Automóveis", rows: 3, start: 0 }),
        });
        const ct = res.headers.get("content-type");
        if (!ct?.includes("json")) return { error: `Non-JSON (${ct})`, status: res.status };
        return res.json();
      },
    },
  ];

  for (const test of tests) {
    try {
      const result = await page.evaluate(
        async ([name, fn]) => {
          try {
            const f = eval(`(${fn})`);
            const r = await f();
            return { ok: true, data: r };
          } catch (e) {
            return { ok: false, error: e.message };
          }
        },
        [test.name, test.fn.toString()]
      );
      console.log(`\n[${test.name}]`);
      if (result.ok) {
        const preview = JSON.stringify(result.data).slice(0, 400);
        console.log(preview);
      } else {
        console.log("ERRO:", result.error);
      }
    } catch (e) {
      console.log(`\n[${test.name}] FALHOU:`, e.message);
    }
  }

  await browser.close();
}

main().catch(console.error);
