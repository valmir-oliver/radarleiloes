import Link from "next/link";
import Logo from "@/components/Logo";

const sites = ["Copart", "Sodre Santoro", "VIP Leiloes", "Superbid", "MGL", "Freitas", "Milan", "Zukerman"];

const destaques = [
  { model: "Toyota Corolla XEi 2021", state: "SP", source: "Copart", lance: "R$ 48.200", tipo: "Extrajudicial" },
  { model: "Honda Civic EXL 2020", state: "PR", source: "VIP Leiloes", lance: "R$ 44.900", tipo: "Judicial" },
  { model: "Onix LT 1.0 Turbo 2022", state: "MG", source: "Sodre Santoro", lance: "R$ 39.100", tipo: "Extrajudicial" },
  { model: "HB20 Vision 2021", state: "GO", source: "Superbid", lance: "R$ 33.700", tipo: "Extrajudicial" },
  { model: "Jeep Renegade Sport 2022", state: "RJ", source: "MGL", lance: "R$ 67.400", tipo: "Judicial" },
  { model: "Strada Freedom 2023", state: "RS", source: "Milan", lance: "R$ 58.800", tipo: "Extrajudicial" },
];

const passos = [
  { num: "01", titulo: "Assine o plano", desc: "Pague R$ 39,90 via Mercado Pago e ative seu plano de 25 consultas mensais." },
  { num: "02", titulo: "Digite o modelo", desc: "No painel, informe o carro que procura. Ex.: Corolla XEi 2021 ou apenas Corolla." },
  { num: "03", titulo: "Receba os resultados", desc: "Retornamos oportunidades de varios leiloes em segundos, com lance atual e site de origem." },
  { num: "04", titulo: "Arremate com confianca", desc: "Acesse o link do leilao original e participe sabendo que encontrou o melhor preco." },
];

const faqs = [
  { q: "Como funciona o plano de consultas?", r: "Cada pesquisa de modelo consome 1 consulta do seu plano. Com o plano base voce tem 25 consultas por ciclo." },
  { q: "Quantos leiloes sao verificados?", r: "Nossa base reune ofertas de mais de 15 plataformas de leilao, atualizadas periodicamente por coletores automaticos." },
  { q: "Minhas consultas expiram?", r: "As consultas sao validas durante o ciclo contratado. Ao renovar o plano, voce recebe novas 25 consultas." },
  { q: "Posso buscar qualquer modelo de carro?", r: "Sim. Voce pode buscar por modelo, versao, ano ou apenas a marca. Ex.: Civic, Corolla 2022, HB20 Vision." },
  { q: "Os resultados sao em tempo real?", r: "Os dados sao atualizados em intervalos regulares. A maioria dos leiloes ativos aparece em ate 4 horas apos publicacao." },
  { q: "Como faco para arrematar?", r: "Nos retornamos o link direto do leilao original. O arremate e feito na plataforma do proprio leiloeiro." },
];

