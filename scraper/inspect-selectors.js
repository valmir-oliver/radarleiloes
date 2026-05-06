const axios = require("axios");
const cheerio = require("cheerio");

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
};

const urlsToInspect = [
  { nome: "JR Leilões - Home", url: "https://www.jrleiloes.com.br/" },
  { nome: "Hasta Pública - Home", url: "https://www.hastapublica.com.br/" },
  { nome: "Calil Leilões - Veículos", url: "https://www.calilleiloes.com.br/lotes/veiculo" },
  { nome: "Grupo Lance - Abertos para Lance", url: "https://www.grupolance.com.br/lotes-abertos-para-lance" }
];

async function inspect(site) {
  console.log(`\n======================================================`);
  console.log(`INSPECIONANDO ESTRUTURA: ${site.nome} (${site.url})`);
  try {
    const r = await axios.get(site.url, { headers, timeout: 15000 });
    const $ = cheerio.load(r.data);
    
    // 1. Procurar possíveis cards usando classes comuns
    const possibleCards = [];
    const selectors = [
      ".card", ".product", ".lote", "article", ".box-leilao", 
      ".thumbnail", ".item", ".list-item", ".card-lote",
      "[class*=card]", "[class*=lote]", "[class*=item]"
    ];
    
    selectors.forEach(sel => {
      const els = $(sel);
      if (els.length > 0) {
        possibleCards.push({ selector: sel, count: els.length });
      }
    });
    
    console.log("Possíveis seletores de Cards encontrados:");
    possibleCards.forEach(c => console.log(`  - Seletor: "${c.selector}" | Elementos: ${c.count}`));
    
    // 2. Se encontrar algum seletor forte, inspecionar a árvore do primeiro elemento
    const mainSel = possibleCards.find(c => c.selector === ".card" || c.selector === ".box-leilao" || c.selector === ".lote" || c.selector === ".item" || c.selector.includes("card") || c.selector.includes("lote"))?.selector;
    if (mainSel) {
      console.log(`\nEstrutura do primeiro elemento encontrado com "${mainSel}":`);
      const firstEl = $(mainSel).first();
      
      // Detalhes do elemento
      const titleText = firstEl.find("h1, h2, h3, h4, h5, a, .title, .nome, .modelo").text().replace(/\s+/g, " ").trim().slice(0, 80);
      const linkHref = firstEl.find("a").attr("href") || "";
      const priceText = firstEl.find(".preco, .valor, .lance, [class*=preco], [class*=valor], [class*=lance]").text().replace(/\s+/g, " ").trim();
      const localText = firstEl.find(".local, .localidade, .estado, .cidade, [class*=local], [class*=cidade]").text().replace(/\s+/g, " ").trim();
      
      console.log(`  - Título encontrado: "${titleText}"`);
      console.log(`  - Link encontrado: "${linkHref}"`);
      console.log(`  - Preço encontrado: "${priceText}"`);
      console.log(`  - Localidade encontrada: "${localText}"`);
      
      // Imagem
      let img = firstEl.find("img").attr("src") || firstEl.find("img").attr("data-src") || "";
      console.log(`  - Imagem encontrada: "${img}"`);
      
      // Mostrar HTML parcial para depuração de seletores reais
      const htmlClean = firstEl.html()?.replace(/\s+/g, " ").trim().slice(0, 600);
      console.log(`  - HTML limpo do primeiro card:`);
      console.log(`    "${htmlClean}"`);
    } else {
      console.log("\nNenhum seletor de card padrão encontrado. Mostrando links de leilões ativos da página:");
      $("a").each((i, el) => {
        const href = $(el).attr("href") || "";
        const text = $(el).text().replace(/\s+/g, " ").trim();
        if (href.includes("lote") || href.includes("detalhe") || href.includes("leilao")) {
          if (text.length > 5) {
             console.log(`  - Link: "${text}" -> ${href}`);
          }
        }
      });
    }
  } catch (e) {
    console.error(`Erro: ${e.message}`);
  }
}

async function main() {
  for (const s of urlsToInspect) {
    await inspect(s);
  }
}

main();
