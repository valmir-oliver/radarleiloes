/**
 * Inspeciona HTML do Sodre Santoro e Superbid via Puppeteer
 * para identificar seletores dos cards de lotes.
 */
const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

async function inspecionar(browser, nome, url) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`INSPECIONANDO: ${nome} — ${url}`);
  console.log("=".repeat(60));

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Espera mais 3s para JS carregar
    await new Promise((r) => setTimeout(r, 3000));

    const resultado = await page.evaluate(() => {
      const seletores = [
        ".card", ".lote", ".produto", "article",
        "[class*=card]", "[class*=lote]", "[class*=produto]",
        "[class*=item]", "[class*=vehicle]", "[class*=veiculo]",
        ".lot", "[class*=lot-]", "[class*=auction]",
      ];

      const encontrados = {};
      for (const sel of seletores) {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) {
          encontrados[sel] = {
            count: els.length,
            html: els[0].outerHTML.slice(0, 800),
          };
        }
      }

      return {
        title: document.title,
        encontrados,
        allClasses: [...new Set(
          [...document.querySelectorAll("*")]
            .flatMap(el => [...el.classList])
            .filter(c => c.length > 3 && c.length < 40)
        )].slice(0, 100),
      };
    });

    console.log(`Title: ${resultado.title}`);

    if (Object.keys(resultado.encontrados).length === 0) {
      console.log("Nenhum seletor encontrou elementos.");
      console.log("Classes encontradas:", resultado.allClasses.join(", "));
    } else {
      for (const [sel, info] of Object.entries(resultado.encontrados)) {
        console.log(`\nSeletor [${sel}]: ${info.count} elementos`);
        console.log(info.html.slice(0, 600));
        break; // só mostra o primeiro seletor que funcionar
      }
    }
  } catch (e) {
    console.log("ERRO:", e.message);
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  try {
    await inspecionar(browser, "Sodre Santoro", "https://www.sodresantoro.com.br/veiculos");
    await inspecionar(browser, "Superbid", "https://www.superbid.net/categorias/68-veiculos");
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
