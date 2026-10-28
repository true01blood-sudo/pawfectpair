import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ClinicEchipaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vet } = await supabase
    .from("vets")
    .select("id, clinic_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!vet) redirect("/veterinari/adauga");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.full_name ?? user.email ?? "Administrator";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Echipă</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Persoanele cu acces la workspace-ul {vet.clinic_name}.
        </p>
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl border p-4"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt={name} className="h-12 w-12 rounded-full object-cover shrink-0" />
        ) : (
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
            style={{ background: "var(--primary)" }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{name}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            {user.email}{profile?.phone ? ` · ${profile.phone}` : ""}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
          style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)", color: "var(--primary)" }}
        >
          Administrator
        </span>
      </div>

      <p
        className="mt-4 rounded-2xl border border-dashed p-4 text-center text-xs"
        style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
      >
        Momentan fiecare cabinet are un singur administrator. Invitarea mai multor membri în echipă nu este încă
        disponibilă.
      </p>
    </main>
  );
}
