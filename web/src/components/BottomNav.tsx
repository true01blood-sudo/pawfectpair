import Link from "next/link";

const items = [
  { href: "/", label: "Acasă", icon: "🏠" },
  { href: "/adoptii", label: "Adopții", icon: "🐾" },
  { href: "/adoptii/adauga", label: "", icon: "+", isFab: true },
  { href: "/programari", label: "Vet", icon: "🩺" },
  { href: "/profil", label: "Profil", icon: "👤" },
];

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-10 border-t bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-2">
        {items.map((item) =>
          item.isFab ? (
            <Link
              key={item.href}
              href={item.href}
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-white shadow-lg"
            >
              {item.icon}
            </Link>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-2 py-1 text-xs text-zinc-500"
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}
