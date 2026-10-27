"use client";

import { useState } from "react";
import { deleteAccount } from "./actions";

export default function DeleteAccountClient() {
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12">
      <div
        className="rounded-2xl border p-8"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            Șterge contul
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Ștergerea contului este permanentă și nu poate fi anulată. Toate datele tale —
            animale, dosare medicale, asigurări, înregistrări de greutate — vor fi șterse definitiv.
          </p>
        </div>

        <div
          className="rounded-xl border p-4 mb-6 text-sm"
          style={{
            background: "color-mix(in srgb, #ef4444 6%, transparent)",
            borderColor: "color-mix(in srgb, #ef4444 25%, transparent)",
            color: "#b91c1c",
          }}
        >
          <p className="font-semibold mb-1">Ce se va șterge:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li>Profilul și datele personale</li>
            <li>Toate animalele înregistrate</li>
            <li>Dosarele medicale și vaccinările</li>
            <li>Istoricul de greutate</li>
            <li>Polițele de asigurare</li>
          </ul>
        </div>

        {!confirmed ? (
          <div>
            <label className="flex items-start gap-3 cursor-pointer mb-6">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded"
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span className="text-sm" style={{ color: "var(--foreground)" }}>
                Înțeleg că această acțiune este permanentă și toate datele mele vor fi șterse definitiv.
              </span>
            </label>
            <button
              disabled
              className="w-full rounded-full py-3 text-sm font-semibold opacity-40 cursor-not-allowed"
              style={{ background: "#ef4444", color: "#fff" }}
            >
              Confirmă ștergerea contului
            </button>
          </div>
        ) : (
          <form
            action={async () => {
              setPending(true);
              await deleteAccount();
            }}
          >
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full py-3 text-sm font-semibold transition-colors"
              style={{ background: "#ef4444", color: "#fff", opacity: pending ? 0.7 : 1 }}
            >
              {pending ? "Se șterge contul..." : "Confirmă ștergerea contului"}
            </button>
          </form>
        )}

        <a
          href="/profil"
          className="mt-4 block text-center text-sm hover:underline"
          style={{ color: "var(--muted)" }}
        >
          Anulează
        </a>
      </div>
    </div>
  );
}
