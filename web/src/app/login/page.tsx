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

  return (
    <main className="flex-1 bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-black/40 backdrop-blur p-8 text-white">
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
      </div>
    </main>
  );
}
