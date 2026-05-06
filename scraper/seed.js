/**
 * Seed: insere dados de exemplo no Supabase para testar a conexão
 * antes do scraping real estar pronto.
 */
const supabase = require("./supabase");

const dadosExemplo = [
  { modelo: "Toyota Corolla XEi 2021", leiloeiro: "Sodre Santoro", estado: "SP", cidade: "Sao Paulo", lance_atual: "R$ 48.200", tipo: "Judicial", link_original: "https://www.sodresantoro.com.br/lote/1", fonte: "seed" },
  { modelo: "Honda Civic EXL 2020", leiloeiro: "VIP Leiloes", estado: "PR", cidade: "Curitiba", lance_atual: "R$ 44.900", tipo: "Extrajudicial", link_original: "https://www.vipleiloes.com.br/lote/2", fonte: "seed" },
  { modelo: "Onix LT 1.0 Turbo 2022", leiloeiro: "Sodre Santoro", estado: "MG", cidade: "Belo Horizonte", lance_atual: "R$ 39.100", tipo: "Extrajudicial", link_original: "https://www.sodresantoro.com.br/lote/3", fonte: "seed" },
  { modelo: "HB20 Vision 1.0 2021", leiloeiro: "Superbid", estado: "GO", cidade: "Goiania", lance_atual: "R$ 33.700", tipo: "Judicial", link_original: "https://www.superbid.net/lote/4", fonte: "seed" },
  { modelo: "Jeep Renegade Sport 2022", leiloeiro: "MGL Leiloes", estado: "RJ", cidade: "Rio de Janeiro", lance_atual: "R$ 67.400", tipo: "Judicial", link_original: "https://www.mglleiloes.com.br/lote/5", fonte: "seed" },
  { modelo: "Fiat Strada Freedom 2023", leiloeiro: "Milan Leiloes", estado: "RS", cidade: "Porto Alegre", lance_atual: "R$ 58.800", tipo: "Extrajudicial", link_original: "https://www.milan.com.br/lote/6", fonte: "seed" },
  { modelo: "Volkswagen Polo Highline 2022", leiloeiro: "Zukerman", estado: "SP", cidade: "Campinas", lance_atual: "R$ 41.500", tipo: "Extrajudicial", link_original: "https://www.zukerman.com.br/lote/7", fonte: "seed" },
  { modelo: "Chevrolet Tracker LTZ 2021", leiloeiro: "Freitas Leiloes", estado: "BA", cidade: "Salvador", lance_atual: "R$ 72.300", tipo: "Judicial", link_original: "https://www.freitasleiloes.com.br/lote/8", fonte: "seed" },
];

async function seedDados() {
  console.log("[Seed] Limpando dados antigos de seed...");
  await supabase.from("lotes").delete().eq("fonte", "seed");

  console.log("[Seed] Inserindo dados de exemplo...");
  const { error } = await supabase.from("lotes").insert(dadosExemplo);
  if (error) console.error("[Seed] Erro:", error.message);
  else console.log(`[Seed] ${dadosExemplo.length} lotes inseridos com sucesso!`);
}

module.exports = { seedDados };

// Permite rodar diretamente: node scraper/seed.js
if (require.main === module) {
  seedDados().then(() => process.exit(0)).catch(console.error);
}
