const axios = require("axios");
const cheerio = require("cheerio");

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
};

async function inspectCalil() {
  console.log("\n--- EXAMINANDO CALIL LEILÕES CARD ---");
  try {
    const r = await axios.get("https://www.calilleiloes.com.br/lotes/veiculo", { headers });
    const $ = cheerio.load(r.data);
    const card = $(".card").first();
    
    console.log("HTML do Card Calil:");
    console.log(card.html()?.replace(/\s+/g, " ").trim().slice(0, 1500));
    
    // Teste de extração
    const link = card.find("a").first().attr("href") || card.find("a[href*=item]").attr("href");
    const titulo = card.find("h5").text().trim();
    const loteNum = card.find("h4").text().trim();
    
    // Encontrar preço: vamos extrair todas as tags de texto dentro do card para ver onde o valor está
    const textos = [];
    card.find("p, div, span, b, strong, h6").each((i, el) => {
      const txt = $(el).text().trim();
      if (txt) textos.push(txt);
    });
    console.log("Textos encontrados no Card:", textos);
  } catch (e) {
    console.log("Erro Calil:", e.message);
  }
}

async function inspectGrupoLance() {
  console.log("\n--- EXAMINANDO GRUPO LANCE VEÍCULOS ---");
  // Vamos tentar acessar a categoria de veículos
  try {
    const url = "https://www.grupolance.com.br/veiculos";
    const r = await axios.get(url, { headers });
    const $ = cheerio.load(r.data);
    console.log(`Página de Veículos carregou. Status: ${r.status}`);
    const card = $(".card").first();
    if (card.length > 0) {
      console.log("Card encontrado no Grupo Lance Veículos:");
      console.log(card.html()?.replace(/\s+/g, " ").trim().slice(0, 1200));
      
      const textos = [];
      card.find("p, div, span, b, strong, .card-price, .lance-atual").each((i, el) => {
        const txt = $(el).text().trim();
        if (txt) textos.push(txt);
      });
      console.log("Textos encontrados no Card:", textos);
    } else {
      console.log("Nenhum card classe '.card' na página de veículos. Mostrando primeiros 5 links:");
      $("a").slice(0, 15).each((i, el) => {
        console.log(`  - ${$(el).text().trim()} (${$(el).attr("href")})`);
      });
    }
  } catch (e) {
    console.log("Erro Grupo Lance:", e.message);
  }
}

async function inspectJRLeiloes() {
  console.log("\n--- EXAMINANDO JR LEILÕES CATEGORIAS ---");
  try {
    const r = await axios.get("https://www.jrleiloes.com.br/", { headers });
    const $ = cheerio.load(r.data);
    console.log("Links principais do menu/rodapé:");
    $("a").each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr("href") || "";
      if (text.length > 2 && (href.includes("veiculo") || href.includes("lote") || href.includes("leiloes") || href.includes("categoria"))) {
        console.log(`  - "${text}" -> ${href}`);
      }
    });
  } catch (e) {
    console.log("Erro JR:", e.message);
  }
}

async function inspectHastaPublica() {
  console.log("\n--- EXAMINANDO HASTA PÚBLICA CATEGORIAS ---");
  try {
    const r = await axios.get("https://www.hastapublica.com.br/", { headers });
    const $ = cheerio.load(r.data);
    console.log("Links principais do menu/rodapé:");
    $("a").each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr("href") || "";
      if (text.length > 2 && (href.includes("veiculo") || href.includes("categoria") || href.includes("leiloes") || href.includes("lotes"))) {
        console.log(`  - "${text}" -> ${href}`);
      }
    });
  } catch (e) {
    console.log("Erro Hasta:", e.message);
  }
}

async function run() {
  await inspectCalil();
  await inspectGrupoLance();
  await inspectJRLeiloes();
  await inspectHastaPublica();
}

run();
