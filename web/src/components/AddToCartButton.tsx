"use client";

import { useState } from "react";
import { useCart, type CartItem } from "@/components/CartContext";

type Props = {
  product: Omit<CartItem, "quantity">;
};

export default function AddToCartButton({ product }: Props) {
  const { add, items } = useCart();
  const [flash, setFlash] = useState(false);
  const inCart = items.find((i) => i.id === product.id)?.quantity ?? 0;

  function handleAdd() {
    add(product, 1);
    setFlash(true);
    setTimeout(() => setFlash(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={product.stock === 0}
      className="min-h-11 rounded-full border-2 px-6 font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        borderColor: "var(--primary)",
        background: flash ? "var(--primary)" : "transparent",
        color: flash ? "#fff" : "var(--primary)",
      }}
    >
      {flash
        ? "✓ Adăugat în coș"
        : inCart > 0
        ? `În coș (${inCart}) · Mai adaugă`
        : "Adaugă în coș"}
    </button>
  );
}
