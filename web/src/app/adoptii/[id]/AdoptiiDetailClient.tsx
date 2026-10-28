"use client";

import { useState } from "react";
import Link from "next/link";
import { applyToListing } from "./actions";

type Listing = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age_years: number | null;
  sex: string | null;
  size: string | null;
  description: string | null;
  city: string | null;
  photo_url: string | null;
  photo_urls: string[] | null;
  traits: string[] | null;
  adoption_fee: number | null;
  rescue_org: string | null;
  vaccinated: boolean | null;
  neutered: boolean | null;
  microchipped: boolean | null;
  good_with_kids: boolean | null;
  good_with_pets: boolean | null;
  energy_level: string | null;
  status: string;
  posted_by: string;
};

type Application = { id: string; status: string } | null;

type Props = {
  listing: Listing;
  isLoggedIn: boolean;
  isOwner: boolean;
  myApplication: Application;
};

const JOURNEY_STEPS = [
  { label: "Application received", icon: "📋", desc: "We've got your application" },
  { label: "Rescue review", icon: "🔍", desc: "Our team reviews your home" },
  { label: "Meet the pet", icon: "🐾", desc: "Schedule a meet & greet" },
  { label: "Placement & support", icon: "🏠", desc: "Bring them home!" },
];

const STEP_STATUS: Record<string, number> = {
  pending: 0,
  accepted: 2,
};

const SEX_LABEL: Record<string, string> = { male: "Mascul", female: "Femelă", unknown: "Necunoscut" };
const SIZE_LABEL: Record<string, string> = { small: "Mic", medium: "Mediu", large: "Mare" };
const ENERGY_LABEL: Record<string, string> = { low: "Scăzut", medium: "Mediu", high: "Ridicat" };
const SPECIES_EMOJI: Record<string, string> = { caine: "🐶", pisica: "🐱", iepure: "🐰", pasare: "🐦" };

function speciesEmoji(s: string) {
  return SPECIES_EMOJI[s?.toLowerCase()] ?? "🐾";
}

