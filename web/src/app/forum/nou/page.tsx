import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createPost } from "../actions";

export default async function ForumNouPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-xl font-bold sm:text-2xl">Postare nouă</h1>
      <form action={createPost} className="mt-6 flex flex-col gap-4">
        <select name="category" className="min-h-11 rounded-xl border px-3 text-sm">
          <option value="">Fără categorie</option>
          <option value="Sănătate">Sănătate</option>
          <option value="Dresaj">Dresaj</option>
          <option value="Nutriție">Nutriție</option>
          <option value="Adopții">Adopții</option>
          <option value="Urgențe">Urgențe</option>
          <option value="Recomandări">Recomandări</option>
        </select>
        <input name="title" placeholder="Titlu" required className="min-h-11 rounded-xl border px-4" />
        <textarea name="body" placeholder="Ce vrei să întrebi sau să împărtășești?" rows={6} required className="rounded-xl border p-4" />
        <button className="min-h-11 self-start rounded-full bg-primary px-5 text-sm font-semibold text-white">
          Publică
        </button>
      </form>
    </main>
  );
}
