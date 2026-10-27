import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Breadcrumb from "@/components/Breadcrumb";
import { updateListingStatus, deleteListing, deleteForumPost, updateResqStatus, deleteResqCase } from "./actions";

const statusLabels: Record<string, { label: string; color: string }> = {
  available: { label: "Disponibil", color: "#10b981" },
  adopted: { label: "Adoptat", color: "#3b82f6" },
  removed: { label: "Eliminat", color: "#ef4444" },
  open: { label: "Deschis", color: "#ef4444" },
  closed: { label: "Închis", color: "#6b7280" },
  resolved: { label: "Rezolvat", color: "#10b981" },
};

export default async function AdminContinutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const [
    { data: listings },
    { data: forumPosts },
    { data: resqCases },
  ] = await Promise.all([
    supabase.from("adoption_listings")
      .select("id, name, species, breed, city, status, created_at, photo_url, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("forum_posts")
      .select("id, content, created_at, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("resq_cases")
      .select("id, species, description, status, created_at, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ href: "/admin", label: "Admin" }, { label: "Moderare conținut" }]} />
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">Moderare conținut</h1>

      {/* Adoption listings */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Anunțuri adopție ({listings?.length ?? 0})</h2>
        </div>
        {listings && listings.length > 0 ? (
          <ul className="flex flex-col gap-2 mb-8">
            {listings.map((l) => {
              const poster = l.profiles as unknown as { full_name: string } | null;
              const s = statusLabels[l.status] ?? { label: l.status, color: "#6b7280" };
              return (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm shadow-sm"
                  style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    {l.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.photo_url} alt={l.name} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{l.name} — {l.species} {l.breed ? `(${l.breed})` : ""}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {l.city} · {poster?.full_name ?? "?"} · {new Date(l.created_at).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</span>
                    <form action={updateListingStatus.bind(null, l.id, "available")}>
                      <button className="min-h-8 rounded-full border px-3 text-xs hover:border-green-400 hover:text-green-600"
                        style={{ borderColor: "var(--card-border)" }}>Activează</button>
                    </form>
                    <form action={updateListingStatus.bind(null, l.id, "removed")}>
                      <button className="min-h-8 rounded-full border px-3 text-xs hover:border-red-400 hover:text-red-500"
                        style={{ borderColor: "var(--card-border)" }}>Elimină</button>
                    </form>
                    <form action={deleteListing.bind(null, l.id)}>
                      <button className="text-xs text-red-500 hover:underline">Șterge</button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mb-8 text-sm" style={{ color: "var(--muted)" }}>Niciun anunț de adopție.</p>
        )}
      </section>

      {/* ResQ cases */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Cazuri ResQ ({resqCases?.length ?? 0})</h2>
        </div>
        {resqCases && resqCases.length > 0 ? (
          <ul className="flex flex-col gap-2 mb-8">
            {resqCases.map((c) => {
              const reporter = c.profiles as unknown as { full_name: string } | null;
              const s = statusLabels[c.status] ?? { label: c.status, color: "#6b7280" };
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm shadow-sm"
                  style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                  <div className="min-w-0">
                    <p className="font-medium">{c.species ?? "Animal"}</p>
                    <p className="truncate text-xs" style={{ color: "var(--muted)" }}>
                      {String(c.description ?? "").slice(0, 80)}{String(c.description ?? "").length > 80 ? "…" : ""}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {reporter?.full_name ?? "?"} · {new Date(c.created_at).toLocaleDateString("ro-RO")}
                      {" · "}<span style={{ color: s.color }}>{s.label}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <form action={updateResqStatus.bind(null, c.id, "closed")}>
                      <button className="min-h-8 rounded-full border px-3 text-xs hover:border-blue-400 hover:text-blue-600"
                        style={{ borderColor: "var(--card-border)" }}>Închide</button>
                    </form>
                    <form action={updateResqStatus.bind(null, c.id, "resolved")}>
                      <button className="min-h-8 rounded-full border px-3 text-xs hover:border-green-400 hover:text-green-600"
                        style={{ borderColor: "var(--card-border)" }}>Rezolvat</button>
                    </form>
                    <form action={deleteResqCase.bind(null, c.id)}>
                      <button className="text-xs text-red-500 hover:underline">Șterge</button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mb-8 text-sm" style={{ color: "var(--muted)" }}>Niciun caz ResQ.</p>
        )}
      </section>

      {/* Forum posts */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Postări forum ({forumPosts?.length ?? 0})</h2>
        </div>
        {forumPosts && forumPosts.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {forumPosts.map((fp) => {
              const author = fp.profiles as unknown as { full_name: string } | null;
              return (
                <li key={fp.id} className="flex items-start justify-between gap-3 rounded-xl border p-3 text-sm shadow-sm"
                  style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                      {author?.full_name ?? "?"} · {new Date(fp.created_at).toLocaleDateString("ro-RO")}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm">{fp.content}</p>
                  </div>
                  <form action={deleteForumPost.bind(null, fp.id)}>
                    <button className="shrink-0 text-xs text-red-500 hover:underline">Șterge</button>
                  </form>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Nicio postare în forum.</p>
        )}
      </section>
    </main>
  );
}
