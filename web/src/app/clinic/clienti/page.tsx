import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ApptRow = {
  starts_at: string;
  status: string;
  owner_id: string;
  pets: { id: string; name: string; species: string; photo_url: string | null } | null;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

type Client = {
  ownerId: string;
  name: string;
  avatarUrl: string | null;
  pets: Map<string, { name: string; species: string; photo_url: string | null }>;
  apptCount: number;
  lastVisit: string | null;
};

export default async function ClinicClientiPage() {
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

  const { data: appts } = await supabase
    .from("vet_appointments")
    .select("starts_at, status, owner_id, pets(id, name, species, photo_url), profiles!owner_id(full_name, avatar_url)")
    .eq("vet_id", vet.id)
    .neq("status", "cancelled")
    .order("starts_at", { ascending: false });

  const rows = (appts ?? []) as unknown as ApptRow[];

  const clients = new Map<string, Client>();
  for (const a of rows) {
    let c = clients.get(a.owner_id);
    if (!c) {
      c = {
        ownerId: a.owner_id,
        name: a.profiles?.full_name ?? "Client",
        avatarUrl: a.profiles?.avatar_url ?? null,
        pets: new Map(),
        apptCount: 0,
        lastVisit: null,
      };
      clients.set(a.owner_id, c);
    }
    c.apptCount += 1;
    if (!c.lastVisit || new Date(a.starts_at) > new Date(c.lastVisit)) c.lastVisit = a.starts_at;
    if (a.pets) c.pets.set(a.pets.id, { name: a.pets.name, species: a.pets.species, photo_url: a.pets.photo_url });
  }

  const clientList = Array.from(clients.values()).sort(
    (a, b) => new Date(b.lastVisit ?? 0).getTime() - new Date(a.lastVisit ?? 0).getTime()
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Clienți</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {clientList.length} client{clientList.length === 1 ? "" : "i"} activ{clientList.length === 1 ? "" : "i"}.
        </p>
      </div>

      {clientList.length > 0 ? (
        <div className="flex flex-col gap-3">
          {clientList.map((c) => (
            <div
              key={c.ownerId}
              className="flex items-center gap-3 rounded-2xl border p-4"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              {c.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.avatarUrl} alt={c.name} className="h-11 w-11 rounded-full object-cover shrink-0" />
              ) : (
                <div
                  className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: "var(--primary)" }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{c.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {Array.from(c.pets.values()).map((p) => p.name).join(", ") || "—"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                  {c.apptCount} vizit{c.apptCount === 1 ? "ă" : "e"}
                </p>
                {c.lastVisit && (
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
                    Ultima: {new Date(c.lastVisit).toLocaleDateString("ro-RO")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p
          className="rounded-2xl border border-dashed p-8 text-center text-sm"
          style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
        >
          Niciun client încă. Clienții apar automat după prima programare.
        </p>
      )}
    </main>
  );
}
