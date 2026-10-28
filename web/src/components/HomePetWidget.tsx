import Link from "next/link";

type Pet = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  birth_date: string | null;
  photo_url: string | null;
} | null;

type Appointment = {
  id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  vet_id: string | null;
} | null;

type Props = {
  pet: Pet;
  nextAppointment: Appointment;
  userName?: string;
};

function ageFromBirthDate(birth_date: string | null): string {
  if (!birth_date) return "";
  const born = new Date(birth_date);
  const now = new Date();
  const months = (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth());
  if (months < 2) return "< 1 lună";
  if (months < 24) return `${months} luni`;
  return `${Math.floor(months / 12)} ani`;
}

const QUICK_LINKS = [
  {
    href: "/sanatate",
    label: "Health records",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    ),
  },
  {
    href: "/sanatate",
    label: "Vaccinations",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    href: "/programari",
    label: "Bookings",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    href: "/ingrijire",
    label: "Care plan",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
    ),
  },
];

export default function HomePetWidget({ pet, nextAppointment }: Props) {
  const petName = pet?.name ?? "animalul tău";
  const age = ageFromBirthDate(pet?.birth_date ?? null);

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-base" style={{ color: "var(--foreground)" }}>
          For {petName}
        </h2>
        <Link
          href="/animale"
          className="text-xs font-semibold hover:underline flex items-center gap-1"
          style={{ color: "var(--primary)" }}
        >
          Manage pets
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </Link>
      </div>

      {/* Pet card */}
      {pet ? (
        <Link
          href="/animale"
          className="flex items-center gap-3 rounded-2xl border p-3 transition-colors hover:border-primary/40"
          style={{ background: "#DCE7D6", borderColor: "#c4d9bc" }}
        >
          {pet.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pet.photo_url} alt={pet.name} className="h-12 w-12 rounded-full object-cover shrink-0" />
          ) : (
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center text-2xl shrink-0"
              style={{ background: "#b8cdb3" }}
            >
              {pet.species === "Câine" ? "🐶" : pet.species === "Pisică" ? "🐱" : "🐾"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: "#1a3318" }}>{pet.name}</p>
            <p className="text-xs" style={{ color: "#4a6e46" }}>
              {pet.breed ?? pet.species}{age ? ` · ${age}` : ""}
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "#4a6e46", flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>
      ) : (
        <Link
          href="/animale/adauga"
          className="flex items-center gap-3 rounded-2xl border-2 border-dashed p-4 transition-colors hover:border-primary"
          style={{ borderColor: "var(--card-border)" }}
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">🐾</div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Adaugă un animal</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Urmărește sănătatea și programările</p>
          </div>
        </Link>
      )}

      {/* Next appointment */}
      {nextAppointment ? (
        <div
          className="rounded-2xl border p-3.5"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Next appointment</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--foreground)" }}>
                {nextAppointment.notes ?? "Control annual"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {new Date(nextAppointment.scheduled_at).toLocaleDateString("ro-RO", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--muted)", flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      ) : (
        <Link
          href="/programari"
          className="flex items-center gap-3 rounded-2xl border p-3 transition-colors hover:border-primary/40"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Nicio programare</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Programează o vizită →</p>
          </div>
        </Link>
      )}

      {/* Quick access 2×2 grid */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_LINKS.map((q) => (
          <Link
            key={q.label}
            href={q.href}
            className="flex flex-col items-center gap-2 rounded-2xl border py-3 px-1 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <span style={{ color: "var(--foreground)" }}>{q.icon}</span>
            <span className="text-[10px] font-medium leading-tight" style={{ color: "var(--muted)" }}>
              {q.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Upcoming near you */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Upcoming near you</p>
          <Link href="/explorare" className="text-xs font-semibold flex items-center gap-0.5 hover:underline" style={{ color: "var(--primary)" }}>
            See all
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        </div>
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <div className="p-3">
            <span
              className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold mb-2"
              style={{ background: "color-mix(in srgb, #16a34a 12%, transparent)", color: "#16a34a" }}
            >
              Community event
            </span>
            <p className="font-bold text-sm leading-snug" style={{ color: "var(--foreground)" }}>
              Plimbare câini în parc
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Sâm, 16 Nov, 10:00
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Parcul Cișmigiu
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs" style={{ color: "var(--muted)" }}>👥 24 participanți</span>
              <button
                type="button"
                className="rounded-full px-4 py-1.5 text-xs font-bold text-white transition-colors hover:opacity-90"
                style={{ background: "var(--primary)" }}
              >
                Join event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended near you */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Recommended near you</p>
          <Link href="/explorare" className="text-xs font-semibold flex items-center gap-0.5 hover:underline" style={{ color: "var(--primary)" }}>
            See all
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        </div>
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <div className="flex items-stretch">
            <div
              className="w-24 shrink-0 flex items-center justify-center text-4xl"
              style={{ background: "linear-gradient(135deg, #e8f4ea 0%, #c8ddc9 100%)" }}
            >
              🏨
            </div>
            <div className="flex-1 p-3">
              <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Pensiune PetFriendly</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-yellow-500 text-xs">⭐</span>
                <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>4.8</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>(64) · 1.5 km</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {["Day care", "Overnight"].map((tag) => (
                  <span key={tag} className="rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{ background: "var(--surface)", color: "var(--muted)" }}>{tag}</span>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>From 45 RON</span>
                <button
                  type="button"
                  className="rounded-full px-3 py-1 text-[10px] font-bold text-white"
                  style={{ background: "var(--primary)" }}
                >
                  Detalii
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
