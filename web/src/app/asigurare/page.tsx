import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Asigurare animale — PetCare",
  description: "Gestionează polițele de asigurare ale animalelor tale și dosarele de daune.",
};

const POLICY_TYPE_LABELS: Record<string, string> = {
  accident: "Accident",
  illness: "Boală",
  comprehensive: "Comprehensive",
  liability: "Răspundere civilă",
};

const POLICY_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  accident: { bg: "color-mix(in srgb, #f59e0b 12%, transparent)", text: "#d97706" },
  illness: { bg: "color-mix(in srgb, #3b82f6 12%, transparent)", text: "#2563eb" },
  comprehensive: { bg: "color-mix(in srgb, var(--primary) 12%, transparent)", text: "var(--primary)" },
  liability: { bg: "color-mix(in srgb, #6b7280 12%, transparent)", text: "#6b7280" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: "color-mix(in srgb, #16a34a 12%, transparent)", text: "#16a34a" },
  expired: { bg: "color-mix(in srgb, #6b7280 12%, transparent)", text: "#6b7280" },
  cancelled: { bg: "color-mix(in srgb, #ef4444 12%, transparent)", text: "#ef4444" },
};

const CLAIM_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  submitted: { bg: "color-mix(in srgb, #f59e0b 12%, transparent)", text: "#d97706" },
  approved: { bg: "color-mix(in srgb, #16a34a 12%, transparent)", text: "#16a34a" },
  rejected: { bg: "color-mix(in srgb, #ef4444 12%, transparent)", text: "#ef4444" },
  paid: { bg: "color-mix(in srgb, var(--primary) 12%, transparent)", text: "var(--primary)" },
};

const CLAIM_STATUS_LABELS: Record<string, string> = {
  submitted: "Depus",
  approved: "Aprobat",
  rejected: "Respins",
  paid: "Plătit",
};

const PROVIDERS = [
  { name: "Omniasig", logo: "🏛️", accident: "150 RON/an", illness: "280 RON/an", comprehensive: "580 RON/an" },
  { name: "Groupama", logo: "🌿", accident: "180 RON/an", illness: "340 RON/an", comprehensive: "650 RON/an" },
  { name: "Allianz", logo: "🔵", accident: "200 RON/an", illness: "380 RON/an", comprehensive: "720 RON/an" },
];

