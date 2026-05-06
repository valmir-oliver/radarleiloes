const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  Referer: "https://www.megaleiloes.com.br/",
};

async function scrapeMegaLeiloes() {
  console.log("[Mega Leiloes] Iniciando scraping...");
  const lotes = [];

  // Scraper carros + motos (2 categorias)
  const urls = [
    "https://www.megaleiloes.com.br/veiculos/carros",
    "https://www.megaleiloes.com.br/veiculos/motos",
    "https://www.megaleiloes.com.br/veiculos/caminhoes",
  ];

  for (const url of urls) {
    try {
      const r = await axios.get(url, { headers, timeout: 15000 });
      const $ = cheerio.load(r.data);

      $(".card").each((i, el) => {
        try {
          const card = $(el);

          const linkEl = card.find("a.card-title");
          const modelo = linkEl.text().trim();
          const link_original = linkEl.attr("href")?.split("?")[0] || "";

          if (!modelo || !link_original) return;

          const lance_str = card.find(".card-price").text().replace(/[^0-9,]/g, "").replace(",", ".");
          const lance_atual = parseFloat(lance_str) || null;

          const localidade = card.find("a.card-locality").text().trim();
          const partes = localidade.split(",").map((s) => s.trim());
          const cidade = partes[0] || null;
          const estado = partes[1] || null;

          const tipoTexto = card.find(".card-instance-title").text().toLowerCase();
          const tipo = tipoTexto.includes("judicial") ? "Judicial" : "Extrajudicial";

          // Data de encerramento (procurar countdown ou data no card)
          let data_encerramento = null;
          const dataEl = card.find("[data-encerramento], .card-date, .card-timer, time");
          if (dataEl.length) {
            data_encerramento = dataEl.attr("datetime") || dataEl.attr("data-encerramento") || null;
          }

          const imageStyle = card.find("a.card-image").attr("style") || "";
          const dataBg = card.find("a.card-image").attr("data-bg") || "";
          let imagem = null;

          const matchStyle = imageStyle.match(/url\(["']?([^"')]+)["']?\)/);
          if (matchStyle && matchStyle[1]) {
            imagem = matchStyle[1];
          } else if (dataBg) {
            imagem = dataBg;
          }

          if (imagem && (imagem.includes("card-no-image") || imagem.includes("no-image"))) {
            imagem = null;
          }

          lotes.push({
            modelo,
            leiloeiro: "Mega Leilões",
            estado,
            cidade,
            lance_atual,
            tipo,
            data_encerramento,
            link_original,
            imagem,
            fonte: "megaleiloes",
          });
        } catch (err) {
          // Skip card com erro
        }
      });

      console.log(`[Mega Leiloes] ${url.split("/").pop()}: ${$(".card").length} cards encontrados`);
    } catch (e) {
      console.log(`[Mega Leiloes] Erro em ${url}: ${e.message}`);
    }
  }

  console.log(`[Mega Leiloes] Total: ${lotes.length} lotes extraídos`);
  return lotes;
}

module.exports = { scrapeMegaLeiloes };
