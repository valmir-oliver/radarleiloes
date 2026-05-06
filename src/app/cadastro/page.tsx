import Link from "next/link";
import Logo from "@/components/Logo";

export default function CadastroPage() {
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

              <form className="mt-5 space-y-3">
                <label className="block text-sm font-semibold" htmlFor="nome">
                  Nome completo
                </label>
                <input
                  id="nome"
                  type="text"
                  placeholder="Seu nome"
                  className="w-full rounded-xl border border-[#d7cdef] bg-white px-3 py-2.5 outline-none"
                />

                <label className="block pt-1 text-sm font-semibold" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  className="w-full rounded-xl border border-[#d7cdef] bg-white px-3 py-2.5 outline-none"
                />

                <label className="block pt-1 text-sm font-semibold" htmlFor="senha">
                  Senha
                </label>
                <input
                  id="senha"
                  type="password"
                  placeholder="********"
                  className="w-full rounded-xl border border-[#d7cdef] bg-white px-3 py-2.5 outline-none"
                />

                <Link
                  href="/painel"
                  className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-[#5E17EB] px-4 py-2.5 text-center font-bold text-white"
                >
                  Criar conta e continuar
                </Link>
              </form>

              <p className="mt-4 text-center text-sm text-[#5b4f73]">
                Ja possui acesso?{" "}
                <Link href="/entrar" className="font-bold text-[#1A0B33]">
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
