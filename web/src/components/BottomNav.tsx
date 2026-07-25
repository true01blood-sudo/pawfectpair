import Link from "next/link";
import { HomeIcon, PawIcon, VetIcon, UserIcon, PlusIcon } from "@/components/icons";

const items = [
  { href: "/", label: "Acasă", Icon: HomeIcon },
  { href: "/adoptii", label: "Adopții", Icon: PawIcon },
  { href: "/adoptii/adauga", label: "Adaugă", Icon: PlusIcon, isFab: true },
  { href: "/veterinari", label: "Vet", Icon: VetIcon },
  { href: "/profil", label: "Profil", Icon: UserIcon },
];

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-10 border-t bg-white md:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4">
        {items.map(({ href, label, Icon, isFab }) =>
          isFab ? (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg"
            >
              <Icon className="h-6 w-6" />
            </Link>
          ) : (
            <Link
              key={href}
              href={href}
              className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 px-2 py-1 text-xs text-zinc-500"
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}
