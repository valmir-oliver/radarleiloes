/**
 * Inspeciona o login e API interna da Copart Brasil
 * Uso: node scraper/inspect-copart.js
 */
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

puppeteer.use(StealthPlugin());

const EMAIL = process.env.COPART_EMAIL;
const PASSWORD = process.env.COPART_PASSWORD;

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error("COPART_EMAIL e COPART_PASSWORD não encontrados no .env.local");
    process.exit(1);
  }

  console.log(`Fazendo login como: ${EMAIL}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );

  // Intercepta chamadas de rede após o login
  const apiCalls = [];
  page.on("response", async (res) => {
    const url = res.url();
    const ct = res.headers()["content-type"] || "";
    if (
      ct.includes("json") &&
      !url.includes("google") &&
      !url.includes("analytics") &&
      !url.includes("hotjar") &&
      !url.includes("facebook")
    ) {
      try {
        const body = await res.json();
        apiCalls.push({ url, status: res.status(), body });
        console.log(`[API] ${res.status()} ${url}`);
      } catch {}
    }
  });

  // 1. Abre a página de login
  console.log("\n[1] Abrindo página de login...");
  await page.goto("https://www.copart.com/login/", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  // Verifica se está na página correta
  const title = await page.title();
  console.log("Título:", title);
  const url = page.url();
  console.log("URL atual:", url);

  // 2. Tenta encontrar os campos de login
  console.log("\n[2] Procurando campos de login...");
  const inputs = await page.evaluate(() => {
    return [...document.querySelectorAll("input")].map((inp) => ({
      type: inp.type,
      id: inp.id,
      name: inp.name,
      placeholder: inp.placeholder,
    }));
  });
  console.log("Inputs encontrados:", JSON.stringify(inputs, null, 2));

  // 3. Faz o login
  console.log("\n[3] Preenchendo formulário...");
  try {
    // Tenta diferentes seletores comuns
    const emailSelectors = ["#username", "#email", "input[name='username']", "input[type='email']", "input[name='email']"];
    const passSelectors = ["#password", "input[name='password']", "input[type='password']"];

    let emailFilled = false;
    for (const sel of emailSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 3000 });
        await page.click(sel, { clickCount: 3 });
        await page.type(sel, EMAIL, { delay: 50 });
        console.log(`Email preenchido em: ${sel}`);
        emailFilled = true;
        break;
      } catch {}
    }

    if (!emailFilled) {
      console.log("AVISO: Campo de email não encontrado");
    }

    let passFilled = false;
    for (const sel of passSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 3000 });
        await page.click(sel, { clickCount: 3 });
        await page.type(sel, PASSWORD, { delay: 50 });
        console.log(`Senha preenchida em: ${sel}`);
        passFilled = true;
        break;
      } catch {}
    }

    if (!passFilled) {
      console.log("AVISO: Campo de senha não encontrado");
    }

    // Clica no botão de submit
    const submitSelectors = ["button[type='submit']", "#submit-btn", ".login-btn", "button.btn-primary"];
    for (const sel of submitSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 2000 });
        await page.click(sel);
        console.log(`Submit clicado em: ${sel}`);
        break;
      } catch {}
    }

    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
    console.log("URL após login:", page.url());

  } catch (e) {
    console.log("Erro no login:", e.message);
  }

  // 4. Navega para busca de veículos
  console.log("\n[4] Navegando para busca de veículos...");
  await page.goto("https://www.copart.com/vehicleFinderSection/?displayStr=BRAZIL&countryCode=BR", {
    waitUntil: "networkidle2",
    timeout: 30000,
  }).catch(() => {});

  await new Promise((r) => setTimeout(r, 3000));
  console.log("URL:", page.url());

  // 5. Mostra chamadas API capturadas
  console.log("\n[5] === CHAMADAS API CAPTURADAS ===");
  for (const call of apiCalls.slice(0, 20)) {
    const bodyStr = JSON.stringify(call.body).slice(0, 200);
    console.log(`\n${call.status} ${call.url}`);
    console.log("Body:", bodyStr);
  }

  await browser.close();
}

main().catch(console.error);
