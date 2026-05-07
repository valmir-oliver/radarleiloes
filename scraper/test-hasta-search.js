const axios = require("axios");
const cheerio = require("cheerio");

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

async function test() {
  const url = "https://www.hastapublica.com.br/busca?id_categoria=2&id_sub_categoria=&localidade=&data=&id_leilao=&palavra=";
  console.log(`Buscando ${url}...`);
  try {
    const r = await axios.get(url, { headers });
    const $ = cheerio.load(r.data);
    console.log(`Status: ${r.status}`);
    
    // Procura por elementos de lote
    // Vamos procurar por divs ou links que pareçam cards de lote
    const boxLotes = $(".box-lote, .card, .thumbnail, [class*=lote], [class*=item]");
    console.log(`Elementos encontrados: ${boxLotes.length}`);
    
    if (boxLotes.length > 0) {
      console.log("HTML do primeiro lote encontrado:");
      console.log(boxLotes.first().html()?.replace(/\s+/g, " ").trim().slice(0, 1200));
      
      // Procura imagem, título, preço, link
      const first = boxLotes.first();
      const link = first.find("a").attr("href") || "";
      const text = first.text().replace(/\s+/g, " ").trim();
      const img = first.find("img").attr("src") || "";
      console.log(`  - Link: "${link}"`);
      console.log(`  - Imagem: "${img}"`);
      console.log(`  - Texto: "${text}"`);
    } else {
      console.log("Nenhum card de lote encontrado. Vamos listar todos os links de lotes (/lote/):");
      $("a").each((i, el) => {
        const href = $(el).attr("href") || "";
        if (href.includes("/lote/")) {
          console.log(`  - ${$(el).text().trim()} -> ${href}`);
        }
      });
    }
  } catch (e) {
    console.error("Erro:", e.message);
  }
}

test();
