import Link from "next/link";
import { createClient, getUser } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import { startPremiumCheckout, openBillingPortal } from "./actions";

const PROMO_CUTOFF = new Date("2026-12-30T23:59:59+02:00");

// Mirror al hasPremiumAccess din packages/shared/src/types/profile.ts —
// web nu are @pawfectpair/shared ca dependență, nu merită adăugată doar
// pentru această verificare de 3 linii.
function hasPremiumAccess(profile: { plan: string; plan_expires_at: string | null } | null): boolean {
  if (!profile || profile.plan !== "premium") return false;
  if (!profile.plan_expires_at) return true;
  return new Date(profile.plan_expires_at).getTime() > Date.now();
}

export const metadata = {
  title: "Planuri — Pet Care",
  description: "Planuri gratuite și Premium pentru useri, listări gratuite și Pro pentru furnizori (veterinari, pensiuni, traineri).",
};

const USER_FREE_MODULES = ["🆘 SOS", "🏠 Adopții", "🛍️ Magazin", "🩺 PetWell", "❤️ PetMatch"];
const USER_PREMIUM_MODULES = [
  "📅 Planner", "📡 GPS & Siguranță", "📚 PetEdu", "🎪 Evenimente", "👥 Comunitate",
  "🏡 Pensiuni", "🎓 Antrenament", "🔍 PetResQ", "🛡️ Asigurare", "🌸 Reproducere",
  "✈️ Pașaport", "📊 Analiză", "🌷 Memorial",
];

