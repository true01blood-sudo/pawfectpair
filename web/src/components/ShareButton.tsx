"use client";

import { useState } from "react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = "https://pawfectpair.app";
    const text = "Am găsit PawfectPair — o platformă super pentru animale de companie: adopții, veterinari, magazin și comunitate. Hai și tu!";

    if (navigator.share) {
      try {
        await navigator.share({ title: "PawfectPair", text, url });
      } catch {
        // user cancelled share sheet — nothing to do
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={share}
      className="flex min-h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold"
    >
      {copied ? "Link copiat!" : "Distribuie cu un prieten"}
    </button>
  );
}
