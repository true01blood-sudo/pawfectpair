import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ImageUpload from "@/components/ImageUpload";
import { addClinicDocument } from "../actions";

const STATUS_LABELS: Record<string, string> = {
  pending: "În așteptare",
  approved: "Aprobat",
  rejected: "Respins",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#d97706",
  approved: "#16a34a",
  rejected: "#ef4444",
};

export default async function ClinicDoveziPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vet } = await supabase
    .from("vets")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!vet) redirect("/veterinari/adauga");

  const { data: documents } = await supabase
    .from("clinic_documents")
    .select("id, title, file_url, status, created_at")
    .eq("vet_id", vet.id)
    .order("created_at", { ascending: false });

  const inputStyle = {
    borderColor: "var(--card-border)",
    color: "var(--foreground)",
    background: "var(--card-bg)",
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Dovezi</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Diplome, certificări și autorizații care îți verifică profilul profesional.
        </p>
      </div>

      <section className="mb-8">
        {documents && documents.length > 0 ? (
          <div className="flex flex-col gap-3">
            {documents.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-2xl border p-3"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.file_url} alt={d.title} className="h-14 w-14 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "var(--foreground)" }}>{d.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    Încărcat {new Date(d.created_at).toLocaleDateString("ro-RO")}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                  style={{
                    background: `color-mix(in srgb, ${STATUS_COLORS[d.status]} 14%, transparent)`,
                    color: STATUS_COLORS[d.status],
                  }}
                >
                  {STATUS_LABELS[d.status] ?? d.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p
            className="rounded-2xl border border-dashed p-8 text-center text-sm"
            style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
          >
            Nicio dovadă încărcată încă.
          </p>
        )}
      </section>

      <section
        className="rounded-2xl border p-5"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <h2 className="font-semibold mb-3" style={{ color: "var(--foreground)" }}>Încarcă o dovadă nouă</h2>
        <form action={addClinicDocument} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
              Titlu <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              required
              placeholder="Ex: Diplomă medic veterinar"
              className="w-full min-h-11 rounded-xl border px-4 text-sm"
              style={inputStyle}
            />
          </div>
          <ImageUpload name="file_url" label="Fotografie document (opțional pentru previzualizare rapidă)" />
          <button
            type="submit"
            className="self-start rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)" }}
          >
            Încarcă dovada
          </button>
        </form>
        <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
          Dovezile încărcate rămân „În așteptare" până la verificarea manuală de către echipa PawfectPair.
        </p>
      </section>
    </main>
  );
}
