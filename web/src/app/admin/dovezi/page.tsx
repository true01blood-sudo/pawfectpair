import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Breadcrumb from "@/components/Breadcrumb";
import { setDocumentStatus } from "../actions";

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

type DocRow = {
  id: string;
  title: string;
  file_url: string;
  status: string;
  created_at: string;
  vets: { clinic_name: string } | null;
};

export default async function AdminDoveziPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const { data: documents } = await supabase
    .from("clinic_documents")
    .select("id, title, file_url, status, created_at, vets(clinic_name)")
    .order("created_at", { ascending: false });

  const rows = (documents ?? []) as unknown as DocRow[];
  const pending = rows.filter((d) => d.status === "pending");
  const reviewed = rows.filter((d) => d.status !== "pending");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ href: "/", label: "Acasă" }, { href: "/profil", label: "Profil" }, { href: "/admin", label: "Panou Admin" }, { label: "Dovezi" }]} />
      <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--foreground)" }}>
        Dovezi cabinete (admin)
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        {pending.length} dovad{pending.length === 1 ? "ă" : "ăi"} în așteptare de verificare.
      </p>

      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
          În așteptare
        </h2>
        {pending.length > 0 ? (
          <div className="flex flex-col gap-3">
            {pending.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-2xl border p-3"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.file_url} alt={d.title} className="h-16 w-16 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{d.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {d.vets?.clinic_name ?? "Cabinet"} · {new Date(d.created_at).toLocaleDateString("ro-RO")}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <form action={setDocumentStatus.bind(null, d.id, "approved")}>
                      <button className="min-h-9 rounded-full bg-primary px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                        Aprobă
                      </button>
                    </form>
                    <form action={setDocumentStatus.bind(null, d.id, "rejected")}>
                      <button
                        className="min-h-9 rounded-full border px-4 text-xs font-medium transition-colors hover:border-red-300 hover:text-red-500"
                        style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                      >
                        Respinge
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p
            className="rounded-2xl border border-dashed p-6 text-center text-sm"
            style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
          >
            Nicio dovadă în așteptare.
          </p>
        )}
      </section>

      {reviewed.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
            Verificate anterior
          </h2>
          <div className="flex flex-col gap-2">
            {reviewed.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-xl border p-3 text-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
              >
                <span style={{ color: "var(--foreground)" }}>
                  {d.title} — {d.vets?.clinic_name ?? "Cabinet"}
                </span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0"
                  style={{ background: `color-mix(in srgb, ${STATUS_COLORS[d.status]} 14%, transparent)`, color: STATUS_COLORS[d.status] }}
                >
                  {STATUS_LABELS[d.status] ?? d.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
