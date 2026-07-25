"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } =
      mode === "signIn"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
          });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="relative flex-1 flex items-center justify-center overflow-hidden bg-dark p-4">
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center blur-md"
        style={{ backgroundImage: "url(/images/bg-source.png)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-dark/45" aria-hidden />

      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-black/50 backdrop-blur-md p-8 text-white">
        <h1 className="text-3xl font-bold text-center">
          {mode === "signIn" ? (
            <>
              Bine ai <span className="text-primary">revenit</span>
            </>
          ) : (
            <>
              Creează <span className="text-primary">cont</span>
            </>
          )}
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          {mode === "signUp" && (
            <input
              type="text"
              placeholder="Nume complet"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-full bg-white px-5 py-3 text-dark placeholder:text-zinc-400 outline-none"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full bg-white px-5 py-3 text-dark placeholder:text-zinc-400 outline-none"
            required
          />
          <input
            type="password"
            placeholder="Parolă"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full bg-white px-5 py-3 text-dark placeholder:text-zinc-400 outline-none"
            minLength={6}
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-3 font-semibold uppercase tracking-wide disabled:opacity-50"
          >
            {loading
              ? "Se procesează..."
              : mode === "signIn"
                ? "Intră în cont"
                : "Creează cont"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-zinc-400">
          <span className="h-px flex-1 bg-white/20" />
          sau
          <span className="h-px flex-1 bg-white/20" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-medium text-dark"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z" />
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
          </svg>
          Continuă cu Google
        </button>

        <button
          onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
          className="mt-6 w-full text-center text-sm text-zinc-300"
        >
          {mode === "signIn" ? (
            <>Nu ai cont? <span className="text-primary">Creează unul</span></>
          ) : (
            <>Ai deja cont? <span className="text-primary">Autentifică-te</span></>
          )}
        </button>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-zinc-400">
          Continuând, ești de acord cu{" "}
          <a href="/legal/termeni" className="underline">Termenii și condițiile</a>{" "}
          și{" "}
          <a href="/legal/confidentialitate" className="underline">
            Politica de confidențialitate
          </a>.
        </p>
      </div>
    </main>
  );
}
