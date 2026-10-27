"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { ProductPlaceholder } from "@/components/PawPlaceholder";
import { placeCartOrder } from "../actions";

const JUDETE = [
  "Alba","Arad","Argeș","Bacău","Bihor","Bistrița-Năsăud","Botoșani","Brăila",
  "Brașov","București","Buzău","Călărași","Caraș-Severin","Cluj","Constanța",
  "Covasna","Dâmbovița","Dolj","Galați","Giurgiu","Gorj","Harghita","Hunedoara",
  "Ialomița","Iași","Ilfov","Maramureș","Mehedinți","Mureș","Neamț","Olt",
  "Prahova","Sălaj","Satu Mare","Sibiu","Suceava","Teleorman","Timiș","Tulcea",
  "Vâlcea","Vaslui","Vrancea",
];

const PAYMENT_OPTS = [
  { value: "cod", label: "Ramburs (numerar la livrare)", icon: "💵" },
  { value: "card", label: "Card online", icon: "💳" },
  { value: "bank_transfer", label: "Transfer bancar", icon: "🏦" },
] as const;

export default function CheckoutPage() {
  const { items, total, count, clear } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "", phone: "", address: "", city: "", county: "",
    payment: "cod" as "cod" | "card" | "bank_transfer",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  if (count === 0) {
    return (
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16 text-center">
        <p className="text-xl font-semibold mb-4">Coșul tău este gol</p>
        <Link href="/magazin" className="text-primary underline">Continuă cumpărăturile</Link>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      setError("Completează toate câmpurile obligatorii marcate cu *.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await placeCartOrder({
      items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      shipping_name: form.name.trim(),
      shipping_phone: form.phone.trim(),
      shipping_address: form.address.trim(),
      shipping_city: form.city.trim(),
      shipping_county: form.county.trim(),
      payment_method: form.payment,
      notes: form.notes.trim() || undefined,
    });
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    clear();
    router.push(`/magazin/comenzile-mele?comanda=${result.orderId}`);
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <Link href="/magazin/cos" className="mb-6 flex items-center gap-1 text-sm transition-colors hover:text-primary" style={{ color: "var(--muted)" }}>
        ← Coș
      </Link>
      <h1 className="text-2xl font-bold mb-6">Finalizează comanda</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Sumar produse */}
        <section className="rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Sumar comandă</h2>
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {item.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.photo_url} alt={item.name} className="h-12 w-12 flex-shrink-0 rounded-xl object-cover" />
              ) : (
                <ProductPlaceholder className="h-12 w-12 flex-shrink-0 rounded-xl" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{item.quantity}× {(item.price_cents / 100).toFixed(2)} {item.currency}</p>
              </div>
              <p className="text-sm font-semibold flex-shrink-0">
                {((item.price_cents * item.quantity) / 100).toFixed(2)} {item.currency}
              </p>
            </div>
          ))}
          <div className="flex justify-between border-t pt-3 font-bold" style={{ borderColor: "var(--card-border)" }}>
            <span>Total</span>
            <span className="text-primary">{(total / 100).toFixed(2)} RON</span>
          </div>
        </section>

        {/* Adresă livrare */}
        <section className="rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Adresă livrare</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Nume complet *</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-primary"
                style={{ borderColor: "var(--card-border)", background: "var(--background)", color: "var(--foreground)" }}
                placeholder="Ion Popescu"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Telefon *</label>
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
                type="tel"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-primary"
                style={{ borderColor: "var(--card-border)", background: "var(--background)", color: "var(--foreground)" }}
                placeholder="07xx xxx xxx"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Stradă, număr, bloc, apartament *</label>
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              required
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-primary"
              style={{ borderColor: "var(--card-border)", background: "var(--background)", color: "var(--foreground)" }}
              placeholder="Str. Florilor nr. 12, ap. 5"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Localitate *</label>
              <input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                required
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-primary"
                style={{ borderColor: "var(--card-border)", background: "var(--background)", color: "var(--foreground)" }}
                placeholder="Cluj-Napoca"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Județ</label>
              <select
                value={form.county}
                onChange={(e) => set("county", e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-primary"
                style={{ borderColor: "var(--card-border)", background: "var(--background)", color: "var(--foreground)" }}
              >
                <option value="">Selectează județul</option>
                {JUDETE.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Observații (opțional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:border-primary"
              style={{ borderColor: "var(--card-border)", background: "var(--background)", color: "var(--foreground)" }}
              placeholder="Instrucțiuni speciale de livrare..."
            />
          </div>
        </section>

        {/* Metodă plată */}
        <section className="rounded-2xl border p-4 space-y-2" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>Metodă de plată</h2>
          {PAYMENT_OPTS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors"
              style={{
                borderColor: form.payment === opt.value ? "var(--primary)" : "var(--card-border)",
                background: form.payment === opt.value ? "color-mix(in srgb, var(--primary) 8%, transparent)" : "transparent",
              }}
            >
              <input
                type="radio"
                name="payment"
                value={opt.value}
                checked={form.payment === opt.value}
                onChange={() => set("payment", opt.value)}
                className="sr-only"
              />
              <span className="text-xl">{opt.icon}</span>
              <span className="flex-1 text-sm font-medium">{opt.label}</span>
              {form.payment === opt.value && (
                <span className="text-primary font-bold">✓</span>
              )}
            </label>
          ))}
          {form.payment === "card" && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Plata cu cardul va fi activată în curând. Vânzătorul te va contacta pentru detalii.
            </p>
          )}
          {form.payment === "bank_transfer" && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Vânzătorul te va contacta cu datele de transfer bancar după plasarea comenzii.
            </p>
          )}
        </section>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-primary font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? "Se procesează..." : "Plasează comanda"}
        </button>
      </form>
    </main>
  );
}
