import type { Metadata } from "next";
import Link from "next/link";
import PageBanner from "@/components/PageBanner";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Suport",
  description: "Ai o întrebare sau o problemă? Suntem aici să te ajutăm.",
};

const faqs = [
  { q: "Cum adaug un animal în cont?", a: "Din Profil → Animalele mele → completează formularul de adăugare." },
  { q: "Cum șterg contul meu?", a: "Scrie-ne la contact@pawfectpair.app — procesăm cererea în maximum 30 de zile, conform GDPR." },
  { q: "Cum devin vânzător în Magazin?", a: "Din pagina Magazin, apasă butonul Devino vânzător — contul tău primește acces la administrarea produselor." },
  { q: "Cum înregistrez un cabinet veterinar?", a: "Din pagina Veterinari, apasă butonul Înregistrează cabinet și completează detaliile clinicii." },
];

export default function SuportPage() {
  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 lg:px-8 pb-24 md:pb-8">
          <PageBanner src="/images/pexels-suport.jpg" alt="Echipă de suport" title="Cu ce te putem ajuta?" />
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Ai o problemă legată de cont, o comandă sau o programare? Suntem aici.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <a
              href="mailto:contact@pawfectpair.app"
              className="card-hover flex min-h-11 flex-col items-center gap-2 rounded-2xl border p-6 text-center shadow-sm"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">✉️</span>
              <span className="font-semibold" style={{ color: "var(--foreground)" }}>Trimite-ne un email</span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>contact@pawfectpair.app</span>
            </a>
            <Link
              href="/forum"
              className="card-hover flex min-h-11 flex-col items-center gap-2 rounded-2xl border p-6 text-center shadow-sm"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">💬</span>
              <span className="font-semibold" style={{ color: "var(--foreground)" }}>Întreabă comunitatea</span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>Forum PawfectPair</span>
            </Link>
          </div>

          <section className="mt-10">
            <h2 className="mb-3 font-semibold" style={{ color: "var(--foreground)" }}>Întrebări frecvente</h2>
            <div className="flex flex-col gap-2">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className="rounded-xl border p-4 open:shadow-sm"
                  style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
                >
                  <summary className="cursor-pointer text-sm font-medium" style={{ color: "var(--foreground)" }}>{f.q}</summary>
                  <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
