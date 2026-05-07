const axios = require("axios");
const cheerio = require("cheerio");

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

async function test() {
  const url = "https://www.hastapublica.com.br/busca?id_categoria=2&id_sub_categoria=&localidade=&data=&id_leilao=&palavra=";
  try {
    const r = await axios.get(url, { headers });
    const $ = cheerio.load(r.data);
    
    console.log("=== ENCONTRANDO LINKS DE LOTE ===");
    const uniqueParents = new Set();
    
    $("a[href*='/lote/']").each((i, el) => {
      const parent = $(el).closest("div");
      const parentClass = parent.attr("class") || "sem-classe";
      const grandparent = parent.parent();
      const grandparentClass = grandparent.attr("class") || "sem-classe";
      
      console.log(`Link: "${$(el).text().trim()}" -> ${$(el).attr("href")}`);
      console.log(`  Parent class: "${parentClass}"`);
      console.log(`  Grandparent class: "${grandparentClass}"`);
      
      uniqueParents.add(parentClass);
    });
  } catch (e) {
    console.error("Erro:", e.message);
  }
}

test();
