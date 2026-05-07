const axios = require("axios");
const cheerio = require("cheerio");

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

async function test() {
  try {
    const r = await axios.get("https://www.jrleiloes.com.br/", { headers });
    const $ = cheerio.load(r.data);
    
    const firstAnchor = $("a[href*='/lote/']").first();
    const commonParent = firstAnchor.parent().parent();
    
    console.log(`Common Parent Tag: ${commonParent.prop("tagName")} | Class: "${commonParent.attr("class")}"`);
    console.log(`Common Parent HTML:`);
    console.log(commonParent.html()?.replace(/\s+/g, " ").trim().slice(0, 2000));
    
  } catch (e) {
    console.error(e);
  }
}

test();
