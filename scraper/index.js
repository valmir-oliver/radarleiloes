/**
 * RADAR LEILOES - Scraper Principal
 * Uso: node scraper/index.js
 * 
 * Roda todos os scrapers e salva os resultados no Supabase.
 * Agende com o Agendador de Tarefas do Windows para rodar a cada 2 horas.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env.local") });
const supabase = require("./supabase");
const { scrapeSODRE } = require("./sodresantoro");
const { seedDados } = require("./seed");

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

  const todosLotes = [];

  // --- Sodre Santoro ---
  try {
    const lotes = await scrapeSODRE();
    todosLotes.push(...lotes);
  } catch (e) {
    console.error("Erro no Sodre Santoro:", e.message);
  }

  // Salva tudo no banco
  if (todosLotes.length > 0) {
    const { error } = await supabase.from("lotes").upsert(todosLotes, {
      ignoreDuplicates: false,
    });
    if (error) console.error("Erro ao salvar lotes:", error.message);
    else console.log(`\n✓ ${todosLotes.length} lotes salvos no Supabase`);
  } else {
    console.log("\nNenhum lote coletado. Rodando seed de dados de exemplo...");
    await seedDados();
  }

  console.log("\n=== Scraping concluido ===");
}

main().catch(console.error);
