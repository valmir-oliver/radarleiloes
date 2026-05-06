const axios = require("axios");
const cheerio = require("cheerio");

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
};

const novosSites = [
  { nome: "JR Leilões", url: "https://www.jrleiloes.com.br/" },
  { nome: "Hasta Pública", url: "https://www.hastapublica.com.br/" },
  { nome: "Calil Leilões", url: "https://www.calilleiloes.com.br/" },
  { nome: "Grupo Lance", url: "https://www.grupolance.com.br/" }
];

async function testar(site) {
  console.log(`\n--------------------------------------------`);
  console.log(`Testando ${site.nome}: ${site.url}`);
  try {
    const r = await axios.get(site.url, { headers, timeout: 15000 });
    console.log(`Status: ${r.status}`);
    const $ = cheerio.load(r.data);
    const title = $("title").text().trim();
    console.log(`Title: "${title}"`);
    
    // Procura por links de lotes ou cards
    const links = [];
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      if (href && (href.includes("lote") || href.includes("detalhe") || href.includes("leilao"))) {
        links.push({ text, href });
      }
    });
    
    console.log(`Links relacionados a lotes encontrados: ${links.length}`);
    if (links.length > 0) {
      console.log("Exemplos de links:");
      links.slice(0, 5).forEach(l => console.log(`  - Text: "${l.text}" | Href: "${l.href}"`));
    }
    
    // Procura por imagens de carros ou cards
    const imgs = [];
    $("img").each((i, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && !src.includes("logo") && !src.includes("icon")) {
        imgs.push(src);
      }
    });
    console.log(`Imagens encontradas: ${imgs.length}`);
    
  } catch (e) {
    console.error(`Erro ao conectar: ${e.message}`);
    if (e.response) {
      console.error(`Status de erro: ${e.response.status}`);
    }
  }
}

async function run() {
  for (const s of novosSites) {
    await testar(s);
  }
}

run();
