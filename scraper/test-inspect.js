const axios = require("axios");
const cheerio = require("cheerio");

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

async function testHasta() {
  console.log("=== Analisando Hasta Pública ===");
  try {
    const urls = [
      "https://www.hastapublica.com.br/busca",
      "https://www.hastapublica.com.br/busca?id_categoria=2&id_sub_categoria=&localidade=&data=&id_leilao=&palavra=",
      "https://www.hastapublica.com.br/busca?id_categoria=3&id_sub_categoria=&localidade=&data=&id_leilao=&palavra="
    ];

    for (const url of urls) {
      const r = await axios.get(url, { headers, timeout: 15000 });
      const $ = cheerio.load(r.data);
      const totalCards = $(".card.card-leilao").length;
      console.log(`URL: ${url} -> Encontrou ${totalCards} cards.`);
    }
  } catch (e) {
    console.error("Erro no testHasta:", e.message);
  }
}

async function testJR() {
  console.log("\n=== Analisando JR Leilões ===");
  try {
    const url = "https://www.jrleiloes.com.br/";
    const r = await axios.get(url, { headers, timeout: 15000 });
    const $ = cheerio.load(r.data);
    
    // Ver todos os links de lotes
    const links = [];
    $("a[href*='/lote/']").each((i, el) => {
      links.push($(el).attr("href"));
    });
    console.log(`JR Leilões - Total de links '/lote/' encontrados: ${links.length}`);
    console.log("Links:", [...new Set(links)]);

    // Ver quantos cards li com flex-col
    let flexColCount = 0;
    $("li").each((i, el) => {
      const className = $(el).attr("class") || "";
      if (className.includes("flex-col") && !className.includes("cookie")) {
        flexColCount++;
      }
    });
    console.log(`JR Leilões - Total de cards 'li.flex-col': ${flexColCount}`);
  } catch (e) {
    console.error("Erro no testJR:", e.message);
  }
}

async function run() {
  await testHasta();
  await testJR();
}

run();
