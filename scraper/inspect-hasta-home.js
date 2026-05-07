const axios = require("axios");
const cheerio = require("cheerio");

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

async function test() {
  const url = "https://www.hastapublica.com.br/";
  try {
    const r = await axios.get(url, { headers });
    const $ = cheerio.load(r.data);
    
    console.log("=== LINKS ENCONTRADOS ===");
    const links = new Set();
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (href) {
        links.add(href);
      }
    });
    
    Array.from(links).forEach(l => {
      if (l.includes("veiculo") || l.includes("lote") || l.includes("leilao") || l.includes("pesquisa") || l.includes("busca")) {
        console.log(`  - ${l}`);
      }
    });
  } catch (e) {
    console.error("Erro:", e.message);
  }
}

test();
