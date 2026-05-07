const axios = require("axios");
const cheerio = require("cheerio");

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

async function test() {
  const url = "https://www.hastapublica.com.br/pesquisa/?id_categoria=2";
  console.log(`Buscando ${url}...`);
  try {
    const r = await axios.get(url, { headers });
    const $ = cheerio.load(r.data);
    console.log(`Status: ${r.status}`);
    
    // Procura por box-lote ou outros cards
    const elements = $(".box-lote, [class*=lote], [class*=card]");
    console.log(`Elementos encontrados: ${elements.length}`);
    
    if (elements.length > 0) {
      console.log("HTML do primeiro elemento:");
      console.log(elements.first().html()?.replace(/\s+/g, " ").trim().slice(0, 1000));
    } else {
      // Mostrar links na página
      console.log("Nenhum lote diretamente. Primeiras tags <a>:");
      $("a").slice(0, 30).each((i, el) => {
        console.log(`  - ${$(el).text().trim()} -> ${$(el).attr("href")}`);
      });
    }
  } catch (e) {
    console.error("Erro:", e.message);
  }
}

test();
