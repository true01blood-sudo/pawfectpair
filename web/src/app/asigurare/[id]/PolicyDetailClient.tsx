"use client";

import { useState } from "react";
import Link from "next/link";

type Policy = {
  id: string;
  provider: string;
  policy_number: string | null;
  policy_type: string;
  premium_cents: number;
  coverage_limit_cents: number | null;
  deductible_cents: number | null;
  start_date: string;
  end_date: string;
  status: string;
  notes: string | null;
  pets: { name: string; species: string; breed: string | null } | null;
};

type Claim = {
  id: string;
  claim_date: string;
  description: string;
  amount_cents: number;
  status: string;
  decision_note: string | null;
  created_at: string;
};

type Props = {
  policy: Record<string, unknown>;
  claims: Record<string, unknown>[];
};

type Tab = "acoperire" | "deductibil" | "excluderi" | "daune";

const POLICY_TYPE_LABELS: Record<string, string> = {
  accident: "Accident",
  illness: "Boală",
  comprehensive: "Comprehensive",
  liability: "Răspundere civilă",
};

const CLAIM_STATUS_LABELS: Record<string, string> = {
  submitted: "Depus",
  approved: "Aprobat",
  rejected: "Respins",
  paid: "Plătit",
};

const CLAIM_STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  submitted: { bg: "color-mix(in srgb, #f59e0b 12%, transparent)", text: "#d97706" },
  approved: { bg: "color-mix(in srgb, #16a34a 12%, transparent)", text: "#16a34a" },
  rejected: { bg: "color-mix(in srgb, #ef4444 12%, transparent)", text: "#ef4444" },
  paid: { bg: "color-mix(in srgb, var(--primary) 12%, transparent)", text: "var(--primary)" },
};

const COVERAGE_BY_TYPE: Record<string, string[]> = {
  accident: [
    "Accidente rutiere și traumatisme",
    "Intervenții chirurgicale de urgență",
    "Fracturi și luxații",
    "Intoxicații accidentale",
    "Mușcături și răniri de la alte animale",
  ],
  illness: [
    "Consultații veterinare",
    "Analize de laborator",
    "Tratamente medicamentoase",
    "Boli cronice diagnosticate",
    "Hospitalizare veterinară",
    "Chirurgie electivă",
  ],
  comprehensive: [
    "Toate tipurile de accidente",
    "Consultații și tratamente boli",
    "Intervenții chirurgicale",
    "Analize și imagistică",
    "Internare și monitorizare",
    "Medicație cronică",
    "Terapii alternative aprobate",
    "Transport de urgență",
  ],
  liability: [
    "Daune produse altor persoane",
    "Daune materiale cauzate de animal",
    "Cheltuieli de judecată",
    "Mușcături și răniri ale terților",
  ],
};

const EXCLUSIONS_BY_TYPE: Record<string, string[]> = {
  accident: [
    "Boli preexistente",
    "Îngrijire preventivă (vaccinuri, deparazitare)",
    "Sterilizare și operații elective",
    "Hrănire și suplimente",
  ],
  illness: [
    "Afecțiuni congenitale",
    "Boli dentare (neacoperite standard)",
    "Sarcină și naștere",
    "Hrănire terapeutică",
  ],
  comprehensive: [
    "Afecțiuni congenitale diagnosticate înainte de poliță",
    "Cosmetică (tunsoare, toaletare)",
    "Sarcină electivă",
    "Vitamine și suplimente alimentare",
    "Cheltuieli de transport non-urgentă",
  ],
  liability: [
    "Daune intenționate",
    "Evenimente din teritorii neacoperite",
    "Animale neînregistrate legal",
  ],
};

