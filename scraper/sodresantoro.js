/**
 * Scraper Sodre Santoro via API REST interna (Elasticsearch)
 * POST https://www.sodresantoro.com.br/api/search-lots
 * ~564 lotes de veículos disponíveis
 */
const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const SEARCH_URL = "https://www.sodresantoro.com.br/api/search-lots";
const PAGE_SIZE = 100;

const BASE_QUERY = {
  indices: ["veiculos", "judiciais-veiculos"],
  query: {
    bool: {
      filter: [
        {
          bool: {
            should: [
              { bool: { must: [{ term: { auction_status: "online" } }] } },
              {
                bool: {
                  must: [{ term: { auction_status: "aberto" } }],
                  must_not: [{ terms: { lot_status_id: [5, 7] } }],
                },
              },
              {
                bool: {
                  must: [
                    { term: { auction_status: "encerrado" } },
                    { terms: { lot_status_id: [6] } },
                  ],
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
        {
          bool: {
            should: [
              { bool: { must_not: { term: { lot_status_id: 6 } } } },
              {
                bool: {
                  must: [
                    { term: { lot_status_id: 6 } },
                    { term: { segment_id: 1 } },
                  ],
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
        {
          bool: {
            should: [{ bool: { must_not: [{ term: { lot_test: true } }] } }],
            minimum_should_match: 1,
          },
        },
      ],
    },
  },
  sort: [
    { lot_status_id_order: { order: "asc" } },
    { auction_date_init: { order: "asc" } },
  ],
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Content-Type": "application/json",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  Referer: "https://www.sodresantoro.com.br/veiculos/lotes",
  Origin: "https://www.sodresantoro.com.br",
  "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  Connection: "keep-alive",
};

function parseLocation(lotLocation) {
  if (!lotLocation) return { cidade: null, estado: null };
  // Formato: "guarulhos i/sp", "são paulo ii/sp", "campinas/sp"
  const parts = lotLocation.split("/");
  const estadoRaw = parts[parts.length - 1]?.trim().toUpperCase().slice(0, 2) || null;
  // Só aceita estado válido de 2 letras
  const estado = estadoRaw && /^[A-Z]{2}$/.test(estadoRaw) ? estadoRaw : null;
  const cidadeRaw = parts
    .slice(0, -1)
    .join("/")
    .replace(/\s+[ivxlc]+$/i, "") // remove número do pátio (romano)
    .trim();
  const cidade = cidadeRaw
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ") || null;
  return { cidade, estado };
}

async function scrapeSodreSantoro() {
  console.log("[Sodre Santoro] Iniciando scraping via API...");
  const todosLotes = [];
  let from = 0;
  let total = null;

  // Obter cookies de sessão visitando a página primeiro
  let cookie = "";
  try {
    const pageResp = await axios.get("https://www.sodresantoro.com.br/veiculos/lotes", {
      headers: {
        "User-Agent": HEADERS["User-Agent"],
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      timeout: 15000,
      maxRedirects: 5,
    });
    const setCookie = pageResp.headers["set-cookie"];
    if (setCookie) {
      cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
      console.log("[Sodre Santoro] Cookie obtido");
    }
  } catch (e) {
    console.log("[Sodre Santoro] Aviso: não foi possível obter cookie:", e.message);
  }

  while (total === null || from < total) {
    try {
      const body = { ...BASE_QUERY, from, size: PAGE_SIZE };
      const reqHeaders = { ...HEADERS };
      if (cookie) reqHeaders["Cookie"] = cookie;
      const r = await axios.post(SEARCH_URL, body, { headers: reqHeaders, timeout: 15000 });
      const { results, total: totalApi } = r.data;

      if (total === null) {
        total = totalApi;
        console.log(`[Sodre Santoro] Total disponível: ${total} lotes`);
      }

      if (!results || results.length === 0) break;

      for (const item of results) {
        const { cidade, estado } = parseLocation(item.lot_location);

        const marca = item.lot_brand
          ? item.lot_brand.charAt(0).toUpperCase() + item.lot_brand.slice(1).toLowerCase()
          : "";
        const modeloDetalhe = item.lot_model
          ? item.lot_model.charAt(0).toUpperCase() + item.lot_model.slice(1).toLowerCase()
          : "";
        const anoFab = item.lot_year_manufacture || "";
        const anoMod = item.lot_year_model || "";
        const anoStr = anoFab && anoMod ? ` ${anoFab}/${anoMod}` : anoMod ? ` ${anoMod}` : "";
        const modelo = `${marca} ${modeloDetalhe}${anoStr}`.trim();

        const lance_atual = item.bid_actual ? parseFloat(item.bid_actual) : null;
        const tipo = item.lot_is_judicial ? "Judicial" : "Extrajudicial";
        const link_original = `https://www.sodresantoro.com.br/leilao/${item.auction_id}/lote/${item.lot_id}/`;
        const data_encerramento = item.lot_date_end || item.auction_date_init || null;

        todosLotes.push({
          modelo,
          leiloeiro: "Sodre Santoro",
          estado,
          cidade,
          lance_atual,
          tipo,
          data_encerramento,
          link_original,
          imagem: item.lot_pictures?.[0] ?? null,
          fonte: "sodresantoro",
        });
      }

      console.log(`[Sodre Santoro] Página ${Math.floor(from / PAGE_SIZE) + 1}: ${results.length} lotes (acumulado: ${todosLotes.length})`);
      from += PAGE_SIZE;

      if (from < total) await new Promise((r) => setTimeout(r, 400));
    } catch (e) {
      console.error(`[Sodre Santoro] Erro na página ${from}: ${e.message}`);
      break;
    }
  }

  console.log(`[Sodre Santoro] Total extraído: ${todosLotes.length} lotes`);
  return todosLotes;
}

module.exports = { scrapeSodreSantoro };