export default async function PlanuriPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; eroare?: string }>;
}) {
  const { checkout, eroare } = await searchParams;
  const supabase = await createClient();
  const user = await getUser();

  let profile: { plan: string; plan_source: string | null; plan_expires_at: string | null } | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("plan, plan_source, plan_expires_at").eq("id", user.id).single();
    profile = data;
  }

  const isPromoActive = new Date() < PROMO_CUTOFF;
  const premium = hasPremiumAccess(profile);

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Planuri</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Un plan simplu pentru stăpâni, unul simplu pentru furnizori de servicii.
          </p>

          {checkout === "succes" && (
            <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--success, #16A34A)", background: "var(--success-bg, #DCFCE7)" }}>
              <p className="font-semibold" style={{ color: "var(--success, #16A34A)" }}>✅ Abonare reușită — bine ai venit la Pet Care+!</p>
            </div>
          )}
          {checkout === "anulat" && (
            <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Plata a fost anulată — nu s-a reținut nimic.</p>
            </div>
          )}
          {eroare === "stripe_neconfigurat" && (
            <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--danger, #DC2626)", background: "var(--danger-bg, #FEE2E2)" }}>
              <p className="text-sm" style={{ color: "var(--danger, #DC2626)" }}>Plata online nu e disponibilă momentan. Încearcă mai târziu.</p>
            </div>
          )}

          {isPromoActive && (
            <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--primary)", background: "color-mix(in srgb, var(--primary) 8%, var(--card-bg))" }}>
              <p className="font-semibold" style={{ color: "var(--foreground)" }}>🎉 Lansare — Pet Care+ gratuit</p>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Oricine își creează cont până la <strong>30 decembrie 2026</strong> primește automat planul Pet Care+ gratuit,
                valabil până cel târziu <strong>1 iunie 2027</strong>. Niciun card necesar.
              </p>
            </div>
          )}

          {user && profile && (
            <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Planul tău curent</p>
              <p className="mt-1 text-lg font-bold" style={{ color: "var(--foreground)" }}>
                {premium ? "💎 Pet Care+" : "🆓 Gratuit"}
                {premium && profile.plan_expires_at && (
                  <span className="ml-2 text-sm font-normal" style={{ color: "var(--muted)" }}>
                    activ până la {new Date(profile.plan_expires_at).toLocaleDateString("ro-RO")}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Planuri useri */}
          <h2 className="mt-8 text-lg font-bold" style={{ color: "var(--foreground)" }}>Pentru stăpâni</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border p-5" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
              <p className="font-semibold" style={{ color: "var(--foreground)" }}>Gratuit</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: "var(--foreground)" }}>0€</p>
              <ul className="mt-3 space-y-1.5 text-sm" style={{ color: "var(--muted)" }}>
                {USER_FREE_MODULES.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border-2 p-5" style={{ borderColor: "var(--primary)", background: "var(--card-bg)" }}>
              <p className="font-semibold" style={{ color: "var(--primary)" }}>Pet Care+</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: "var(--foreground)" }}>19,99€<span className="text-sm font-normal" style={{ color: "var(--muted)" }}>/an</span></p>
              <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>Include tot ce e în Gratuit, plus:</p>
              <ul className="mt-3 space-y-1.5 text-sm" style={{ color: "var(--muted)" }}>
                {USER_PREMIUM_MODULES.map((m) => <li key={m}>{m}</li>)}
                <li>⭐ Prioritate la rezervări și notificări</li>
              </ul>
              {!user ? (
                <Link
                  href="/login"
                  className="mt-4 block w-full rounded-full px-5 py-2.5 text-center text-sm font-semibold"
                  style={{ background: "var(--primary)", color: "white" }}
                >
                  Conectează-te ca să te abonezi
                </Link>
              ) : premium ? (
                <form action={openBillingPortal}>
                  <button
                    type="submit"
                    className="mt-4 w-full rounded-full border px-5 py-2.5 text-sm font-semibold"
                    style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                  >
                    Gestionează abonamentul
                  </button>
                </form>
              ) : (
                <form action={startPremiumCheckout}>
                  <button
                    type="submit"
                    className="mt-4 w-full rounded-full px-5 py-2.5 text-sm font-semibold"
                    style={{ background: "var(--primary)", color: "white" }}
                  >
                    Abonează-te — 19,99€/an
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Planuri furnizori */}
          <h2 className="mt-10 text-lg font-bold" style={{ color: "var(--foreground)" }}>Pentru furnizori de servicii</h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Veterinari, pensiuni, traineri, magazine — listare gratuită, vizibilitate suplimentară cu Pro.</p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border p-5" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
              <p className="font-semibold" style={{ color: "var(--foreground)" }}>Listare de bază</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: "var(--foreground)" }}>0€</p>
              <ul className="mt-3 space-y-1.5 text-sm" style={{ color: "var(--muted)" }}>
                <li>Nume, adresă, telefon, categorie</li>
                <li>Apare în căutare și pe hartă</li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 p-5" style={{ borderColor: "var(--primary)", background: "var(--card-bg)" }}>
              <p className="font-semibold" style={{ color: "var(--primary)" }}>Pro</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: "var(--foreground)" }}>de la 9,99€<span className="text-sm font-normal" style={{ color: "var(--muted)" }}>/lună</span></p>
              <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>24,99€/lună pentru clinici/pensiuni cu mai mulți angajați</p>
              <ul className="mt-3 space-y-1.5 text-sm" style={{ color: "var(--muted)" }}>
                <li>✅ Badge &quot;Verificat&quot;</li>
                <li>📈 Prioritate în căutare și pe hartă</li>
                <li>📅 Acceptă rezervări prin aplicație</li>
                <li>📊 Statistici (vizualizări, apeluri, cereri)</li>
                <li>💬 Răspunde la recenzii</li>
              </ul>
              <button
                disabled
                className="mt-4 w-full rounded-full px-5 py-2.5 text-sm font-semibold opacity-50"
                style={{ background: "var(--primary)", color: "white" }}
                title="Necesită mai întâi revendicarea listării firmei tale (în curând)"
              >
                Devino furnizor Pro (în curând)
              </button>
            </div>
          </div>

          <p className="mt-6 text-xs" style={{ color: "var(--muted)" }}>
            Din 1 iunie 2027, toți utilizatorii și furnizorii vor alege explicit unul dintre planuri.
          </p>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
