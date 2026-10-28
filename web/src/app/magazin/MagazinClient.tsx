"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductPlaceholder } from "@/components/PawPlaceholder";

type Product = {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  photo_url: string | null;
  category: string | null;
  delivery_info: string | null;
  seller_name: string | null;
  species_tags: string[] | null;
};

type Props = {
  products: Product[];
  petName: string | null;
  petSpecies: string | null;
  isLoggedIn: boolean;
};

const CATEGORIES = [
  { id: "", label: "Toate", emoji: "🛍️" },
  { id: "food", label: "Hrană", emoji: "🦴" },
  { id: "toys", label: "Jucării", emoji: "🎾" },
  { id: "health", label: "Sănătate", emoji: "💊" },
  { id: "accessories", label: "Accesorii", emoji: "🎀" },
  { id: "care", label: "Îngrijire", emoji: "✂️" },
];

function formatPrice(cents: number, currency: string) {
  if (cents === 0) return "Preț la cerere";
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export default function MagazinClient({ products, petName, petSpecies, isLoggedIn }: Props) {
  const [activeCategory, setActiveCategory] = useState("");
  const [forLuna, setForLuna] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  function handleAdd(productId: string) {
    setCart((c) => ({ ...c, [productId]: (c[productId] ?? 0) + 1 }));
    setAddedIds((s) => new Set([...s, productId]));
    setTimeout(() => {
      setAddedIds((s) => {
        const next = new Set(s);
        next.delete(productId);
        return next;
      });
    }, 1000);
  }

  const cartTotal = Object.values(cart).reduce((a, b) => a + b, 0);

  const filtered = products.filter((p) => {
    if (activeCategory && p.category !== activeCategory) return false;
    if (forLuna && petSpecies) {
      const tags = p.species_tags ?? [];
      if (tags.length > 0 && !tags.includes(petSpecies.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 pb-28 md:pb-8">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Magazin PetCare
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            Good things for good pets 🐾
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoggedIn && (
            <Link
              href="/magazin/cos"
              className="relative rounded-full border px-4 py-2 text-sm font-medium flex items-center gap-1.5"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
            >
              🛒
              {cartTotal > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ background: "var(--primary)" }}
                >
                  {cartTotal}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>

      {/* "For Luna" filter */}
      {petName && (
        <div
          className="mb-4 flex items-center gap-3 rounded-2xl border p-3 cursor-pointer transition-all"
          style={{
            background: forLuna
              ? "color-mix(in srgb, var(--primary) 8%, transparent)"
              : "var(--card-bg)",
            borderColor: forLuna ? "var(--primary)" : "var(--card-border)",
          }}
          onClick={() => setForLuna(!forLuna)}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{
              background: forLuna
                ? "var(--primary)"
                : "color-mix(in srgb, var(--primary) 12%, transparent)",
            }}
          >
            {forLuna ? <span className="text-white">✓</span> : "🐾"}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: forLuna ? "var(--primary)" : "var(--foreground)" }}>
              Pentru {petName}
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {forLuna ? "Afișez doar produse potrivite" : "Filtrează produse potrivite pentru animalul tău"}
            </p>
          </div>
          <div
            className="w-10 h-6 rounded-full transition-colors flex-shrink-0"
            style={{ background: forLuna ? "var(--primary)" : "var(--card-border)", position: "relative" }}
          >
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: forLuna ? "calc(100% - 20px)" : "4px" }}
            />
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="flex-shrink-0 flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
            style={{
              background: activeCategory === cat.id ? "var(--primary)" : "var(--card-bg)",
              borderColor: activeCategory === cat.id ? "var(--primary)" : "var(--card-border)",
              color: activeCategory === cat.id ? "#fff" : "var(--foreground)",
            }}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
        {filtered.length} produse{forLuna && petName ? ` pentru ${petName}` : ""}
        {activeCategory ? ` · ${CATEGORIES.find((c) => c.id === activeCategory)?.label}` : ""}
      </p>

      {/* Product grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((p) => {
            const inCart = cart[p.id] ?? 0;
            const justAdded = addedIds.has(p.id);
            return (
              <div
                key={p.id}
                className="rounded-2xl border overflow-hidden"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                <Link href={`/magazin/${p.id}`}>
                  <div className="relative aspect-square w-full overflow-hidden">
                    {p.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <ProductPlaceholder className="h-full w-full" />
                    )}
                    {inCart > 0 && (
                      <span
                        className="absolute top-2 right-2 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: "var(--primary)" }}
                      >
                        {inCart}
                      </span>
                    )}
                  </div>
                </Link>

                <div className="p-2.5">
                  <Link href={`/magazin/${p.id}`}>
                    <p
                      className="text-xs font-semibold truncate mb-0.5"
                      style={{ color: "var(--foreground)" }}
                    >
                      {p.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {p.seller_name ?? "PetCare"}
                    </p>
                  </Link>

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                      {formatPrice(p.price_cents, p.currency)}
                    </p>
                    <button
                      onClick={() => handleAdd(p.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all active:scale-95"
                      style={{
                        background: justAdded ? "#16a34a" : "var(--primary)",
                        transform: justAdded ? "scale(1.1)" : "scale(1)",
                      }}
                    >
                      {justAdded ? "✓" : "+"}
                    </button>
                  </div>

                  {p.delivery_info && (
                    <p className="text-[10px] mt-1 truncate" style={{ color: "var(--muted)" }}>
                      🚚 {p.delivery_info}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="rounded-2xl border-2 border-dashed p-12 text-center"
          style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
        >
          <p className="text-4xl mb-3">🛍️</p>
          <p className="font-semibold" style={{ color: "var(--foreground)" }}>
            {forLuna && petName
              ? `Niciun produs specific pentru ${petName} în această categorie`
              : "Niciun produs în această categorie"}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            {forLuna ? "Încearcă fără filtrul 'Pentru " + petName + "'" : "Revino în curând pentru produse noi."}
          </p>
          {forLuna && (
            <button
              onClick={() => setForLuna(false)}
              className="mt-4 rounded-full border px-5 py-2 text-sm font-medium"
              style={{ borderColor: "var(--card-border)", color: "var(--primary)" }}
            >
              Elimină filtrul
            </button>
          )}
        </div>
      )}
    </div>
  );
}
