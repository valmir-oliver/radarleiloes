const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
  Referer: "https://www.calilleiloes.com.br/",
};

async function scrapeCalilLeiloes() {
  console.log("[Calil Leilões] Iniciando scraping de veículos...");
  const lotes = [];
  const url = "https://www.calilleiloes.com.br/lotes/veiculo";

  try {
    const r = await axios.get(url, { headers, timeout: 15000 });
    const $ = cheerio.load(r.data);

    $(".card").each((i, el) => {
      try {
        const card = $(el);
        const h5 = card.find("h5");
        if (h5.length === 0) return; // Garante que é o card do lote correto

        let modelo = h5.text().replace(/\s+/g, " ").trim();
        // Remove trailing "Lance Inicial" or other headers if merged
        modelo = modelo.replace(/Lance\s+Inicial$/i, "").trim();
        
        const linkEl = card.find("a[href*='/item/']").first();
        let link_original = linkEl.attr("href") || "";
        if (!link_original) return;

        if (link_original.startsWith("/")) {
          link_original = "https://www.calilleiloes.com.br" + link_original;
        }

        // Imagem extraída do background inline-style
        let imagem = null;
        const imgEl = card.find("a[style*='background']");
        if (imgEl.length) {
          const styleAttr = imgEl.attr("style") || "";
          const matchStyle = styleAttr.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (matchStyle && matchStyle[1]) {
            imagem = matchStyle[1];
          }
        }

        if (imagem && (imagem.includes("sem-imagem") || imagem.includes("sem_imagem"))) {
          imagem = null;
        }

        // Localidade: Brodowski - SP ou similar
        const cardText = card.text();
        let cidade = null;
        let estado = "SP"; // Default da maioria dos leilões da Calil

        const matchExposicao = cardText.match(/Local de Exposição:.*-\s*([^-\n\s]+)\s*-\s*([A-Z]{2})/i) || cardText.match(/-\s*([^-\n]+)\s*-\s*([A-Z]{2})/);
        if (matchExposicao) {
          const estCandidate = matchExposicao[2].trim();
          const validStates = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
          if (validStates.includes(estCandidate)) {
            cidade = matchExposicao[1].trim();
            estado = estCandidate;
          }
        }

        // Preço / Lance inicial
        let lance_atual = null;
        const matchPreco = cardText.match(/R\$\s*([\d.,]+)/i);
        if (matchPreco && matchPreco[1]) {
          lance_atual = parseFloat(matchPreco[1].replace(/\./g, "").replace(",", "."));
        }

        lotes.push({
          modelo,
          leiloeiro: "Calil Leilões",
          estado,
          cidade,
          lance_atual,
          tipo: cardText.toLowerCase().includes("judicial") ? "Judicial" : "Extrajudicial",
          data_encerramento: null,
          link_original,
          imagem,
          fonte: "calilleiloes",
        });
      } catch (err) {
        // Skip individual cards
      }
    });

    console.log(`[Calil Leilões] ${lotes.length} lotes de veículos encontrados`);
  } catch (e) {
    console.error("[Calil Leilões] Erro ao buscar página:", e.message);
  }

  return lotes;
}

module.exports = { scrapeCalilLeiloes };

if (require.main === module) {
  scrapeCalilLeiloes().then(console.log).catch(console.error);
}
