"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { StarsDisplay, StarsInput } from "@/components/Stars";
import { submitReview } from "../actions";

type Tab = "about" | "services" | "reviews";

const TAB_LABELS: Record<Tab, string> = {
  about: "Prezentare",
  services: "Servicii",
  reviews: "Recenzii",
};

type Service = { id: string; name: string; duration_minutes: number | null; price_cents: number; currency: string };
type Review = { user_id: string; rating: number; comment: string | null; profiles: { full_name: string } | null };
type Pet = { id: string; name: string };

type Props = {
  vet: Record<string, unknown>;
  services: Service[];
  reviews: Review[];
  myPets: Pet[] | null;
  isOwner: boolean;
  isLoggedIn: boolean;
  currentUserId: string | null;
};

export default function VetDetailClient({ vet, services, reviews, myPets, isOwner, isLoggedIn, currentUserId }: Props) {
  const [tab, setTab] = useState<Tab>("about");

  const id = vet.id as string;
  const clinicName = vet.clinic_name as string;
  const city = vet.city as string | null;
  const address = vet.address as string | null;
  const phone = vet.phone as string | null;
  const bio = vet.bio as string | null;
  const photoUrl = vet.photo_url as string | null;
  const photos = (vet.photos as string[] | null) ?? [];
  const isLicensed = (vet.is_licensed as boolean | null) ?? false;
  const experiencedTeam = (vet.experienced_team as boolean | null) ?? false;
  const modernFacility = (vet.modern_facility as boolean | null) ?? false;

  const gallery = [photoUrl, ...photos].filter(Boolean) as string[];
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const myReview = currentUserId ? reviews.find((r) => r.user_id === currentUserId) : null;

  const badges = [
    isLicensed && { icon: "✅", label: "Cabinet autorizat" },
    experiencedTeam && { icon: "👥", label: "Echipă cu experiență" },
    modernFacility && { icon: "🏢", label: "Facilitate modernă" },
  ].filter(Boolean) as { icon: string; label: string }[];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Hero */}
      <div
        className="relative rounded-2xl overflow-hidden mb-2"
        style={{ aspectRatio: "4/3", background: "linear-gradient(135deg, #f0faf4 0%, #d8f3e4 100%)" }}
      >
        {gallery.length > 0 ? (
          <Image src={gallery[0]} alt={clinicName} fill sizes="(max-width: 640px) 100vw, 672px" className="object-cover" priority />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-7xl">🏥</div>
        )}
        {gallery.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white">
            1/{gallery.length}
          </span>
        )}
        {isOwner && (
          <Link
            href={`/veterinari/${id}/editeaza`}
            className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold hover:bg-white transition-colors"
            style={{ color: "#111827" }}
          >
            ✎ Editează
          </Link>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {gallery.slice(1).map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt={`${clinicName} ${i + 2}`} className="h-16 w-20 shrink-0 rounded-xl object-cover" />
          ))}
        </div>
      )}

      <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{clinicName}</h1>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {reviews.length > 0 && <StarsDisplay rating={avgRating} count={reviews.length} />}
        <span className="text-sm" style={{ color: "var(--muted)" }}>{city}{address ? ` · ${address}` : ""}</span>
      </div>
      {phone && <a href={`tel:${phone}`} className="text-sm font-medium text-primary hover:underline">{phone}</a>}

      {badges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {badges.map((b) => (
            <span key={b.label} className="rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}>
              {b.icon} {b.label}
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-5 flex gap-1 rounded-2xl p-1" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            style={{ background: tab === t ? "var(--primary)" : "transparent", color: tab === t ? "#fff" : "var(--muted)" }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "about" && (
        <div className="mt-4 rounded-2xl border p-4" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          {bio ? (
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--foreground)" }}>{bio}</p>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Cabinetul nu a adăugat o descriere.</p>
          )}
        </div>
      )}

      {tab === "services" && (
        <div className="mt-4 flex flex-col gap-2">
          {services.length > 0 ? (
            services.map((srv) => (
              <div
                key={srv.id}
                className="flex items-center justify-between gap-3 rounded-2xl border p-4"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{srv.name}</p>
                  {srv.duration_minutes && <p className="text-xs" style={{ color: "var(--muted)" }}>{srv.duration_minutes} minute</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>{(srv.price_cents / 100).toFixed(0)} {srv.currency}</span>
                  {isLoggedIn && (
                    <Link
                      href={`/veterinari/${id}/rezerva?serviciu=${srv.id}`}
                      className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white"
                    >
                      Alege o oră
                    </Link>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Cabinetul nu a adăugat încă servicii listate.</p>
          )}
        </div>
      )}

      {tab === "reviews" && (
        <div className="mt-4 flex flex-col gap-3">
          {reviews.length > 0 ? (
            reviews.map((r, i) => (
              <div key={i} className="rounded-xl border p-3 text-sm shadow-sm" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                <StarsDisplay rating={r.rating} />
                <p className="mt-1 font-medium" style={{ color: "var(--foreground)" }}>{r.profiles?.full_name || "Utilizator"}</p>
                {r.comment && <p className="mt-1" style={{ color: "var(--muted)" }}>{r.comment}</p>}
              </div>
            ))
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Nicio recenzie încă.</p>
          )}

          {isLoggedIn && !myReview && (
            <form action={submitReview.bind(null, id)} className="mt-1 flex flex-col gap-3 rounded-xl border p-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Lasă o recenzie</p>
              <StarsInput />
              <textarea name="comment" placeholder="Comentariu (opțional)" rows={2} className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
              <button className="min-h-11 self-start rounded-full bg-primary px-5 text-sm font-semibold text-white">Trimite recenzia</button>
            </form>
          )}
        </div>
      )}

      {/* Booking — mereu vizibil sub tab-uri */}
      <section id="booking" className="mt-6 rounded-2xl border p-4 sm:p-6" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <h2 className="mb-3 font-semibold" style={{ color: "var(--foreground)" }}>Programează o vizită</h2>
        {!isLoggedIn ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            <a href="/login" className="text-primary hover:underline">Autentifică-te</a> pentru a programa o vizită.
          </p>
        ) : !myPets || myPets.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Nu ai încă niciun animal adăugat. Adaugă unul din{" "}
            <a href="/profil" className="text-primary hover:underline">profilul tău</a>.
          </p>
        ) : (
          <Link
            href={`/veterinari/${id}/rezerva`}
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Alege animalul și ora →
          </Link>
        )}
      </section>
    </div>
  );
}
