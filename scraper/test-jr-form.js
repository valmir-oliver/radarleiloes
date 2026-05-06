const axios = require("axios");
const cheerio = require("cheerio");

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
};

async function run() {
  try {
    const r = await axios.get("https://www.jrleiloes.com.br/", { headers });
    const $ = cheerio.load(r.data);
    
    console.log("=== ENCONTRANDO FORMULÁRIOS ===");
    $("form").each((i, el) => {
      console.log(`Form ${i}: Action: "${$(el).attr("action")}" | Method: "${$(el).attr("method")}"`);
      $(el).find("input, select").each((j, input) => {
         console.log(`  - Input: Name: "${$(input).attr("name")}" | Type: "${$(input).attr("type") || input.name}"`);
      });
    });

    console.log("\n=== ENCONTRANDO SELECTS DE BUSCA ===");
    $("select").each((i, el) => {
      console.log(`Select ${i}: ID: "${$(el).attr("id")}" | Name: "${$(el).attr("name")}"`);
      $(el).find("option").slice(0, 10).each((j, opt) => {
        console.log(`  - Option: Value: "${$(opt).attr("value")}" | Text: "${$(opt).text().trim()}"`);
      });
    });
    
  } catch (e) {
    console.error("Erro:", e.message);
  }
}

run();