export default function Home() {
  return (
    <div className="main-grid min-h-screen text-[#171222]">
      {/* HEADER */}
      <header className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="top-nav flex items-center justify-between rounded-2xl px-4 py-3">
          <Logo size="sm" />
          <div className="hidden gap-2 sm:flex">
            <Link href="/entrar" className="rounded-full border border-[#d7cdef] px-4 py-2 text-sm font-semibold">
              Entrar
            </Link>
            <Link href="/cadastro" className="rounded-full bg-[#5E17EB] px-4 py-2 text-sm font-semibold text-white">
              Comecar agora
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">

        {/* HERO */}
        <div className="grid gap-8 lg:grid-cols-12">
          <section className="fade-up lg:col-span-7">
            <p className="mb-4 inline-flex items-center rounded-full border border-[#d7cdef] bg-white px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[#5b4f73]">
              +25 PLATAFORMAS DE LEILAO MONITORADAS
            </p>
            <h1 className="hero-title text-[3.4rem] sm:text-[4.8rem]">
              ENQUANTO OUTROS PROCURAM,
              <span className="block text-[#5E17EB]">VOCE JA ENCONTROU.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-[#5b4f73]">
              O Radar varre mais de 15 plataformas de leilao ao mesmo tempo. Voce digita o modelo,
              nos localizamos o lance. Rapido, simples e sem perder tempo em dezenas de sites.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">PLANO BASE</p>
                <p className="mt-2 text-3xl font-extrabold">R$ 39,90</p>
                <p className="text-sm text-[#5b4f73]">25 consultas por ciclo</p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">LEILOES</p>
                <p className="mt-2 text-3xl font-extrabold">+10 mil</p>
                <p className="text-sm text-[#5b4f73]">lotes monitorados</p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">RESPOSTA</p>
                <p className="mt-2 text-3xl font-extrabold">Rapida</p>
                <p className="text-sm text-[#5b4f73]">busca em segundos</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {sites.map((site) => (
                <span key={site} className="pill rounded-full px-3 py-1 text-sm font-medium">{site}</span>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/cadastro" className="inline-flex items-center justify-center rounded-xl bg-[#5E17EB] px-6 py-3 text-sm font-bold text-white">
                Comecar agora
              </Link>
              <Link href="/painel" className="inline-flex items-center justify-center rounded-xl border border-[#d7cdef] bg-white px-6 py-3 text-sm font-bold text-[#171222]">
                Ver demonstracao
              </Link>
            </div>
          </section>

          {/* MOCK PAINEL */}
          <section className="fade-up-delay lg:col-span-5">
            <div className="glass-card rounded-3xl p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">PAINEL DO CLIENTE</p>
                  <h2 className="text-2xl font-extrabold">Buscar automovel</h2>
                </div>

              </div>
              <div className="search-mock mt-5 rounded-2xl p-4">
                <label className="text-sm font-semibold">O que voce procura?</label>
                <input
                  className="mt-2 w-full rounded-xl border border-[#d7cdef] bg-white px-3 py-2 outline-none"
                  placeholder="Ex.: Corolla XEi 2021"
                  readOnly
                />
                <button className="mt-3 w-full rounded-xl bg-[#5E17EB] px-4 py-2.5 font-bold text-white">
                  Buscar agora
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {destaques.slice(0, 3).map((item) => (
                  <article key={item.model} className="rounded-xl border border-[#d7cdef] bg-white px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold">{item.model}</p>
                      <span className="rounded-full bg-[#DCC6FF] px-2 py-0.5 text-xs font-semibold text-[#1A0B33]">Ativo</span>
                    </div>
                    <p className="mt-1 text-xs text-[#5b4f73]">{item.source} - {item.state} - {item.lance}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* DESTAQUES */}
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">OPORTUNIDADES RECENTES</p>
              <h2 className="text-3xl font-extrabold">Leiloes em destaque</h2>
            </div>
            <Link href="/cadastro" className="hidden rounded-xl border border-[#d7cdef] bg-white px-4 py-2 text-sm font-semibold sm:block">
              Ver todos
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {destaques.map((item) => (
              <article key={item.model + item.source} className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold leading-snug">{item.model}</p>
                  <span className="shrink-0 rounded-full border border-[#d7cdef] px-2 py-0.5 text-xs text-[#5b4f73]">{item.tipo}</span>
                </div>
                <p className="mt-2 text-xs text-[#5b4f73]">{item.source} - {item.state}</p>
                <p className="mt-3 text-lg font-extrabold">{item.lance}</p>
                <Link href="/cadastro" className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#5E17EB] py-2 text-xs font-bold text-white">
                  Quero este carro
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="mt-16">
          <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">SIMPLES E RAPIDO</p>
          <h2 className="mt-1 text-3xl font-extrabold">Como funciona</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {passos.map((p) => (
              <article key={p.num} className="glass-card rounded-2xl p-4">
                <p className="hero-title text-5xl text-[#5E17EB]">{p.num}</p>
                <h3 className="mt-2 text-lg font-extrabold">{p.titulo}</h3>
                <p className="mt-1 text-sm text-[#5b4f73]">{p.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* CTA CENTRAL */}
        <section className="mt-16">
          <div className="glass-card rounded-3xl p-8 text-center sm:p-12">
            <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">COMECE HOJE</p>
            <h2 className="hero-title mt-2 text-[2.8rem] sm:text-[3.8rem]">
              ARREMATE O CARRO CERTO
              <span className="block text-[#5E17EB]">PELO MENOR LANCE</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-[#5b4f73]">
              Navegue entre mais de 10 mil leiloes ativos e encontre a oportunidade perfeita
              sem precisar visitar dezenas de sites.
            </p>
            <Link href="/cadastro" className="mt-7 inline-flex items-center justify-center rounded-xl bg-[#5E17EB] px-8 py-4 text-base font-bold text-white">
              Comecar agora
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">DUVIDAS FREQUENTES</p>
          <h2 className="mt-1 text-3xl font-extrabold">Perguntas frequentes</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {faqs.map((faq) => (
              <article key={faq.q} className="glass-card rounded-2xl p-4">
                <h3 className="text-sm font-bold">{faq.q}</h3>
                <p className="mt-2 text-sm text-[#5b4f73]">{faq.r}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-12 border-t border-[#d7cdef] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <Logo size="sm" />
              <p className="mt-3 text-sm text-[#5b4f73]">
                Simplificamos sua busca pelo leilao perfeito. Reunimos leiloes de automoveis
                de diversas plataformas em um so painel. Busca facil, arremate rapido.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">PLATAFORMA</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/cadastro" className="hover:text-[#5E17EB]">Criar conta</Link></li>
                <li><Link href="/entrar" className="hover:text-[#5E17EB]">Entrar</Link></li>
                <li><Link href="/painel" className="hover:text-[#5E17EB]">Demo do painel</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">LEGAL</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="#" className="hover:text-[#5E17EB]">Politica de privacidade</Link></li>
                <li><Link href="#" className="hover:text-[#5E17EB]">Termos de uso</Link></li>
                <li><Link href="#" className="hover:text-[#5E17EB]">Central de ajuda</Link></li>
              </ul>
            </div>
          </div>
          <p className="mt-8 border-t border-[#d7cdef] pt-6 text-center text-xs text-[#5b4f73]">
            2026 Radar Leiloes Auto - O arremate e realizado diretamente na plataforma do leiloeiro.
            O Radar nao se responsabiliza por transacoes comerciais realizadas nos sites de leilao.
          </p>
        </div>
      </footer>
    </div>
  );
}