export default function AdoptiiDetailClient({ listing, isLoggedIn, isOwner, myApplication }: Props) {
  const [activePhoto, setActivePhoto] = useState(0);
  const [showHotel, setShowHotel] = useState(false);
  const [applyMsg, setApplyMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hotelDate, setHotelDate] = useState("");

  const photos: string[] = [];
  if (listing.photo_url) photos.push(listing.photo_url);
  if (listing.photo_urls) photos.push(...listing.photo_urls.filter((u) => u && u !== listing.photo_url));
  if (photos.length === 0) photos.push(""); // empty placeholder

  const traits = listing.traits ?? [];
  const currentStep = myApplication ? STEP_STATUS[myApplication.status] ?? 0 : -1;

  const healthBadges = [
    listing.vaccinated && "Vaccinat",
    listing.neutered && "Sterilizat",
    listing.microchipped && "Microcip",
  ].filter(Boolean) as string[];

  const compatBadges = [
    listing.good_with_kids === true && "Bun cu copiii",
    listing.good_with_pets === true && "Bun cu animale",
    listing.good_with_kids === false && "Fără copii mici",
    listing.good_with_pets === false && "Fără alte animale",
  ].filter(Boolean) as string[];

  const canApply = isLoggedIn && !isOwner && listing.status === "available" && !myApplication;

  async function handleApply() {
    if (!applyMsg.trim()) return;
    const fd = new FormData();
    fd.append("message", applyMsg);
    await applyToListing(listing.id, fd);
    setSubmitted(true);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-28 md:pb-8">
      {/* Back */}
      <Link
        href="/adoptii"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-4"
        style={{ color: "var(--primary)" }}
      >
        ← Înapoi la adopții
      </Link>

      {/* Photo gallery */}
      <div
        className="relative rounded-3xl overflow-hidden mb-3"
        style={{
          background: "linear-gradient(135deg, #fff7ed 0%, #fde8d0 100%)",
          aspectRatio: "4/3",
        }}
      >
        {photos[activePhoto] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photos[activePhoto]}
            alt={listing.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">
            {speciesEmoji(listing.species)}
          </div>
        )}

        {/* Status badge */}
        <span
          className="absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold"
          style={{
            background: listing.status === "available" ? "#22c55e" : listing.status === "pending" ? "#f59e0b" : "#6b7280",
            color: "#fff",
          }}
        >
          {listing.status === "available" ? "Disponibil" : listing.status === "pending" ? "În proces" : "Adoptat"}
        </span>

        {/* Photo count */}
        {photos.length > 1 && (
          <span
            className="absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-xs font-bold"
            style={{ background: "rgba(0,0,0,0.45)", color: "#fff" }}
          >
            {activePhoto + 1} / {photos.length}
          </span>
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {photos.map((url, i) => (
            <button
              key={i}
              onClick={() => setActivePhoto(i)}
              className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all"
              style={{ borderColor: i === activePhoto ? "var(--primary)" : "transparent" }}
            >
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-2xl"
                  style={{ background: "#fde8d0" }}
                >
                  {speciesEmoji(listing.species)}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
          Meet {listing.name}
        </h1>
        <div className="flex flex-wrap gap-2 text-sm" style={{ color: "var(--muted)" }}>
          {listing.breed && <span>🏷️ {listing.breed}</span>}
          {listing.sex && <span>· {SEX_LABEL[listing.sex] ?? listing.sex}</span>}
          {listing.age_years != null && <span>· {listing.age_years} ani</span>}
          {listing.size && <span>· {SIZE_LABEL[listing.size] ?? listing.size}</span>}
          {listing.city && <span>· 📍 {listing.city}</span>}
        </div>
      </div>

      {/* Traits */}
      {traits.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>Personalitate</p>
          <div className="flex flex-wrap gap-2">
            {traits.map((t) => (
              <span
                key={t}
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                  color: "var(--primary)",
                  border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Health & compatibility badges */}
      {(healthBadges.length > 0 || compatBadges.length > 0 || listing.energy_level) && (
        <div className="mb-4">
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>Informații medicale</p>
          <div className="flex flex-wrap gap-2">
            {healthBadges.map((b) => (
              <span
                key={b}
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: "color-mix(in srgb, #16a34a 10%, transparent)",
                  color: "#16a34a",
                  border: "1px solid color-mix(in srgb, #16a34a 20%, transparent)",
                }}
              >
                ✓ {b}
              </span>
            ))}
            {listing.energy_level && (
              <span
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: "color-mix(in srgb, #f59e0b 10%, transparent)",
                  color: "#b45309",
                  border: "1px solid color-mix(in srgb, #f59e0b 20%, transparent)",
                }}
              >
                ⚡ Energie: {ENERGY_LABEL[listing.energy_level]}
              </span>
            )}
            {compatBadges.map((b) => (
              <span
                key={b}
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: b.startsWith("Fără")
                    ? "color-mix(in srgb, #ef4444 10%, transparent)"
                    : "color-mix(in srgb, #3b82f6 10%, transparent)",
                  color: b.startsWith("Fără") ? "#dc2626" : "#1d4ed8",
                  border: `1px solid ${b.startsWith("Fără") ? "color-mix(in srgb, #ef4444 20%, transparent)" : "color-mix(in srgb, #3b82f6 20%, transparent)"}`,
                }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {listing.description && (
        <div className="mb-4">
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>Despre {listing.name}</p>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--muted)" }}>
            {listing.description}
          </p>
        </div>
      )}

      {/* Rescue org info */}
      {listing.rescue_org && (
        <div
          className="mb-4 rounded-2xl border p-4 flex items-start gap-3"
          style={{
            background: "color-mix(in srgb, #dcfce7 30%, var(--card-bg))",
            borderColor: "color-mix(in srgb, #16a34a 20%, transparent)",
          }}
        >
          <span className="text-2xl shrink-0">🏥</span>
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "#166534" }}>Organizație de salvare</p>
            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{listing.rescue_org}</p>
            <p className="text-xs mt-0.5" style={{ color: "#4b7a5e" }}>
              Toți animalele sunt verificate medical și socializate.
            </p>
          </div>
        </div>
      )}

      {/* Adoption fee */}
      {listing.adoption_fee != null && (
        <div
          className="mb-4 rounded-2xl border p-4 flex items-center justify-between"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: "var(--muted)" }}>Taxă adopție</p>
            <p className="text-xl font-bold" style={{ color: "var(--primary)" }}>
              {listing.adoption_fee === 0 ? "Gratuit" : `${listing.adoption_fee} RON`}
            </p>
          </div>
          <span className="text-3xl">🎀</span>
        </div>
      )}

      {/* Adoption journey tracker */}
      {myApplication && (
        <div
          className="mb-4 rounded-2xl border p-4"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <p className="text-sm font-bold mb-4" style={{ color: "var(--foreground)" }}>
            Your adoption journey
          </p>
          <div className="relative">
            {/* Line */}
            <div
              className="absolute top-5 left-5 right-5 h-0.5 -translate-y-1/2"
              style={{ background: "var(--card-border)", zIndex: 0 }}
            />
            <div className="flex justify-between relative z-10">
              {JOURNEY_STEPS.map((step, i) => {
                const done = i <= currentStep;
                const active = i === currentStep;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all"
                      style={{
                        background: done ? "var(--primary)" : "var(--card-bg)",
                        borderColor: done ? "var(--primary)" : "var(--card-border)",
                        boxShadow: active ? "0 0 0 3px color-mix(in srgb, var(--primary) 25%, transparent)" : "none",
                      }}
                    >
                      {done ? (i < currentStep ? "✓" : step.icon) : step.icon}
                    </div>
                    <p
                      className="text-center text-[10px] font-medium leading-tight max-w-[60px]"
                      style={{ color: done ? "var(--primary)" : "var(--muted)" }}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          {currentStep >= 0 && currentStep < JOURNEY_STEPS.length && (
            <p className="mt-3 text-xs text-center" style={{ color: "var(--muted)" }}>
              {JOURNEY_STEPS[currentStep].desc}
            </p>
          )}
        </div>
      )}

      {/* Apply section */}
      {!isOwner && listing.status === "available" && (
        <div
          className="mb-4 rounded-2xl border p-4"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          {!isLoggedIn ? (
            <div className="text-center py-2">
              <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                Autentifică-te pentru a adopta pe {listing.name}
              </p>
              <Link
                href="/login"
                className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white"
              >
                Autentifică-te
              </Link>
            </div>
          ) : myApplication ? (
            <div className="text-center py-2">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Ai aplicat pentru {listing.name}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                Status: <strong>{myApplication.status === "pending" ? "În așteptare" : myApplication.status === "accepted" ? "Acceptat" : "Respins"}</strong>
              </p>
            </div>
          ) : submitted ? (
            <div className="text-center py-2">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Aplicația ta a fost trimisă!
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                Vom reveni cu un răspuns în curând.
              </p>
            </div>
          ) : canApply ? (
            <div>
              <p className="text-sm font-bold mb-3" style={{ color: "var(--foreground)" }}>
                Aplică pentru a adopta pe {listing.name}
              </p>
              <textarea
                value={applyMsg}
                onChange={(e) => setApplyMsg(e.target.value)}
                rows={3}
                placeholder="Spune-ne de ce ai fi un stăpân potrivit pentru {listing.name}..."
                className="w-full rounded-xl border p-3 text-sm outline-none resize-none focus:border-primary transition-colors"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--card-border)",
                  color: "var(--foreground)",
                }}
              />
              <button
                onClick={handleApply}
                disabled={!applyMsg.trim()}
                className="mt-3 w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                style={{ background: "var(--primary)" }}
              >
                Trimite aplicația
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Pet hotel booking card */}
      <div
        className="rounded-2xl border overflow-hidden mb-4"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <div
          className="p-4"
          style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold mb-0.5" style={{ color: "#1e40af" }}>🏨 Pet Hotel</p>
              <p className="text-base font-bold" style={{ color: "#1e3a8a" }}>Lake Paws Hotel</p>
              <p className="text-xs mt-0.5" style={{ color: "#3b82f6" }}>
                📍 {listing.city ?? "Aproape de tine"} · 4.9 ⭐ · 127 recenzii
              </p>
            </div>
            <button
              onClick={() => setShowHotel(!showHotel)}
              className="rounded-full px-3 py-1.5 text-xs font-bold text-white"
              style={{ background: "#3b82f6" }}
            >
              {showHotel ? "Închide" : "Rezervă"}
            </button>
          </div>
          <div className="flex gap-3 mt-3">
            {["Standard · 80 RON/noapte", "Deluxe · 140 RON/noapte", "Suite · 200 RON/noapte"].map((room) => (
              <div
                key={room}
                className="flex-1 rounded-xl p-2 text-center"
                style={{ background: "rgba(255,255,255,0.7)" }}
              >
                <p className="text-[10px] font-semibold" style={{ color: "#1e40af" }}>
                  {room.split(" · ")[0]}
                </p>
                <p className="text-[10px]" style={{ color: "#3b82f6" }}>
                  {room.split(" · ")[1]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {showHotel && (
          <div className="p-4 border-t" style={{ borderColor: "var(--card-border)" }}>
            <p className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>
              Rezervă o cameră
            </p>
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Check-in</label>
                <input
                  type="date"
                  value={hotelDate}
                  onChange={(e) => setHotelDate(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-primary"
                  style={{ background: "var(--surface)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Check-out</label>
                <input
                  type="date"
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-primary"
                  style={{ background: "var(--surface)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                />
              </div>
            </div>
            <button
              className="w-full rounded-full py-2.5 text-sm font-semibold text-white"
              style={{ background: "#3b82f6" }}
            >
              Confirmă rezervarea
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
