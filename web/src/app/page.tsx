import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { PetPlaceholder } from "@/components/PawPlaceholder";
import { getT, type Locale } from "@/lib/i18n";
import AppSidebar from "@/components/AppSidebar";
import SocialFeed from "@/components/SocialFeed";
import HomePetWidget from "@/components/HomePetWidget";

const CATEGORY_HREFS = ["/veterinari", "/adoptii", "/magazin", "/sos", "/educatie", "/comunitate", "/resq", "/sos"];
const CATEGORY_EMOJIS = ["🩺", "🐾", "🛒", "📍", "🏋️", "💬", "🔍", "🚨"];

const PROMISE_META = [
  { emoji: "🏥", modules: ["PetWell", "Programări", "PetPlanner", "PetEdu"], href: "/programari", bg: "#fff7ed", accent: "#fa871b", border: "#fdd9b0" },
  { emoji: "🛡️", modules: ["PetGuardian", "PetSOS", "PetResQ"], href: "/sos", bg: "#1a1a1a", accent: "#fa871b", border: "#333", dark: true },
  { emoji: "🩺", modules: ["Veterinari", "PetTraining", "PetDay"], href: "/veterinari", bg: "#f0faf4", accent: "#16a34a", border: "#bbf7d0" },
  { emoji: "🛒", modules: ["PetMarket", "PetLegacy"], href: "/magazin", bg: "#f5f3ff", accent: "#7c3aed", border: "#ddd6fe" },
];

const PROFILE_EMOJIS = ["💉", "⚖️", "📋", "📅"];

const plusFeatures = [
  { emoji: "📍", text: "GPS activ + istoric trasee" },
  { emoji: "🏥", text: "Sănătate extinsă + analize AI" },
  { emoji: "🩺", text: "Beneficii la veterinari parteneri" },
  { emoji: "🛒", text: "Oferte exclusive PetMarket" },
  { emoji: "📋", text: "Dosare medicale nelimitate" },
  { emoji: "🔔", text: "Alerte prioritare PetSOS" },
];

