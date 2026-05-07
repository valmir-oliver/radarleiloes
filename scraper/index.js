/**
 * RADAR LEILOES - Scraper Principal
 * Uso: node scraper/index.js
 * 
 * Roda todos os scrapers e salva os resultados no Supabase.
 * Agende com o Agendador de Tarefas do Windows para rodar a cada 2 horas.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env.local") });
const supabase = require("./supabase");
const { scrapeMegaLeiloes } = require("./megaleiloes");
const { scrapeSodreSantoro } = require("./sodresantoro");
const { scrapeCopartBr } = require("./copartbr");
const { scrapeJRLeiloes } = require("./jrleiloes");
const { scrapeHastaPublica } = require("./hastapublica");
const { scrapeCalilLeiloes } = require("./calilleiloes");
const { scrapeGrupoLance } = require("./grupolance");
const { seedDados } = require("./seed");

async function salvarLotesPorFonte(fonte, lotes) {
  if (lotes.length === 0) return;

  try {
    // 1. Buscar os lotes existentes para esta fonte
    const { data: existing, error: fetchError } = await supabase
      .from("lotes")
      .select("id, link_original")
      .eq("fonte", fonte);

    if (fetchError) {
      console.error(`  Erro ao buscar lotes existentes de [${fonte}]:`, fetchError.message);
      return;
    }

    const existingMap = new Map(existing ? existing.map(x => [x.link_original, x.id]) : []);

    // 2. Mapear inserts e updates, removendo duplicatas locais no mesmo lote de scraping
    const toUpsert = [];
    const incomingLinks = new Set();
    const processedLinks = new Set();

    for (const lote of lotes) {
      if (!lote.link_original) continue;
      
      // Se houver links duplicados na mesma rodada de scraping do leiloeiro, ignorar para evitar erros no Postgres
      if (processedLinks.has(lote.link_original)) continue;
      processedLinks.add(lote.link_original);
      
      incomingLinks.add(lote.link_original);

      if (existingMap.has(lote.link_original)) {
        // Se já existe, atualiza mantendo o mesmo ID
        toUpsert.push({ id: existingMap.get(lote.link_original), ...lote });
      } else {
        // Se é novo, insere sem ID (Supabase gera automaticamente)
        toUpsert.push(lote);
      }
    }

    // 3. Executar o Upsert
    if (toUpsert.length > 0) {
      const { error: upsertError } = await supabase.from("lotes").upsert(toUpsert);
      if (upsertError) {
        console.error(`  Erro ao realizar Upsert [${fonte}]:`, upsertError.message);
        return;
      }
    }

    // 4. Deletar os lotes obsoletos (que existiam mas não foram encontrados nesta rodada)
    const toDeleteIds = existing
      ? existing.filter(x => !incomingLinks.has(x.link_original)).map(x => x.id)
      : [];

    if (toDeleteIds.length > 0) {
      const { error: deleteError } = await supabase.from("lotes").delete().in("id", toDeleteIds);
      if (deleteError) {
        console.error(`  Erro ao deletar lotes obsoletos [${fonte}]:`, deleteError.message);
      } else {
        console.log(`  - ${toDeleteIds.length} lotes obsoletos deletados [${fonte}]`);
      }
    }

    console.log(`  ✓ Sincronização concluída: ${lotes.length} lotes ativos [${fonte}]`);
  } catch (err) {
    console.error(`  Erro inesperado ao sincronizar [${fonte}]:`, err.message);
  }
}

async function main() {
  console.log("=== RADAR LEILOES - Scraper iniciado ===");
  console.log(new Date().toLocaleString("pt-BR"));
  console.log("");

  // Verifica conexão com Supabase
  const { error: pingError } = await supabase.from("lotes").select("id").limit(1);
  if (pingError) {
    console.error("ERRO: Nao foi possivel conectar ao Supabase:", pingError.message);
    process.exit(1);
  }
  console.log("✓ Supabase conectado\n");

  let totalLotes = 0;

  // --- Mega Leiloes ---
  try {
    const lotes = await scrapeMegaLeiloes();
    await salvarLotesPorFonte("megaleiloes", lotes);
    totalLotes += lotes.length;
  } catch (e) {
    console.error("Erro no Mega Leiloes:", e.message);
  }

  // --- Sodre Santoro ---
  try {
    const lotes = await scrapeSodreSantoro();
    await salvarLotesPorFonte("sodresantoro", lotes);
    totalLotes += lotes.length;
  } catch (e) {
    console.error("Erro no Sodre Santoro:", e.message);
  }

  // --- Copart Brasil ---
  try {
    const lotes = await scrapeCopartBr();
    await salvarLotesPorFonte("copartbr", lotes);
    totalLotes += lotes.length;
  } catch (e) {
    console.error("Erro no Copart Brasil:", e.message);
  }

  // --- JR Leilões ---
  try {
    const lotes = await scrapeJRLeiloes();
    await salvarLotesPorFonte("jrleiloes", lotes);
    totalLotes += lotes.length;
  } catch (e) {
    console.error("Erro no JR Leilões:", e.message);
  }

  // --- Hasta Pública ---
  try {
    const lotes = await scrapeHastaPublica();
    await salvarLotesPorFonte("hastapublica", lotes);
    totalLotes += lotes.length;
  } catch (e) {
    console.error("Erro na Hasta Pública:", e.message);
  }

  // --- Calil Leilões ---
  try {
    const lotes = await scrapeCalilLeiloes();
    await salvarLotesPorFonte("calilleiloes", lotes);
    totalLotes += lotes.length;
  } catch (e) {
    console.error("Erro na Calil Leilões:", e.message);
  }

  // --- Grupo Lance ---
  try {
    const lotes = await scrapeGrupoLance();
    await salvarLotesPorFonte("grupolance", lotes);
    totalLotes += lotes.length;
  } catch (e) {
    console.error("Erro no Grupo Lance:", e.message);
  }

  if (totalLotes === 0) {
    console.log("\nNenhum lote coletado. Rodando seed de dados de exemplo...");
    await seedDados();
  } else {
    console.log(`\n✓ Total: ${totalLotes} lotes coletados e salvos`);
  }

  console.log("\n=== Scraping concluido ===");
}

main().catch(console.error);
