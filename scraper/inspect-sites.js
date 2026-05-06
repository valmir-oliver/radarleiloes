const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

async function inspecionar(nome, url) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`INSPECIONANDO: ${nome}`);
  console.log("=".repeat(60));
  try {
    const r = await axios.get(url, { headers, timeout: 15000 });
    const $ = cheerio.load(r.data);

    // Mostrar as 3 primeiras cards completas
    const card = $(".card").first();
    if (card.length) {
      console.log("\n--- .card (primeiro) ---");
      console.log(card.html()?.slice(0, 2000));
    }

    // Tentar pegar links de lotes
    const links = [];
    $("a[href]").each((i, el) => {
      const href = $(el).attr("href") || "";
      if (href.includes("lote") || href.includes("veiculo") || href.includes("produto")) {
        links.push(href);
      }
    });
    console.log(`\nLinks de lotes encontrados: ${links.slice(0, 10).join("\n")}`);
  } catch (e) {
    console.log("ERRO:", e.message);
  }
}

async function inspecionarLeilomaster(nome, url) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`INSPECIONANDO: ${nome}`);
  console.log("=".repeat(60));
  try {
    const r = await axios.get(url, { headers, timeout: 15000 });
    const $ = cheerio.load(r.data);

    const classes = new Set();
    $("*").each((i, el) => {
      const cls = $(el).attr("class");
      if (cls) cls.split(" ").forEach((c) => { if (c.toLowerCase().includes("card") || c.toLowerCase().includes("lote") || c.toLowerCase().includes("item") || c.toLowerCase().includes("produto")) classes.add(c); });
    });
    console.log("\nClasses com 'card/lote/item/produto':", [...classes].join(", "));

    // Mostrar primeiro [class*=card]
    const cards = $("[class*=card]");
    console.log(`\nTotal [class*=card]: ${cards.length}`);
    console.log("\n--- Primeiro card ---");
    console.log(cards.first().html()?.slice(0, 2000));

    const links = [];
    $("a[href]").each((i, el) => {
      const href = $(el).attr("href") || "";
      if (href.includes("lote") || href.includes("veiculo") || href.includes("carro") || href.includes("item")) {
        links.push(href);
      }
    });
    console.log(`\nLinks relevantes: ${links.slice(0, 10).join("\n")}`);
  } catch (e) {
    console.log("ERRO:", e.message);
  }
}

async function main() {
  await inspecionar("Mega Leiloes", "https://www.megaleiloes.com.br/veiculos");
  await inspecionarLeilomaster("Leilomaster", "https://www.leilomaster.com.br/leilao/veiculos");
}
main();
