const axios = require("axios");
const cheerio = require("cheerio");

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

async function test() {
  // Vamos tentar carregar a página principal e a página de paginação
  const urls = [
    "https://www.jrleiloes.com.br/",
    "https://www.jrleiloes.com.br/?page=1"
  ];
  
  for (const url of urls) {
    console.log(`\nBuscando ${url}...`);
    try {
      const r = await axios.get(url, { headers });
      const $ = cheerio.load(r.data);
      
      // Procura por list-lote ou qualquer seletor com lote
      const links = $("a[href*='/lote/']");
      console.log(`Links contendo '/lote/': ${links.length}`);
      
      const listLotes = $(".list-lote, [class*=lote], [class*=item]");
      console.log(`Elementos encontrados: ${listLotes.length}`);
      
      if (listLotes.length > 0) {
        // Encontrar o primeiro list-lote ou similar
        let target = null;
        listLotes.each((i, el) => {
          const cl = $(el).attr("class") || "";
          if (cl.includes("lote") && !cl.includes("cookie")) {
            target = $(el);
            return false; // break
          }
        });
        
        if (target) {
          console.log(`=== HTML DO ELEMENTO TARGET (${target.attr("class")}) ===`);
          console.log(target.html()?.replace(/\s+/g, " ").trim().slice(0, 1500));
          
          console.log("\n--- Extraindo campos ---");
          const link = target.attr("href") || target.find("a").attr("href") || "";
          const img = target.find("img").attr("src") || "";
          const txt = target.text().replace(/\s+/g, " ").trim();
          console.log(`Link: "${link}"`);
          console.log(`Imagem: "${img}"`);
          console.log(`Texto: "${txt}"`);
        }
      }
    } catch (e) {
      console.error("Erro:", e.message);
    }
  }
}

test();
