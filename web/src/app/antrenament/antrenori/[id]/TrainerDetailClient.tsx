"use client";

import { useState } from "react";
import { requestTrainerBooking } from "../../actions";

type Trainer = {
  id: string;
  display_name: string;
  bio: string | null;
  specialties: string[];
  city: string | null;
  phone: string | null;
  photo_url: string | null;
  price_range: string | null;
  experience_years: number;
  verified: boolean;
};
type Pet = { id: string; name: string; photo_url: string | null };

const SPECIALTY_LABELS: Record<string, string> = {
  obedience: "Ascultare",
  behavior: "Comportament",
  agility: "Agility",
  puppy: "Pui",
  protection: "Protecție",
  therapy: "Terapie",
};
const SPECIALTY_EMOJI: Record<string, string> = {
  obedience: "🎯",
  behavior: "🧠",
  agility: "🏃",
  puppy: "🐶",
  protection: "🛡️",
  therapy: "💚",
};

export default function TrainerDetailClient({
  trainer,
  myPets,
  isLoggedIn,
}: {
  trainer: Trainer;
  myPets: Pet[] | null;
  isLoggedIn: boolean;
}) {
  const [petId, setPetId] = useState(myPets?.[0]?.id ?? "");
  const [requestedAt, setRequestedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!petId || !requestedAt) return;
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("pet_id", petId);
      fd.set("requested_at", requestedAt);
      fd.set("notes", notes);
      await requestTrainerBooking(trainer.id, fd);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut trimite cererea.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4">
        <div
          className="h-20 w-20 shrink-0 rounded-full flex items-center justify-center text-2xl font-bold text-white overflow-hidden"
          style={{ background: "var(--primary)" }}
        >
          {trainer.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={trainer.photo_url} alt={trainer.display_name} className="h-20 w-20 object-cover" />
          ) : (
            trainer.display_name.charAt(0)
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{trainer.display_name}</h1>
            {trainer.verified && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--primary)">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
              </svg>
            )}
          </div>
          {trainer.city && <p className="text-sm" style={{ color: "var(--muted)" }}>📍 {trainer.city}</p>}
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {trainer.experience_years} {trainer.experience_years === 1 ? "an" : "ani"} experiență
          </p>
          {trainer.price_range && (
            <p className="text-sm font-bold mt-0.5" style={{ color: "var(--primary)" }}>{trainer.price_range}</p>
          )}
        </div>
      </div>

      {trainer.specialties.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {trainer.specialties.map((sp) => (
            <span
              key={sp}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}
            >
              {SPECIALTY_EMOJI[sp] ?? "📌"} {SPECIALTY_LABELS[sp] ?? sp}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 rounded-2xl border p-4" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <p className="text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>Despre {trainer.display_name}</p>
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: trainer.bio ? "var(--muted)" : "var(--muted)" }}>
          {trainer.bio || "Acest trainer nu a adăugat încă o descriere."}
        </p>
        {trainer.phone && (
          <a href={`tel:${trainer.phone}`} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            📞 {trainer.phone}
          </a>
        )}
      </div>

      <div className="mt-5 rounded-2xl border p-4 sm:p-6" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <h2 className="mb-3 font-semibold" style={{ color: "var(--foreground)" }}>Cere o sesiune</h2>
        {!isLoggedIn ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            <a href="/login" className="text-primary hover:underline">Autentifică-te</a> pentru a cere o sesiune.
          </p>
        ) : !myPets || myPets.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Nu ai încă niciun animal adăugat. Adaugă unul din{" "}
            <a href="/profil" className="text-primary hover:underline">profilul tău</a>.
          </p>
        ) : submitted ? (
          <div className="text-center py-2">
            <p className="text-2xl mb-2">📨</p>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Cerere trimisă!</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              {trainer.display_name} va confirma sesiunea în curând. O găsești în{" "}
              <a href="/programari" className="text-primary hover:underline">Programările mele</a>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Animal</label>
              <select
                value={petId}
                onChange={(e) => setPetId(e.target.value)}
                className="min-h-11 w-full rounded-xl border px-3 text-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}
              >
                {myPets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Data și ora dorite</label>
              <input
                type="datetime-local"
                value={requestedAt}
                onChange={(e) => setRequestedAt(e.target.value)}
                required
                className="min-h-11 w-full rounded-xl border px-3 text-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}
              />
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalii pentru trainer (opțional) — comportament, vârsta animalului..."
              rows={3}
              className="rounded-xl border p-3 text-sm"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !petId || !requestedAt}
              className="min-h-11 self-start rounded-full bg-primary px-6 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Se trimite..." : "Trimite cererea"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
