import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import AppShell from "@/components/AppShell";
import { ANDROID_APP_URL } from "@/lib/appLinks";

export const metadata: Metadata = {
  title: "Explorare — PetCare",
  description: "Descoperă veterinari, magazine, antrenori, parcuri și servicii pet-friendly din zona ta.",
};

const CATEGORY_TABS = [
  { key: "all", label: "Toate", emoji: "🗺️" },
  { key: "vet", label: "Veterinari", emoji: "🏥" },
  { key: "shop", label: "Magazine", emoji: "🛍️" },
  { key: "trainer", label: "Antrenori", emoji: "🎓" },
  { key: "park", label: "Parcuri", emoji: "🌳" },
  { key: "hotel", label: "Hotel & Pensiune", emoji: "🏨" },
];

// Static demo locations — in production these come from DB with lat/lng
const DEMO_SERVICES = [
  {
    id: "v1", type: "vet", name: "Clinica Veterinară Dr. Ionescu",
    city: "Cluj-Napoca", address: "Str. Memorandumului 15", rating: 4.8,
    reviewCount: 124, phone: "0264-123456", openNow: true,
    tags: ["Urgențe 24/7", "Radiografie", "Chirurgie"],
    emoji: "🏥",
  },
  {
    id: "v2", type: "vet", name: "Vetclinic Paws & Care",
    city: "Cluj-Napoca", address: "Bd. Muncii 42", rating: 4.6,
    reviewCount: 87, phone: "0264-789012", openNow: true,
    tags: ["Dermatologie", "Cardiologie"],
    emoji: "🏥",
  },
  {
    id: "s1", type: "shop", name: "ZooMarket Premium",
    city: "Cluj-Napoca", address: "Calea Turzii 110", rating: 4.7,
    reviewCount: 203, phone: "0264-555111", openNow: true,
    tags: ["Hrană premium", "Accesorii", "Livrare"],
    emoji: "🛍️",
  },
  {
    id: "t1", type: "trainer", name: "Andrei Dumitrescu — Dog Trainer",
    city: "Cluj-Napoca", address: "Zona Mănăștur", rating: 5.0,
    reviewCount: 56, phone: "0722-345678", openNow: false,
    tags: ["Dresaj", "Agility", "Comportament"],
    emoji: "🎓",
  },
  {
    id: "p1", type: "park", name: "Parcul Feroviarilor — Zonă câini",
    city: "Cluj-Napoca", address: "Str. Fabricii 2", rating: 4.5,
    reviewCount: 312, phone: null, openNow: true,
    tags: ["Liber acces", "Fântână câini", "Împrejmuit"],
    emoji: "🌳",
  },
];

