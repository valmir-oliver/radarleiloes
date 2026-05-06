/**
 * Testa os endpoints de busca descobertos no código Angular do Copart Brasil
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

  const results = await page.evaluate(async () => {
    const BASE = "https://www.copart.com.br";
    const out = {};

    // 1. POST /public/lots/search com query Solr
    try {
      const r = await fetch(`${BASE}/public/lots/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          query: ["categoria:Automóveis"],
          filter: {},
          sort: ["auction_date_type asc"],
          page: 0, rows: 3, start: 0,
        }),
      });
      const ct = r.headers.get("content-type") || "";
      if (ct.includes("json")) out["POST /public/lots/search (JSON body)"] = await r.json();
      else out["POST /public/lots/search (JSON body)"] = { status: r.status, ct };
    } catch (e) { out["POST /public/lots/search (JSON body)"] = { error: e.message }; }

    // 2. GET /public/lots/search?query=
    try {
      const r = await fetch(`${BASE}/public/lots/search?query=categoria%3AAutom%C3%B3veis&rows=3&start=0`, {
        headers: { Accept: "application/json" },
      });
      const ct = r.headers.get("content-type") || "";
      if (ct.includes("json")) out["GET /public/lots/search?query="] = await r.json();
      else out["GET /public/lots/search?query="] = { status: r.status, ct };
    } catch (e) { out["GET /public/lots/search?query="] = { error: e.message }; }

    // 3. POST /public/vehicleFinder/search
    try {
      const r = await fetch(`${BASE}/public/vehicleFinder/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: "categoria:Automóveis", rows: 3, start: 0 }),
      });
      const ct = r.headers.get("content-type") || "";
      if (ct.includes("json")) out["POST /public/vehicleFinder/search"] = await r.json();
      else out["POST /public/vehicleFinder/search"] = { status: r.status, ct };
    } catch (e) { out["POST /public/vehicleFinder/search"] = { error: e.message }; }

    // 4. GET /public/vehicleFinder/search
    try {
      const r = await fetch(`${BASE}/public/vehicleFinder/search?query=categoria%3AAutom%C3%B3veis&rows=3&start=0`, {
        headers: { Accept: "application/json" },
      });
      const ct = r.headers.get("content-type") || "";
      if (ct.includes("json")) out["GET /public/vehicleFinder/search?query="] = await r.json();
      else out["GET /public/vehicleFinder/search?query="] = { status: r.status, ct };
    } catch (e) { out["GET /public/vehicleFinder/search?query="] = { error: e.message }; }

    // 5. DataTables server-side (forma antiga)
    try {
      const r = await fetch(`${BASE}/public/lots/search`, {
        method: "GET",
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
      });
      const ct = r.headers.get("content-type") || "";
      if (ct.includes("json")) out["GET /public/lots/search (XHR)"] = await r.json();
      else out["GET /public/lots/search (XHR)"] = { status: r.status, ct };
    } catch (e) { out["GET /public/lots/search (XHR)"] = { error: e.message }; }

    return out;
  });

  for (const [key, val] of Object.entries(results)) {
    console.log(`\n[${key}]`);
    console.log(JSON.stringify(val).slice(0, 400));
  }

  await browser.close();
}

main().catch(console.error);
