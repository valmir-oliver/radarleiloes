const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
  Referer: "https://www.hastapublica.com.br/",
};

async function scrapeHastaPublica() {
  console.log("[Hasta Pública] Iniciando scraping de veículos...");
  const lotes = [];
  const url = "https://www.hastapublica.com.br/busca?id_categoria=2&id_sub_categoria=&localidade=&data=&id_leilao=&palavra=";

  try {
    const r = await axios.get(url, { headers, timeout: 15000 });
    const $ = cheerio.load(r.data);

    $(".card.card-leilao").each((i, el) => {
      try {
        const card = $(el);

        const titleEl = card.find(".titleInsideLote");
        const modelo = titleEl.text().replace(/\s+/g, " ").trim();
        if (!modelo) return;

        // Link original: pode ser um link interno ou externo (ex: Comprei)
        const linkEl = card.find("a").first();
        let link_original = linkEl.attr("href") || "";
        if (!link_original) return;

        if (link_original.startsWith("/")) {
          link_original = "https://www.hastapublica.com.br" + link_original;
        }

        // Imagem
        let imagem = card.find("img").first().attr("src") || null;
        if (imagem && (imagem.includes("sem_foto") || imagem.includes("no-image"))) {
          imagem = null;
        }

        // Localidade: e.g. "Santo André/SP"
        const localBlock = card.find(".descricao dt").first().text().replace(/\s+/g, " ").trim();
        let cidade = null;
        let estado = null;
        if (localBlock) {
          const partes = localBlock.split("/");
          cidade = partes[0] ? partes[0].trim() : null;
          estado = partes[1] ? partes[1].trim() : null;
        }

        // Preço / Lance atual
        let lance_atual = null;
        const priceText = card.find(".descricao dd").text().replace(/\s+/g, " ").trim();
        const match = priceText.match(/R\$\s*([\d.,]+)/i) || priceText.match(/([\d.,]+)/);
        if (match && match[1]) {
          lance_atual = parseFloat(match[1].replace(/\./g, "").replace(",", "."));
        }

        // Tipo: Judicial ou Extrajudicial (detectar do texto do card)
        const textCard = card.text().toLowerCase();
        const tipo = textCard.includes("judicial") && !textCard.includes("extrajudicial") ? "Judicial" : "Extrajudicial";

        lotes.push({
          modelo,
          leiloeiro: "Hasta Pública Leilões",
          estado: estado || "SP",
          cidade: cidade,
          lance_atual,
          tipo,
          data_encerramento: null,
          link_original,
          imagem,
          fonte: "hastapublica",
        });
      } catch (err) {
        // Ignorar erros em cards individuais
      }
    });

    console.log(`[Hasta Pública] ${lotes.length} lotes de veículos encontrados`);
  } catch (e) {
    console.error("[Hasta Pública] Erro ao buscar página:", e.message);
  }

  return lotes;
}

module.exports = { scrapeHastaPublica };

if (require.main === module) {
  scrapeHastaPublica().then(console.log).catch(console.error);
}
