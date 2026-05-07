"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Logo from "@/components/Logo";

// Interface para solicitações
interface Solicitacao {
  id: string;
  descricao: string;
  lote_id?: string;
  leiloeiro: string;
  link_original?: string;
  data_encerramento: string;
  solicitante_nome: string;
  solicitante_email: string;
  data_solicitacao: string;
  fonte: string;
  status: "Aberto" | "Em Análise" | "Concluído";
  analise_texto?: string;
  recomendacao?: "Aprovado" | "Aprovado com ressalvas" | "Reprovado";
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

export default function AreaAdministrativa() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(true);
  const [tabAtiva, setTabAtiva] = useState<"visao-geral" | "solicitacoes" | "destaque" | "oportunidades" | "usuarios">("visao-geral");

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroFonte, setFiltroFonte] = useState("");

  // Estado das Solicitações de Análise
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([
    {
      id: "sol-1",
      descricao: "BMW X3 XDRIVE20I M SPORT 2021",
      leiloeiro: "Fábio Zukerman",
      link_original: "https://www.zukermanleiloes.com.br/lote/bmw-x3-xdrive20i",
      data_encerramento: "19/06/2026",
      solicitante_nome: "Matheus Silva",
      solicitante_email: "matheus.silva@hotmail.com",
      data_solicitacao: "06/05/2026",
      fonte: "ZUKERMAN",
      status: "Aberto",
    },
    {
      id: "sol-2",
      descricao: "Toyota Corolla XEI 2.0 Flex automatico 2023",
      leiloeiro: "Calil Leilões",
      link_original: "https://www.calilleiloes.com.br/lote/toyota-corolla-xei-2023",
      data_encerramento: "03/06/2026",
      solicitante_nome: "Matheus Silva",
      solicitante_email: "matheus.silva@hotmail.com",
      data_solicitacao: "06/05/2026",
      fonte: "CALIL",
      status: "Aberto",
    },
    {
      id: "sol-3",
      descricao: "Honda HR-V Touring 1.5 Turbo automatico 2022",
      leiloeiro: "JR Leilões",
      link_original: "https://www.jrleiloes.com.br/lote/honda-hr-v-touring-2022",
      data_encerramento: "12/05/2026",
      solicitante_nome: "Matheus Silva",
      solicitante_email: "matheus.silva@hotmail.com",
      data_solicitacao: "06/05/2026",
      fonte: "JR LEILÕES",
      status: "Aberto",
    },
    {
      id: "sol-4",
      descricao: "Renault Kwid Intense 1.0 Flex Manual 2020",
      leiloeiro: "Hasta Pública",
      link_original: "https://www.hastapublica.com.br/lote/renault-kwid-intense-2020",
      data_encerramento: "11/06/2026",
      solicitante_nome: "Matheus Silva",
      solicitante_email: "matheus.silva@hotmail.com",
      data_solicitacao: "06/05/2026",
      fonte: "HASTA",
      status: "Aberto",
    },
    {
      id: "sol-5",
      descricao: "Toyota Corolla GLI 1.8 CVT automatico 2019",
      leiloeiro: "Fábio Zukerman",
      link_original: "https://www.zukermanleiloes.com.br/lote/toyota-corolla-gli-2019",
      data_encerramento: "08/06/2026",
      solicitante_nome: "Mayck Eduardo Nascimento",
      solicitante_email: "mayck.nascimento@gmail.com",
      data_solicitacao: "06/05/2026",
      fonte: "ZUKERMAN",
      status: "Aberto",
    },
    {
      id: "sol-6",
      descricao: "Fiat Palio Attractive 1.4 Fire Flex Manual 2016",
      leiloeiro: "Calil Leilões",
      link_original: "https://www.calilleiloes.com.br/lote/fiat-palio-attractive-2016",
      data_encerramento: "14/06/2026",
      solicitante_nome: "Rodrigo Alves",
      solicitante_email: "rodrigo.alves.eng@gmail.com",
      data_solicitacao: "05/05/2026",
      fonte: "CALIL",
      status: "Aberto",
    },
    {
      id: "sol-7",
      descricao: "Chevrolet Tracker Premier 1.2 Turbo automatico 2021",
      leiloeiro: "JR Leilões",
      link_original: "https://www.jrleiloes.com.br/lote/chevrolet-tracker-premier-2021",
      data_encerramento: "18/05/2026",
      solicitante_nome: "Jean Marcelo Araujo Trindade",
      solicitante_email: "jean.marcelo@advocacia.com.br",
      data_solicitacao: "05/05/2026",
      fonte: "JR LEILÕES",
      status: "Aberto",
    },
    {
      id: "sol-8",
      descricao: "BMW 320i M Sport active flex automatico 2023",
      leiloeiro: "Hasta Pública",
      link_original: "https://www.hastapublica.com.br/lote/bmw-320i-m-sport-2023",
      data_encerramento: "14/06/2026",
      solicitante_nome: "CELSO DOMINGOS BORTOLAN",
      solicitante_email: "celso.bortolan@gmail.com",
      data_solicitacao: "04/05/2026",
      fonte: "HASTA",
      status: "Concluído",
      recomendacao: "Aprovado",
      analise_texto: "Veículo em excelente estado estrutural e sem registros de leilões anteriores. Avaliação FIPE de R$ 265.000, com lance teto estimado de até R$ 195.000 para margem operacional limpa.",
    },
  ]);

  // Modais
  const [modalNovaAnaliseOpen, setModalNovaAnaliseOpen] = useState(false);
  const [modalAnaliseRequest, setModalAnaliseRequest] = useState<Solicitacao | null>(null);

  // Formulário do Modal de Análise
  const [analiseTexto, setAnaliseTexto] = useState("");
  const [recomendacao, setRecomendacao] = useState<"Aprovado" | "Aprovado com ressalvas" | "Reprovado">("Aprovado");
  const [analisandoIA, setAnalisandoIA] = useState(false);

  // Verificar Auth
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/entrar");
      } else {
        const userEmail = data.session.user.email;
        if (!isUserAdmin(userEmail)) {
          alert("Acesso Negado: Esta área é restrita aos administradores.");
          router.push("/painel");
        } else {
          setSessionUser(userEmail ?? "Administrador");
          setVerificando(false);
        }
      }
    });
  }, [router]);

  // Função para simular escrita da IA (Letter-by-letter typing animation)
  const handleAnalisarComIA = () => {
    if (!modalAnaliseRequest) return;
    setAnalisandoIA(true);
    setAnaliseTexto("");

    const modeloNome = modalAnaliseRequest.descricao;
    const leiloeiroNome = modalAnaliseRequest.leiloeiro;

    const textoCompleto = `ANÁLISE PERICIAL PREVENTIVA E MODELAGEM DE VALOR RADAR AI:

1. AVALIAÇÃO DO MODELO:
Veículo: ${modeloNome}
Origem do Leilão: ${leiloeiroNome}
Comportamento de Mercado: Liquidez histórica altíssima com depreciação controlada no mercado secundário. Margem média de revenda estimada entre 22% a 31% sobre a tabela FIPE.

2. HISTÓRICO DE RISCO (SCORE RADAR):
- Chassi e Identificadores: Nada consta. Integridade de gravação estrutural validada.
- Registro de Sinistro: Livre de apontamentos de colisão grave ou recuperação estrutural secundária.
- Roubo/Furto e Restrições Ativas: Sem gravame ativo ou registro de furto em aberto.

3. RECOMENDAÇÃO TÉCNICA DE LANCE:
- Preço Máximo Indicado (Teto de Arremate): Recomenda-se manter o limite de ofertas em até 70% da avaliação FIPE para compensação tributária e taxas administrativas.
- Status do Parecer: Recomendado para arremate sem restrições.`;

    let index = 0;
    const timer = setInterval(() => {
      if (index < textoCompleto.length) {
        setAnaliseTexto((prev) => prev + textoCompleto.charAt(index));
        index++;
      } else {
        clearInterval(timer);
        setAnalisandoIA(false);
      }
    }, 15);
  };

  // Salvar análise editada
  const handleSalvarAnalise = () => {
    if (!modalAnaliseRequest) return;
    
    setSolicitacoes((prev) =>
      prev.map((sol) =>
        sol.id === modalAnaliseRequest.id
          ? {
              ...sol,
              status: "Concluído",
              analise_texto: analiseTexto,
              recomendacao: recomendacao,
            }
          : sol
      )
    );
    setModalAnaliseRequest(null);
    setAnaliseTexto("");
  };

  // Filtragem de solicitações
  const solicitacoesFiltradas = solicitacoes.filter((sol) => {
    const okBusca = busca === "" || sol.descricao.toLowerCase().includes(busca.toLowerCase()) || sol.solicitante_nome.toLowerCase().includes(busca.toLowerCase());
    const okStatus = filtroStatus === "" || sol.status === filtroStatus;
    const okFonte = filtroFonte === "" || sol.fonte === filtroFonte;
    return okBusca && okStatus && okFonte;
  });

  if (verificando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f6] text-[#666666]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
          <p className="text-sm font-bold">Verificando credenciais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f6] text-[#111111] flex flex-col font-sans">
      
      {/* HEADER DA ÁREA ADMINISTRATIVA */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/painel" className="block shrink-0">
              <Logo size="sm" />
            </Link>
            
            {/* Abas de Navegação Superior (Conforme o Vídeo) */}
            <nav className="hidden lg:flex items-center gap-6">
              <button
                onClick={() => setTabAtiva("visao-geral")}
                className={`relative py-2 text-sm font-extrabold transition-colors ${
                  tabAtiva === "visao-geral" ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Visão Geral
                {tabAtiva === "visao-geral" && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 rounded-full animate-fade-in" />
                )}
              </button>
              
              <button
                onClick={() => setTabAtiva("solicitacoes")}
                className={`relative py-2 text-sm font-extrabold transition-colors ${
                  tabAtiva === "solicitacoes" ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Analisar solicitações
                {tabAtiva === "solicitacoes" && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 rounded-full animate-fade-in" />
                )}
              </button>

              <button
                onClick={() => setTabAtiva("destaque")}
                className={`relative py-2 text-sm font-extrabold transition-colors ${
                  tabAtiva === "destaque" ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Leilões em destaque
                {tabAtiva === "destaque" && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 rounded-full animate-fade-in" />
                )}
              </button>

              <button
                onClick={() => setTabAtiva("oportunidades")}
                className={`relative py-2 text-sm font-extrabold transition-colors ${
                  tabAtiva === "oportunidades" ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Boas oportunidades
                {tabAtiva === "oportunidades" && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 rounded-full animate-fade-in" />
                )}
              </button>

              <button
                onClick={() => setTabAtiva("usuarios")}
                className={`relative py-2 text-sm font-extrabold transition-colors ${
                  tabAtiva === "usuarios" ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Usuários
                {tabAtiva === "usuarios" && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 rounded-full animate-fade-in" />
                )}
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-indigo-600 tracking-wider uppercase">Área Administrativa</p>
              <p className="text-xs text-gray-500">{sessionUser}</p>
            </div>
            
            <Link
              href="/painel"
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
              Voltar ao Painel
            </Link>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL COM LAYOUT DAS ABAS */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8">
        
        {/* ABA 1: VISÃO GERAL */}
        {tabAtiva === "visao-geral" && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Visão Geral do Sistema</h2>
            
            {/* Linha de Indicadores de Usuários */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs relative overflow-hidden group">
                <div className="absolute top-0 left-0 h-1.5 w-full bg-blue-500" />
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">Total de Usuários</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <p className="text-3xl font-black text-gray-900">6.719</p>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">+12% este mês</span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1.5 w-full bg-indigo-500" />
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">Ativos (30 dias)</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <p className="text-3xl font-black text-gray-900">4.373</p>
                  <span className="text-[10px] text-gray-500">65% de engajamento</span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1.5 w-full bg-emerald-500" />
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">Ativos (7 dias)</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <p className="text-3xl font-black text-gray-900">1.688</p>
                  <span className="text-[10px] text-gray-500">25.8% de retorno</span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1.5 w-full bg-purple-500" />
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">Novos este mês</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <p className="text-3xl font-black text-gray-900">841</p>
                  <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-600">Meta: 1.000</span>
                </div>
              </div>
            </div>

            {/* Linha de Indicadores de Análises */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Análises Pendentes</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">161</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-2.5 text-amber-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Concluídas (mês)</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">888</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Leilões em Destaque</p>
                  <p className="text-2xl font-black text-blue-600 mt-1">2</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.243.577 1.835l-3.97 2.895a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.895a1 1 0 00-1.175 0l-3.97 2.895c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.895c-.783-.592-.383-1.835.57-1.835h4.907a1 1 0 00.95-.69l1.519-4.674z" /></svg>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Boas Oportunidades</p>
                  <p className="text-2xl font-black text-purple-600 mt-1">454</p>
                </div>
                <div className="rounded-xl bg-purple-50 p-2.5 text-purple-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
              </div>
            </div>

            {/* Desempenho dos Analistas & Detalhes */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-400">Desempenho dos Analistas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase font-extrabold tracking-wider">
                        <th className="py-3 px-2">Analista</th>
                        <th className="py-3 px-2">Análises Concluídas</th>
                        <th className="py-3 px-2">Avaliação Média</th>
                        <th className="py-3 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      <tr>
                        <td className="py-4.5 px-2 font-bold text-gray-900">William Gualberto</td>
                        <td className="py-4.5 px-2">492 pareceres</td>
                        <td className="py-4.5 px-2 text-emerald-600 font-extrabold">9.8/10</td>
                        <td className="py-4.5 px-2"><span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">Online</span></td>
                      </tr>
                      <tr>
                        <td className="py-4.5 px-2 font-bold text-gray-900">Luiz Antonio Macêdo</td>
                        <td className="py-4.5 px-2">396 pareceres</td>
                        <td className="py-4.5 px-2 text-emerald-600 font-extrabold">9.6/10</td>
                        <td className="py-4.5 px-2"><span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">Online</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-400">Recomendações do Mês</h3>
                <div className="flex flex-col items-center justify-center py-4">
                  {/* Gráfico radial simples simulado */}
                  <div className="relative h-28 w-28 flex items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-indigo-600 animate-dash" strokeWidth="3" strokeDasharray="75, 100" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute text-center">
                      <p className="text-2xl font-black text-gray-900">75%</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Aprovados</p>
                    </div>
                  </div>
                  <p className="mt-4 text-center text-xs text-gray-500 leading-relaxed">
                    A maior parte dos veículos inspecionados este mês obteve parecer técnico favorável.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: SOLICITAÇÕES DE ANÁLISE (EXATAMENTE COMO NO VÍDEO) */}
        {tabAtiva === "solicitacoes" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Solicitações de Análise</h2>
              <button 
                onClick={() => setModalNovaAnaliseOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 shadow-sm transition-colors"
              >
                + Nova Análise Independente
              </button>
            </div>

            {/* Grid Principal com Painel de Filtro Lateral e Tabela */}
            <div className="grid gap-6 lg:grid-cols-4 items-start">
              
              {/* Filtros de Busca Lateral (Conforme layout do vídeo) */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Filtrar Pedidos</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Buscar veículo ou usuário</label>
                    <input 
                      type="text" 
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Ex: Corolla, Matheus..." 
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-indigo-500 bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Status da Análise</label>
                    <select 
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-indigo-500 bg-gray-50"
                    >
                      <option value="">Todos</option>
                      <option value="Aberto">Aberto</option>
                      <option value="Em Análise">Em Análise</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Fonte / Origem</label>
                    <select 
                      value={filtroFonte}
                      onChange={(e) => setFiltroFonte(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-indigo-500 bg-gray-50"
                    >
                      <option value="">Todas</option>
                      <option value="ZUKERMAN">ZUKERMAN</option>
                      <option value="CALIL">CALIL</option>
                      <option value="JR LEILÕES">JR LEILÕES</option>
                      <option value="HASTA">HASTA</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={() => { setBusca(""); setFiltroStatus(""); setFiltroFonte(""); }}
                  className="w-full rounded-xl border border-gray-200 bg-white hover:bg-gray-50 py-2.5 text-xs font-bold text-gray-600 transition-colors"
                >
                  Limpar Filtros
                </button>
              </div>

              {/* Tabela Principal de Solicitações (Conforme layout do vídeo) */}
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden lg:col-span-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 uppercase font-black tracking-wider">
                        <th className="py-3 px-4">Descrição do Lote</th>
                        <th className="py-3 px-4">Encerramento</th>
                        <th className="py-3 px-4">Solicitante</th>
                        <th className="py-3 px-4">Fonte</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {solicitacoesFiltradas.map((sol) => (
                        <tr key={sol.id} className="hover:bg-gray-50/40 transition-colors">
                          <td className="py-4.5 px-4">
                            <p className="font-extrabold text-gray-900 leading-snug">{sol.descricao}</p>
                            {sol.recomendacao && (
                              <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider mt-1 rounded-full px-2 py-0.5 border ${
                                sol.recomendacao === "Aprovado" 
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                                  : sol.recomendacao === "Aprovado com ressalvas"
                                  ? "bg-amber-50 text-amber-600 border-amber-200"
                                  : "bg-rose-50 text-rose-600 border-rose-200"
                              }`}>
                                {sol.recomendacao}
                              </span>
                            )}
                          </td>
                          <td className="py-4.5 px-4 text-gray-500 font-semibold">{sol.data_encerramento}</td>
                          <td className="py-4.5 px-4">
                            <p className="font-bold text-gray-900 leading-tight">{sol.solicitante_nome}</p>
                            <p className="text-[10px] text-gray-400">{sol.solicitante_email}</p>
                          </td>
                          <td className="py-4.5 px-4">
                            <span className="rounded-md bg-amber-500/10 px-2 py-1 text-[9px] font-black uppercase text-amber-800 border border-amber-200/50">
                              {sol.fonte}
                            </span>
                          </td>
                          <td className="py-4.5 px-4">
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                              sol.status === "Aberto" 
                                ? "bg-gray-100 text-gray-600" 
                                : sol.status === "Em Análise"
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            }`}>
                              {sol.status}
                            </span>
                          </td>
                          <td className="py-4.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botão de Análise de Solicitação (O botão azul do vídeo que abre a análise de IA) */}
                              <button
                                onClick={() => {
                                  setModalAnaliseRequest(sol);
                                  setAnaliseTexto(sol.analise_texto ?? "");
                                  setRecomendacao(sol.recomendacao ?? "Aprovado");
                                }}
                                title="Análise com IA"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all hover:scale-105 active:scale-95"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              
                              {/* Botão de excluir */}
                              <button
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja excluir esta solicitação?")) {
                                    setSolicitacoes((prev) => prev.filter((s) => s.id !== sol.id));
                                  }
                                }}
                                title="Excluir solicitação"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all hover:scale-105 active:scale-95"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {solicitacoesFiltradas.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-500 font-semibold">
                            Nenhuma solicitação encontrada para os filtros aplicados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* OUTRAS ABAS SECUNDÁRIAS */}
        {tabAtiva === "destaque" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center animate-fade-in space-y-3">
            <svg className="h-12 w-12 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.243.577 1.835l-3.97 2.895a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.895a1 1 0 00-1.175 0l-3.97 2.895c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.895c-.783-.592-.383-1.835.57-1.835h4.907a1 1 0 00.95-.69l1.519-4.674z" /></svg>
            <h3 className="text-base font-black text-gray-900">Leilões em Destaque</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Gerencie os veículos expostos na vitrine inicial de lotes. Marque quais leilões ativos devem receber visibilidade premium.
            </p>
          </div>
        )}

        {tabAtiva === "oportunidades" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center animate-fade-in space-y-3">
            <svg className="h-12 w-12 mx-auto text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            <h3 className="text-base font-black text-gray-900">Boas Oportunidades</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Configuração de score AI automático baseado na relação preço de FIPE vs lance atual histórico.
            </p>
          </div>
        )}

        {tabAtiva === "usuarios" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center animate-fade-in space-y-3">
            <svg className="h-12 w-12 mx-auto text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <h3 className="text-base font-black text-gray-900">Controle de Usuários</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Consulte e edite permissões de assinantes VIP, controle de faturamento recorrente e bloqueio de usuários inadimplentes.
            </p>
          </div>
        )}
      </main>

      {/* MODAL: ANÁLISE DE SOLICITAÇÃO COMPLETO (EXATAMENTE COMO NO VÍDEO) */}
      {modalAnaliseRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs transition-all">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all scale-100 border border-gray-100 animate-scale-up">
            
            {/* Header com os dados de leilão e URL original */}
            <div className="bg-gradient-to-r from-[#1e40af] to-[#2563eb] px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black tracking-wide">Análise de solicitação</h3>
                  <p className="mt-1 text-xs text-blue-100 truncate max-w-2xl">
                    Leilão: <a href={modalAnaliseRequest.link_original ?? "#"} target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">{modalAnaliseRequest.link_original ?? "Nenhum link anexado"}</a>
                  </p>
                </div>
                <button 
                  onClick={() => setModalAnaliseRequest(null)}
                  className="rounded-full p-1.5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Corpo da Análise */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              <div className="bg-white p-4.5 rounded-2xl border border-gray-100 space-y-1 shadow-xs">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500">Veículo Solicitado</p>
                <h4 className="text-sm font-black text-gray-900 leading-snug">{modalAnaliseRequest.descricao}</h4>
                <p className="text-xs text-gray-500">Solicitante: <span className="font-semibold text-gray-800">{modalAnaliseRequest.solicitante_nome}</span> ({modalAnaliseRequest.solicitante_email})</p>
              </div>

              {/* Área do Editor de Rich Text Mockup (Conforme no vídeo) */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-[400px]">
                
                {/* Editor Toolbar */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex flex-wrap items-center gap-1">
                  <span className="text-xs font-bold text-gray-500 pr-2 border-r border-gray-200 mr-2">Normal</span>
                  
                  <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600 font-extrabold text-xs" title="Negrito">B</button>
                  <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600 italic text-xs" title="Itálico">I</button>
                  <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600 underline text-xs" title="Sublinhado">U</button>
                  
                  <span className="h-4 w-px bg-gray-200 mx-1.5" />
                  
                  {/* Link Icon */}
                  <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600" title="Inserir Link">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  </button>

                  {/* Bullet List Icon */}
                  <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600" title="Lista">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                  </button>
                </div>

                {/* Editor Textarea */}
                <textarea
                  value={analiseTexto}
                  onChange={(e) => setAnaliseTexto(e.target.value)}
                  placeholder="Escreva a resposta analítica aqui ou utilize o assistente pericial Radar AI abaixo..."
                  className="flex-1 w-full p-4 text-xs font-semibold leading-relaxed text-gray-700 outline-none resize-none bg-white font-mono"
                />

                {/* Dica de rodapé */}
                <div className="bg-gray-50 border-t border-gray-100 px-4 py-2 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold">Dica: Para manter a formatação, utilize as ferramentas acima para customizar o texto.</span>
                  {analisandoIA && (
                    <span className="text-[10px] text-indigo-600 font-bold animate-pulse flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-ping" />
                      Radar AI gerando laudo técnico...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer de ações (Idêntico ao Vídeo) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 bg-gray-50 px-6 py-4.5">
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Botão de Análise de IA com efeito mágico */}
                <button
                  onClick={handleAnalisarComIA}
                  disabled={analisandoIA}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-4.5 py-2.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  <span>✨</span>
                  Analisar com IA
                </button>

                {/* Dropdown de Recomendação */}
                <select
                  value={recomendacao}
                  onChange={(e) => setRecomendacao(e.target.value as any)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 outline-none focus:border-indigo-500 shadow-sm"
                >
                  <option value="Aprovado">Aprovado</option>
                  <option value="Aprovado com ressalvas">Aprovado com ressalvas</option>
                  <option value="Reprovado">Reprovado</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setModalAnaliseRequest(null)}
                  className="rounded-xl border border-gray-200 bg-white px-4.5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarAnalise}
                  className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-xs px-5 py-2.5 shadow-md active:scale-95 transition-all"
                >
                  Salvar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: NOVA ANÁLISE INDEPENDENTE */}
      {modalNovaAnaliseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-2xl animate-scale-up">
            <div className="bg-emerald-600 px-5 py-4 text-white flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider">Nova Análise Independente</h3>
              <button onClick={() => setModalNovaAnaliseOpen(false)} className="rounded-full p-1 hover:bg-white/10 text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Descrição / Modelo do Veículo</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Jeep Compass Longitude 2.0 TD 2022" 
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-emerald-500 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Link do Leilão Original</label>
                  <input 
                    type="text" 
                    placeholder="Ex: https://..." 
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-emerald-500 bg-gray-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Fonte</label>
                    <input 
                      type="text" 
                      placeholder="Ex: COPART" 
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-emerald-500 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Encerramento</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 24/05/2026" 
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-emerald-500 bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                <button 
                  onClick={() => setModalNovaAnaliseOpen(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    alert("Análise criada com sucesso na fila!");
                    setModalNovaAnaliseOpen(false);
                  }}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 shadow-md transition-all active:scale-95"
                >
                  Cadastrar Lote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
