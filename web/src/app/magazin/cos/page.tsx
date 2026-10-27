"use client";

import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { ProductPlaceholder } from "@/components/PawPlaceholder";

export default function CosPage() {
  const { items, remove, setQty, total, count } = useCart();

  if (count === 0) {
    return (
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16 text-center">
        <div className="text-5xl mb-4">🛒</div>
        <p className="text-xl font-semibold mb-2">Coșul tău este gol</p>
        <p className="text-sm text-zinc-500 mb-6">Adaugă produse din magazin pentru a continua.</p>
        <Link href="/magazin" className="rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-dark transition-colors">
          Mergi la magazin
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <Link href="/magazin" className="mb-6 flex items-center gap-1 text-sm transition-colors hover:text-primary" style={{ color: "var(--muted)" }}>
        ← Magazin
      </Link>
      <h1 className="text-2xl font-bold mb-6">Coșul meu</h1>

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex gap-4 rounded-2xl border p-4"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
          >
            {item.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.photo_url}
                alt={item.name}
                className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
              />
            ) : (
              <ProductPlaceholder className="h-20 w-20 flex-shrink-0 rounded-xl" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{item.name}</p>
              <p className="text-primary font-bold">
                {(item.price_cents / 100).toFixed(2)} {item.currency}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQty(item.id, item.quantity - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border text-lg font-bold transition-colors hover:border-primary hover:bg-primary hover:text-white"
                  style={{ borderColor: "var(--card-border)" }}
                >
                  −
                </button>
                <span className="min-w-[2rem] text-center font-semibold">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => setQty(item.id, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  className="flex h-8 w-8 items-center justify-center rounded-full border text-lg font-bold transition-colors hover:border-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ borderColor: "var(--card-border)" }}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="ml-auto text-xs text-red-400 hover:text-red-600 hover:underline transition-colors"
                >
                  Șterge
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div
        className="mt-6 rounded-2xl border p-4"
        style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            {count} {count === 1 ? "produs" : "produse"}
          </span>
          <span className="text-xl font-bold text-primary">
            {(total / 100).toFixed(2)} RON
          </span>
        </div>
        <Link
          href="/magazin/checkout"
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-primary font-semibold text-white hover:bg-primary-dark transition-colors"
        >
          Finalizează comanda →
        </Link>
      </div>
    </main>
  );
}
