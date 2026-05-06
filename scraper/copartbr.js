/**
 * Scraper Copart Brasil (copart.com.br)
 * API: POST /public/lots/search (browser context para bypass Incapsula)
 * ~12.800 lotes brasileiros com imagens reais em BRL
 */
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

puppeteer.use(StealthPlugin());

const ROWS_PER_PAGE = 10; // API do Copart BR retorna máximo 10 por página
const MAX_PAGES = 100; // 100 páginas × 10 = 1000 lotes por execução

function parseLocation(yn) {
  if (!yn) return { cidade: null, estado: null };
  // Formato: "EMBÚ DAS ARTES - SP" ou "ITAQUAQUECETUBA - SP"
  const parts = yn.split(" - ");
  if (parts.length >= 2) {
    const estado = parts[parts.length - 1].trim().toUpperCase().slice(0, 2);
    const cidade = parts.slice(0, parts.length - 1).join(" - ").trim();
    const estadoValido = /^[A-Z]{2}$/.test(estado) ? estado : null;
    return { cidade: cidade || null, estado: estadoValido };
  }
  return { cidade: yn.trim() || null, estado: null };
}

async function fetchPage(page, start) {
  return page.evaluate(
    async ({ start, rows }) => {
      try {
        const r = await fetch("https://www.copart.com.br/public/lots/search", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            query: ["*"],
            filter: {},
            sort: ["auction_date_type asc"],
            page: Math.floor(start / rows),
            size: rows,
            start: start,
            showUpComing: true,
          }),
        });
        const json = await r.json();
        return {
          total: json?.data?.results?.totalElements ?? 0,
          content: json?.data?.results?.content ?? [],
        };
      } catch (e) {
        return { error: e.message, total: 0, content: [] };
      }
    },
    { start, rows: ROWS_PER_PAGE }
  );
}

async function scrapeCopartBr() {
  console.log("[Copart Brasil] Iniciando scraping via copart.com.br...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );

  // Obtém cookies do site para bypass Incapsula
  await page.goto("https://www.copart.com.br/", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 2000));
  console.log("[Copart Brasil] Cookies obtidos");

  const todosLotes = [];
  let total = 0;

  for (let p = 0; p < MAX_PAGES; p++) {
    const start = p * ROWS_PER_PAGE;
    const result = await fetchPage(page, start);

    if (result.error) {
      console.log(`[Copart Brasil] Erro na página ${p + 1}: ${result.error}`);
      break;
    }

    if (p === 0) {
      total = result.total;
      console.log(`[Copart Brasil] Total disponível: ${total} lotes`);
    }

    const lotes = result.content;
    if (!lotes.length) break;

    for (const item of lotes) {
      try {
        const modelo = item.ld || `${item.lcy ?? ""} ${item.mkn ?? ""} ${item.lm ?? ""}`.trim();
        const { cidade, estado } = parseLocation(item.yn);
        const lance_atual = item.hb && item.hb > 0 ? item.hb : null;

        // Data de encerramento
        let data_encerramento = null;
        if (item.ad && item.ad !== "") {
          try {
            data_encerramento = new Date(item.ad).toISOString();
          } catch {}
        }

        const tipo = item.saleType === "Compre Agora" ? "Extrajudicial" : "Judicial";
        const link_original = item.ln ? `https://www.copart.com.br/lot/${item.ln}` : null;
        const imagem = item.tims || null;

        if (!modelo || !link_original) continue;

        todosLotes.push({
          modelo: modelo.trim(),
          leiloeiro: "Copart Brasil",
          estado,
          cidade,
          lance_atual,
          tipo,
          data_encerramento,
          link_original,
          imagem,
          fonte: "copartbr",
        });
      } catch {}
    }

    console.log(
      `[Copart Brasil] Página ${p + 1}/${Math.min(MAX_PAGES, Math.ceil(total / ROWS_PER_PAGE))}: ${lotes.length} lotes (acumulado: ${todosLotes.length})`
    );

    if (start + ROWS_PER_PAGE >= total) break;
    await new Promise((r) => setTimeout(r, 300)); // pausa entre páginas
  }

  await browser.close();
  console.log(`[Copart Brasil] Total extraído: ${todosLotes.length} lotes`);
  return todosLotes;
}

module.exports = { scrapeCopartBr };
