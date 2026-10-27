import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Asigurare animale — PetCare",
  description: "Gestionează polițele de asigurare ale animalelor tale și dosarele de daune.",
};

const COVERAGE_LABELS: Record<string, string> = {
  basic: "Basic",
  comprehensive: "Comprehensive",
  premium: "Premium",
};

const COVERAGE_COLORS: Record<string, { bg: string; text: string }> = {
  basic: { bg: "color-mix(in srgb, #6b7280 12%, transparent)", text: "#6b7280" },
  comprehensive: { bg: "color-mix(in srgb, #3b82f6 12%, transparent)", text: "#2563eb" },
  premium: { bg: "color-mix(in srgb, var(--primary) 12%, transparent)", text: "var(--primary)" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: "color-mix(in srgb, #16a34a 12%, transparent)", text: "#16a34a" },
  expired: { bg: "color-mix(in srgb, #6b7280 12%, transparent)", text: "#6b7280" },
  cancelled: { bg: "color-mix(in srgb, #ef4444 12%, transparent)", text: "#ef4444" },
};

const CLAIM_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  submitted: { bg: "color-mix(in srgb, #f59e0b 12%, transparent)", text: "#d97706" },
  processing: { bg: "color-mix(in srgb, #3b82f6 12%, transparent)", text: "#2563eb" },
  approved: { bg: "color-mix(in srgb, #16a34a 12%, transparent)", text: "#16a34a" },
  rejected: { bg: "color-mix(in srgb, #ef4444 12%, transparent)", text: "#ef4444" },
  paid: { bg: "color-mix(in srgb, var(--primary) 12%, transparent)", text: "var(--primary)" },
};

const CLAIM_STATUS_LABELS: Record<string, string> = {
  submitted: "Depus",
  processing: "În analiză",
  approved: "Aprobat",
  rejected: "Respins",
  paid: "Plătit",
};

// Insurance providers for comparison
const PROVIDERS = [
  { name: "Omniasig", logo: "🏛️", basic: "150 RON/an", comprehensive: "320 RON/an", premium: "580 RON/an" },
  { name: "Groupama", logo: "🌿", basic: "180 RON/an", comprehensive: "380 RON/an", premium: "650 RON/an" },
  { name: "Allianz", logo: "🔵", basic: "200 RON/an", comprehensive: "420 RON/an", premium: "720 RON/an" },
];

export default async function AsigurarePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: policies } = await supabase
    .from("insurance_policies")
    .select("*, pets(name, species)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const { data: claims } = await supabase
    .from("insurance_claims")
    .select("*")
    .eq("owner_id", user.id)
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
                {((claims ?? []).filter((c) => c.status === "paid").length)}
              </div>
              <div className="text-[11px]" style={{ color: "var(--muted)" }}>Daune plătite</div>
            </div>
            <div
              className="rounded-2xl border p-3 text-center"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <div className="text-xl font-bold" style={{ color: "var(--primary)" }}>
                {(activePolicies.reduce((s, p) => s + p.annual_premium_cents, 0) / 100).toFixed(0)} RON
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
                const coverageColor = COVERAGE_COLORS[policy.coverage_type] ?? COVERAGE_COLORS.basic;
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
                            {policy.provider_name}
                          </p>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: coverageColor.bg, color: coverageColor.text }}
                          >
                            {COVERAGE_LABELS[policy.coverage_type]}
                          </span>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: statusColor.bg, color: statusColor.text }}
                          >
                            {policy.status === "active" ? "Activ" : policy.status === "expired" ? "Expirat" : "Anulat"}
                          </span>
                        </div>
                        {policy.plan_name && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                            {policy.plan_name}
                          </p>
                        )}
                        {pet && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                            🐾 {pet.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm" style={{ color: "var(--primary)" }}>
                          {(policy.annual_premium_cents / 100).toFixed(0)} {policy.currency}/an
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
                      {policy.documents_url && (
                        <a
                          href={policy.documents_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center rounded-xl border py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                          style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
                        >
                          📄 Document
                        </a>
                      )}
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
                        {claim.title}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {(claim.amount_cents / 100).toFixed(2)} RON ·{" "}
                        {new Date(claim.created_at).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0"
                      style={{ background: claimStatusColor.bg, color: claimStatusColor.text }}
                    >
                      {CLAIM_STATUS_LABELS[claim.status]}
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
              <span className="text-center">Basic</span>
              <span className="text-center">Comprehensive</span>
              <span className="text-center">Premium</span>
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
                <span className="text-center text-xs" style={{ color: "var(--muted)" }}>{p.basic}</span>
                <span className="text-center text-xs" style={{ color: "var(--muted)" }}>{p.comprehensive}</span>
                <span className="text-center text-xs font-bold" style={{ color: "var(--primary)" }}>{p.premium}</span>
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
