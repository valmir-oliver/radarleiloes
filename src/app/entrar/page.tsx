"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase";

export default function EntrarPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      setErro("Email ou senha incorretos.");
    } else {
      router.push("/painel");
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
            href="/cadastro"
            className="rounded-full bg-[#5E17EB] px-4 py-2 text-sm font-semibold text-white"
          >
            Criar conta
          </Link>
        </header>

        <main className="grid gap-6 lg:grid-cols-12">
          <section className="fade-up lg:col-span-7">
            <p className="mb-4 inline-flex rounded-full border border-[#d7cdef] bg-white px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">
              ACESSO DO CLIENTE
            </p>
            <h1 className="hero-title text-[3.2rem] sm:text-[4.2rem]">
              VOLTE PARA O
              <span className="block text-[#5E17EB]">SEU PAINEL DE BUSCA</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-[#5b4f73]">
              Entre com seu email para continuar consultando modelos em varios leiloes e encontrar as melhores oportunidades.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">SALDO</p>
                <p className="mt-2 text-2xl font-extrabold">25</p>
                <p className="text-sm text-[#5b4f73]">consultas</p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">PLANO</p>
                <p className="mt-2 text-2xl font-extrabold">R$ 39,90</p>
                <p className="text-sm text-[#5b4f73]">ativo</p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#5b4f73]">RESPOSTA</p>
                <p className="mt-2 text-2xl font-extrabold">Rapida</p>
                <p className="text-sm text-[#5b4f73]">em segundos</p>
              </div>
            </div>
          </section>

          <section className="fade-up-delay lg:col-span-5">
            <div className="glass-card rounded-3xl p-5 sm:p-6">
              <h2 className="text-2xl font-extrabold">Entrar</h2>
              <p className="mt-1 text-sm text-[#5b4f73]">Use seu login para acessar o painel.</p>

              <form className="mt-5 space-y-3" onSubmit={handleLogin}>
                <label className="block text-sm font-semibold" htmlFor="email">
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
                  placeholder="********"
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
                  {carregando ? "Entrando..." : "Entrar no painel"}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-[#666666]">
                Ainda nao tem conta?{" "}
                <Link href="/cadastro" className="font-bold text-[#6B21E8]">
                  Criar agora
                </Link>
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
