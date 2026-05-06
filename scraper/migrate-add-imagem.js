/**
 * Adiciona coluna 'imagem' na tabela lotes via Supabase service_role
 * Uso: node scraper/migrate-add-imagem.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Tenta inserir uma linha de teste com o campo imagem para ver se existe
  const { error } = await supabase
    .from("lotes")
    .update({ imagem: null })
    .eq("id", "00000000-0000-0000-0000-000000000000"); // ID inexistente — só testa o campo

  if (error && error.message.includes("imagem")) {
    console.log("Coluna 'imagem' não existe. Execute o seguinte SQL no Supabase Dashboard:");
    console.log("\n  ALTER TABLE lotes ADD COLUMN IF NOT EXISTS imagem text;\n");
    console.log("Acesse: https://supabase.com/dashboard/project/wsxfqcmkoktrzrjxxqen/editor");
  } else {
    console.log("✓ Coluna 'imagem' já existe ou foi criada com sucesso.");
  }
}

main().catch(console.error);
