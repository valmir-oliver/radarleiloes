/**
 * Intercepta chamadas de rede do Sodre Santoro para descobrir a API de lotes.
 * E inspeciona a página de veículos do Superbid com mais profundidade.
 */
const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

async function interceptarSodre(browser) {
  console.log("\n=== SODRE SANTORO — Interceptando chamadas de rede ===");
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );

  const apiCalls = [];
  page.on("response", async (res) => {
    const url = res.url();
    const ct = res.headers()["content-type"] || "";
    if (ct.includes("json") && !url.includes("google") && !url.includes("analytics") && !url.includes("gtm")) {
      try {
        const body = await res.json();
        apiCalls.push({ url, body });
      } catch {}
    }
  });

  try {
    await page.goto("https://www.sodresantoro.com.br/veiculos", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 4000));

    if (apiCalls.length === 0) {
      console.log("Nenhuma chamada JSON detectada.");
    } else {
      for (const call of apiCalls) {
        console.log(`\nURL: ${call.url}`);
        console.log("Body:", JSON.stringify(call.body).slice(0, 400));
      }
    }

    // Ver se há algum elemento com dados de lote
    const texto = await page.evaluate(() => {
      const els = document.querySelectorAll("h2, h3, [class*=lote], [class*=card], [class*=produto], [class*=veiculo]");
      return [...els].map(e => e.textContent?.trim()).filter(t => t?.length > 5).slice(0, 20);
    });
    console.log("\nTextos encontrados na página:", texto);
  } catch (e) {
    console.log("ERRO:", e.message);
  } finally {
    await page.close();
  }
}

async function inspecionarSuperbid(browser) {
  console.log("\n=== SUPERBID — Inspecionando lotes de veículos ===");
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );

  const jsonCalls = [];
  page.on("response", async (res) => {
    const url = res.url();
    const ct = res.headers()["content-type"] || "";
    if (ct.includes("json") && !url.includes("google") && !url.includes("analytics") && !url.includes("gtm") && !url.includes("font")) {
      try {
        const body = await res.json();
        jsonCalls.push({ url, body });
      } catch {}
    }
  });

  try {
    await page.goto("https://www.superbid.net/categorias/68-veiculos", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 5000));

    for (const call of jsonCalls.slice(0, 8)) {
      const bodyStr = JSON.stringify(call.body);
      // Só mostrar se parecer ter dados de leilão
      if (bodyStr.includes("lote") || bodyStr.includes("veiculo") || bodyStr.includes("lance") || bodyStr.includes("auction") || bodyStr.includes("bid") || bodyStr.includes("lot")) {
        console.log(`\nURL: ${call.url}`);
        console.log("Body:", bodyStr.slice(0, 500));
      }
    }
    if (jsonCalls.length === 0) console.log("Nenhuma chamada JSON detectada.");

    // Captura o HTML dos cards de leilões
    const cards = await page.evaluate(() => {
      const items = document.querySelectorAll(".item-content, [class*=card], [class*=lot], [class*=auction]");
      return [...items].slice(0, 3).map(el => ({
        text: el.textContent?.replace(/\s+/g, " ").trim().slice(0, 200),
        html: el.outerHTML.slice(0, 600),
      }));
    });
    console.log("\nCards encontrados:");
    cards.forEach((c, i) => {
      console.log(`\n[${i}] Texto: ${c.text}`);
      console.log(`    HTML: ${c.html}`);
    });
  } catch (e) {
    console.log("ERRO:", e.message);
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  try {
    await interceptarSodre(browser);
    await inspecionarSuperbid(browser);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
