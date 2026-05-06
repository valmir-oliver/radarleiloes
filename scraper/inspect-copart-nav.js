/**
 * Captura chamadas AJAX do site copart.com.br durante navegação real
 * Aguarda mais tempo para as requisições Angular carregarem
 */
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

puppeteer.use(StealthPlugin());

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36");

  const captured = [];
  page.on("response", async (res) => {
    const url = res.url();
    const ct = res.headers()["content-type"] || "";
    // Captura qualquer JSON do domínio copart.com.br
    if (ct.includes("json") && url.includes("copart.com.br") &&
      !url.includes("cookielaw") && !url.includes("rdstation") &&
      !url.includes("Incapsula") && !url.includes("nly-Fathere")) {
      try {
        const body = await res.json();
        const bodyStr = JSON.stringify(body);
        // Só captura se tiver dados de lotes
        if (bodyStr.includes("LotNumber") || bodyStr.includes("lotNumber") ||
          bodyStr.includes("totalElements") || bodyStr.includes("totalRecords") ||
          bodyStr.includes("numFound") || bodyStr.includes("recordsTotal")) {
          captured.push({ url, body });
          console.log(`✓ CAPTURADO: ${url}`);
        }
      } catch {}
    }
  });

  // Tenta URLs diferentes para a busca de automóveis
  const urlsToTry = [
    "https://www.copart.com.br/automóveis",
    "https://www.copart.com.br/lotes/automóveis",
    "https://www.copart.com.br/busca?q=automoveis",
  ];

  // Primeiro: acessa a home
  await page.goto("https://www.copart.com.br/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3000));

  // Tenta clicar em "Automóveis" no menu de categorias
  console.log("Procurando link de Automóveis...");
  try {
    const autoLink = await page.evaluate(() => {
      const links = [...document.querySelectorAll("a")];
      const found = links.find(
        (l) => l.textContent.trim().toLowerCase().includes("automóveis") && l.href
      );
      return found ? found.href : null;
    });
    console.log("Link Automóveis:", autoLink);

    if (autoLink) {
      await page.goto(autoLink, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 5000));
      console.log("URL atual:", page.url());
    }
  } catch (e) {
    console.log("Erro ao clicar:", e.message);
  }

  // Tenta acessar via lot/detail para ver o formato
  console.log("\nAcessando detalhe de um lote conhecido (1051645)...");
  await page.goto("https://www.copart.com.br/lot/1051645", { waitUntil: "networkidle2", timeout: 20000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 3000));

  if (captured.length === 0) {
    console.log("\nNenhuma chamada de lotes capturada ainda. URLs visitadas:");
    console.log(page.url());

    // Testa direto via fetch da página
    const directTest = await page.evaluate(async () => {
      const endpoints = [
        "/public/data/lot/detail/1051645",
        "/public/lots/1051645",
        "/lot/1051645/detail",
      ];
      const results = {};
      for (const ep of endpoints) {
        try {
          const r = await fetch(ep, { headers: { Accept: "application/json" } });
          results[ep] = { status: r.status, ct: r.headers.get("content-type") };
        } catch (e) {
          results[ep] = { error: e.message };
        }
      }
      return results;
    });
    console.log("\nTeste direto de endpoints:", JSON.stringify(directTest, null, 2));
  }

  console.log("\n=== CAPTURADAS ===");
  for (const c of captured) {
    console.log(`\nURL: ${c.url}`);
    console.log(JSON.stringify(c.body).slice(0, 500));
  }

  await browser.close();
}

main().catch(console.error);
