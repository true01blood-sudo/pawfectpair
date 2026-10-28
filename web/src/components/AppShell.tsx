import { createClient } from "@/lib/supabase/server";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import HomePetWidget from "@/components/HomePetWidget";

type Props = {
  children: React.ReactNode;
  mainClassName?: string;
};

export default async function AppShell({ children, mainClassName }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  let isAdmin = false;
  let isVet = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
    isVet = profile?.role === "vet";
    // Also check if user has a registered vet profile
    if (!isVet) {
      const { data: vetRow } = await supabase
        .from("vets")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (vetRow) isVet = true;
    }
  }

  let unreadNotifications = 0;
  let pendingConversations = 0;
  if (user) {
    const { count: notifCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    unreadNotifications = notifCount ?? 0;

    const { data: myMatches } = await supabase
      .from("matches")
      .select("id, user_a_id, user_b_id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);
    if (myMatches && myMatches.length > 0) {
      const results = await Promise.all(
        myMatches.map((m) =>
          supabase
            .from("messages")
            .select("sender_id")
            .eq("match_id", m.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        )
      );
      pendingConversations = results.filter((r) => r.data && r.data.sender_id !== user.id).length;
    }
  }

  let petProfile = null;
  let nextAppointment = null;
  if (user) {
    const { data: pet } = await supabase
      .from("pets")
      .select("id, name, species, breed, birth_date, photo_url")
      .eq("owner_id", user.id)
      .limit(1)
      .single();
    petProfile = pet;

    if (pet) {
      const { data: appt } = await supabase
        .from("appointments")
        .select("id, scheduled_at, status, notes, vet_id")
        .eq("pet_id", pet.id)
        .gte("scheduled_at", new Date().toISOString())
        .neq("status", "cancelled")
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      nextAppointment = appt;
    }
  }

  // Fara autentificare: afisam doar continutul (header-ul public din layout.tsx e vizibil)
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AppHeader userName={userName} avatarUrl={avatarUrl} isAdmin={isAdmin} isVet={isVet} unreadNotifications={unreadNotifications} pendingConversations={pendingConversations} />
      <div className="flex-1 flex overflow-hidden min-h-0">
        <AppSidebar />
        <div className={`flex-1 min-h-0 flex flex-col ${mainClassName ?? "overflow-y-auto"}`}>
          {children}
          {/* Compact app footer */}
          <footer
            className="mt-auto shrink-0 border-t px-6 py-3 hidden md:flex items-center justify-between text-xs"
            style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
          >
            <span>© {new Date().getFullYear()} PawfectPair</span>
            <nav className="flex gap-4">
              <a href="/legal/termeni" className="hover:text-primary transition-colors">Termeni</a>
              <a href="/legal/confidentialitate" className="hover:text-primary transition-colors">Confidențialitate</a>
              <a href="/legal/gdpr" className="hover:text-primary transition-colors">GDPR</a>
              <a href="/contact" className="hover:text-primary transition-colors">Contact</a>
            </nav>
          </footer>
        </div>
        <aside
          className="w-80 shrink-0 hidden xl:flex xl:flex-col overflow-y-auto border-l"
          style={{ borderColor: "var(--card-border)" }}
        >
          <HomePetWidget pet={petProfile} nextAppointment={nextAppointment} userName={userName} />
        </aside>
      </div>
    </div>
  );
}
