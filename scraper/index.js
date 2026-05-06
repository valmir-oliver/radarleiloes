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
const { seedDados } = require("./seed");

async function salvarLotesPorFonte(fonte, lotes) {
  if (lotes.length === 0) return;
  // Remove lotes antigos da mesma fonte e insere os novos
  await supabase.from("lotes").delete().eq("fonte", fonte);
  const { error } = await supabase.from("lotes").insert(lotes);
  if (error) console.error(`  Erro ao salvar [${fonte}]:`, error.message);
  else console.log(`  ✓ ${lotes.length} lotes salvos [${fonte}]`);
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

  if (totalLotes === 0) {
    console.log("\nNenhum lote coletado. Rodando seed de dados de exemplo...");
    await seedDados();
  } else {
    console.log(`\n✓ Total: ${totalLotes} lotes coletados e salvos`);
  }

  console.log("\n=== Scraping concluido ===");
}

main().catch(console.error);