const SERVICE_LABELS: Record<string, string> = {
  dog_walking: "Plimbare", home_visits: "Vizite acasă", sitting_at_owner: "Sitting la tine",
  sitting_at_sitter: "Sitting la sitter", daycare: "Day care", boarding: "Pensiune", transport: "Transport",
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ tip?: string; oras?: string; q?: string }>;
}) {
  const { tip, oras, q } = await searchParams;
  const activeType = tip ?? "all";

  const supabase = await createClient();

  // Fetch real vets from DB
  const { data: vets } = await supabase
    .from("vets")
    .select("id, clinic_name, city, address, phone, bio")
    .order("clinic_name", { ascending: true })
    .limit(20);

  // Trainers from DB
  const { data: trainers } = await supabase
    .from("trainers")
    .select("id, display_name, city, rating, specializations, is_verified")
    .order("rating", { ascending: false })
    .limit(10);

  // Pet boarding / day care listings from DB
  const { data: listings } = await supabase
    .from("petday_listings")
    .select("id, title, city, address, phone, services, verified")
    .eq("active", true)
    .order("verified", { ascending: false })
    .limit(10);

  // Merge DB data with demo
  const dbVets = (vets ?? []).map((v) => ({
    id: v.id, type: "vet" as const,
    name: v.clinic_name, city: v.city ?? "România",
    address: v.address ?? "", rating: 4.5, reviewCount: 0,
    phone: v.phone, openNow: true,
    tags: v.bio ? [v.bio.slice(0, 30)] : ["Veterinar"],
    emoji: "🏥",
  }));

  const dbTrainers = (trainers ?? []).map((t) => ({
    id: t.id, type: "trainer" as const,
    name: t.display_name, city: t.city ?? "România",
    address: "", rating: Number(t.rating ?? 4.5), reviewCount: 0,
    phone: null, openNow: true,
    tags: (t.specializations as string[] ?? []).slice(0, 3),
    emoji: "🎓",
  }));

  const dbListings = (listings ?? []).map((l) => ({
    id: l.id, type: "hotel" as const,
    name: l.title, city: l.city ?? "România",
    address: l.address ?? "", rating: 0, reviewCount: 0,
    phone: l.phone, openNow: true,
    tags: (l.services as string[] ?? []).slice(0, 3).map((s) => SERVICE_LABELS[s] ?? s),
    emoji: "🏨",
  }));

  const allServices = [...dbVets, ...dbTrainers, ...dbListings, ...DEMO_SERVICES.filter(
    (s) => s.type !== "vet" && s.type !== "trainer" && s.type !== "hotel"
  )];

  const filtered = allServices.filter((s) => {
    if (activeType !== "all" && s.type !== activeType) return false;
    if (oras && !s.city.toLowerCase().includes(oras.toLowerCase())) return false;
    if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  function buildHref(params: { tip?: string; oras?: string; q?: string }) {
    const sp = new URLSearchParams();
    if (params.tip && params.tip !== "all") sp.set("tip", params.tip);
    if (params.oras) sp.set("oras", params.oras);
    if (params.q) sp.set("q", params.q);
    const qs = sp.toString();
    return qs ? `/explorare?${qs}` : "/explorare";
  }

  return (
    <>
    <AppShell>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Explorare
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Veterinari, magazine, antrenori, parcuri și servicii pet-friendly.
          </p>
        </div>

        {/* Search bar */}
        <form action="/explorare" method="GET" className="mb-5 flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base">🔍</span>
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Caută servicii, clinici, magazine..."
              className="w-full rounded-full border pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              style={{
                background: "var(--card-bg)",
                borderColor: "var(--card-border)",
                color: "var(--foreground)",
              }}
            />
            {activeType !== "all" && <input type="hidden" name="tip" value={activeType} />}
            {oras && <input type="hidden" name="oras" value={oras} />}
          </div>
          <button
            type="submit"
            className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Caută
          </button>
        </form>

        {/* Map placeholder */}
        <div
          className="mb-5 relative rounded-2xl overflow-hidden flex items-center justify-center"
          style={{ height: 160, background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)", border: "1px solid #7dd3fc" }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl mb-1">🗺️</div>
            <p className="font-bold text-sm" style={{ color: "#0369a1" }}>Hartă interactivă</p>
            <p className="text-xs" style={{ color: "#0284c7" }}>Disponibilă în aplicația mobilă</p>
          </div>
          {/* Decorative pins */}
          <div className="absolute top-6 left-16 text-xl">📍</div>
          <div className="absolute top-12 right-20 text-lg">📍</div>
          <div className="absolute bottom-8 left-1/3 text-xl">📍</div>
          <div className="absolute top-8 right-1/3 text-base">📍</div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
          {CATEGORY_TABS.map((cat) => (
            <Link
              key={cat.key}
              href={buildHref({ tip: cat.key, oras, q })}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: activeType === cat.key ? "var(--primary)" : "var(--card-bg)",
                borderColor: activeType === cat.key ? "var(--primary)" : "var(--card-border)",
                color: activeType === cat.key ? "#fff" : "var(--foreground)",
              }}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </Link>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          {filtered.length} rezultate{activeType !== "all" ? ` pentru „${CATEGORY_TABS.find(c => c.key === activeType)?.label}"` : ""}
        </p>

        {/* Service cards */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map((svc) => (
              <div
                key={svc.id}
                className="rounded-2xl border p-4 transition-shadow hover:shadow-md"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ background: "color-mix(in srgb, var(--primary) 8%, transparent)" }}
                  >
                    {svc.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: "var(--foreground)" }}>
                      {svc.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      📍 {svc.city}{svc.address ? `, ${svc.address}` : ""}
                    </p>
                  </div>
                </div>

                {/* Rating + status */}
                <div className="flex items-center gap-3 mb-3">
                  {svc.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                        {svc.rating.toFixed(1)}
                      </span>
                      {svc.reviewCount > 0 && (
                        <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                          ({svc.reviewCount})
                        </span>
                      )}
                    </div>
                  )}
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: svc.openNow ? "color-mix(in srgb, #16a34a 12%, transparent)" : "color-mix(in srgb, #6b7280 12%, transparent)",
                      color: svc.openNow ? "#16a34a" : "#6b7280",
                    }}
                  >
                    {svc.openNow ? "Deschis" : "Închis"}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {svc.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-2 py-0.5 text-[10px]"
                      style={{
                        background: "var(--surface)",
                        color: "var(--muted)",
                        border: "1px solid var(--card-border)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {svc.phone && (
                    <a
                      href={`tel:${svc.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                      style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
                    >
                      📞 Sună
                    </a>
                  )}
                  {svc.type === "vet" && (
                    <Link
                      href={`/veterinari/${svc.id}`}
                      className="flex-1 flex items-center justify-center rounded-xl border py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                      style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
                    >
                      Detalii →
                    </Link>
                  )}
                  {svc.type === "trainer" && (
                    <Link
                      href="/antrenament"
                      className="flex-1 flex items-center justify-center rounded-xl border py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                      style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
                    >
                      Vezi profil →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl border-2 border-dashed p-12 text-center"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
          >
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-semibold" style={{ color: "var(--foreground)" }}>
              Niciun rezultat găsit
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              Încearcă o altă categorie sau caută un alt nume.
            </p>
          </div>
        )}

        {/* CTA mobile */}
        <div
          className="mt-8 rounded-2xl border p-5 flex items-center gap-4"
          style={{
            background: "color-mix(in srgb, var(--primary) 5%, transparent)",
            borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
          }}
        >
          <span className="text-3xl shrink-0">📱</span>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
              Descoperă pe hartă în aplicația mobilă
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Hartă interactivă, filtrare pe rază, direcții GPS.
            </p>
          </div>
          <Link
            href={ANDROID_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white"
          >
            Descarcă →
          </Link>
        </div>
      </main>
    </AppShell>
    <BottomNav />
    </>
  );
}
