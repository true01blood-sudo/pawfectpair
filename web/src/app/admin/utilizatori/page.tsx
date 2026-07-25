import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { changeRole, removeUserContent } from "./actions";

const roleLabels: Record<string, string> = {
  user: "Utilizator",
  vet: "Veterinar",
  shop: "Magazin",
  shelter: "Centru/Asociație",
  admin: "Admin",
};

export default async function AdminUtilizatoriPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-xl font-bold sm:text-2xl">Utilizatori</h1>
      <p className="mt-1 text-sm text-zinc-500">{profiles?.length ?? 0} conturi înregistrate</p>

      <ul className="mt-4 flex flex-col gap-2">
        {profiles?.map((p) => (
          <li key={p.id} className="card-hover flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm shadow-sm">
            <div>
              <p className="font-medium">{p.full_name || "(fără nume)"}</p>
              <p className="text-xs text-zinc-400">
                {roleLabels[p.role] ?? p.role} · din {new Date(p.created_at).toLocaleDateString("ro-RO")}
              </p>
            </div>
            {p.id !== user.id && (
              <div className="flex items-center gap-2">
                <form action={changeRole.bind(null, p.id)} className="flex items-center gap-1">
                  <select name="role" defaultValue={p.role} className="min-h-11 rounded-lg border px-2 text-xs">
                    <option value="user">Utilizator</option>
                    <option value="vet">Veterinar</option>
                    <option value="shop">Magazin</option>
                    <option value="shelter">Centru/Asociație</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button className="min-h-11 rounded-full border px-3 text-xs">Salvează</button>
                </form>
                <form action={removeUserContent.bind(null, p.id)}>
                  <button className="min-h-11 rounded-full border border-red-300 px-3 text-xs text-red-600">
                    Șterge conținut
                  </button>
                </form>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
