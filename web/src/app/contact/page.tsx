import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import { sendContactMessage } from "./actions";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactează echipa PawfectPair. Suntem aici să te ajutăm.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 pb-24 md:pb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--foreground)" }}>Contact</h1>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
            Ai o întrebare, o problemă sau o sugestie? Suntem aici să te ajutăm.
          </p>

          {/* Info cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-8">
            {[
              { icon: "✉️", label: "Email", value: "contact@pawfectpair.app" },
              { icon: "💬", label: "Răspuns", value: "În 24–48 ore" },
              { icon: "🛡️", label: "Suport", value: "Lun–Vin, 9–18" },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-2xl border p-4 text-center"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
              >
                <p className="text-2xl mb-1">{c.icon}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{c.label}</p>
                <p className="text-sm mt-0.5" style={{ color: "var(--foreground)" }}>{c.value}</p>
              </div>
            ))}
          </div>

          {sent === "1" ? (
            <div
              className="rounded-2xl border p-8 text-center"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
            >
              <p className="text-3xl mb-3">✅</p>
              <p className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>Mesaj trimis!</p>
              <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
                Îți vom răspunde în cel mult 48 de ore la adresa de email furnizată.
              </p>
              <a
                href="/contact"
                className="inline-block mt-4 rounded-full px-5 py-2 text-sm font-semibold text-white"
                style={{ background: "var(--primary)" }}
              >
                Trimite alt mesaj
              </a>
            </div>
          ) : (
            <form
              action={sendContactMessage}
              className="rounded-2xl border p-6 flex flex-col gap-4"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
            >
              <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Trimite-ne un mesaj</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                    Numele tău <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    required
                    maxLength={120}
                    autoComplete="name"
                    placeholder="Ion Popescu"
                    className="w-full rounded-xl border px-3 py-2.5 text-sm bg-transparent"
                    style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={200}
                    autoComplete="email"
                    placeholder="email@exemplu.com"
                    className="w-full rounded-xl border px-3 py-2.5 text-sm bg-transparent"
                    style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Subiect</label>
                <input
                  name="subject"
                  maxLength={200}
                  placeholder="Ex: Problemă cu contul meu"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm bg-transparent"
                  style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                  Mesaj <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  maxLength={2000}
                  placeholder="Descrie problema sau întrebarea ta..."
                  className="w-full rounded-xl border px-3 py-2.5 text-sm bg-transparent resize-none"
                  style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                />
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Maxim 2000 caractere.</p>
              </div>

              <button
                type="submit"
                className="self-start rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--primary)" }}
              >
                Trimite mesajul
              </button>
            </form>
          )}
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
