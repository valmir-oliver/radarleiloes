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

const ADMIN_EMAILS = [
  "valmirbc@gmail.com",
  "valmir-oliver@hotmail.com",
  "admin@radarleiloes.com",
  "suporte@radarleiloes.com"
];

function isUserAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const lowercaseEmail = email.toLowerCase().trim();
  return (
    ADMIN_EMAILS.includes(lowercaseEmail) ||
    lowercaseEmail.endsWith("@radarleiloes.com.br") ||
    lowercaseEmail.endsWith("@radarleiloes.com")
  );
}

function getPrecoNumerico(lance: string | null | undefined): number {
  if (!lance) return 45000;
  const num = parseFloat(lance.replace(/[^0-9.-]/g, ""));
  return isNaN(num) || num === 0 ? 45000 : num;
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
  const [ordenacao, setOrdenacao] = useState("preco-menor");
  const [sidebarAberta, setSidebarAberta] = useState(false);

  // Seleção e Análise Multi-Lotes (WhatsApp Desktop transfers/2026-19 feature requests)
  const [selectedLoteIds, setSelectedLoteIds] = useState<Set<string>>(new Set());
  const [lotesAtualizando, setLotesAtualizando] = useState<Set<string>>(new Set());
  
  // Modais de Controle
  const [analiseModalAberta, setAnaliseModalAberta] = useState(false);
  const [analisandoProgresso, setAnalisandoProgresso] = useState(0);
  const [analisandoStatus, setAnalisandoStatus] = useState("");
  const [analiseConcluida, setAnaliseConcluida] = useState(false);
  
  const [alertaLote, setAlertaLote] = useState<Lote | null>(null);
  
  const [solicitacaoLote, setSolicitacaoLote] = useState<Lote | null>(null);
  const [solicitacaoSucesso, setSolicitacaoSucesso] = useState(false);
  const [solicitacaoEnviando, setSolicitacaoEnviando] = useState(false);

  // Estados Reais para Persistência no Banco de Dados
  const [userSolicitacoes, setUserSolicitacoes] = useState<any[]>([]);
  const [laudoVisualizar, setLaudoVisualizar] = useState<any | null>(null);
  const [lanceMaximo, setLanceMaximo] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/entrar");
      } else {
        setEmail(data.session.user.email ?? "");
        setVerificando(false);
        // Busca todos os lotes do banco em páginas de 1000
        (async () => {
          const PAGE = 1000;
          let todos: Lote[] = [];
          let from = 0;
          while (true) {
            const { data: rows } = await supabase
              .from("lotes")
              .select("*")
              .order("created_at", { ascending: false })
              .range(from, from + PAGE - 1);
            if (!rows || rows.length === 0) break;
            todos = todos.concat(rows as Lote[]);
            if (rows.length < PAGE) break;
            from += PAGE;
          }
          setLotes(todos);
          setCarregandoLotes(false);

          // Busca as solicitações reais de análise deste usuário no Supabase
          const { data: sols } = await supabase
            .from("solicitacoes_analise")
            .select("*")
            .eq("solicitante_email", data.session.user.email);
          if (sols) {
            setUserSolicitacoes(sols);
          }
        })();
      }
    });
  }, [router]);

  async function handleSair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const resultados = lotes
    .filter((l) => {
      const okBusca = busca === "" || l.modelo.toLowerCase().includes(busca.toLowerCase()) || l.leiloeiro.toLowerCase().includes(busca.toLowerCase());
      const okEstado = estado === "" || l.estado === estado;
      const okTipo = tipo === "" || l.tipo === tipo;
      return okBusca && okEstado && okTipo;
    })
    .sort((a, b) => {
      if (ordenacao === "preco-menor") {
        return getPrecoNumerico(a.lance_atual) - getPrecoNumerico(b.lance_atual);
      } else if (ordenacao === "preco-maior") {
        return getPrecoNumerico(b.lance_atual) - getPrecoNumerico(a.lance_atual);
      } else if (ordenacao === "recente") {
        const dateA = a.data_encerramento ? new Date(a.data_encerramento.split("/").reverse().join("-")) : new Date(0);
        const dateB = b.data_encerramento ? new Date(b.data_encerramento.split("/").reverse().join("-")) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      }
      return 0;
    });

  const selectedLotes = lotes.filter((l) => selectedLoteIds.has(l.id));

  // Funções de Ação e Sincronização
  const toggleSelecionar = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedLoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRefreshLote = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLotesAtualizando((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      setLotesAtualizando((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1200);
  };

  const handleAlertaLote = (item: Lote, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAlertaLote(item);
  };

  const handleSolicitarAnalise = (item: Lote, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSolicitacaoLote(item);
    setSolicitacaoSucesso(false);
    setSolicitacaoEnviando(false);
  };

  const submitSolicitacao = async () => {
    if (!solicitacaoLote) return;
    setSolicitacaoEnviando(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("solicitacoes_analise")
      .insert({
        lote_id: solicitacaoLote.id,
        descricao_veiculo: solicitacaoLote.modelo,
        leiloeiro: solicitacaoLote.leiloeiro,
        link_original: solicitacaoLote.link_original,
        data_encerramento: solicitacaoLote.data_encerramento,
        solicitante_email: email,
        solicitante_nome: email.split("@")[0], // fallback name
        lance_maximo: parseFloat(lanceMaximo.replace(/[^0-9.-]/g, "")) || 0,
        observacoes_cliente: observacoes,
        status: "Aberto"
      });

    if (error) {
      console.error("Erro ao inserir solicitacao no banco:", error);
    } else {
      // Atualiza lista local
      const { data: sols } = await supabase
        .from("solicitacoes_analise")
        .select("*")
        .eq("solicitante_email", email);
      if (sols) {
        setUserSolicitacoes(sols);
      }

      setSolicitacaoSucesso(true);
      setLanceMaximo("");
      setObservacoes("");
      setTimeout(() => {
        setSolicitacaoLote(null);
        setSolicitacaoSucesso(false);
      }, 1500);
    }
    setSolicitacaoEnviando(false);
  };

  const handleAnalisarMultiples = () => {
    setAnaliseModalAberta(true);
    setAnalisandoProgresso(0);
    setAnalisandoStatus("Iniciando varredura...");
    setAnaliseConcluida(false);

    setTimeout(() => {
      setAnalisandoProgresso(25);
      setAnalisandoStatus("Consultando base de dados FIPE nacional...");
    }, 600);

    setTimeout(() => {
      setAnalisandoProgresso(55);
      setAnalisandoStatus("Varrendo histórico de leilões anteriores e sinistros...");
    }, 1200);

    setTimeout(() => {
      setAnalisandoProgresso(80);
      setAnalisandoStatus("Calculando depreciação de mercado e margem de lucro...");
    }, 1800);

    setTimeout(() => {
      setAnalisandoProgresso(100);
      setAnalisandoStatus("Relatório estruturado com sucesso!");
      setAnaliseConcluida(true);
    }, 2400);
  };

  const calcularDadosSimulados = (item: Lote) => {
    const precoAtual = getPrecoNumerico(item.lance_atual);
    let fipe = precoAtual * 1.45;
    let liquidez = "Alta";
    let scoreRisco = "Baixo Risco";
    let scoreColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
    let riscoMensagem = "Chassi sem adulteração, veículo recuperado de financiamento com procedência limpa. Excelente oportunidade de revenda.";

    if (item.modelo.toLowerCase().includes("corolla")) {
      fipe = 118000;
      liquidez = "Excelente (Altíssima procura)";
    } else if (item.modelo.toLowerCase().includes("velar")) {
      fipe = 338000;
      liquidez = "Média-Alta";
      scoreRisco = "Baixo Risco";
      scoreColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
      riscoMensagem = "Histórico limpo. Requer apenas verificação preventiva das bolsas da suspensão ativa antes do primeiro uso.";
    } else if (item.modelo.toLowerCase().includes("f-type")) {
      fipe = 425000;
      liquidez = "Moderada (Veículo de nicho)";
      scoreRisco = "Risco Moderado";
      scoreColor = "text-amber-600 bg-amber-50 border-amber-200";
      riscoMensagem = "Esportivo premium de alta cilindrada. Possui excelente margem de revenda, porém com maior tempo médio de pátio.";
    }

    const economia = fipe - precoAtual;
    const margemPercent = Math.round((economia / fipe) * 100);

    return { fipe, economia, margemPercent, liquidez, scoreRisco, scoreColor, riscoMensagem };
  };

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
            {isUserAdmin(email) && (
              <Link
                href="/area-administrativa"
                className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-4 py-1.5 text-xs font-bold text-indigo-700 transition-colors animate-pulse"
              >
                👑 Área Administrativa
              </Link>
            )}
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
            <select 
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="rounded-xl border border-[#e0e0e0] bg-white px-3 py-2 text-xs font-semibold text-[#111111] outline-none cursor-pointer hover:border-gray-300 transition-colors"
            >
              <option value="preco-menor">Preço: Menor</option>
              <option value="preco-maior">Preço: Maior</option>
              <option value="recente">Mais recente</option>
            </select>
          </div>

          {/* grid de cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {carregandoLotes ? (
              <div className="col-span-3 py-20 text-center text-[#666666]">Carregando lotes...</div>
            ) : resultados.map((item) => (
              <article 
                key={item.id} 
                className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                  selectedLoteIds.has(item.id) 
                    ? "border-[#6B21E8] ring-2 ring-[#6B21E8]/20" 
                    : "border-[#e0e0e0] hover:border-[#6B21E8]/40"
                }`}
              >
                {/* Botão de Seleção (No topo esquerdo do Card) */}
                <button
                  onClick={(e) => toggleSelecionar(item.id, e)}
                  className={`absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all shadow-md duration-200 ${
                    selectedLoteIds.has(item.id)
                      ? "bg-[#6B21E8] text-white opacity-100 scale-100"
                      : "bg-white/90 text-[#111111] border border-[#e0e0e0] hover:bg-white backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                  } ${selectedLoteIds.size > 0 ? "opacity-100" : ""}`}
                >
                  {selectedLoteIds.has(item.id) ? (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Selecionado
                    </>
                  ) : (
                    <>
                      <div className="h-3.5 w-3.5 rounded border border-[#cccccc] bg-transparent transition-colors group-hover:border-[#6B21E8]" />
                      Selecionar
                    </>
                  )}
                </button>

                {/* imagem do veículo */}
                <div className="relative h-44 overflow-hidden bg-[#f5f5f5]">
                  {item.imagem ? (
                    <img
                      src={item.imagem}
                      alt={item.modelo}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.style.display = "none";
                        const fallback = img.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback Sem Foto c/ Botão de Solicitação de Análise */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#f9f9f9] to-[#f0f0f0]"
                    style={{ display: item.imagem ? "none" : "flex" }}
                  >
                    <svg className="h-10 w-10 text-[#cccccc] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                    <button
                      onClick={(e) => handleSolicitarAnalise(item, e)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#1e40af] hover:bg-[#1d4ed8] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all duration-200 hover:scale-105"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Solicitar análise de veículo
                    </button>
                  </div>

                  {item.data_encerramento && (
                    <span className="absolute right-3 top-3 rounded-full border border-[#e0e0e0]/80 bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-[#111111] shadow-sm">
                      🕒 {new Date(item.data_encerramento).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                  )}

                  {/* Overlay de Sincronização Individual */}
                  {lotesAtualizando.has(item.id) && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                      <div className="flex flex-col items-center gap-2 text-white">
                        <svg className="h-8 w-8 animate-spin text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" /></svg>
                        <span className="text-xs font-bold tracking-wider">Sincronizando...</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <p className="text-sm font-bold leading-snug text-[#111111] line-clamp-1 group-hover:text-[#6B21E8] transition-colors">{item.modelo}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-[#666666]">
                    <svg className="h-3.5 w-3.5 shrink-0 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                    {item.cidade && `${item.cidade} - `}{item.estado ?? ""}
                  </p>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[#999999]">Lance atual</p>
                      <p className="text-lg font-extrabold text-[#6B21E8]">{formatarMoeda(item.lance_atual)}</p>
                    </div>
                    {item.tipo && (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                        item.tipo === "Judicial" 
                          ? "bg-amber-50 text-amber-700 border-amber-200" 
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {item.tipo}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#f0f0f0] flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#888888]">{item.leiloeiro}</span>
                    
                    <div className="flex items-center gap-1.5">
                      {/* Sincronização manual do lote individual */}
                      <button 
                        onClick={(e) => handleRefreshLote(item.id, e)}
                        title="Sincronizar dados"
                        className="rounded-xl border border-[#e0e0e0] bg-white p-2 text-[#666666] hover:bg-[#f5f5f5] hover:text-[#111111] transition-all hover:scale-105 active:scale-95"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" /></svg>
                      </button>

                      {/* Alerta/Verificação de risco do lote */}
                      <button 
                        onClick={(e) => handleAlertaLote(item, e)}
                        title="Histórico de risco"
                        className="rounded-xl border border-[#e0e0e0] bg-white p-2 text-[#666666] hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 transition-all hover:scale-105 active:scale-95"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      </button>

                      {/* Botão Dinâmico de Laudo Pericial Real / Banco de dados */}
                      {(() => {
                        const sol = userSolicitacoes.find((s) => s.lote_id === item.id);
                        if (!sol) {
                          return (
                            <button
                              onClick={(e) => handleSolicitarAnalise(item, e)}
                              title="Solicitar laudo pericial presencial"
                              className="rounded-xl border border-[#e0e0e0] bg-white p-2 text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </button>
                          );
                        }
                        
                        if (sol.status === "Aberto" || sol.status === "Em Análise") {
                          return (
                            <span 
                              title="Laudo pericial em andamento..."
                              className="inline-flex h-8 items-center gap-1 rounded-xl bg-amber-50 border border-amber-200 px-2.5 text-[10px] font-black text-amber-700 animate-pulse cursor-wait"
                            >
                              ⏳ Em Análise
                            </span>
                          );
                        }

                        return (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setLaudoVisualizar(sol);
                            }}
                            title="Visualizar laudo pericial concluído"
                            className="inline-flex h-8 items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 text-[10px] font-black text-emerald-700 hover:bg-emerald-100 transition-all hover:scale-105 active:scale-95 animate-pulse"
                          >
                            <span>🟢</span> Laudo Pronto
                          </button>
                        );
                      })()}

                      <a
                        href={item.link_original ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl bg-[#6B21E8] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#5a18c7] transition-all duration-200 hover:scale-105 shadow-sm"
                      >
                        Ver leilão
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                      </a>
                    </div>
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

          {/* BARRA FLUTUANTE DE SELEÇÃO COLETIVA (De acordo com WhatsApp Video transfers/2026-19) */}
          {selectedLoteIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-2 rounded-full border border-gray-300/80 bg-[#f3f4f6]/95 px-2.5 py-2 shadow-2xl backdrop-blur-md transition-all duration-300 animate-bounce-subtle">
              <button
                onClick={handleAnalisarMultiples}
                className="inline-flex items-center gap-2 rounded-full bg-[#1e40af] px-5 py-2.5 text-xs font-black text-white hover:bg-[#1d4ed8] active:scale-95 transition-all shadow-md"
              >
                {/* Ícone de documento/análise */}
                <svg className="h-4 w-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Analisar {selectedLoteIds.size} veículo{selectedLoteIds.size > 1 ? "s" : ""}
              </button>
              
              <button
                onClick={() => setSelectedLoteIds(new Set())}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-colors shadow-md"
                title="Limpar seleção"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          {/* MODAL: RELATÓRIO DE INTELIGÊNCIA ARTIFICIAL MULTI-VEÍCULOS */}
          {analiseModalAberta && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity duration-300">
              <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all scale-100 duration-300 border border-gray-100">
                
                {/* Header do Relatório */}
                <div className="relative bg-gradient-to-r from-[#1e40af] to-[#6B21E8] px-6 py-5 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-white/10 p-1.5 backdrop-blur-xs">
                        <svg className="h-5 w-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                      </div>
                      <h3 className="text-lg font-black tracking-wide">Relatório Analítico Radar AI</h3>
                    </div>
                    <button 
                      onClick={() => setAnaliseModalAberta(false)}
                      className="rounded-full p-1 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-blue-100">Análise de viabilidade financeira e precificação inteligente de lotes ativos</p>
                </div>

                {/* Fase 1: Sincronizando / Analisando */}
                {!analiseConcluida && (
                  <div className="flex flex-col items-center justify-center py-20 px-6">
                    <div className="relative flex items-center justify-center">
                      <div className="h-20 w-20 animate-spin rounded-full border-4 border-gray-100 border-t-[#6B21E8]" />
                      <div className="absolute flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                        <svg className="h-7 w-7 text-[#6B21E8] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                      </div>
                    </div>
                    <p className="mt-6 text-sm font-black tracking-wide text-gray-800">{analisandoStatus}</p>
                    
                    {/* Barra de progresso */}
                    <div className="mt-4 h-2 w-64 overflow-hidden rounded-full bg-gray-100 border border-gray-200">
                      <div 
                        className="h-full bg-gradient-to-r from-[#1e40af] to-[#6B21E8] transition-all duration-300"
                        style={{ width: `${analisandoProgresso}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Fase 2: Relatório Pronto */}
                {analiseConcluida && (
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Resumo das métricas */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100 p-4 text-center">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">Média de Economia</p>
                        <p className="mt-1 text-2xl font-black text-indigo-700">~ 42%</p>
                        <p className="text-[10px] text-indigo-600 mt-0.5">Abaixo da tabela FIPE</p>
                      </div>
                      <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100 p-4 text-center">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">Lucro Médio Estimado</p>
                        <p className="mt-1 text-2xl font-black text-emerald-700">R$ 54.200</p>
                        <p className="text-[10px] text-emerald-600 mt-0.5">Por lote arrematado</p>
                      </div>
                      <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-4 text-center">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-blue-500">Liquidez de Venda</p>
                        <p className="mt-1 text-2xl font-black text-blue-700">Excelente</p>
                        <p className="text-[10px] text-blue-600 mt-0.5">Modelos com alta busca</p>
                      </div>
                    </div>

                    {/* Detalhamento de cada Lote */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Detalhamento dos Veículos ({selectedLotes.length})</h4>
                      
                      {selectedLotes.map((lote) => {
                        const { fipe, economia, margemPercent, liquidez, scoreRisco, scoreColor, riscoMensagem } = calcularDadosSimulados(lote);
                        return (
                          <div key={lote.id} className="rounded-2xl border border-gray-100 p-4 hover:border-gray-200 transition-colors bg-gray-50/50 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex gap-3">
                                {lote.imagem ? (
                                  <img src={lote.imagem} alt={lote.modelo} className="h-12 w-16 object-cover rounded-lg border border-gray-200 shrink-0" />
                                ) : (
                                  <div className="h-12 w-16 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  </div>
                                )}
                                <div>
                                  <h5 className="text-sm font-black text-gray-900 leading-snug">{lote.modelo}</h5>
                                  <p className="text-xs text-gray-500">Fonte: {lote.leiloeiro}</p>
                                </div>
                              </div>
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${scoreColor}`}>
                                {scoreRisco}
                              </span>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-4 bg-white p-3 rounded-xl border border-gray-100 text-center">
                              <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Lance Atual</p>
                                <p className="text-sm font-extrabold text-[#6B21E8]">{formatarMoeda(lote.lance_atual)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Avaliação FIPE</p>
                                <p className="text-sm font-extrabold text-gray-800">{formatarMoeda(fipe.toString())}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Economia Direta</p>
                                <p className="text-sm font-extrabold text-emerald-600">-{margemPercent}% (-{formatarMoeda(economia.toString())})</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Lance Teto Indicado</p>
                                <p className="text-sm font-extrabold text-blue-600">{formatarMoeda((fipe * 0.75).toString())}</p>
                              </div>
                            </div>

                            <div className="flex gap-2 items-start text-xs bg-indigo-50/30 p-3 rounded-xl">
                              <span className="text-indigo-500 shrink-0">💡</span>
                              <p className="text-gray-700 leading-relaxed">
                                <span className="font-bold text-gray-900">Análise AI: </span>{riscoMensagem} <span className="font-semibold text-indigo-600">Liquidez de revenda: {liquidez}.</span>
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer das ações */}
                <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
                  <button 
                    onClick={() => setAnaliseModalAberta(false)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 active:scale-95 transition-all"
                  >
                    Fechar
                  </button>
                  {analiseConcluida && (
                    <button 
                      onClick={() => { window.print(); }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#6B21E8] px-4.5 py-2 text-xs font-bold text-white hover:bg-[#5a18c7] active:scale-95 transition-all shadow-md"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      Imprimir Relatório
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MODAL: HISTÓRICO DE RISCO (ALERTA INDIVIDUAL) */}
          {alertaLote && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-2xl animate-scale-up">
                <div className="bg-amber-500/10 border-b border-amber-100 px-5 py-4 flex items-center justify-between text-amber-800">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <h3 className="text-sm font-black uppercase tracking-wider">Histórico de Segurança do Veículo</h3>
                  </div>
                  <button onClick={() => setAlertaLote(null)} className="rounded-full p-1 hover:bg-amber-100/50 text-amber-700">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900 leading-snug">{alertaLote.modelo}</h4>
                    <p className="text-xs text-gray-500">Leiloeiro: {alertaLote.leiloeiro}</p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                      <span className="text-gray-500 font-medium">Histórico de Roubo/Furto</span>
                      <span className="font-extrabold text-emerald-600 flex items-center gap-1">🟢 Nada consta</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                      <span className="text-gray-500 font-medium">Registro de Sinistro / Danos</span>
                      <span className="font-extrabold text-emerald-600 flex items-center gap-1">🟢 Sem registro</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                      <span className="text-gray-500 font-medium">Histórico de Leilões Anteriores</span>
                      <span className="font-extrabold text-emerald-600 flex items-center gap-1">🟢 Passagem única</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                      <span className="text-gray-500 font-medium">Status de IPVA / Débitos</span>
                      <span className="font-extrabold text-amber-600 flex items-center gap-1">🟡 IPVA corrente a pagar</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-3 flex gap-2 text-xs text-amber-800">
                    <span className="shrink-0">📝</span>
                    <p className="leading-relaxed">
                      Este lote foi classificado como <span className="font-extrabold">Baixo Risco</span>. Recomenda-se apenas a vistoria padrão no pátio físico do leiloeiro ou contratação da análise pericial presencial Radar.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3.5">
                  <button 
                    onClick={() => setAlertaLote(null)}
                    className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-xs px-4 py-2 shadow-sm transition-colors"
                  >
                    Fechar Histórico
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: SOLICITAR ANÁLISE ESPECIALIZADA */}
          {solicitacaoLote && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-2xl animate-scale-up">
                
                {/* Header do modal */}
                <div className="bg-[#1e40af] px-5 py-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <h3 className="text-sm font-black uppercase tracking-wider">Laudo Pericial Presencial</h3>
                  </div>
                  <button onClick={() => setSolicitacaoLote(null)} className="rounded-full p-1 hover:bg-white/10 text-white/80">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {solicitacaoSucesso ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-pulse">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h4 className="text-base font-black text-gray-900">Solicitação Registrada!</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Nossa equipe técnica no local do leilão fará a verificação física deste veículo em até 24h. O laudo completo será enviado ao seu e-mail cadastrado.
                    </p>
                  </div>
                ) : (
                  <div className="p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-900 leading-snug">{solicitacaoLote.modelo}</h4>
                      <p className="text-xs text-gray-500">Fonte: {solicitacaoLote.leiloeiro}</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Lance Máximo Desejado (Teto)</label>
                        <input 
                          type="text" 
                          value={lanceMaximo}
                          onChange={(e) => setLanceMaximo(e.target.value)}
                          placeholder="Ex: R$ 85.000" 
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-blue-500 bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Observações / Pontos Críticos</label>
                        <textarea 
                          rows={3}
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          placeholder="Ex: Verificar possível vazamento de óleo ou marcas de repintura na coluna traseira..." 
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-blue-500 bg-gray-50"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-3 text-[11px] text-blue-800 flex gap-1.5 leading-relaxed">
                      <span>🔔</span>
                      <p>
                        A análise presencial inclui verificação estrutural (chassi, caixas de roda), teste de pintura por espessímetro digital e escaneamento do histórico de sinistro nacional.
                      </p>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                      <button 
                        onClick={() => setSolicitacaoLote(null)}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={submitSolicitacao}
                        disabled={solicitacaoEnviando}
                        className="inline-flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                      >
                        {solicitacaoEnviando ? "Processando..." : "Confirmar Solicitação"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODAL: EXIBIÇÃO DE LAUDO PERICIAL CONCLUÍDO */}
          {laudoVisualizar && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
              <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-2xl animate-scale-up">
                
                {/* Header do modal */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-emerald-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h3 className="text-sm font-black uppercase tracking-wider">Laudo Técnico Concluído</h3>
                  </div>
                  <button onClick={() => setLaudoVisualizar(null)} className="rounded-full p-1 hover:bg-white/10 text-white/80">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Verificado por Radar Leilões
                    </span>
                    <h4 className="text-base font-black text-gray-900 mt-2 leading-snug">{laudoVisualizar.descricao_veiculo}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Leiloeiro: {laudoVisualizar.leiloeiro}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Parecer do Analista</span>
                      <span className={`inline-flex items-center gap-1 mt-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                        laudoVisualizar.resultado_parecer === "Aprovado"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : laudoVisualizar.resultado_parecer === "Com ressalvas"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {laudoVisualizar.resultado_parecer === "Aprovado" ? "🟢 Aprovado" : laudoVisualizar.resultado_parecer === "Com ressalvas" ? "🟡 Com ressalvas" : "🔴 Reprovado"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lance Máximo Sugerido</span>
                      <span className="text-sm font-extrabold text-blue-700 block mt-1">
                        {formatarMoeda(laudoVisualizar.lance_maximo_sugerido || laudoVisualizar.lance_maximo)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400">Análise Detalhada Radar AI</span>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/80 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                      {laudoVisualizar.parecer_tecnico || "Nenhuma observação técnica fornecida pelo analista."}
                    </div>
                  </div>

                  {laudoVisualizar.analisado_em && (
                    <p className="text-[10px] text-gray-400 text-right font-medium">
                      Analisado em: {new Date(laudoVisualizar.analisado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
                  <button 
                    onClick={() => { window.print(); }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 active:scale-95 transition-all shadow-sm"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Imprimir Laudo
                  </button>
                  <button 
                    onClick={() => setLaudoVisualizar(null)}
                    className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-xs px-5 py-2 shadow-md transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
