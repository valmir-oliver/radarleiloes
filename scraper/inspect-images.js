const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
  Referer: "https://www.megaleiloes.com.br/",
};

async function main() {
  const r = await axios.get("https://www.megaleiloes.com.br/veiculos/carros", { headers, timeout: 15000 });
  const $ = cheerio.load(r.data);

  let count = 0;
  $(".card").each((i, el) => {
    if (count >= 5) return;
    const card = $(el);
    const imgEl = card.find("a.card-image");
    const dataBg = imgEl.attr("data-bg") || "";
    const modelo = card.find("a.card-title").text().trim();
    console.log(`Card ${i}: modelo="${modelo}"`);
    console.log(`  data-bg="${dataBg}"`);
    const imgs = card.find("img");
    imgs.each((j, img) => {
      const s = $(img).attr("src") || "";
      const ds = $(img).attr("data-src") || "";
      const dl = $(img).attr("data-lazy") || "";
      if (s || ds || dl) console.log(`  img[${j}]: src="${s}" data-src="${ds}" data-lazy="${dl}"`);
    });
    count++;
  });
}
main().catch(console.error);
