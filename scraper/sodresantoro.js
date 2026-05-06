const axios = require("axios");
const cheerio = require("cheerio");
const supabase = require("./supabase");

const BASE_URL = "https://www.sodresantoro.com.br/veiculos";

async function scrapeSODRE() {
  console.log("[Sodre Santoro] Iniciando scraping...");
  const lotes = [];

  try {
    const { data: html } = await axios.get(BASE_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(html);

    // Itera sobre os cards de veículos (seletores ajustáveis conforme o site)
    $("article, .lot-card, .card-lote, [class*='lot'], [class*='veiculo'], [class*='card']").each((_, el) => {
      const texto = $(el).text().trim();
      if (!texto || texto.length < 10) return;

      const modelo = $(el).find("h2, h3, .title, [class*='title'], [class*='modelo']").first().text().trim();
      const lance = $(el).find("[class*='lance'], [class*='preco'], [class*='price'], strong").first().text().trim();
      const local = $(el).find("[class*='local'], [class*='cidade'], [class*='estado']").first().text().trim();
      const link = $(el).find("a").first().attr("href") || "";

      if (!modelo || modelo.length < 3) return;

      lotes.push({
        modelo: modelo.substring(0, 200),
        leiloeiro: "Sodre Santoro",
        estado: extrairEstado(local),
        cidade: extrairCidade(local),
        lance_atual: lance || null,
        tipo: "Extrajudicial",
        link_original: link.startsWith("http") ? link : `https://www.sodresantoro.com.br${link}`,
        fonte: "sodresantoro",
      });
    });

    console.log(`[Sodre Santoro] ${lotes.length} lotes encontrados`);
  } catch (err) {
    console.error("[Sodre Santoro] Erro no scraping:", err.message);
  }

  return lotes;
}

function extrairEstado(local) {
  if (!local) return null;
  const match = local.match(/\b([A-Z]{2})\b/);
  return match ? match[1] : null;
}

function extrairCidade(local) {
  if (!local) return null;
  return local.split("-")[0].split("/")[0].trim().substring(0, 100) || null;
}

async function salvarLotes(lotes) {
  if (lotes.length === 0) return;
  const { error } = await supabase
    .from("lotes")
    .upsert(lotes, { onConflict: "fonte,link_original", ignoreDuplicates: false });
  if (error) console.error("Erro ao salvar:", error.message);
  else console.log(`[DB] ${lotes.length} lotes salvos/atualizados`);
}

module.exports = { scrapeSODRE, salvarLotes };
