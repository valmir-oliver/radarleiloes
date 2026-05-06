/**
 * Captura o endpoint de busca da Copart Brasil (copart.com.br)
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
    if (
      url.includes("copart.com.br") &&
      !url.includes("google") &&
      !url.includes("analytics") &&
      !url.includes("fullstory") &&
      !url.includes("cookielaw") &&
      !url.includes("rdstation") &&
      !url.includes("doubleclick") &&
      !url.includes("mcevents") &&
      !url.includes("onetrust") &&
      !url.includes("nly-Fathere")
    ) {
      try {
        apiCalls.push({ method, url, body: method === "POST" ? req.postData()?.slice(0, 600) : null });
      } catch {}
    }
  });

  const apiResponses = [];
  page.on("response", async (res) => {
    const url = res.url();
    const ct = res.headers()["content-type"] || "";
    if (
      ct.includes("json") &&
      url.includes("copart.com.br") &&
      !url.includes("onetrust") &&
      !url.includes("rdstation") &&
      !url.includes("nly-Fathere")
    ) {
      try {
        const body = await res.json();
        apiResponses.push({ url, status: res.status(), body });
      } catch {}
    }
  });

  // Primeiro acessa a home para pegar cookies
  await page.goto("https://www.copart.com.br/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Acessa a busca de automóveis
  console.log("Acessando busca de automóveis...");
  await page.goto("https://www.copart.com.br/vehicleFinderSection/?displayStr=Autom%C3%B3veis&query=categoria%3AAutom%C3%B3veis", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 5000));

  console.log("=== REQUESTS (apenas copart.com.br) ===");
  for (const r of apiCalls) {
    console.log(`${r.method} ${r.url}`);
    if (r.body) console.log("  Body:", r.body);
  }

  console.log("\n=== RESPOSTAS JSON ===");
  for (const r of apiResponses) {
    const preview = JSON.stringify(r.body).slice(0, 500);
    console.log(`\n${r.status} ${r.url}`);
    console.log(preview);
  }

  await browser.close();
}

main().catch(console.error);
