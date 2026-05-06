const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

async function main() {
  const r = await axios.get("https://www.sodresantoro.com.br/veiculos", { headers, timeout: 15000 });
  const $ = cheerio.load(r.data);

  // Quais classes existem nos articles?
  $("article").each((i, el) => {
    if (i < 3) {
      console.log(`\n--- Article ${i} ---`);
      console.log($(el).html()?.slice(0, 1500));
    }
  });

  console.log(`\nTotal articles: ${$("article").length}`);
  console.log(`Total .lote: ${$(".lote").length}`);
  console.log(`Total .card: ${$(".card").length}`);
  console.log(`Total [class*=lote]: ${$("[class*=lote]").length}`);

  // Paginação
  const paginacao = $("a[href*=page], a[href*=pagina], .pagination a, a.next");
  console.log(`\nLinks paginação: ${paginacao.length}`);
  paginacao.each((i, el) => { if (i < 5) console.log("  " + $(el).attr("href")); });
}
main().catch(console.error);
