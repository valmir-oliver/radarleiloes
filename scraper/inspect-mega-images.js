/**
 * Verifica quais atributos de imagem estão disponíveis no HTML do Mega Leilões
 * depois do JavaScript carregar (via Puppeteer)
 */
const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36");

  await page.goto("https://www.megaleiloes.com.br/veiculos/carros", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 2000));

  const cards = await page.evaluate(() => {
    return [...document.querySelectorAll(".card")].slice(0, 5).map((card) => {
      const imgEl = card.querySelector("a.card-image");
      const imgTag = card.querySelector("img");
      return {
        modelo: card.querySelector("a.card-title")?.textContent?.trim(),
        dataBg: imgEl?.getAttribute("data-bg"),
        style: imgEl?.getAttribute("style"),
        imgSrc: imgTag?.src,
        imgDataSrc: imgTag?.getAttribute("data-src"),
        bgInline: window.getComputedStyle(imgEl || document.body).backgroundImage,
      };
    });
  });

  cards.forEach((c, i) => {
    console.log(`\nCard ${i}: ${c.modelo}`);
    console.log("  data-bg:", c.dataBg);
    console.log("  style attr:", c.style);
    console.log("  computed bg:", c.bgInline?.slice(0, 100));
    console.log("  img src:", c.imgSrc);
  });

  await browser.close();
}
main().catch(console.error);