export default async function Home() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value ?? "ro") as Locale;
  const t = getT(locale);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: listings } = await supabase
    .from("adoption_listings")
    .select("id, name, species, breed, city, photo_url")
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(6);

  let petProfile = null;
  let nextAppointment = null;
  if (user) {
    const { data: pet } = await supabase
      .from("pets")
      .select("id, name, species, breed, birth_date, photo_url")
      .eq("owner_id", user.id)
      .limit(1)
      .single();
    petProfile = pet;

    if (pet) {
      const { data: appt } = await supabase
        .from("appointments")
        .select("id, scheduled_at, status, notes, vet_id")
        .eq("pet_id", pet.id)
        .gte("scheduled_at", new Date().toISOString())
        .neq("status", "cancelled")
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      nextAppointment = appt;
    }
  }

  // ── AppShell layout for authenticated users ──
  if (user) {
    const userName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "tu";
    const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;
    return (
      <>
        <div className="h-full flex overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto min-h-0">
            <SocialFeed userName={userName} avatarUrl={avatarUrl} />
          </main>
          <aside
            className="w-72 shrink-0 hidden xl:block overflow-y-auto border-l"
            style={{ borderColor: "var(--card-border)" }}
          >
            <HomePetWidget pet={petProfile} nextAppointment={nextAppointment} userName={userName} />
          </aside>
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <main className="flex-1 pb-24 md:pb-0" style={{ background: "var(--background)" }}>

        {/* ── HERO ── */}
        <section style={{ background: "var(--background)" }} className="border-b">
          <div className="mx-auto max-w-6xl px-4 pt-10 pb-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">
                  {t.hero.badge}
                </p>
                <h1 className="font-heading text-4xl font-extrabold leading-tight text-dark sm:text-5xl lg:text-6xl">
                  {t.hero.title}
                  <br />
                  <span className="text-primary">{t.hero.accent}</span>,
                  <br />
                  {t.hero.titleEnd.split("\n")[1]}
                </h1>
                <p className="mt-4 text-lg text-zinc-500">
                  {t.hero.subtitle}
                </p>

                {/* Search bar */}
                <div className="mt-6 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
                  <svg className="ml-2 h-5 w-5 shrink-0 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder={t.hero.searchPlaceholder}
                    className="flex-1 bg-transparent text-sm text-dark placeholder-zinc-400 outline-none"
                  />
                  <Link
                    href="/adoptii"
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark transition-colors shrink-0"
                  >
                    {t.hero.searchBtn}
                  </Link>
                </div>

                {/* CTAs */}
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="https://play.google.com/store/apps/details?id=app.pawfectpair.mobile"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                    style={{ background: "#111827" }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.18 23.76a2 2 0 0 0 2.9.29l9.66-9.66-2.9-2.9-9.66 9.37zM20.65 9.54l-3.37-1.94-3.24 3.17 3.24 3.17 3.4-1.96a1.72 1.72 0 0 0 0-2.44zm-17.47-7.3a2 2 0 0 0-.32 1.1v18.32a2 2 0 0 0 .32 1.09l.08.08 10.26-10.26v-.24L3.26 2.16zm9.85 6.9 2.9 2.9-9.85 9.58a2.03 2.03 0 0 1-2.6.06z"/>
                    </svg>
                    {t.hero.downloadAndroid}
                  </a>
                  {!user && (
                    <Link
                      href="/login"
                      className="inline-flex items-center rounded-2xl border-2 border-primary px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      {t.hero.createAccount}
                    </Link>
                  )}
                </div>
              </div>

              {/* Right: Pet card sau imagine */}
              <div className="relative flex justify-center lg:justify-end">
                {petProfile ? (
                  /* Pet profile card for logged-in users */
                  <div className="w-full max-w-sm rounded-3xl border p-6 shadow-md" style={{ background: "var(--card-bg)" }}>
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Animalul tău</p>
                      <Link href="/animale" className="text-xs text-zinc-400 hover:text-primary">Gestionează →</Link>
                    </div>
                    <div className="flex items-center gap-3 py-3 border-b">
                      {petProfile.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={petProfile.photo_url} alt={petProfile.name} className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-2xl">🐾</div>
                      )}
                      <div>
                        <p className="font-bold text-dark">{petProfile.name}</p>
                        <p className="text-sm text-zinc-400">{petProfile.breed || petProfile.species}</p>
                      </div>
                      <span className="ml-auto rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">Activ</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <Link href="/programari" className="flex items-center justify-between rounded-xl bg-orange-50 px-3 py-2.5 hover:bg-orange-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <span>🩺</span>
                          <span className="text-sm font-medium text-dark">Programează vizită</span>
                        </div>
                        <span className="text-zinc-400 text-sm">→</span>
                      </Link>
                      <Link href={`/animale`} className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2.5 hover:bg-zinc-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <span>📋</span>
                          <span className="text-sm font-medium text-dark">Fișă medicală</span>
                        </div>
                        <span className="text-zinc-400 text-sm">→</span>
                      </Link>
                      <Link href="/magazin" className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2.5 hover:bg-zinc-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <span>🛒</span>
                          <span className="text-sm font-medium text-dark">Produse recomandate</span>
                        </div>
                        <span className="text-zinc-400 text-sm">→</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Decorative card for logged-out users */
                  <div className="w-full max-w-sm space-y-3">
                    <div className="rounded-3xl border p-5 shadow-sm" style={{ background: "var(--card-bg)" }}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-xl">🐶</div>
                        <div>
                          <p className="font-semibold text-dark">Max — Labrador, 2 ani</p>
                          <p className="text-xs text-zinc-400">Ultima vizită: acum 3 luni</p>
                        </div>
                        <span className="ml-auto rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-primary">Reminder</span>
                      </div>
                      <div className="mt-3 rounded-xl bg-orange-50 px-3 py-2.5 text-sm text-dark">
                        💉 Antirabic scadent în <strong>12 zile</strong>
                      </div>
                    </div>
                    <div className="rounded-3xl border p-5 shadow-sm" style={{ background: "var(--card-bg)" }}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-xl">🐱</div>
                        <div>
                          <p className="font-semibold text-dark">Luna — Pisică, 1 an</p>
                          <p className="text-xs text-zinc-400">GPS activ · acasă</p>
                        </div>
                        <span className="ml-auto h-2.5 w-2.5 rounded-full bg-green-500"></span>
                      </div>
                    </div>
                    <p className="text-center text-xs text-zinc-400">Creează un cont gratuit pentru profilul animalului tău</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── CATEGORY SHORTCUTS ── */}
          <div className="border-t" style={{ background: "var(--background)" }}>
            <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap gap-2">
                {t.categories.map((label, i) => (
                  <Link
                    key={label}
                    href={CATEGORY_HREFS[i] ?? "/"}
                    className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary transition-colors"
                    style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}
                  >
                    <span>{CATEGORY_EMOJIS[i]}</span>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 4 PROMISIUNI ── */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">{t.offers.label}</p>
            <h2 className="font-heading mt-2 text-3xl font-bold text-dark sm:text-4xl">
              {t.offers.title}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {t.promises.map((p, i) => {
              const meta = PROMISE_META[i];
              return (
              <Link
                key={p.title}
                href={meta.href}
                className="group rounded-3xl border p-7 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: meta.bg, borderColor: meta.border }}
              >
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{meta.emoji}</span>
                  <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: meta.accent + "22", color: meta.accent }}>
                    {p.title}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-bold" style={{ color: meta.dark ? "#fff" : "#1a1a1a" }}>{p.subtitle}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: meta.dark ? "#9ca3af" : "#6b7280" }}>{p.desc}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {meta.modules.map((m) => (
                    <span key={m} className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{
                      background: meta.dark ? "rgba(255,255,255,0.08)" : meta.accent + "18",
                      color: meta.dark ? "#d1d5db" : meta.accent,
                      border: `1px solid ${meta.dark ? "rgba(255,255,255,0.12)" : meta.accent + "40"}`,
                    }}>{m}</span>
                  ))}
                </div>
                <div className="mt-5 text-sm font-semibold" style={{ color: meta.accent }}>
                  {p.cta} →
                </div>
              </Link>
              );
            })}
          </div>
        </section>

        {/* ── PET PROFILE + PETWELL ── */}
        <section className="py-12" style={{ background: "var(--surface)" }}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-primary">{t.profile.label}</p>
                <h2 className="font-heading mt-2 text-3xl font-bold text-dark sm:text-4xl">
                  {t.profile.title}<br />{t.profile.titleLine2}
                </h2>
                <p className="mt-4" style={{ color: "var(--muted)" }}>
                  {t.profile.desc}
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {t.profile.features.map((f, i) => (
                    <div key={f.label} className="rounded-2xl border p-4" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                      <span className="text-2xl">{PROFILE_EMOJIS[i]}</span>
                      <p className="mt-2 text-sm font-semibold" style={{ color: "var(--foreground)" }}>{f.label}</p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>{f.sub}</p>
                    </div>
                  ))}
                </div>
                <Link href={user ? "/animale" : "/login"} className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark transition-colors">
                  {user ? t.profile.goToProfile : t.profile.createCta}
                </Link>
              </div>
              <div className="rounded-3xl border p-6 shadow-sm" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: "var(--card-border)" }}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-2xl">🐶</div>
                  <div>
                    <p className="font-bold text-dark">Max</p>
                    <p className="text-sm" style={{ color: "var(--muted)" }}>Labrador Retriever · 2 ani</p>
                  </div>
                  <span className="ml-auto rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Sănătos</span>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    { emoji: "💉", title: "Antirabic", sub: "Urmează în 12 zile", badge: "Reminder", badgeColor: "bg-primary text-white" },
                    { emoji: "⚖️", title: "Greutate: 28 kg", sub: "+0.5 kg față de luna trecută", badge: "↑ normal", badgeColor: "text-zinc-400" },
                    { emoji: "🩺", title: "Control anual", sub: "Vineri, 14:00 — Dr. Ionescu", badge: "Confirmat", badgeColor: "bg-green-50 text-green-700" },
                  ].map((row) => (
                    <div key={row.title} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "var(--surface)" }}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{row.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold text-dark">{row.title}</p>
                          <p className="text-xs" style={{ color: "var(--muted)" }}>{row.sub}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${row.badgeColor}`}>{row.badge}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href="/programari" className="flex-1 rounded-xl border py-2.5 text-center text-xs font-semibold text-dark hover:bg-zinc-50 transition-colors" style={{ borderColor: "var(--card-border)" }}>+ Programare</Link>
                  <Link href="/animale" className="flex-1 rounded-xl border py-2.5 text-center text-xs font-semibold text-dark hover:bg-zinc-50 transition-colors" style={{ borderColor: "var(--card-border)" }}>Fișă completă</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SERVICII TRIO ── */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">{t.services.label}</p>
            <h2 className="font-heading mt-1 text-2xl font-bold text-dark sm:text-3xl">{t.services.title}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {t.services.items.map((s, i) => {
              const meta = [
                { emoji: "🩺", href: "/veterinari", bg: "#f0faf4", border: "#bbf7d0", accent: "#16a34a" },
                { emoji: "🛒", href: "/magazin", bg: "#fff7ed", border: "#fdd9b0", accent: "#fa871b" },
                { emoji: "📍", href: null as string | null, bg: "#1a1a1a", border: "#333", accent: "#fa871b", dark: true },
              ][i];
              return (
              <div key={s.title} className="flex flex-col gap-4 rounded-3xl border p-6" style={{ background: meta.bg, borderColor: meta.border }}>
                <span className="text-4xl">{meta.emoji}</span>
                <div>
                  <p className="text-xl font-bold" style={{ color: meta.dark ? "#fff" : "#1a1a1a" }}>{s.title}</p>
                  <p className="mt-1.5 text-sm" style={{ color: meta.dark ? "#9ca3af" : "#6b7280" }}>{s.desc}</p>
                </div>
                {meta.href ? (
                  <Link href={meta.href} className="mt-auto text-sm font-bold" style={{ color: meta.accent }}>{s.cta} →</Link>
                ) : (
                  <span className="mt-auto text-sm font-bold" style={{ color: meta.accent }}>{s.cta} →</span>
                )}
              </div>
              );
            })}
          </div>
        </section>

        {/* ── COMUNITATE + ADOPTII ── */}
        <section className="py-12" style={{ background: "var(--surface)" }}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              <div>
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-widest text-primary">{t.adoptii.label}</p>
                    <h2 className="font-heading mt-1 text-2xl font-bold text-dark">{t.adoptii.title}</h2>
                  </div>
                  <Link href="/adoptii" className="text-sm font-medium text-primary hover:underline">{t.adoptii.viewAll}</Link>
                </div>
                {listings && listings.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {listings.slice(0, 6).map((pet) => (
                      <Link key={pet.id} href={`/adoptii/${pet.id}`} className="group overflow-hidden rounded-2xl border shadow-sm hover:shadow-md transition-shadow" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                        {pet.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={pet.photo_url} alt={pet.name} className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <PetPlaceholder className="aspect-square w-full" />
                        )}
                        <div className="p-2.5">
                          <p className="truncate text-sm font-semibold text-dark">{pet.name}</p>
                          <p className="truncate text-xs" style={{ color: "var(--muted)" }}>{pet.city}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed p-10 text-center" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                    <span className="text-3xl">🐾</span>
                    <p className="mt-3 text-sm font-medium text-dark">{t.adoptii.noListings}</p>
                    <Link href="/adoptii/adauga" className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">{t.adoptii.addListing}</Link>
                  </div>
                )}
              </div>

              <div>
                <div className="mb-5">
                  <p className="text-sm font-semibold uppercase tracking-widest text-primary">{t.community.label}</p>
                  <h2 className="font-heading mt-1 text-2xl font-bold text-dark">{t.community.title}</h2>
                </div>
                <div className="space-y-3">
                  {t.community.items.map((item, i) => {
                    const links = ["/forum", "/resq", "/sos"];
                    const emojis = ["💬", "🔍", "🚨"];
                    return (
                    <Link key={item.title} href={links[i]} className="flex items-start gap-4 rounded-2xl border p-5 transition-all hover:border-primary/30 hover:shadow-sm" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                      <span className="text-3xl">{emojis[i]}</span>
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: "var(--foreground)" }}>{item.title}</p>
                        <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>{item.desc}</p>
                      </div>
                      <span className="mt-1" style={{ color: "var(--muted)" }}>→</span>
                    </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PAWFECT+ ── */}
        <section style={{ background: "#111827" }} className="py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 sm:p-12">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-1.5 text-sm font-bold text-primary">{t.plus.badge}</div>
                  <h2 className="font-heading mt-3 text-2xl font-bold sm:text-3xl" style={{ color: "#ffffff" }}>
                    {t.plus.title.split("\n")[0]}<br />{t.plus.title.split("\n")[1]}
                  </h2>
                  <p className="mt-2 text-zinc-400">{t.plus.desc}</p>
                  <span className="mt-4 inline-block rounded-full border border-white/25 px-4 py-1.5 text-sm text-zinc-200">{t.plus.comingSoon}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {plusFeatures.map((f) => (
                    <div key={f.text} className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
                      <span className="text-lg">{f.emoji}</span>
                      <span className="text-xs text-zinc-300">{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── DOWNLOAD CTA ── */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border p-10 text-center" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
            <span className="text-5xl">📱</span>
            <h2 className="font-heading mt-4 text-2xl font-bold text-dark sm:text-3xl">{t.download.title}</h2>
            <p className="mt-2 text-zinc-500">{t.download.subtitle}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a href="https://play.google.com/store/apps/details?id=app.pawfectpair.mobile" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                style={{ background: "#111827" }}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.18 23.76a2 2 0 0 0 2.9.29l9.66-9.66-2.9-2.9-9.66 9.37zM20.65 9.54l-3.37-1.94-3.24 3.17 3.24 3.17 3.4-1.96a1.72 1.72 0 0 0 0-2.44zm-17.47-7.3a2 2 0 0 0-.32 1.1v18.32a2 2 0 0 0 .32 1.09l.08.08 10.26-10.26v-.24L3.26 2.16zm9.85 6.9 2.9 2.9-9.85 9.58a2.03 2.03 0 0 1-2.6.06z"/>
                </svg>
                {t.download.googlePlay}
              </a>
              {!user && (
                <Link href="/login" className="inline-flex rounded-2xl border-2 border-primary px-6 py-3 text-sm font-bold text-primary hover:bg-primary hover:text-white transition-colors">
                  {t.download.webAccount}
                </Link>
              )}
            </div>
          </div>
        </section>

      </main>
      <BottomNav />
    </>
  );
}
