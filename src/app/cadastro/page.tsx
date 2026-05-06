"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase";

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setCarregando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome_completo: nome } },
    });
    setCarregando(false);
    if (error) {
      setErro(error.message === "User already registered" ? "Este email ja esta cadastrado." : "Erro ao criar conta. Tente novamente.");
    } else {
      setSucesso(true);
    }
  }
  return (
    <div className="main-grid min-h-screen px-4 py-6 text-[#171222] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="top-nav mb-6 flex items-center justify-between rounded-2xl px-4 py-3">
          <Link href="/" className="block">
            <Logo size="sm" />
          </Link>
          <Link
            href="/entrar"
            className="rounded-full border border-[#d7cdef] bg-white px-4 py-2 text-sm font-semibold"
          >
            Ja tenho conta
          </Link>
        </header>

        <main className="grid gap-6 lg:grid-cols-12">
          <section className="fade-up lg:col-span-7">
            <p className="mb-4 inline-flex rounded-full border border-[#d7cdef] bg-white px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">
              NOVA ASSINATURA
            </p>
            <h1 className="hero-title text-[3.2rem] sm:text-[4.2rem]">
              CRIE SUA CONTA E
              <span className="block text-[#5E17EB]">GANHE 25 CONSULTAS</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-[#5b4f73]">
              Cadastre-se em minutos e prepare sua conta para receber o pagamento via Mercado Pago.
              Depois disso, o cliente ja entra no painel pronto para buscar carros.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">PACOTE INICIAL</p>
                <p className="mt-2 text-3xl font-extrabold">R$ 39,90</p>
                <p className="text-sm text-[#5b4f73]">1 ciclo de 25 consultas</p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">ATIVACAO</p>
                <p className="mt-2 text-3xl font-extrabold">Automatica</p>
                <p className="text-sm text-[#5b4f73]">apos confirmacao do pagamento</p>
              </div>
            </div>
          </section>

          <section className="fade-up-delay lg:col-span-5">
            <div className="glass-card rounded-3xl p-5 sm:p-6">
              <h2 className="text-2xl font-extrabold">Criar conta</h2>
              <p className="mt-1 text-sm text-[#5b4f73]">Preencha seus dados para continuar.</p>

              {sucesso ? (
                <div className="mt-5 rounded-2xl bg-green-50 border border-green-200 p-5 text-center">
                  <p className="text-lg font-extrabold text-green-700">Conta criada!</p>
                  <p className="mt-2 text-sm text-green-600">Verifique seu email para confirmar o cadastro. Depois e so entrar no painel.</p>
                  <Link href="/entrar" className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#6B21E8] px-6 py-2.5 font-bold text-white">
                    Ir para o login
                  </Link>
                </div>
              ) : (
                <form className="mt-5 space-y-3" onSubmit={handleCadastro}>
                  <label className="block text-sm font-semibold" htmlFor="nome">
                    Nome completo
                  </label>
                  <input
                    id="nome"
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#e0e0e0] bg-white px-3 py-2.5 outline-none focus:border-[#6B21E8]"
                  />

                  <label className="block pt-1 text-sm font-semibold" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#e0e0e0] bg-white px-3 py-2.5 outline-none focus:border-[#6B21E8]"
                  />

                  <label className="block pt-1 text-sm font-semibold" htmlFor="senha">
                    Senha
                  </label>
                  <input
                    id="senha"
                    type="password"
                    placeholder="Minimo 6 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#e0e0e0] bg-white px-3 py-2.5 outline-none focus:border-[#6B21E8]"
                  />

                  {erro && <p className="text-sm font-semibold text-red-600">{erro}</p>}

                  <button
                    type="submit"
                    disabled={carregando}
                    className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-[#6B21E8] px-4 py-2.5 text-center font-bold text-white disabled:opacity-60"
                  >
                    {carregando ? "Criando conta..." : "Criar conta e continuar"}
                  </button>
                </form>
              )}

              <p className="mt-4 text-center text-sm text-[#666666]">
                Ja possui acesso?{" "}
                <Link href="/entrar" className="font-bold text-[#6B21E8]">
                  Entrar agora
                </Link>
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
