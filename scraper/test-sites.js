const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

const sites = [
  {
    nome: "Mega Leiloes",
    url: "https://www.megaleiloes.com.br/veiculos",
    seletores: [".card", ".produto", ".lote", "article", "[class*=card]", "[class*=lote]"],
  },
  {
    nome: "Superbid",
    url: "https://www.superbid.net/categorias/68-veiculos",
    seletores: [".card", ".produto", ".lote", "article", "[class*=card]", "[class*=item]"],
  },
  {
    nome: "Leilaovip",
    url: "https://www.leilaovip.com.br/lotes?categoria=veiculos",
    seletores: [".card", ".produto", ".lote", "article", "[class*=card]", "[class*=lote]"],
  },
  {
    nome: "Sodre Santoro",
    url: "https://www.sodresantoro.com.br/veiculos",
    seletores: [".card", ".produto", ".lote", "article", "[class*=card]", "[class*=lote]"],
  },
  {
    nome: "Lance Mais",
    url: "https://www.lancemais.com.br/leiloes/veiculos",
    seletores: [".card", ".produto", ".lote", "article", "[class*=card]"],
  },
  {
    nome: "Leilomaster",
    url: "https://www.leilomaster.com.br/leilao/veiculos",
    seletores: [".card", ".produto", ".lote", "article", "[class*=card]"],
  },
  {
    nome: "Leilao.com.br",
    url: "https://www.leilao.com.br/lotes?categoria=veiculos",
    seletores: [".card", ".produto", ".lote", "article", "[class*=card]", "[class*=lote]"],
  },
  {
    nome: "DeMotors",
    url: "https://www.demotors.com.br/leilao",
    seletores: [".card", ".produto", ".lote", "article", "[class*=card]"],
  },
  {
    nome: "Leilao Judicial SP",
    url: "https://leiloeiro.com.br/peca-ao-juiz/veiculos",
    seletores: [".card", ".produto", ".lote", "article", "[class*=card]"],
  },
  {
    nome: "Bidkar",
    url: "https://www.bidkar.com.br/lotes",
    seletores: [".card", ".produto", ".lote", "article", "[class*=card]"],
  },
];

async function testarSite(site) {
  try {
    const r = await axios.get(site.url, { headers, timeout: 12000 });
    const $ = cheerio.load(r.data);
    const title = $("title").text().trim().slice(0, 80);

    for (const sel of site.seletores) {
      const els = $(sel);
      if (els.length > 0) {
        const texto = els.first().text().replace(/\s+/g, " ").trim().slice(0, 100);
        console.log(`✅ OK     [${r.status}] ${site.nome}`);
        console.log(`         Seletor: ${sel} (${els.length} elementos)`);
        console.log(`         Texto: "${texto}"`);
        return { nome: site.nome, status: "ok", elementos: els.length };
      }
    }

    console.log(`⚠️  SPA    [${r.status}] ${site.nome} — HTML sem dados (JavaScript renderiza)`);
    console.log(`         Title: "${title}"`);
    return { nome: site.nome, status: "spa" };
  } catch (e) {
    const codigo = e.response?.status || e.code || "ERR";
    console.log(`❌ FALHOU [${codigo}] ${site.nome} — ${e.message.slice(0, 70)}`);
    return { nome: site.nome, status: "falhou", codigo };
  }
}

async function main() {
  console.log("=== TESTANDO SITES DE LEILAO ===\n");
  const resultados = await Promise.all(sites.map(testarSite));

  console.log("\n=== RESUMO ===");
  const ok = resultados.filter((r) => r.status === "ok");
  const spa = resultados.filter((r) => r.status === "spa");
  const falhou = resultados.filter((r) => r.status === "falhou");

  console.log(`\n✅ Extraiu dados HTML (${ok.length}): ${ok.map((r) => r.nome).join(", ") || "nenhum"}`);
  console.log(`⚠️  SPA/JS-only (${spa.length}): ${spa.map((r) => r.nome).join(", ") || "nenhum"}`);
  console.log(`❌ Bloqueado/offline (${falhou.length}): ${falhou.map((r) => `${r.nome}(${r.codigo})`).join(", ") || "nenhum"}`);
}

main();
