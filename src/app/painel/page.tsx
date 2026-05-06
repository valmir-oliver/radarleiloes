"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase";

type Lote = {
  id: string;
  modelo: string;
  leiloeiro: string;
  estado: string | null;
  cidade: string | null;
  lance_atual: string | null;
  tipo: string | null;
  data_encerramento: string | null;
  link_original: string | null;
  imagem: string | null;
};

const estados = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function formatarMoeda(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined) return "Sob consulta";
  const num = typeof valor === "string" ? parseFloat(valor.replace(/[^0-9.-]/g, "")) : valor;
  if (isNaN(num) || num === 0) return "Sob consulta";
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function PainelPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [verificando, setVerificando] = useState(true);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [carregandoLotes, setCarregandoLotes] = useState(true);
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [sidebarAberta, setSidebarAberta] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/entrar");
      } else {
        setEmail(data.session.user.email ?? "");
        setVerificando(false);
        // Busca lotes do banco
        supabase
          .from("lotes")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100)
          .then(({ data: rows }) => {
            setLotes((rows as Lote[]) ?? []);
            setCarregandoLotes(false);
          });
      }
    });
  }, [router]);

  async function handleSair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const resultados = lotes.filter((l) => {
    const okBusca = busca === "" || l.modelo.toLowerCase().includes(busca.toLowerCase()) || l.leiloeiro.toLowerCase().includes(busca.toLowerCase());
    const okEstado = estado === "" || l.estado === estado;
    const okTipo = tipo === "" || l.tipo === tipo;
    return okBusca && okEstado && okTipo;
  });

  if (verificando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] text-[#666666]">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111111]">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-[#e0e0e0] bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="block">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-[#e0e0e0] bg-[#f5f5f5] px-3 py-1 text-xs font-semibold text-[#666666] sm:inline">
              {email}
            </span>
            <button
              onClick={handleSair}
              className="rounded-full border border-[#e0e0e0] bg-white px-4 py-1.5 text-sm font-semibold text-[#111111] hover:bg-[#f5f5f5]"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* SIDEBAR */}
        <aside className={`${sidebarAberta ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-20 w-72 overflow-y-auto border-r border-[#e0e0e0] bg-white pt-20 transition-transform lg:static lg:translate-x-0 lg:block lg:w-64 lg:shrink-0 lg:pt-6 xl:w-72`}>
          <div className="px-4 pb-10">
            <p className="mb-4 flex items-center gap-1 text-xs font-bold tracking-[0.12em] text-[#111111]">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2M9 16h6" /></svg>
              FILTROS
            </p>

            {/* tipo tabs */}
            <div className="mb-4 flex gap-1 rounded-xl border border-[#e0e0e0] bg-[#f5f5f5] p-1">
              {["Todos", "Judicial", "Extrajudicial"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t === "Todos" ? "" : t)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                    (t === "Todos" && tipo === "") || tipo === t
                      ? "bg-white text-[#6B21E8] shadow-sm"
                      : "text-[#666666] hover:text-[#111111]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* busca */}
            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold text-[#111111]">Busca</label>
              <input
                type="text"
                placeholder="Modelo, marca ou leiloeiro"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-xl border border-[#e0e0e0] bg-[#f9f9f9] px-3 py-2 text-sm outline-none focus:border-[#6B21E8]"
              />
            </div>

            {/* estado */}
            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold text-[#111111]">Estado (UF)</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full rounded-xl border border-[#e0e0e0] bg-[#f9f9f9] px-3 py-2 text-sm outline-none focus:border-[#6B21E8]"
              >
                <option value="">Todos os estados</option>
                {estados.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>

            {/* leiloeiro */}
            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold text-[#111111]">Leiloeiro</label>
              <select className="w-full rounded-xl border border-[#e0e0e0] bg-[#f9f9f9] px-3 py-2 text-sm outline-none focus:border-[#6B21E8]">
                <option value="">Todos</option>
                {["Copart","VIP Leiloes","Sodre Santoro","Superbid","MGL Leiloes","Milan Leiloes","Freitas Leiloes","Zukerman"].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => { setBusca(""); setEstado(""); setTipo(""); }}
              className="mt-2 w-full rounded-xl border border-[#e0e0e0] py-2 text-xs font-semibold text-[#666666] hover:bg-[#f5f5f5]"
            >
              Limpar filtros
            </button>
          </div>
        </aside>

        {/* overlay mobile */}
        {sidebarAberta && (
          <div className="fixed inset-0 z-10 bg-black/30 lg:hidden" onClick={() => setSidebarAberta(false)} />
        )}

        {/* CONTEUDO PRINCIPAL */}
        <main className="flex-1 p-4 sm:p-6">
          {/* barra superior */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-[#e0e0e0] bg-white p-2 lg:hidden"
                onClick={() => setSidebarAberta(true)}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2" /></svg>
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6B21E8] px-3 py-1 text-xs font-bold text-white">
                {resultados.length} lotes
              </span>
              <span className="text-sm text-[#666666]">encontrados</span>
            </div>
            <select className="rounded-xl border border-[#e0e0e0] bg-white px-3 py-2 text-xs font-semibold text-[#111111] outline-none">
              <option>Preco: Menor</option>
              <option>Preco: Maior</option>
              <option>Mais recente</option>
            </select>
          </div>

          {/* grid de cards */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {carregandoLotes ? (
              <div className="col-span-3 py-20 text-center text-[#666666]">Carregando lotes...</div>
            ) : resultados.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-[#e0e0e0] bg-white shadow-sm transition-shadow hover:shadow-md">
                {/* imagem do veículo */}
                <div className="relative h-40 overflow-hidden bg-[#f0f0f0]">
                  {item.imagem ? (
                    <img
                      src={item.imagem}
                      alt={item.modelo}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.style.display = "none";
                        const fallback = img.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="h-full w-full items-center justify-center bg-[#f0f0f0]"
                    style={{ display: item.imagem ? "none" : "flex" }}
                  >
                    <svg className="h-16 w-16 text-[#cccccc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                  </div>
                  {item.data_encerramento && (
                    <span className="absolute right-2 top-2 rounded-full border border-[#e0e0e0] bg-white px-2 py-0.5 text-xs font-semibold text-[#666666]">
                      {new Date(item.data_encerramento).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <p className="text-sm font-bold leading-snug">{item.modelo}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-[#666666]">
                    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                    {item.cidade && `${item.cidade} - `}{item.estado ?? ""}
                  </p>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-[#666666]">Lance atual</p>
                      <p className="text-lg font-extrabold text-[#6B21E8]">{formatarMoeda(item.lance_atual)}</p>
                    </div>
                    {item.tipo && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.tipo === "Judicial" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                        {item.tipo}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-[#666666]">{item.leiloeiro}</span>
                    <a
                      href={item.link_original ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl bg-[#6B21E8] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#5a18c7]"
                    >
                      Ver leilao
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {resultados.length === 0 && (
            <div className="mt-20 text-center text-[#666666]">
              <p className="text-2xl font-extrabold">Nenhum resultado</p>
              <p className="mt-2 text-sm">Tente ajustar os filtros ou a busca.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
