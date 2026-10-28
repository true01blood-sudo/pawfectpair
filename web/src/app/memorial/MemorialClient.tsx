"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Memorial = {
  id: string;
  pet_name: string;
  species: string | null;
  photo_url: string | null;
  tribute: string | null;
  favorite_memory: string | null;
  passed_at: string;
  resting_place: string | null;
  is_public: boolean;
};

type Props = {
  myMemorials: Record<string, unknown>[];
  publicMemorials: Record<string, unknown>[];
  userId: string;
};

const SPECIES_EMOJI: Record<string, string> = {
  caine: "🐶", pisica: "🐱", iepure: "🐰", pasare: "🐦", hamster: "🐹",
};
function spEmoji(s: string | null) {
  return SPECIES_EMOJI[(s ?? "").toLowerCase()] ?? "🐾";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
}

type NewMemorialForm = {
  pet_name: string;
  species: string;
  tribute: string;
  favorite_memory: string;
  passed_at: string;
  resting_place: string;
  is_public: boolean;
};

export default function MemorialClient({ myMemorials: rawMy, publicMemorials: rawPublic }: Props) {
  const myMemorials = rawMy as unknown as Memorial[];
  const publicMemorials = rawPublic as unknown as Memorial[];

  const [selected, setSelected] = useState<Memorial | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewMemorialForm>({
    pet_name: "", species: "caine", tribute: "",
    favorite_memory: "", passed_at: "", resting_place: "", is_public: false,
  });
  const [saving, startSaving] = useTransition();
  const [toggleMap, setToggleMap] = useState<Record<string, boolean>>({});
  const router = useRouter();

  async function handleSave() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    startSaving(async () => {
      await supabase.from("pet_memorials").insert({
        user_id: user.id,
        pet_name: form.pet_name.trim(),
        species: form.species || null,
        tribute: form.tribute.trim() || null,
        favorite_memory: form.favorite_memory.trim() || null,
        passed_at: form.passed_at,
        resting_place: form.resting_place.trim() || null,
        is_public: form.is_public,
      });
      setShowForm(false);
      router.refresh();
    });
  }

  async function togglePublic(memorial: Memorial) {
    const supabase = createClient();
    const newVal = !memorial.is_public;
    setToggleMap((m) => ({ ...m, [memorial.id]: newVal }));
    await supabase.from("pet_memorials").update({ is_public: newVal }).eq("id", memorial.id);
    router.refresh();
  }

  async function handleExport(memorial: Memorial) {
    const lines = [
      `Memorial: ${memorial.pet_name}`,
      memorial.species ? `Specie: ${memorial.species}` : "",
      `Data plecării: ${formatDate(memorial.passed_at)}`,
      memorial.resting_place ? `Loc de odihnă: ${memorial.resting_place}` : "",
      "",
      memorial.tribute ? `Tribut:\n${memorial.tribute}` : "",
      "",
      memorial.favorite_memory ? `Amintire preferată:\n${memorial.favorite_memory}` : "",
    ].filter((l) => l !== undefined).join("\n");

    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memorial_${memorial.pet_name.toLowerCase().replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-28 md:pb-8">
      {/* Header */}
      <div className="mb-6">
        <div
          className="rounded-3xl p-6 mb-4 text-center"
          style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)" }}
        >
          <p className="text-3xl mb-2">🌟</p>
          <h1 className="text-xl font-bold text-white">Grădina amintirilor</h1>
          <p className="text-sm text-indigo-200 mt-1">
            Un loc special pentru cei care au adus bucurie în viața noastră.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full rounded-full py-3 text-sm font-semibold text-white transition-colors"
          style={{ background: "var(--primary)" }}
        >
          + Creează un memorial
        </button>
      </div>

      {/* New memorial form */}
      {showForm && (
        <div
          className="rounded-2xl border p-4 mb-6"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <h2 className="font-bold text-sm mb-4" style={{ color: "var(--foreground)" }}>
            Memorial nou
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Numele animalului *</label>
              <input
                type="text"
                value={form.pet_name}
                onChange={(e) => setForm({ ...form, pet_name: e.target.value })}
                placeholder="ex: Bella"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-primary"
                style={{ background: "var(--surface)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Specie</label>
                <select
                  value={form.species}
                  onChange={(e) => setForm({ ...form, species: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--surface)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                >
                  {["caine", "pisica", "iepure", "pasare", "hamster", "altele"].map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Data plecării *</label>
                <input
                  type="date"
                  value={form.passed_at}
                  onChange={(e) => setForm({ ...form, passed_at: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--surface)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Tribut / mesaj de amintire</label>
              <textarea
                value={form.tribute}
                onChange={(e) => setForm({ ...form, tribute: e.target.value })}
                rows={3}
                placeholder="Scrie câteva cuvinte despre cel drag..."
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none resize-none"
                style={{ background: "var(--surface)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Amintire preferată</label>
              <textarea
                value={form.favorite_memory}
                onChange={(e) => setForm({ ...form, favorite_memory: e.target.value })}
                rows={2}
                placeholder="Un moment special pe care nu-l vei uita niciodată..."
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none resize-none"
                style={{ background: "var(--surface)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Loc de odihnă (opțional)</label>
              <input
                type="text"
                value={form.resting_place}
                onChange={(e) => setForm({ ...form, resting_place: e.target.value })}
                placeholder="ex: Grădina casei, Cimitirul Prietenilor"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setForm({ ...form, is_public: !form.is_public })}
                className="w-10 h-6 rounded-full transition-colors relative cursor-pointer"
                style={{ background: form.is_public ? "var(--primary)" : "var(--card-border)" }}
              >
                <div
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: form.is_public ? "calc(100% - 20px)" : "4px" }}
                />
              </div>
              <span className="text-sm" style={{ color: "var(--foreground)" }}>
                Fă memorialul public în Grădina amintirilor
              </span>
            </label>
            <button
              onClick={handleSave}
              disabled={saving || !form.pet_name.trim() || !form.passed_at}
              className="w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--primary)" }}
            >
              {saving ? "Se salvează..." : "Creează memorialul"}
            </button>
          </div>
        </div>
      )}

      {/* My memorials */}
      {myMemorials.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
            Memoriale personale ({myMemorials.length})
          </h2>
          <div className="space-y-4">
            {myMemorials.map((mem) => {
              const currentPublic = toggleMap[mem.id] !== undefined ? toggleMap[mem.id] : mem.is_public;
              const isSelected = selected?.id === mem.id;
              return (
                <div
                  key={mem.id}
                  className="rounded-2xl border overflow-hidden"
                  style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                >
                  {/* Card header */}
                  <button
                    className="w-full p-4 text-left flex items-start gap-3"
                    onClick={() => setSelected(isSelected ? null : mem)}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl overflow-hidden"
                      style={{ background: "linear-gradient(135deg, #1e1b4b, #4c1d95)" }}
                    >
                      {mem.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mem.photo_url} alt={mem.pet_name} className="w-full h-full object-cover" />
                      ) : (
                        spEmoji(mem.species)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold" style={{ color: "var(--foreground)" }}>
                        Remembering {mem.pet_name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        {mem.species} · {formatDate(mem.passed_at)}
                      </p>
                      {mem.tribute && (
                        <p className="text-xs mt-1 line-clamp-2 italic" style={{ color: "var(--muted)" }}>
                          "{mem.tribute}"
                        </p>
                      )}
                    </div>
                    <span className="text-lg">{isSelected ? "▲" : "▼"}</span>
                  </button>

                  {/* Expanded content */}
                  {isSelected && (
                    <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--card-border)" }}>
                      {mem.favorite_memory && (
                        <div
                          className="mt-3 rounded-xl p-3"
                          style={{
                            background: "color-mix(in srgb, #7c3aed 8%, transparent)",
                            border: "1px solid color-mix(in srgb, #7c3aed 15%, transparent)",
                          }}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#7c3aed" }}>
                            Amintire preferată
                          </p>
                          <p className="text-sm italic" style={{ color: "var(--foreground)" }}>
                            "{mem.favorite_memory}"
                          </p>
                        </div>
                      )}

                      {mem.resting_place && (
                        <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
                          🌿 Loc de odihnă: <span style={{ color: "var(--foreground)" }}>{mem.resting_place}</span>
                        </p>
                      )}

                      {/* Settings */}
                      <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--card-border)" }}>
                        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                          Setări memorial
                        </p>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                              Vizibilitate publică
                            </p>
                            <p className="text-xs" style={{ color: "var(--muted)" }}>
                              {currentPublic ? "Vizibil în Grădina amintirilor" : "Doar tu poți vedea"}
                            </p>
                          </div>
                          <div
                            onClick={() => togglePublic(mem)}
                            className="w-11 h-6 rounded-full transition-colors relative cursor-pointer"
                            style={{ background: currentPublic ? "var(--primary)" : "var(--card-border)" }}
                          >
                            <div
                              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                              style={{ left: currentPublic ? "calc(100% - 20px)" : "4px" }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleExport(mem)}
                          className="w-full flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                          style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
                        >
                          📤 Exportă memorialul (.txt)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {myMemorials.length === 0 && !showForm && (
        <div
          className="rounded-2xl border-2 border-dashed p-10 text-center mb-8"
          style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
        >
          <p className="text-4xl mb-3">🌸</p>
          <p className="font-semibold" style={{ color: "var(--foreground)" }}>
            Niciun memorial creat
          </p>
          <p className="text-sm mt-1 mb-4" style={{ color: "var(--muted)" }}>
            Creează un loc special pentru cei dragi care au plecat.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white"
          >
            + Primul memorial
          </button>
        </div>
      )}

      {/* Garden of Memories (public memorials) */}
      {publicMemorials.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
            🌿 Grădina amintirilor
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {publicMemorials.map((mem) => (
              <div
                key={mem.id}
                className="rounded-2xl border overflow-hidden"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                <div
                  className="h-28 flex items-center justify-center text-4xl"
                  style={{ background: "linear-gradient(135deg, #1e1b4b, #4c1d95)" }}
                >
                  {mem.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mem.photo_url} alt={mem.pet_name} className="w-full h-full object-cover" />
                  ) : (
                    spEmoji(mem.species)
                  )}
                </div>
                <div className="p-3">
                  <p className="font-bold text-xs mb-0.5" style={{ color: "var(--foreground)" }}>
                    {mem.pet_name}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                    {mem.passed_at ? new Date(mem.passed_at).getFullYear() : ""}
                    {mem.resting_place ? ` · ${mem.resting_place}` : ""}
                  </p>
                  {mem.tribute && (
                    <p className="text-[10px] italic mt-1 line-clamp-2" style={{ color: "var(--muted)" }}>
                      "{mem.tribute}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
