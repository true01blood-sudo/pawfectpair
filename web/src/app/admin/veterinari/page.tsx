import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Breadcrumb from "@/components/Breadcrumb";
import { deleteVet } from "../actions";

export default async function AdminVeterinariPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const { data: vets } = await supabase
    .from("vets")
    .select("id, clinic_name, city, address, phone, created_at")
    .order("created_at", { ascending: false });

  const { data: reviews } = await supabase.from("vet_reviews").select("vet_id, rating");
  const ratingByVet = new Map<string, number[]>();
  reviews?.forEach((r) => {
    const arr = ratingByVet.get(r.vet_id) ?? [];
    arr.push(r.rating);
    ratingByVet.set(r.vet_id, arr);
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ href: "/", label: "Acasă" }, { href: "/profil", label: "Profil" }, { href: "/admin", label: "Panou Admin" }, { label: "Veterinari" }]} />
      <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--foreground)" }}>
        Cabinete veterinare (admin)
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        {vets?.length ?? 0} cabinet{(vets?.length ?? 0) === 1 ? "" : "e"} înregistrat{(vets?.length ?? 0) === 1 ? "" : "e"}.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {vets && vets.length > 0 ? (
          vets.map((v) => {
            const ratings = ratingByVet.get(v.id);
            const avg = ratings && ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
            return (
              <div
                key={v.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm shadow-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
              >
                <div className="min-w-0">
                  <p className="font-medium" style={{ color: "var(--foreground)" }}>{v.clinic_name}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {v.city ?? "Oraș nespecificat"}{v.address ? ` · ${v.address}` : ""}{v.phone ? ` · ${v.phone}` : ""}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {avg ? `★ ${avg.toFixed(1)} (${ratings!.length})` : "Fără recenzii"} · înregistrat {new Date(v.created_at).toLocaleDateString("ro-RO")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`/veterinari/${v.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-8 flex items-center rounded-full border px-3 text-xs transition-colors hover:border-primary/40"
                    style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                  >
                    Vezi profil
                  </a>
                  <form action={deleteVet.bind(null, v.id)}>
                    <button className="text-xs text-red-500 hover:underline">Șterge</button>
                  </form>
                </div>
              </div>
            );
          })
        ) : (
          <p
            className="rounded-2xl border border-dashed p-8 text-center text-sm"
            style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
          >
            Niciun cabinet înregistrat.
          </p>
        )}
      </div>
    </main>
  );
}