export default function PolicyDetailClient({ policy: rawPolicy, claims: rawClaims }: Props) {
  const policy = rawPolicy as unknown as Policy;
  const claims = rawClaims as unknown as Claim[];
  const [activeTab, setActiveTab] = useState<Tab>("acoperire");

  const pet = policy.pets as { name: string; species: string; breed: string | null } | null;
  const premium = (policy.premium_cents ?? 0) / 100;
  const coverage = policy.coverage_limit_cents ? policy.coverage_limit_cents / 100 : null;
  const deductible = policy.deductible_cents ? policy.deductible_cents / 100 : null;
  const expiresAt = policy.end_date ? new Date(policy.end_date) : null;
  const startsAt = policy.start_date ? new Date(policy.start_date) : null;
  const isActive = policy.status === "active";
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400000) : null;
  const coverageItems = COVERAGE_BY_TYPE[policy.policy_type] ?? COVERAGE_BY_TYPE.comprehensive;
  const exclusionItems = EXCLUSIONS_BY_TYPE[policy.policy_type] ?? EXCLUSIONS_BY_TYPE.comprehensive;
  const totalClaimed = claims.filter((c) => c.status === "paid").reduce((s, c) => s + (c.amount_cents ?? 0), 0) / 100;

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: "acoperire", label: "Acoperire", emoji: "🛡️" },
    { id: "deductibil", label: "Deductibil", emoji: "💰" },
    { id: "excluderi", label: "Excluderi", emoji: "⛔" },
    { id: "daune", label: `Daune (${claims.length})`, emoji: "📋" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-28 md:pb-8">
      {/* Back */}
      <Link
        href="/asigurare"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-4"
        style={{ color: "var(--primary)" }}
      >
        ← Înapoi la asigurări
      </Link>

      {/* Hero card */}
      <div
        className="rounded-3xl p-5 mb-4"
        style={{
          background: isActive
            ? "linear-gradient(135deg, var(--primary) 0%, #ff8c4b 100%)"
            : "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-white/70 mb-1">
              {POLICY_TYPE_LABELS[policy.policy_type] ?? policy.policy_type}
            </p>
            <h1 className="text-2xl font-bold text-white">{policy.provider}</h1>
            {pet && (
              <p className="text-sm text-white/80 mt-1">
                🐾 {pet.name}{pet.breed ? ` · ${pet.breed}` : ""}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-white/70">Primă anuală</p>
            <p className="text-xl font-bold text-white">{premium.toFixed(0)} RON</p>
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
              style={{ background: isActive ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", color: "#fff" }}
            >
              {isActive ? "✓ Activ" : policy.status === "expired" ? "Expirat" : "Anulat"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: "Nr. poliță", value: policy.policy_number ?? "—" },
            { label: "Valabil de la", value: startsAt ? startsAt.toLocaleDateString("ro-RO") : "—" },
            { label: daysLeft && daysLeft > 0 ? `Expiră în ${daysLeft}z` : "Expiră la", value: expiresAt ? expiresAt.toLocaleDateString("ro-RO") : "—" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl p-2 text-center"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <p className="text-[10px] text-white/70">{item.label}</p>
              <p className="text-xs font-bold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-shrink-0 flex items-center gap-1 rounded-full px-4 py-2 text-xs font-semibold transition-colors border"
            style={{
              background: activeTab === tab.id ? "var(--primary)" : "var(--card-bg)",
              borderColor: activeTab === tab.id ? "var(--primary)" : "var(--card-border)",
              color: activeTab === tab.id ? "#fff" : "var(--foreground)",
            }}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        className="rounded-2xl border p-4"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        {activeTab === "acoperire" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                Ce este acoperit
              </p>
              {coverage && (
                <div className="text-right">
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Limită maximă</p>
                  <p className="font-bold text-sm" style={{ color: "var(--primary)" }}>
                    {coverage.toLocaleString("ro-RO")} RON
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {coverageItems.map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                    style={{ background: "color-mix(in srgb, #16a34a 15%, transparent)", color: "#16a34a" }}
                  >
                    ✓
                  </span>
                  <p className="text-sm" style={{ color: "var(--foreground)" }}>{item}</p>
                </div>
              ))}
            </div>
            {coverage && totalClaimed > 0 && (
              <div
                className="mt-4 rounded-xl p-3"
                style={{ background: "var(--surface)" }}
              >
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "var(--muted)" }}>Utilizat din limită</span>
                  <span className="font-bold" style={{ color: "var(--primary)" }}>
                    {totalClaimed.toFixed(0)} / {coverage.toLocaleString("ro-RO")} RON
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--card-border)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((totalClaimed / coverage) * 100, 100)}%`,
                      background: "var(--primary)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "deductibil" && (
          <div>
            <p className="font-bold text-sm mb-4" style={{ color: "var(--foreground)" }}>
              Franciză și deductibil
            </p>

            {deductible !== null ? (
              <div
                className="rounded-2xl p-4 mb-4 text-center"
                style={{
                  background: "color-mix(in srgb, var(--primary) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--primary) 15%, transparent)",
                }}
              >
                <p className="text-3xl font-bold mb-1" style={{ color: "var(--primary)" }}>
                  {deductible.toFixed(0)} RON
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Suma pe care o plătești pentru fiecare daună
                </p>
              </div>
            ) : (
              <div
                className="rounded-2xl p-4 mb-4 text-center"
                style={{ background: "var(--surface)" }}
              >
                <p className="text-2xl font-bold mb-1" style={{ color: "var(--foreground)" }}>0 RON</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Fără franciză — toate daunele sunt acoperite integral</p>
              </div>
            )}

            <div className="space-y-3">
              {[
                { title: "Cum funcționează franciza", desc: "La fiecare daună aprobată, suma francizei este dedusă din despăgubire. Restul îl primești direct în cont." },
                { title: "Limita de despăgubire", desc: coverage ? `${coverage.toLocaleString("ro-RO")} RON/an. Suma maximă pe care asigurătorul o va plăti în total pe an.` : "Fără limită anuală specificată." },
                { title: "Prima anuală", desc: `${premium.toFixed(0)} RON/an. Plătești această sumă indiferent de numărul de daune depuse.` },
              ].map((info) => (
                <div
                  key={info.title}
                  className="rounded-xl p-3"
                  style={{ background: "var(--surface)" }}
                >
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>{info.title}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{info.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "excluderi" && (
          <div>
            <p className="font-bold text-sm mb-1" style={{ color: "var(--foreground)" }}>
              Ce nu este acoperit
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
              Citește cu atenție excluderile înainte de a depune o daună.
            </p>
            <div className="space-y-2">
              {exclusionItems.map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px]"
                    style={{ background: "color-mix(in srgb, #ef4444 12%, transparent)", color: "#ef4444" }}
                  >
                    ✕
                  </span>
                  <p className="text-sm" style={{ color: "var(--foreground)" }}>{item}</p>
                </div>
              ))}
            </div>
            <div
              className="mt-4 rounded-xl border p-3 flex items-start gap-2"
              style={{
                background: "color-mix(in srgb, #f59e0b 8%, transparent)",
                borderColor: "color-mix(in srgb, #f59e0b 20%, transparent)",
              }}
            >
              <span className="text-base shrink-0">⚠️</span>
              <p className="text-xs" style={{ color: "#92400e" }}>
                Această listă este orientativă. Consultați termenii și condițiile complete ale poliței pentru detalii exhaustive.
              </p>
            </div>
          </div>
        )}

        {activeTab === "daune" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                Istoricul daunelor
              </p>
              <Link
                href={`/asigurare/dauna/${policy.id}`}
                className="rounded-full px-3 py-1.5 text-xs font-bold text-white"
                style={{ background: "var(--primary)" }}
              >
                + Daună nouă
              </Link>
            </div>

            {claims.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Nicio daună depusă
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  Depune prima ta daună dacă ai o cheltuială acoperită.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {claims.map((claim) => {
                  const sc = CLAIM_STATUS_COLOR[claim.status] ?? CLAIM_STATUS_COLOR.submitted;
                  return (
                    <div
                      key={claim.id}
                      className="rounded-xl border p-3"
                      style={{ background: "var(--surface)", borderColor: "var(--card-border)" }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                            {claim.description}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                            {claim.claim_date
                              ? new Date(claim.claim_date).toLocaleDateString("ro-RO")
                              : new Date(claim.created_at).toLocaleDateString("ro-RO")}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                            {((claim.amount_cents ?? 0) / 100).toFixed(2)} RON
                          </p>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: sc.bg, color: sc.text }}
                          >
                            {CLAIM_STATUS_LABELS[claim.status] ?? claim.status}
                          </span>
                        </div>
                      </div>
                      {claim.decision_note && (
                        <p className="text-xs mt-2 pt-2 border-t" style={{ color: "var(--muted)", borderColor: "var(--card-border)" }}>
                          💬 {claim.decision_note}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      {policy.notes && (
        <div
          className="mt-4 rounded-2xl border p-4"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>Note personale</p>
          <p className="text-sm whitespace-pre-line" style={{ color: "var(--foreground)" }}>{policy.notes}</p>
        </div>
      )}
    </div>
  );
}
