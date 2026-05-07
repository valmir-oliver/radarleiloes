const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
  Referer: "https://www.grupolance.com.br/",
};

async function scrapeGrupoLance() {
  console.log("[Grupo Lance] Iniciando scraping de veículos...");
  const lotes = [];
  const url = "https://www.grupolance.com.br/veiculos";

  try {
    const r = await axios.get(url, { headers, timeout: 15000 });
    const $ = cheerio.load(r.data);

    $(".card").each((i, el) => {
      try {
        const card = $(el);

        const titleEl = card.find("a.card-title");
        const modelo = titleEl.text().replace(/\s+/g, " ").trim();
        if (!modelo) return;

        let link_original = titleEl.attr("href") || "";
        if (!link_original) return;

        if (link_original.startsWith("/")) {
          link_original = "https://www.grupolance.com.br" + link_original;
        }

        // Imagem extraída de style inline do card-image
        let imagem = null;
        const imgEl = card.find("a.card-image");
        if (imgEl.length) {
          const styleAttr = imgEl.attr("style") || "";
          const matchStyle = styleAttr.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (matchStyle && matchStyle[1]) {
            imagem = matchStyle[1];
            if (imagem.startsWith("//")) {
              imagem = "https:" + imagem;
            }
          }
        }

        if (imagem && (imagem.includes("no-image") || imagem.includes("no_image"))) {
          imagem = null;
        }

        // Preço / Lance atual
        let lance_atual = null;
        const priceEl = card.find(".card-price");
        if (priceEl.length) {
          const priceText = priceEl.text().replace(/\s+/g, " ").trim();
          const matchPrice = priceText.match(/R\$\s*([\d.,]+)/i) || priceText.match(/([\d.,]+)/);
          if (matchPrice && matchPrice[1]) {
            lance_atual = parseFloat(matchPrice[1].replace(/\./g, "").replace(",", "."));
          }
        }

        // Localidade: "Americana, SP"
        let cidade = null;
        let estado = "SP";
        
        // Procurar por blocos de texto contendo localidade ou classes similares
        const localEl = card.find(".card-info, .card-body").first();
        if (localEl.length) {
          const textLocal = localEl.text().replace(/\s+/g, " ").trim();
          const matchLocal = textLocal.match(/([A-Za-zÀ-ÖØ-öø-ÿ\s/]+),\s*([A-Z]{2})/);
          if (matchLocal) {
            cidade = matchLocal[1].replace(/judicial/gi, "").replace(/extrajudicial/gi, "").replace(/\s+/g, " ").trim();
            estado = matchLocal[2].trim();
          }
        }

        // Tipo: Judicial ou Extrajudicial
        const textCard = card.text().toLowerCase();
        const tipo = textCard.includes("extrajudicial") ? "Extrajudicial" : "Judicial";

        lotes.push({
          modelo,
          leiloeiro: "Grupo Lance",
          estado,
          cidade,
          lance_atual,
          tipo,
          data_encerramento: null,
          link_original,
          imagem,
          fonte: "grupolance",
        });
      } catch (err) {
        // Skip individual cards
      }
    });

    console.log(`[Grupo Lance] ${lotes.length} lotes de veículos encontrados`);
  } catch (e) {
    console.error("[Grupo Lance] Erro ao buscar página:", e.message);
  }

  return lotes;
}

module.exports = { scrapeGrupoLance };

if (require.main === module) {
  scrapeGrupoLance().then(console.log).catch(console.error);
}
