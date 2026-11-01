"use client";

import { useState } from "react";
import Link from "next/link";
import { bookAppointment } from "../../actions";

type Pet = { id: string; name: string; photo_url: string | null };
type Service = { id: string; name: string; duration_minutes: number | null; price_cents: number; currency: string };

type Step = "pet" | "time" | "review";
const STEPS: Step[] = ["pet", "time", "review"];
const STEP_LABELS: Record<Step, string> = { pet: "Animal", time: "Oră", review: "Recapitulare" };

type Props = {
  vetId: string;
  clinicName: string;
  pets: Pet[];
  services: Service[];
  initialServiceId: string | null;
};

export default function BookingWizard({ vetId, clinicName, pets, services, initialServiceId }: Props) {
  const [step, setStep] = useState<Step>("pet");
  const [petId, setPetId] = useState<string>(pets[0]?.id ?? "");
  const [serviceId, setServiceId] = useState<string>(initialServiceId ?? "");
  const [startsAt, setStartsAt] = useState("");
  const [reason, setReason] = useState("");

  const selectedPet = pets.find((p) => p.id === petId) ?? null;
  const selectedService = services.find((s) => s.id === serviceId) ?? null;
  const stepIndex = STEPS.indexOf(step);

  function goNext() {
    if (step === "pet" && !petId) return;
    if (step === "time" && !startsAt) return;
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  }
  function goBack() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <Link href={`/veterinari/${vetId}`} className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors" style={{ color: "var(--muted)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        {clinicName}
      </Link>

      {/* Step indicator */}
      <div className="mt-4 mb-6 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  background: i < stepIndex ? "#16a34a" : i === stepIndex ? "var(--primary)" : "var(--card-bg)",
                  color: i <= stepIndex ? "#fff" : "var(--muted)",
                  border: i > stepIndex ? "1px solid var(--card-border)" : undefined,
                }}
              >
                {i < stepIndex ? "✓" : i + 1}
              </div>
              <span className="text-[11px] font-medium" style={{ color: i <= stepIndex ? "var(--foreground)" : "var(--muted)" }}>
                {STEP_LABELS[s]}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="h-0.5 w-8" style={{ background: i < stepIndex ? "#16a34a" : "var(--card-border)" }} />}
          </div>
        ))}
      </div>

      {step === "pet" && (
        <div className="flex flex-col gap-3">
          <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Alege animalul</h1>
          {pets.map((pet) => (
            <button
              key={pet.id}
              type="button"
              onClick={() => setPetId(pet.id)}
              className="flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors"
              style={{ borderColor: petId === pet.id ? "var(--primary)" : "var(--card-border)", background: petId === pet.id ? "color-mix(in srgb, var(--primary) 6%, transparent)" : "var(--card-bg)" }}
            >
              {pet.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pet.photo_url} alt={pet.name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-lg" style={{ background: "var(--surface)" }}>🐾</div>
              )}
              <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{pet.name}</span>
              {petId === pet.id && <span className="ml-auto text-primary">✓</span>}
            </button>
          ))}

          {services.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>Serviciu (opțional)</p>
              <div className="flex flex-col gap-2">
                {services.map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setServiceId(serviceId === srv.id ? "" : srv.id)}
                    className="flex items-center justify-between gap-2 rounded-xl border p-3 text-left text-sm transition-colors"
                    style={{ borderColor: serviceId === srv.id ? "var(--primary)" : "var(--card-border)", background: serviceId === srv.id ? "color-mix(in srgb, var(--primary) 6%, transparent)" : "var(--card-bg)" }}
                  >
                    <span style={{ color: "var(--foreground)" }}>{srv.name}</span>
                    <span className="font-bold shrink-0" style={{ color: "var(--primary)" }}>{(srv.price_cents / 100).toFixed(0)} {srv.currency}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="button" onClick={goNext} disabled={!petId} className="mt-4 min-h-11 rounded-full bg-primary text-sm font-bold text-white disabled:opacity-40">
            Continuă
          </button>
        </div>
      )}

      {step === "time" && (
        <div className="flex flex-col gap-3">
          <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Alege data și ora</h1>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="min-h-11 rounded-xl border px-4 text-sm"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivul vizitei (opțional)"
            className="min-h-11 rounded-xl border px-4 text-sm"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}
          />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={goBack} className="min-h-11 flex-1 rounded-full border text-sm font-semibold" style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}>
              Înapoi
            </button>
            <button type="button" onClick={goNext} disabled={!startsAt} className="min-h-11 flex-1 rounded-full bg-primary text-sm font-bold text-white disabled:opacity-40">
              Continuă
            </button>
          </div>
        </div>
      )}

      {step === "review" && (
        <form action={bookAppointment.bind(null, vetId)} className="flex flex-col gap-3">
          <h1 className="text-lg font-bold mb-1" style={{ color: "var(--foreground)" }}>Recapitulare</h1>

          <div className="rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
            {selectedPet?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedPet.photo_url} alt={selectedPet.name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-lg" style={{ background: "var(--surface)" }}>🐾</div>
            )}
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{selectedPet?.name}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{clinicName}{selectedService ? ` · ${selectedService.name}` : ""}</p>
            </div>
          </div>

          <div className="rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
            <span className="text-xl">📅</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {startsAt ? new Date(startsAt).toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : ""}
              </p>
              {reason && <p className="text-xs" style={{ color: "var(--muted)" }}>{reason}</p>}
            </div>
          </div>

          {selectedService && (
            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--muted)" }}>Serviciu</span>
                <span style={{ color: "var(--foreground)" }}>{selectedService.name}</span>
              </div>
              <div className="mt-1 flex items-center justify-between font-bold">
                <span style={{ color: "var(--foreground)" }}>Total</span>
                <span style={{ color: "var(--primary)" }}>{(selectedService.price_cents / 100).toFixed(0)} {selectedService.currency}</span>
              </div>
            </div>
          )}

          <input type="hidden" name="pet_id" value={petId} />
          <input type="hidden" name="starts_at" value={startsAt} />
          <input type="hidden" name="reason" value={reason} />
          <input type="hidden" name="service_id" value={serviceId} />

          <div className="mt-2 flex gap-2">
            <button type="button" onClick={goBack} className="min-h-11 flex-1 rounded-full border text-sm font-semibold" style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}>
              Înapoi
            </button>
            <button type="submit" className="min-h-11 flex-1 rounded-full bg-primary text-sm font-bold text-white">
              Confirmă programarea
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
