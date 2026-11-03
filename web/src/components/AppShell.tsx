import { createClient, getUser } from "@/lib/supabase/server";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import HomePetWidget from "@/components/HomePetWidget";

type Props = {
  children: React.ReactNode;
  mainClassName?: string;
};

export default async function AppShell({ children, mainClassName }: Props) {
  const supabase = await createClient();
  const user = await getUser();

  // Fara autentificare: afisam doar continutul (header-ul public din layout.tsx e vizibil)
  if (!user) {
    return <>{children}</>;
  }

  const userName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;

  // Val 1 — interogari independente intre ele, pornite toate deodata
  // (inainte rulau secvential, una dupa alta: ~11 round-trip-uri la rand
  // pe FIECARE pagina autentificata — gasit in auditul de performanta).
  const [
    { data: profile },
    { count: notifCount },
    { data: myMatches },
    { data: nextEvent },
    { data: recommendedListing },
    { data: petProfile },
  ] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
    supabase.from("matches").select("id, user_a_id, user_b_id").or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`),
    supabase
      .from("pet_events")
      .select("id, title, city, location, starts_at, max_participants")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("petday_listings")
      .select("id, title, city, price_from, price_unit, services")
      .eq("active", true)
      .order("verified", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("pets").select("id, name, species, breed, birth_date, photo_url").eq("owner_id", user.id).limit(1).single(),
  ]);

  let isAdmin = profile?.role === "admin";
  let isVet = profile?.role === "vet";
  const unreadNotifications = notifCount ?? 0;

  // Val 2 — depind de rezultatele de mai sus, dar tot paralel intre ele.
  const [
    { data: vetRow },
    messageResults,
    [{ count: eventParticipantCountRaw }, { data: myRsvp }],
    { data: nextAppointment },
  ] = await Promise.all([
    isVet
      ? Promise.resolve({ data: null as { id: string } | null })
      : supabase.from("vets").select("id").eq("user_id", user.id).maybeSingle(),
    myMatches && myMatches.length > 0
      ? Promise.all(
          myMatches.map((m) =>
            supabase
              .from("messages")
              .select("sender_id")
              .eq("match_id", m.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          )
        )
      : Promise.resolve([]),
    nextEvent
      ? Promise.all([
          supabase.from("event_participants").select("id", { count: "exact", head: true }).eq("event_id", nextEvent.id).eq("status", "going"),
          supabase.from("event_participants").select("status").eq("event_id", nextEvent.id).eq("user_id", user.id).maybeSingle(),
        ])
      : Promise.resolve([{ count: 0 }, { data: null }] as const),
    petProfile
      ? supabase
          .from("appointments")
          .select("id, scheduled_at, status, notes, vet_id")
          .eq("pet_id", petProfile.id)
          .gte("scheduled_at", new Date().toISOString())
          .neq("status", "cancelled")
          .order("scheduled_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (vetRow) isVet = true;
  const pendingConversations = messageResults.filter((r) => r.data && r.data.sender_id !== user.id).length;
  const eventParticipantCount = eventParticipantCountRaw ?? 0;
  const isGoingToEvent = myRsvp?.status === "going";

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
          <HomePetWidget
            pet={petProfile}
            nextAppointment={nextAppointment}
            userName={userName}
            nextEvent={nextEvent}
            eventParticipantCount={eventParticipantCount}
            isGoingToEvent={isGoingToEvent}
            recommendedListing={recommendedListing}
          />
        </aside>
      </div>
    </div>
  );
}
