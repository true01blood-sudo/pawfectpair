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
  { href: "/animale", emoji: "📋", label: "Fișă medicală" },
  { href: "/animale", emoji: "💉", label: "Vaccinări" },
  { href: "/programari", emoji: "📅", label: "Programări" },
  { href: "/ingrijire", emoji: "💊", label: "Plan îngrijire" },
];

const RECOMMENDED = [
  { href: "/veterinari", emoji: "🏥", label: "Veterinari", sub: "Aproape de tine" },
  { href: "/educatie", emoji: "🎓", label: "Training", sub: "Cursuri online" },
  { href: "/magazin", emoji: "🛒", label: "Produse", sub: "Recomandate" },
];

export default function HomePetWidget({ pet, nextAppointment, userName }: Props) {
  if (!pet) {
    return (
      <div className="p-4 space-y-3">
        <div className="rounded-2xl border p-5 text-center" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="text-4xl mb-2">🐾</div>
          <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
            Niciun animal înregistrat
          </p>
          <p className="text-xs mt-1 mb-3" style={{ color: "var(--muted)" }}>
            Adaugă primul tău animal pentru a urmări sănătatea și programările.
          </p>
          <Link
            href="/animale/adauga"
            className="inline-flex rounded-full bg-primary px-4 py-2 text-xs font-bold text-white"
          >
            + Adaugă animal
          </Link>
        </div>

        {/* Recommended services even without a pet */}
        <p className="text-xs font-bold uppercase tracking-widest px-1 pt-2" style={{ color: "var(--muted)" }}>
          Servicii recomandate
        </p>
        {RECOMMENDED.map((r) => (
          <Link
            key={r.href + r.label}
            href={r.href}
            className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-primary/5"
            style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
          >
            <span className="text-xl">{r.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{r.label}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{r.sub}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--muted)", flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        ))}
      </div>
    );
  }

  const age = ageFromBirthDate(pet.birth_date);

  return (
    <div className="p-4 space-y-3">
      {/* Pet header */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        {/* Cover gradient */}
        <div
          className="h-12 w-full"
          style={{ background: "linear-gradient(135deg, var(--primary) 0%, #ff9a5c 100%)" }}
        />
        <div className="px-4 pb-4 -mt-6">
          {pet.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pet.photo_url}
              alt={pet.name}
              className="h-12 w-12 rounded-full border-2 border-white object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full border-2 border-white flex items-center justify-center text-2xl"
              style={{ background: "#fff7ed" }}>
              {pet.species === "Câine" ? "🐶" : pet.species === "Pisică" ? "🐱" : "🐾"}
            </div>
          )}
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                  {pet.name}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {pet.breed ?? pet.species}
                  {age ? ` · ${age}` : ""}
                </p>
              </div>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                style={{ background: "color-mix(in srgb, #16a34a 12%, transparent)", color: "#16a34a" }}
              >
                Sănătos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Next appointment */}
      {nextAppointment ? (
        <div
          className="rounded-2xl border p-3"
          style={{ background: "color-mix(in srgb, var(--primary) 6%, transparent)", borderColor: "color-mix(in srgb, var(--primary) 25%, transparent)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--primary)" }}>
            Urmează
          </p>
          <div className="flex items-center gap-2">
            <span className="text-lg">🩺</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                {nextAppointment.notes ?? "Consultație"}
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {new Date(nextAppointment.scheduled_at).toLocaleDateString("ro-RO", {
                  weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <Link
          href="/programari"
          className="flex items-center gap-3 rounded-2xl border p-3 transition-colors hover:border-primary/40"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <span className="text-lg">📅</span>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Nicio programare</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Programează o vizită →</p>
          </div>
        </Link>
      )}

      {/* Quick links */}
      <p className="text-[10px] font-bold uppercase tracking-widest px-1 pt-1" style={{ color: "var(--muted)" }}>
        Acces rapid
      </p>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_LINKS.map((q) => (
          <Link
            key={q.label}
            href={q.href}
            className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <span className="text-xl">{q.emoji}</span>
            <span className="text-[11px] font-medium leading-snug" style={{ color: "var(--foreground)" }}>{q.label}</span>
          </Link>
        ))}
      </div>

      {/* Recommended */}
      <p className="text-[10px] font-bold uppercase tracking-widest px-1 pt-1" style={{ color: "var(--muted)" }}>
        Recomandate
      </p>
      <div className="space-y-2">
        {RECOMMENDED.map((r) => (
          <Link
            key={r.label}
            href={r.href}
            className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-primary/5"
            style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
          >
            <span className="text-lg">{r.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{r.label}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{r.sub}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--muted)", flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        ))}
      </div>

      {/* Manage pet link */}
      <Link
        href="/animale"
        className="flex items-center justify-center gap-2 rounded-full border py-2.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
        style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
      >
        Gestionează animale →
      </Link>
    </div>
  );
}
