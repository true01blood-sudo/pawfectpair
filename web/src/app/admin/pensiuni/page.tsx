import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Breadcrumb from "@/components/Breadcrumb";
import { toggleListingVerified, toggleListingActive, deletePetdayListing, deletePetdayReview } from "../actions";

export default async function AdminPensiuniPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const [{ data: listings }, { data: reviews }] = await Promise.all([
    supabase
      .from("petday_listings")
      .select("id, title, city, provider_type, verified, active, created_at, profiles(full_name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("petday_reviews")
      .select("id, rating, comment, created_at, profiles(full_name), petday_listings(title)")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ href: "/", label: "Acasă" }, { href: "/profil", label: "Profil" }, { href: "/admin", label: "Panou Admin" }, { label: "Pensiuni" }]} />
      <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--foreground)" }}>
        Pensiuni & Cazare (admin)
      </h1>

      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
          Unități de cazare ({listings?.length ?? 0})
        </h2>
        {listings && listings.length > 0 ? (
          <div className="flex flex-col gap-2">
            {listings.map((l) => {
              const owner = l.profiles as unknown as { full_name: string } | null;
              return (
                <div
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm shadow-sm"
                  style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
                >
                  <div className="min-w-0">
                    <p className="font-medium" style={{ color: "var(--foreground)" }}>
                      {l.title} {l.verified && <span title="Verificat">✅</span>} {!l.active && <span className="text-[10px] font-semibold" style={{ color: "#ef4444" }}>(inactiv)</span>}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {l.city} · {l.provider_type === "center" ? "Centru" : "Sitter"} · {owner?.full_name ?? "?"} · {new Date(l.created_at).toLocaleDateString("ro-RO")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <form action={toggleListingVerified.bind(null, l.id, !l.verified)}>
                      <button className="min-h-8 rounded-full border px-3 text-xs hover:border-green-400 hover:text-green-600" style={{ borderColor: "var(--card-border)" }}>
                        {l.verified ? "Retrage verificarea" : "Verifică"}
                      </button>
                    </form>
                    <form action={toggleListingActive.bind(null, l.id, !l.active)}>
                      <button className="min-h-8 rounded-full border px-3 text-xs hover:border-amber-400 hover:text-amber-600" style={{ borderColor: "var(--card-border)" }}>
                        {l.active ? "Dezactivează" : "Activează"}
                      </button>
                    </form>
                    <form action={deletePetdayListing.bind(null, l.id)}>
                      <button className="text-xs text-red-500 hover:underline">Șterge</button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Nicio unitate de cazare.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
          Recenzii recente ({reviews?.length ?? 0})
        </h2>
        {reviews && reviews.length > 0 ? (
          <div className="flex flex-col gap-2">
            {reviews.map((r) => {
              const author = r.profiles as unknown as { full_name: string } | null;
              const listing = r.petday_listings as unknown as { title: string } | null;
              return (
                <div
                  key={r.id}
                  className="flex items-start justify-between gap-3 rounded-xl border p-3 text-sm shadow-sm"
                  style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                      {author?.full_name ?? "?"} → {listing?.title ?? "?"} · {"★".repeat(r.rating)} · {new Date(r.created_at).toLocaleDateString("ro-RO")}
                    </p>
                    {r.comment && <p className="mt-0.5 text-sm" style={{ color: "var(--foreground)" }}>{r.comment}</p>}
                  </div>
                  <form action={deletePetdayReview.bind(null, r.id)}>
                    <button className="shrink-0 text-xs text-red-500 hover:underline">Șterge</button>
                  </form>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Nicio recenzie.</p>
        )}
      </section>
    </main>
  );
}
