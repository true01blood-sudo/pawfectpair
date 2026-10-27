"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const TYPES = [
  { value: "vaccination", label: "💉 Vaccinare" },
  { value: "treatment", label: "💊 Tratament" },
  { value: "checkup", label: "🩺 Control anual" },
  { value: "surgery", label: "🔪 Operație" },
  { value: "allergy", label: "⚠️ Alergie" },
  { value: "other", label: "📋 Altele" },
];

export default function AdaugaInregistrarePage({ params }: { params: { petId: string } }) {
  const router = useRouter();
  const [type, setType] = useState("vaccination");
  const [title, setTitle] = useState("");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split("T")[0]);
  const [nextDueDate, setNextDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Titlul este obligatoriu."); return; }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error: err } = await supabase.from("medical_records").insert({
      pet_id: params.petId,
      created_by: user.id,
      type,
      title: title.trim(),
      record_date: recordDate,
      next_due_date: nextDueDate || null,
      notes: notes.trim() || null,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    router.push(`/sanatate/${params.petId}`);
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:px-6 pb-24 md:pb-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/sanatate/${params.petId}`}
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--muted)" }}
        >
          ← Înapoi
        </Link>
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
          Adaugă înregistrare
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tip */}
        <div>
          <label className="block text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Tip înregistrare
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className="rounded-xl border p-3 text-xs font-medium text-center transition-colors"
                style={{
                  background: type === t.value ? "color-mix(in srgb, var(--primary) 12%, transparent)" : "var(--card-bg)",
                  borderColor: type === t.value ? "var(--primary)" : "var(--card-border)",
                  color: type === t.value ? "var(--primary)" : "var(--foreground)",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Titlu */}
        <div>
          <label className="block text-xs font-bold mb-1.5 uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Titlu *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === "vaccination" ? "ex: Vaccinare antirabică anuală" : "ex: Tratament purici și căpușe"}
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
              color: "var(--foreground)",
            }}
            required
          />
        </div>

        {/* Data */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Data efectuării *
            </label>
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
              style={{
                background: "var(--card-bg)",
                borderColor: "var(--card-border)",
                color: "var(--foreground)",
              }}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Repetare / Scadență
            </label>
            <input
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
              style={{
                background: "var(--card-bg)",
                borderColor: "var(--card-border)",
                color: "var(--foreground)",
              }}
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-bold mb-1.5 uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Note
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Informații suplimentare, doze, medicamente..."
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {error && (
          <p className="rounded-xl border px-4 py-3 text-sm" style={{ background: "#fef2f2", borderColor: "#fca5a5", color: "#dc2626" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-white hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {loading ? "Se salvează..." : "Salvează înregistrarea"}
        </button>
      </form>
    </main>
  );
}
