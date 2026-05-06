/**
 * Captura a chamada API real que a Copart faz para buscar veículos do Brasil
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

  // Captura os POSTS feitos pelo frontend
  const apiPosts = [];
  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().includes("copart.com")) {
      try {
        apiPosts.push({ url: req.url(), body: req.postData() });
      } catch {}
    }
  });

  const apiResponses = [];
  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("copart.com/public") || url.includes("copart.com/data")) {
      try {
        const body = await res.json();
        apiResponses.push({ url, status: res.status(), body });
      } catch {}
    }
  });

  // Acessa diretamente a busca Brasil
  console.log("Acessando busca de veículos do Brasil...");
  await page.goto(
    "https://www.copart.com/vehicleFinderSection/?displayStr=BRAZIL&countryCode=BR",
    { waitUntil: "networkidle2", timeout: 30000 }
  );
  await new Promise((r) => setTimeout(r, 5000));

  console.log("URL final:", page.url());

  console.log("\n=== POSTS CAPTURADOS ===");
  for (const p of apiPosts) {
    console.log(`POST ${p.url}`);
    console.log("Body:", p.body?.slice(0, 500));
    console.log("---");
  }

  console.log("\n=== RESPONSES API COPART ===");
  for (const r of apiResponses.slice(0, 5)) {
    console.log(`\n${r.status} ${r.url}`);
    const str = JSON.stringify(r.body).slice(0, 600);
    console.log(str);
  }

  await browser.close();
}

main().catch(console.error);
