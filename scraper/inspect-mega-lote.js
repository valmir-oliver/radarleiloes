/**
 * Descobre como o Mega Leilões carrega imagens de um lote individual
 */
const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

async function main() {
  // URL de um lote real do scraper anterior
  const loteUrl = "https://www.megaleiloes.com.br/veiculos/carros/si/sem-informacao/carro-mitsubishi-lancer-20-cvt-20152016-j123419";

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36");

  const jsonCalls = [];
  page.on("response", async (res) => {
    const url = res.url();
    const ct = res.headers()["content-type"] || "";
    if (ct.includes("json") && !url.includes("google") && !url.includes("analytics")) {
      try {
        const body = await res.json();
        jsonCalls.push({ url, body });
      } catch {}
    }
  });

  await page.goto(loteUrl, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3000));

  // Pega imagens da galeria do lote
  const imagens = await page.evaluate(() => {
    const imgs = [];
    document.querySelectorAll("img[src]").forEach((img) => {
      const src = img.src;
      if (src && !src.includes("bank_icon") && !src.includes("logo") && !src.includes("card-no-image")) {
        imgs.push(src);
      }
    });
    // também verifica background-image inline
    document.querySelectorAll("[style*='background-image']").forEach((el) => {
      const style = el.getAttribute("style") || "";
      const match = style.match(/url\(["']?([^"')]+)["']?\)/);
      if (match) imgs.push(match[1]);
    });
    return [...new Set(imgs)];
  });

  console.log("\n=== IMAGENS ENCONTRADAS NA PÁGINA DO LOTE ===");
  imagens.slice(0, 10).forEach((url) => console.log(" ", url));

  console.log("\n=== CHAMADAS JSON ===");
  for (const call of jsonCalls) {
    const bodyStr = JSON.stringify(call.body);
    if (bodyStr.includes("image") || bodyStr.includes("photo") || bodyStr.includes("foto") || bodyStr.includes("imagem")) {
      console.log(`URL: ${call.url}`);
      console.log("Body:", bodyStr.slice(0, 400));
    }
  }

  await browser.close();
}
main().catch(console.error);
