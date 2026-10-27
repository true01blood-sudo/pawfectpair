import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "PetGuardian — GPS & Siguranță",
  description: "Urmărire GPS în timp real, alerte de pierdere și siguranța animalului tău.",
};

export default async function GpsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pets } = await supabase
    .from("pets")
    .select("id, name, species, breed, photo_url")
    .eq("owner_id", user.id);

  // Last known location per pet
  const petIds = (pets ?? []).map((p) => p.id);
  let lastLocations: Record<string, { lat: number; lng: number; recorded_at: string } | null> = {};
  if (petIds.length > 0) {
    for (const petId of petIds) {
      const { data } = await supabase
        .from("pet_locations")
        .select("lat, lng, recorded_at")
        .eq("pet_id", petId)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      lastLocations[petId] = data;
    }
  }

  // Active lost pet alerts
  const { data: lostAlerts } = await supabase
    .from("lost_pet_alerts")
    .select("id, title, description, last_seen_location, last_seen_at, contact_phone, reward_info, status, pets(name, photo_url)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(10);

  const myAlerts = (lostAlerts ?? []).filter((_a) => false); // filtered from public list; in prod would filter by owner_id

  return (
    <>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              PetGuardian
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Localizare GPS, alerte pierdere și siguranța animalelor tale.
            </p>
          </div>
          <Link
            href="/sos"
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold"
            style={{ background: "#ef4444", color: "#fff" }}
          >
            🚨 SOS
          </Link>
        </div>

        {/* Pet GPS cards */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
            Animalele tale
          </h2>

          {pets && pets.length > 0 ? (
            <div className="space-y-3">
              {pets.map((pet) => {
                const loc = lastLocations[pet.id];
                const isOnline = loc
                  ? new Date().getTime() - new Date(loc.recorded_at).getTime() < 30 * 60 * 1000
                  : false;

                return (
                  <div
                    key={pet.id}
                    className="rounded-2xl border p-4"
                    style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                  >
                    <div className="flex items-center gap-3">
                      {pet.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pet.photo_url} alt={pet.name} className="h-12 w-12 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="h-12 w-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                          style={{ background: "#fff7ed" }}>
                          {pet.species === "Câine" ? "🐶" : pet.species === "Pisică" ? "🐱" : "🐾"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{pet.name}</p>
                          <span
                            className="flex h-2 w-2 rounded-full"
                            style={{ background: isOnline ? "#16a34a" : loc ? "#f59e0b" : "#9ca3af" }}
                          />
                          <span className="text-xs" style={{ color: "var(--muted)" }}>
                            {isOnline ? "Online" : loc ? "Ultima locație" : "Fără GPS"}
                          </span>
                        </div>
                        {loc ? (
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                            📍 {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)} ·{" "}
                            {new Date(loc.recorded_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        ) : (
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                            Instalează aplicația mobilă pentru GPS activ
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/gps/harta?pet=${pet.id}`}
                          className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                          style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                        >
                          Hartă
                        </Link>
                      </div>
                    </div>

                    {/* Quick GPS actions */}
                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/gps/traseu?pet=${pet.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                        style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
                      >
                        📍 Istoric traseu
                      </Link>
                      <Link
                        href={`/gps/alerta?pet=${pet.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition-colors hover:border-red-300 hover:text-red-500"
                        style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
                      >
                        🚨 Alertă pierdut
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-2xl border-2 border-dashed p-8 text-center"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
            >
              <div className="text-4xl mb-3">🐾</div>
              <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                Niciun animal înregistrat
              </p>
              <Link href="/animale/adauga" className="mt-3 inline-flex rounded-full bg-primary px-5 py-2 text-xs font-bold text-white">
                + Adaugă animal
              </Link>
            </div>
          )}
        </section>

        {/* Map preview placeholder */}
        <section className="mb-8">
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)", border: "1px solid #7dd3fc", height: 200 }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl mb-2">🗺️</div>
              <p className="font-bold text-sm" style={{ color: "#0369a1" }}>Hartă GPS interactivă</p>
              <p className="text-xs" style={{ color: "#0284c7" }}>Disponibilă în aplicația mobilă</p>
              <Link
                href="https://play.google.com/store/apps/details?id=app.pawfectpair.mobile"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 rounded-full px-4 py-1.5 text-xs font-bold"
                style={{ background: "#0284c7", color: "#fff" }}
              >
                Descarcă aplicația →
              </Link>
            </div>
            {/* Decorative map dots */}
            <div className="absolute top-8 left-12 h-4 w-4 rounded-full opacity-40" style={{ background: "#0ea5e9" }} />
            <div className="absolute top-16 right-16 h-3 w-3 rounded-full opacity-30" style={{ background: "#0ea5e9" }} />
            <div className="absolute bottom-12 left-24 h-5 w-5 rounded-full opacity-50" style={{ background: "#0ea5e9" }} />
          </div>
        </section>

        {/* Lost pet alerts */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Alerte animale pierdute
            </h2>
            <Link href="/gps/pierdute" className="text-xs font-medium text-primary hover:underline">
              Vezi toate →
            </Link>
          </div>

          {lostAlerts && lostAlerts.length > 0 ? (
            <div className="space-y-3">
              {lostAlerts.slice(0, 3).map((alert) => {
                const pet = alert.pets as unknown as { name: string; photo_url: string | null } | null;
                return (
                  <div
                    key={alert.id}
                    className="rounded-2xl border p-4"
                    style={{
                      background: "color-mix(in srgb, #ef4444 4%, var(--card-bg))",
                      borderColor: "color-mix(in srgb, #ef4444 20%, var(--card-border))",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-xl shrink-0"
                        style={{ background: "#fee2e2" }}>
                        🐾
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: "#fee2e2", color: "#ef4444" }}
                          >
                            PIERDUT
                          </span>
                        </div>
                        <p className="font-semibold text-sm mt-1" style={{ color: "var(--foreground)" }}>
                          {alert.title}
                        </p>
                        {alert.last_seen_location && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                            📍 Ultima vedere: {alert.last_seen_location}
                          </p>
                        )}
                        {alert.contact_phone && (
                          <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--primary)" }}>
                            📞 {alert.contact_phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-2xl border p-8 text-center"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Nicio alertă activă în zona ta
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                Comunitatea e în siguranță!
              </p>
            </div>
          )}
        </section>
      </main>
      <BottomNav />
    </>
  );
}
