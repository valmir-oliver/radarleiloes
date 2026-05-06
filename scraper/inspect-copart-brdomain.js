/**
 * Investiga a API do site copart.com.br (domínio brasileiro)
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

  const apiCalls = [];
  page.on("request", (req) => {
    const url = req.url();
    const method = req.method();
    if (method === "POST" || url.includes("/api/") || url.includes("/public/") || url.includes("/data/")) {
      if (!url.includes("google") && !url.includes("analytics") && !url.includes("fullstory") && !url.includes("cookielaw")) {
        try {
          apiCalls.push({ method, url, body: method === "POST" ? req.postData()?.slice(0, 300) : null });
        } catch {}
      }
    }
  });

  const apiResponses = [];
  page.on("response", async (res) => {
    const url = res.url();
    const ct = res.headers()["content-type"] || "";
    if (ct.includes("json") && url.includes("copart.com") && !url.includes("google") && !url.includes("cookielaw")) {
      try {
        const body = await res.json();
        apiResponses.push({ url, status: res.status(), body });
      } catch {}
    }
  });

  // Visita o site brasileiro
  console.log("Acessando copart.com.br...");
  await page.goto("https://www.copart.com.br/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3000));
  console.log("URL:", page.url());
  console.log("Título:", await page.title());

  // Navega para a busca de veículos
  console.log("\nAcessando busca de veículos...");
  await page.goto("https://www.copart.com.br/vehicleFinderSection/?displayStr=ALL_LOTS", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 4000));

  console.log("\n=== REQUESTS CAPTURADOS ===");
  for (const r of apiCalls.slice(0, 30)) {
    console.log(`${r.method} ${r.url}`);
    if (r.body) console.log("  Body:", r.body);
  }

  console.log("\n=== RESPOSTAS JSON ===");
  for (const r of apiResponses.slice(0, 10)) {
    const preview = JSON.stringify(r.body).slice(0, 400);
    console.log(`\n${r.status} ${r.url}`);
    console.log(preview);
  }

  // Testa POST na API do domínio BR
  console.log("\n=== TESTANDO API copart.com.br ===");
  const brResult = await page.evaluate(async () => {
    const res = await fetch("https://www.copart.com.br/public/lots/search-results", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: ["*"],
        filter: {},
        sort: ["auction_date_type asc", "auction_date_utc asc"],
        page: 0,
        size: 3,
        start: 0,
      }),
    });
    const j = await res.json();
    return {
      total: j?.data?.results?.totalElements,
      items: (j?.data?.results?.content || []).map((l) => ({
        ld: l.ld,
        yn: l.yn,
        locCountry: l.locCountry,
        ts: l.ts,
        cuc: l.cuc,
        hb: l.hb,
        tims: l.tims,
        ln: l.ln,
        ldu: l.ldu,
      })),
    };
  });

  console.log(`Total: ${brResult.total}`);
  brResult.items.forEach((r) => console.log(JSON.stringify(r)));

  await browser.close();
}

main().catch(console.error);