export default async function AsigurarePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: policies } = await supabase
    .from("insurance_policies")
    .select("*, pets(name, species)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: claims } = await supabase
    .from("insurance_claims")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const activePolicies = (policies ?? []).filter((p) => p.status === "active");

  return (
    <>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              Asigurare animale
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Polițele tale, dosare daune și comparator asigurători.
            </p>
          </div>
          <Link
            href="/asigurare/adauga"
            className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            + Adaugă poliță
          </Link>
        </div>

        {/* Summary stats */}
        {activePolicies.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div
              className="rounded-2xl border p-3 text-center"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <div className="text-xl font-bold" style={{ color: "var(--primary)" }}>{activePolicies.length}</div>
              <div className="text-[11px]" style={{ color: "var(--muted)" }}>Polițe active</div>
            </div>
            <div
              className="rounded-2xl border p-3 text-center"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <div className="text-xl font-bold" style={{ color: "var(--primary)" }}>
                {(claims ?? []).filter((c) => c.status === "paid").length}
              </div>
              <div className="text-[11px]" style={{ color: "var(--muted)" }}>Daune plătite</div>
            </div>
            <div
              className="rounded-2xl border p-3 text-center"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <div className="text-xl font-bold" style={{ color: "var(--primary)" }}>
                {(activePolicies.reduce((s, p) => s + (p.premium_cents ?? 0), 0) / 100).toFixed(0)} RON
              </div>
              <div className="text-[11px]" style={{ color: "var(--muted)" }}>Prime/an total</div>
            </div>
          </div>
        )}

        {/* Policies */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
            Polițele mele
          </h2>

          {policies && policies.length > 0 ? (
            <div className="space-y-3">
              {policies.map((policy) => {
                const pet = policy.pets as unknown as { name: string; species: string } | null;
                const typeColor = POLICY_TYPE_COLORS[policy.policy_type] ?? POLICY_TYPE_COLORS.comprehensive;
                const statusColor = STATUS_COLORS[policy.status] ?? STATUS_COLORS.active;
                const expiresAt = policy.end_date ? new Date(policy.end_date) : null;
                const daysLeft = expiresAt
                  ? Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <div
                    key={policy.id}
                    className="rounded-2xl border p-4"
                    style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                            {policy.provider}
                          </p>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: typeColor.bg, color: typeColor.text }}
                          >
                            {POLICY_TYPE_LABELS[policy.policy_type] ?? policy.policy_type}
                          </span>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: statusColor.bg, color: statusColor.text }}
                          >
                            {policy.status === "active" ? "Activ" : policy.status === "expired" ? "Expirat" : "Anulat"}
                          </span>
                        </div>
                        {pet && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                            🐾 {pet.name}
                          </p>
                        )}
                        {policy.notes && (
                          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--muted)" }}>
                            {policy.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm" style={{ color: "var(--primary)" }}>
                          {((policy.premium_cents ?? 0) / 100).toFixed(0)} RON/an
                        </p>
                        {daysLeft !== null && daysLeft > 0 && daysLeft < 60 && (
                          <p className="text-[10px] mt-0.5" style={{ color: "#f59e0b" }}>
                            ⚠️ Expiră în {daysLeft} zile
                          </p>
                        )}
                        {expiresAt && (
                          <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                            Până: {expiresAt.toLocaleDateString("ro-RO")}
                          </p>
                        )}
                      </div>
                    </div>

                    {policy.policy_number && (
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        Nr. poliță: {policy.policy_number}
                      </p>
                    )}

                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/asigurare/dauna/${policy.id}`}
                        className="flex-1 flex items-center justify-center rounded-xl border py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                        style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
                      >
                        📋 Depune daună
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
              <div className="text-4xl mb-3">🛡️</div>
              <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                Nicio poliță adăugată
              </p>
              <p className="text-xs mt-1 mb-4" style={{ color: "var(--muted)" }}>
                Adaugă polița existentă sau compară ofertele de mai jos.
              </p>
              <Link
                href="/asigurare/adauga"
                className="inline-flex rounded-full bg-primary px-5 py-2 text-xs font-bold text-white"
              >
                + Adaugă poliță
              </Link>
            </div>
          )}
        </section>

        {/* Recent claims */}
        {claims && claims.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
              Dosare daune recente
            </h2>
            <div className="space-y-2">
              {claims.map((claim) => {
                const claimStatusColor = CLAIM_STATUS_COLORS[claim.status] ?? CLAIM_STATUS_COLORS.submitted;
                return (
                  <div
                    key={claim.id}
                    className="flex items-center gap-3 rounded-xl border p-3"
                    style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                        {claim.description}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {((claim.amount_cents ?? 0) / 100).toFixed(2)} RON ·{" "}
                        {claim.claim_date
                          ? new Date(claim.claim_date).toLocaleDateString("ro-RO")
                          : new Date(claim.created_at).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0"
                      style={{ background: claimStatusColor.bg, color: claimStatusColor.text }}
                    >
                      {CLAIM_STATUS_LABELS[claim.status] ?? claim.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Provider comparison */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
            Compară asigurători
          </h2>
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <div
              className="grid grid-cols-4 px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ background: "var(--surface)", color: "var(--muted)" }}
            >
              <span>Asigurător</span>
              <span className="text-center">Accident</span>
              <span className="text-center">Boală</span>
              <span className="text-center">Comprehensive</span>
            </div>
            {PROVIDERS.map((p, i) => (
              <div
                key={p.name}
                className="grid grid-cols-4 px-4 py-3 items-center"
                style={{
                  borderTop: i > 0 ? "1px solid var(--card-border)" : undefined,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.logo}</span>
                  <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{p.name}</span>
                </div>
                <span className="text-center text-xs" style={{ color: "var(--muted)" }}>{p.accident}</span>
                <span className="text-center text-xs" style={{ color: "var(--muted)" }}>{p.illness}</span>
                <span className="text-center text-xs font-bold" style={{ color: "var(--primary)" }}>{p.comprehensive}</span>
              </div>
            ))}
            <div className="border-t px-4 py-3" style={{ borderColor: "var(--card-border)" }}>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                * Prețuri orientative. Contactați asigurătorul pentru ofertă personalizată.
              </p>
            </div>
          </div>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
