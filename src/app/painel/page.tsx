import Link from "next/link";
import Logo from "@/components/Logo";

const resultados = [
  {
    modelo: "Toyota Corolla XEi 2021",
    leiloeiro: "Copart",
    estado: "SP",
    lance: "R$ 48.200",
    atualizacao: "ha 3 min",
  },
  {
    modelo: "Honda Civic EXL 2020",
    leiloeiro: "VIP Leiloes",
    estado: "PR",
    lance: "R$ 44.900",
    atualizacao: "ha 7 min",
  },
  {
    modelo: "Onix LT 1.0 Turbo 2022",
    leiloeiro: "Sodre Santoro",
    estado: "MG",
    lance: "R$ 39.100",
    atualizacao: "ha 12 min",
  },
  {
    modelo: "HB20 Vision 2021",
    leiloeiro: "Superbid",
    estado: "GO",
    lance: "R$ 33.700",
    atualizacao: "ha 18 min",
  },
];

export default function PainelPage() {
  return (
    <div className="main-grid min-h-screen px-4 py-6 text-[#171222] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="top-nav mb-6 flex items-center justify-between rounded-2xl px-4 py-3">
          <Link href="/" className="block">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-2">
<span className="rounded-full border border-[#d7cdef] bg-white px-3 py-1 text-xs font-semibold text-[#5b4f73]">
              24 consultas restantes
            </span>
            <Link href="/" className="rounded-full bg-[#1A0B33] px-4 py-2 text-sm font-semibold text-white">
              Sair
            </Link>
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-12">
          <section className="fade-up lg:col-span-8">
            <div className="glass-card rounded-3xl p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">
                    BUSCA UNIFICADA
                  </p>
                  <h1 className="text-3xl font-extrabold">Consultar automovel</h1>
                </div>
                <span className="rounded-full bg-[#5E17EB] px-3 py-1 text-xs font-semibold text-white">
                  1 consulta por pesquisa
                </span>
              </div>

              <div className="search-mock mt-5 rounded-2xl p-4">
                <label className="text-sm font-semibold" htmlFor="busca">
                  Modelo, versao ou palavra-chave
                </label>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    id="busca"
                    className="rounded-xl border border-[#d7cdef] bg-white px-3 py-2.5 outline-none"
                    placeholder="Ex.: Corolla XEi 2021"
                    defaultValue="Corolla XEi 2021"
                  />
                  <button className="rounded-xl bg-[#5E17EB] px-4 py-2.5 font-bold text-white">
                    Buscar agora
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {resultados.map((item) => (
                  <article
                    key={`${item.modelo}-${item.leiloeiro}`}
                    className="rounded-xl border border-[#d7cdef] bg-white px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold">{item.modelo}</p>
                      <span className="rounded-full bg-[#DCC6FF] px-2 py-0.5 text-xs font-semibold text-[#1A0B33]">
                        {item.atualizacao}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#5b4f73]">
                      {item.leiloeiro} · {item.estado}
                    </p>
                    <p className="mt-2 text-sm font-semibold">Lance atual: {item.lance}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <aside className="fade-up-delay space-y-3 lg:col-span-4">
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">SEU PLANO</p>
              <p className="mt-2 text-3xl font-extrabold">R$ 39,90</p>
              <p className="text-sm text-[#5b4f73]">Ciclo atual com 25 consultas</p>
            </div>

            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">HISTORICO</p>
              <p className="mt-2 text-3xl font-extrabold">01</p>
              <p className="text-sm text-[#5b4f73]">consulta usada hoje</p>
            </div>

            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">PROXIMA ETAPA</p>
              <p className="mt-2 text-sm text-[#5b4f73]">
                Integrar Mercado Pago para renovacao automatica e Supabase para salvar historico real
                de consultas.
              </p>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
