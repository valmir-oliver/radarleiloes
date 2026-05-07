const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
  Referer: "https://www.jrleiloes.com.br/",
};

async function scrapeJRLeiloes() {
  console.log("[JR Leilões] Iniciando scraping...");
  const lotes = [];
  const url = "https://www.jrleiloes.com.br/";

  try {
    const r = await axios.get(url, { headers, timeout: 15000 });
    const $ = cheerio.load(r.data);

    // Iterar sobre os cartões LI que representam os lotes
    $("li").each((i, el) => {
      try {
        const item = $(el);
        const className = item.attr("class") || "";
        
        // Filtra para garantir que é um card de lote e não cookies ou outros menus
        if (!className.includes("flex-col") || className.includes("cookie")) return;

        const linkEl = item.find("a[href*='/lote/']").last();
        let link_original = linkEl.attr("href") || "";
        if (!link_original) return;

        if (link_original.startsWith("/")) {
          link_original = "https://www.jrleiloes.com.br" + link_original;
        }

        const modelo = item.find("a.font-new.font-bold, .font-new").first().text().replace(/\s+/g, " ").trim();
        if (!modelo) return;

        // Imagem
        let imagem = item.find("img").first().attr("src") || null;
        if (imagem && (imagem.includes("sem_foto") || imagem.includes("no-image") || imagem.includes("no_image"))) {
          imagem = null;
        }

        // Lance/Valor (Lance atual ou Avaliação se lance atual for 0)
        let lance_atual = null;
        const textoCard = item.text();
        
        const matchLance = textoCard.match(/Lance atual:\s*R\$\s*([\d.,]+)/i);
        if (matchLance && matchLance[1]) {
          const val = parseFloat(matchLance[1].replace(/\./g, "").replace(",", "."));
          if (val > 0) lance_atual = val;
        }

        // Se não houver lance atual, buscar Avaliação
        if (!lance_atual) {
          const matchAvaliacao = textoCard.match(/Avaliação:\s*R\$\s*([\d.,]+)/i);
          if (matchAvaliacao && matchAvaliacao[1]) {
            lance_atual = parseFloat(matchAvaliacao[1].replace(/\./g, "").replace(",", "."));
          }
        }

        lotes.push({
          modelo,
          leiloeiro: "Joyce Ribeiro Leilões",
          estado: "SP", // Sediado em SP
          cidade: "Brodowski", // Localidade comum deles
          lance_atual,
          tipo: modelo.toLowerCase().includes("judicial") ? "Judicial" : "Extrajudicial",
          data_encerramento: null,
          link_original,
          imagem,
          fonte: "jrleiloes",
        });
      } catch (err) {
        // Ignorar erros em cards individuais
      }
    });

    console.log(`[JR Leilões] ${lotes.length} lotes encontrados`);
  } catch (e) {
    console.error("[JR Leilões] Erro ao buscar página:", e.message);
  }

  return lotes;
}

module.exports = { scrapeJRLeiloes };

if (require.main === module) {
  scrapeJRLeiloes().then(console.log).catch(console.error);
}
