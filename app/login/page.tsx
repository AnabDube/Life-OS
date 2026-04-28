import LoginForm from "./LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith("/") ? next : undefined;

  return (
    <main className="relative z-[1] flex min-h-[100dvh] items-center justify-center px-5 py-12">
      <div className="w-full max-w-[400px]">
        <p className="mb-3 text-center font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.22em] text-gold opacity-90">
          Bismillah-ir-Rahman-ir-Rahim
        </p>
        <h1 className="text-center font-[family-name:var(--font-display)] text-[44px] font-semibold leading-none text-fg">
          Life <span className="text-green">OS</span>
        </h1>
        <p className="mt-3 mb-9 text-center text-sm text-fg-mid">
          Your daily companion — faith, work, trading, and goals.
        </p>

        <LoginForm next={safeNext} />

        {error ? (
          <p
            role="alert"
            className="mt-4 text-center text-xs text-[#f87171]"
          >
            {error === "missing_code"
              ? "That sign-in link was incomplete. Please request a new one."
              : error === "exchange_failed"
                ? "That sign-in link has expired. Please request a new one."
                : "Something went wrong. Please request a new link."}
          </p>
        ) : null}

        <p className="mt-10 text-center text-[11px] text-fg-dim">
          We&apos;ll email you a one-tap sign-in link. No password needed.
        </p>
      </div>
    </main>
  );
}
