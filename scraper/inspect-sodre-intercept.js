/**
 * Intercepta o request exato de search-lots e lotes da página de leilão
 */
const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );

  const apiCalls = [];

  // Intercepta requests para ver body + url
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("search-lots") || url.includes("prd-api") || url.includes("/lote") || url.includes("/lot")) {
      apiCalls.push({
        type: "request",
        url,
        method: req.method(),
        body: req.postData(),
        headers: req.headers(),
      });
    }
    req.continue();
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("search-lots") || (url.includes("prd-api") && (url.includes("lot") || url.includes("lote")))) {
      try {
        const body = await res.json();
        apiCalls.push({ type: "response", url, body });
      } catch {}
    }
  });

  // Navega para página de lotes de veículos
  console.log("Navegando para /veiculos/lotes...");
  await page.goto("https://www.sodresantoro.com.br/veiculos/lotes", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 5000));

  // Mostra requests capturados
  const requests = apiCalls.filter((c) => c.type === "request");
  const responses = apiCalls.filter((c) => c.type === "response");

  console.log(`\n=== REQUESTS (${requests.length}) ===`);
  for (const req of requests) {
    console.log(`${req.method} ${req.url}`);
    if (req.body) console.log("  Body:", req.body.slice(0, 300));
  }

  console.log(`\n=== RESPONSES (${responses.length}) ===`);
  for (const res of responses) {
    console.log(`URL: ${res.url}`);
    console.log("Body:", JSON.stringify(res.body).slice(0, 500));
  }

  // Também navega para o leilão específico
  console.log("\n\nNavegando para /leilao/28553...");
  const apiCalls2 = [];
  page.removeAllListeners("response");
  page.on("response", async (res2) => {
    const url = res2.url();
    if ((url.includes("prd-api") || url.includes("sodresantoro")) && !url.includes("analytics") && !url.includes("google")) {
      try {
        const body = await res2.json();
        apiCalls2.push({ url, body });
      } catch {}
    }
  });

  await page.goto("https://www.sodresantoro.com.br/leilao/28553", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 5000));

  console.log(`\n=== LEILÃO 28553 — Chamadas JSON (${apiCalls2.length}) ===`);
  for (const call of apiCalls2) {
    const bodyStr = JSON.stringify(call.body);
    if (bodyStr.includes("lot") || bodyStr.includes("lance") || bodyStr.includes("lote") || bodyStr.includes("veiculo") || bodyStr.includes("modelo")) {
      console.log(`\nURL: ${call.url}`);
      console.log("Body:", bodyStr.slice(0, 600));
    }
  }

  await browser.close();
}

main().catch(console.error);
