import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ClinicProfilPage() {
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
  redirect(`/veterinari/${vet.id}`);
}
