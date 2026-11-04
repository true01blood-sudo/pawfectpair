"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Step = "loading" | "off" | "enrolling" | "on";

export default function TwoFactorSection() {
  const supabase = createClient();
  const [step, setStep] = useState<Step>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refreshFactors() {
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.find((f) => f.status === "verified");
    if (verified) {
      setFactorId(verified.id);
      setStep("on");
    } else {
      setFactorId(null);
      setStep("off");
    }
  }

  useEffect(() => {
    refreshFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startEnroll() {
    setError(null);
    setBusy(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setBusy(false);
    if (error || !data) {
      setError(error?.message ?? "Nu am putut porni activarea 2FA.");
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setStep("enrolling");
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setBusy(true);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      setBusy(false);
      setError(challengeError?.message ?? "Nu am putut trimite codul de verificare.");
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    setBusy(false);
    if (verifyError) {
      setError("Cod incorect. Verifică aplicația de autentificare și încearcă din nou.");
      return;
    }
    setCode("");
    await refreshFactors();
  }

  async function disable() {
    if (!factorId) return;
    if (!confirm("Dezactivezi autentificarea în doi pași pentru acest cont?")) return;
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    await refreshFactors();
  }

  return (
    <section className="rounded-2xl border p-5 mb-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
      <h2 className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>Autentificare în doi pași (2FA)</h2>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
        Adaugă un cod generat de o aplicație (Google Authenticator, Authy etc.) pe lângă parolă, la fiecare autentificare.
      </p>

      {step === "loading" && <p className="text-sm" style={{ color: "var(--muted)" }}>Se încarcă...</p>}

      {step === "off" && (
        <button
          type="button"
          onClick={startEnroll}
          disabled={busy}
          className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--primary)" }}
        >
          {busy ? "..." : "Activează 2FA"}
        </button>
      )}

      {step === "enrolling" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: "var(--foreground)" }}>
            1. Scanează codul QR cu aplicația de autentificare.
          </p>
          {qrCode && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrCode} alt="Cod QR 2FA" width={180} height={180} className="rounded-xl border" style={{ borderColor: "var(--card-border)" }} />
          )}
          {secret && (
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Sau introdu manual cheia: <span className="font-mono">{secret}</span>
            </p>
          )}
          <p className="text-sm mt-2" style={{ color: "var(--foreground)" }}>
            2. Introdu codul de 6 cifre generat de aplicație:
          </p>
          <form onSubmit={confirmEnroll} className="flex items-center gap-3">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              placeholder="123456"
              className="w-32 rounded-xl border px-3 py-2 text-sm tracking-widest bg-transparent"
              style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
            />
            <button
              type="submit"
              disabled={busy || code.trim().length < 6}
              className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--primary)" }}
            >
              {busy ? "..." : "Confirmă"}
            </button>
          </form>
        </div>
      )}

      {step === "on" && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium" style={{ color: "#10b981" }}>✓ Activat</p>
          <button
            type="button"
            onClick={disable}
            disabled={busy}
            className="rounded-full border px-5 py-2 text-sm font-semibold disabled:opacity-50"
            style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
          >
            Dezactivează
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs" style={{ color: "#ef4444" }}>{error}</p>}
    </section>
  );
}
