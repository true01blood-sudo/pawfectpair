"use client";

import { useState } from "react";
import Link from "next/link";

type Tab = "overview" | "sanatate" | "premii" | "pui" | "recenzii";

const TAB_LABELS: Record<Tab, string> = {
  overview: "Prezentare",
  sanatate: "Sănătate",
  premii: "Premii",
  pui: "Pui",
  recenzii: "Recenzii",
};

type Props = {
  listing: Record<string, unknown>;
  owner: Record<string, unknown> | null;
  isLoggedIn: boolean;
};

function GenderBadge({ gender }: { gender: string | null }) {
  if (!gender) return null;
  const isMale = gender === "mascul";
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{
        background: isMale ? "color-mix(in srgb, #3b82f6 15%, transparent)" : "color-mix(in srgb, #ec4899 15%, transparent)",
        color: isMale ? "#2563eb" : "#db2777",
      }}
    >
      {isMale ? "Mascul ♂" : "Femelă ♀"}
    </span>
  );
}

export default function BreedingDetailClient({ listing, owner, isLoggedIn }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [inquirySent, setInquirySent] = useState(false);
  const [saved, setSaved] = useState(false);

  const healthTests = (listing.health_tests as string[] | null) ?? [];
  const title = listing.title as string;
  const breed = listing.breed as string | null;
  const species = listing.species as string;
  const ageYears = listing.age_years as number | null;
  const city = listing.city as string | null;
  const description = listing.description as string | null;
  const pedigreeInfo = listing.pedigree_info as string | null;
  const priceInfo = listing.price_info as string | null;
  const photoUrl = listing.photo_url as string | null;
  const gender = listing.gender as string | null;

  const ownerName = (owner?.full_name as string | null) ?? "Proprietar";
  const ownerVerified = (owner?.is_verified as boolean | null) ?? false;

  const speciesEmoji = species === "caine" ? "🐶" : species === "pisica" ? "🐱" : "🐴";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back nav */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/reproductie"
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors"
          style={{ color: "var(--muted)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Înapoi la listing
        </Link>
      </div>

      {/* Hero image */}
      <div
        className="relative mx-4 rounded-2xl overflow-hidden mb-4"
        style={{ aspectRatio: "4/3", background: "linear-gradient(135deg, #fff7ed 0%, #fde8d0 100%)" }}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-8xl">{speciesEmoji}</div>
        )}
        {/* Favorite + share */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            type="button"
            onClick={() => setSaved((p) => !p)}
            className="h-9 w-9 rounded-full bg-white/90 flex items-center justify-center shadow transition-colors hover:bg-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? "#ef4444" : "none"} stroke={saved ? "#ef4444" : "#374151"} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button
            type="button"
            className="h-9 w-9 rounded-full bg-white/90 flex items-center justify-center shadow transition-colors hover:bg-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Title + badges */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{title}</h1>
            {priceInfo && (
              <div className="text-right shrink-0">
                <p className="text-lg font-bold" style={{ color: "var(--primary)" }}>{priceInfo}</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <GenderBadge gender={gender} />
            {breed && (
              <span className="text-sm" style={{ color: "var(--muted)" }}>{breed}</span>
            )}
            {ageYears && (
              <span className="text-sm" style={{ color: "var(--muted)" }}>· {ageYears} ani</span>
            )}
            {city && (
              <span className="text-sm" style={{ color: "var(--muted)" }}>· 📍 {city}</span>
            )}
          </div>
        </div>

        {/* Owner row */}
        <div
          className="flex items-center gap-3 rounded-2xl border p-3"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
            style={{ background: "var(--primary)" }}
          >
            {ownerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{ownerName}</span>
              {ownerVerified && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#16a34a">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                </svg>
              )}
            </div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Crescător verificat</p>
          </div>
          <Link
            href={isLoggedIn ? "#contact" : "/login"}
            className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
            style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
          >
            Contact
          </Link>
        </div>

        {/* Health tests (quick view) */}
        {healthTests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {healthTests.map((test) => (
              <span
                key={test}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ background: "color-mix(in srgb, #16a34a 12%, transparent)", color: "#16a34a" }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" style={{ display: "none" }}/>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                {test}
              </span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex gap-1 rounded-2xl p-1 overflow-x-auto"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="flex-shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
              style={{
                background: tab === t ? "var(--primary)" : "transparent",
                color: tab === t ? "#fff" : "var(--muted)",
              }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && (
          <div className="space-y-3">
            {description ? (
              <div
                className="rounded-2xl border p-4"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                <h3 className="font-bold text-sm mb-2" style={{ color: "var(--foreground)" }}>
                  Despre {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{description}</p>
              </div>
            ) : (
              <div
                className="rounded-2xl border p-4 text-center"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                <p className="text-sm" style={{ color: "var(--muted)" }}>Proprietarul nu a adăugat descriere.</p>
              </div>
            )}
            {pedigreeInfo && (
              <div
                className="rounded-2xl border p-4"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                <h3 className="font-bold text-sm mb-2" style={{ color: "var(--foreground)" }}>Informații pedigree</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{pedigreeInfo}</p>
              </div>
            )}
          </div>
        )}

        {tab === "sanatate" && (
          <div
            className="rounded-2xl border p-4 space-y-3"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Teste de sănătate</h3>
            {healthTests.length > 0 ? (
              <div className="space-y-2">
                {healthTests.map((test) => (
                  <div key={test} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: "var(--surface)" }}>
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{test}</span>
                    </div>
                    <span
                      className="text-xs font-semibold rounded-full px-2 py-0.5"
                      style={{ background: "color-mix(in srgb, #16a34a 12%, transparent)", color: "#16a34a" }}
                    >
                      Clear
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Proprietarul nu a adăugat teste de sănătate. Solicită documentele înainte de a continua.
              </p>
            )}
          </div>
        )}

        {tab === "premii" && (
          <div
            className="rounded-2xl border p-8 text-center"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Niciun premiu adăugat</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Proprietarul nu a adăugat premii sau titluri.
            </p>
          </div>
        )}

        {tab === "pui" && (
          <div
            className="rounded-2xl border p-8 text-center"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <div className="text-4xl mb-3">🐾</div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Niciun pui listat</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Proprietarul nu a adăugat puii din generații anterioare.
            </p>
          </div>
        )}

        {tab === "recenzii" && (
          <div
            className="rounded-2xl border p-8 text-center"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <div className="text-4xl mb-3">⭐</div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Fără recenzii momentan</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Primele recenzii vor apărea după primele imperecheri confirmate.
            </p>
          </div>
        )}

        {/* Contact / Booking CTA */}
        <div
          id="contact"
          className="rounded-2xl border p-4 space-y-3"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          {priceInfo && (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "var(--muted)" }}>Preț serviciu</span>
              <span className="font-bold" style={{ color: "var(--foreground)" }}>{priceInfo}</span>
            </div>
          )}
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            💡 Verificați documentele de sănătate și pedigree-ul înainte de a confirma.
          </p>
          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => setInquirySent(true)}
              disabled={inquirySent}
              className="w-full rounded-full py-3 text-sm font-bold text-white transition-colors disabled:opacity-70"
              style={{ background: inquirySent ? "#16a34a" : "var(--primary)" }}
            >
              {inquirySent ? "✓ Cerere trimisă! Proprietarul te va contacta." : "Trimite cerere de contact"}
            </button>
          ) : (
            <Link
              href="/login"
              className="block w-full rounded-full py-3 text-center text-sm font-bold text-white"
              style={{ background: "var(--primary)" }}
            >
              Autentifică-te pentru a contacta
            </Link>
          )}
        </div>

        {/* Responsible breeding notice */}
        <div
          className="rounded-2xl border p-4 flex items-start gap-3 mb-2"
          style={{
            background: "color-mix(in srgb, #f59e0b 8%, transparent)",
            borderColor: "color-mix(in srgb, #f59e0b 25%, transparent)",
          }}
        >
          <span className="text-xl shrink-0">⚠️</span>
          <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
            Reproducerea responsabilă înseamnă teste de sănătate, pedigree verificat și condiții bune pentru pui. PetCare nu garantează informațiile din anunțuri — verificați personal.
          </p>
        </div>
      </div>
    </div>
  );
}
