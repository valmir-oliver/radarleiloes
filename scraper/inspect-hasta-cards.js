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
    
    const cards = $(".card.card-leilao");
    console.log(`Cards encontrados: ${cards.length}`);
    
    if (cards.length > 0) {
      const card = cards.first();
      console.log("=== HTML DO CARD ===");
      console.log(card.html()?.replace(/\s+/g, " ").trim());
      
      console.log("\n=== EXTRAINDO CAMPOS ===");
      const link = card.find("a[href*='/lote/']").first().attr("href");
      
      // Procura título e localidade
      const textBlock = card.find(".col-12").first().text().replace(/\s+/g, " ").trim();
      console.log(`Texto do Bloco Principal: "${textBlock}"`);
      
      // Procura imagem
      // Vamos ver todas as tags de imagem ou styles
      const img = card.find("img").attr("src") || card.find("img").attr("data-src") || "";
      console.log(`Imagem src: "${img}"`);
      
      // Procura por preço
      // No HTML, vamos listar todas as classes ou textos que possam conter valores monetários
      card.find("p, div, span, b, strong").each((i, el) => {
        const txt = $(el).text().trim();
        if (txt.includes("R$")) {
          console.log(`Texto com R$ [${$(el).attr("class") || "sem-classe"}]: "${txt}"`);
        }
      });
      
    }
  } catch (e) {
    console.error("Erro:", e.message);
  }
}

test();
