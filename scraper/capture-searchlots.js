/**
 * Captura o POST body exato do search-lots que retorna resultados
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

  const capturedRequests = [];

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (req.url().includes("search-lots")) {
      const body = req.postData();
      capturedRequests.push({ url: req.url(), body });
    }
    req.continue();
  });

  page.on("response", async (res) => {
    if (res.url().includes("search-lots")) {
      try {
        const data = await res.json();
        if (data.results?.length > 0) {
          console.log(`\n=== FOUND! POST body que retornou ${data.results.length} resultados ===`);
          // Encontra o request correspondente
          const req = capturedRequests[capturedRequests.length - 1];
          if (req) {
            console.log("\nPOST Body completo:");
            console.log(req.body);
          }
          console.log("\nPrimeiro resultado:");
          console.log(JSON.stringify(data.results[0], null, 2));
          console.log("\nSegundo resultado (se houver):");
          if (data.results[1]) console.log(JSON.stringify(data.results[1], null, 2));
          console.log("\nTotal resultados:", data.total, "| Retornados:", data.results.length);
        }
      } catch {}
    }
  });

  console.log("Carregando /veiculos/lotes...");
  await page.goto("https://www.sodresantoro.com.br/veiculos/lotes", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 6000));

  // Verifica se precisa de scroll para carregar mais
  await page.evaluate(() => window.scrollTo(0, 500));
  await new Promise((r) => setTimeout(r, 3000));

  console.log(`\nTotal requests capturados: ${capturedRequests.length}`);

  await browser.close();
}

main().catch(console.error);
