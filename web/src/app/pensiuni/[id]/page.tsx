import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { submitPensiuneReview, createBooking } from "../actions";
import BackLink from "@/components/BackLink";
import { StarsDisplay, StarsInput } from "@/components/Stars";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";

const SERVICE_LABELS: Record<string, string> = {
  dog_walking: "🐕 Plimbări",
  home_visits: "🏡 Vizite acasă",
  sitting_at_owner: "🛋️ Sitting la tine",
  sitting_at_sitter: "🏠 Sitting la pensiune",
  daycare: "☀️ Grădiniță de zi",
  boarding: "🌙 Cazare peste noapte",
  transport: "🚗 Transport",
};

const AMENITY_LABELS: Record<string, string> = {
  curte: "🌳 Curte",
  climatizare: "❄️ Climatizare",
  webcam_live: "📹 Webcam live",
  supraveghere_24_7: "👁️ Supraveghere 24/7",
  plimbari_zilnice: "🚶 Plimbări zilnice",
  ingrijire_medicala: "💊 Îngrijire medicală",
  grooming_inclus: "✂️ Grooming inclus",
  transport_inclus: "🚐 Transport inclus",
  camere_individuale: "🚪 Camere individuale",
  zona_joaca: "🎾 Zonă de joacă",
};

const PRICE_UNIT_LABELS: Record<string, string> = {
  day: "/zi", night: "/noapte", hour: "/oră", visit: "/vizită", walk: "/plimbare",
};

export default async function PensiuneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("petday_listings")
    .select("*")
    .eq("id", id)
    .single();

  if (!listing) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myPets } = user
    ? await supabase.from("pets").select("id, name").eq("owner_id", user.id)
    : { data: null };

  const { data: reviews } = await supabase
    .from("petday_reviews")
    .select("user_id, rating, comment, created_at, profiles(full_name)")
    .eq("listing_id", id)
    .order("created_at", { ascending: false });

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const myReview = user ? reviews?.find((r) => r.user_id === user.id) : null;
  const gallery = [listing.photo_url, ...(listing.photos ?? [])].filter(Boolean) as string[];

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
          <BackLink href="/pensiuni" label="Pensiuni" />

          {gallery.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {gallery.map((url, i) => (
                <div key={i} className="relative h-40 w-56 shrink-0 overflow-hidden rounded-2xl">
                  <Image src={url} alt={`${listing.title} ${i + 1}`} fill sizes="224px" className="object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center gap-2">
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{listing.title}</h1>
            {listing.verified && <span title="Verificat">✅</span>}
          </div>
          {reviews && reviews.length > 0 && (
            <div className="mt-1"><StarsDisplay rating={avgRating} count={reviews.length} /></div>
          )}
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            📍 {listing.city} {listing.address ? `· ${listing.address}` : ""}
          </p>
          {listing.phone && (
            <a href={`tel:${listing.phone}`} className="text-sm font-medium text-primary hover:underline">{listing.phone}</a>
          )}
          <p className="mt-2 text-lg font-bold" style={{ color: "var(--primary)" }}>
            {listing.price_from ? `De la ${listing.price_from} RON${PRICE_UNIT_LABELS[listing.price_unit] ?? ""}` : "Preț la cerere"}
          </p>

          {listing.description && <p className="mt-4 text-sm" style={{ color: "var(--foreground)" }}>{listing.description}</p>}

          {(listing.services as string[])?.length > 0 && (
            <div className="mt-4">
              <h2 className="mb-2 text-sm font-bold" style={{ color: "var(--foreground)" }}>Servicii oferite</h2>
              <div className="flex flex-wrap gap-2">
                {(listing.services as string[]).map((s) => (
                  <span key={s} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}>
                    {SERVICE_LABELS[s] ?? s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(listing.amenities as string[])?.length > 0 && (
            <div className="mt-4">
              <h2 className="mb-2 text-sm font-bold" style={{ color: "var(--foreground)" }}>Facilități</h2>
              <div className="flex flex-wrap gap-2">
                {(listing.amenities as string[]).map((a) => (
                  <span key={a} className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}>
                    {AMENITY_LABELS[a] ?? a}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2 text-xs" style={{ color: "var(--muted)" }}>
            {listing.accepts_dogs && <span>🐶 Câini</span>}
            {listing.accepts_cats && <span>🐱 Pisici</span>}
            {listing.accepts_other && <span>🐾 Alte animale</span>}
            {listing.max_pets && <span>· max {listing.max_pets} animale</span>}
          </div>

          <section
            className="mt-8 rounded-2xl border p-4 sm:p-6"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <h2 className="mb-3 font-semibold" style={{ color: "var(--foreground)" }}>Rezervă o perioadă</h2>
            {!user ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                <a href="/login" className="text-primary hover:underline">Autentifică-te</a> pentru a rezerva.
              </p>
            ) : (
              <form action={createBooking.bind(null, id)} className="flex flex-col gap-3">
                {myPets && myPets.length > 0 && (
                  <select name="pet_id" className="min-h-11 rounded-xl border px-4 text-sm" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}>
                    <option value="">Alege animalul (opțional)</option>
                    {myPets.map((pet) => (
                      <option key={pet.id} value={pet.id}>{pet.name}</option>
                    ))}
                  </select>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <input name="starts_at" type="datetime-local" required className="min-h-11 rounded-xl border px-4 text-sm" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
                  <input name="ends_at" type="datetime-local" required className="min-h-11 rounded-xl border px-4 text-sm" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
                </div>
                <input name="note" placeholder="Observații (opțional)" className="min-h-11 rounded-xl border px-4 text-sm" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
                <button className="min-h-11 self-start rounded-full bg-primary px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                  Trimite cererea de rezervare
                </button>
              </form>
            )}
          </section>

          <section className="mt-8">
            <h2 className="mb-3 font-semibold" style={{ color: "var(--foreground)" }}>Recenzii</h2>
            {reviews && reviews.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {reviews.map((r, i) => {
                  const author = r.profiles as unknown as { full_name: string } | null;
                  return (
                    <li key={i} className="rounded-xl border p-3 text-sm shadow-sm" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                      <StarsDisplay rating={r.rating} />
                      <p className="mt-1 font-medium" style={{ color: "var(--foreground)" }}>{author?.full_name || "Utilizator"}</p>
                      {r.comment && <p className="mt-1" style={{ color: "var(--muted)" }}>{r.comment}</p>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm" style={{ color: "var(--muted)" }}>Nicio recenzie încă.</p>
            )}

            {user && !myReview && (
              <form
                action={submitPensiuneReview.bind(null, id)}
                className="mt-4 flex flex-col gap-3 rounded-xl border p-4"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Lasă o recenzie</p>
                <StarsInput />
                <textarea name="comment" placeholder="Comentariu (opțional)" rows={2} className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
                <button className="min-h-11 self-start rounded-full bg-primary px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                  Trimite recenzia
                </button>
              </form>
            )}
          </section>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
