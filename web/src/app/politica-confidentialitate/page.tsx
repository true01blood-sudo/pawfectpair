import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politică de confidențialitate — PetCare Services",
  description: "Politica de confidențialitate a aplicației PetCare Services / PawfectPair.",
};

export default function PoliticaConfidentialitatePage() {
  const lastUpdated = "28 octombrie 2026";
  const appName = "PetCare Services";
  const companyName = "PawfectPair SRL";
  const contactEmail = "privacy@petcare.app";

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 pb-20">
      <div className="mb-8">
        <Link href="/" className="text-sm hover:underline" style={{ color: "var(--primary)" }}>
          ← Înapoi la PetCare
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
        Politică de confidențialitate
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
        Ultima actualizare: {lastUpdated}
      </p>

      <div className="prose max-w-none space-y-8" style={{ color: "var(--foreground)" }}>

        <section>
          <h2 className="text-xl font-bold mb-3">1. Introducere</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {appName} (denumită în continuare „Aplicația"), operată de {companyName}, respectă confidențialitatea
            utilizatorilor săi. Această politică descrie modul în care colectăm, utilizăm și protejăm datele
            personale ale utilizatorilor aplicației mobile și ale site-ului web.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">2. Date colectate</h2>
          <div className="space-y-3">
            {[
              {
                title: "Date de cont",
                desc: "Adresă de email, nume, fotografie de profil — utilizate pentru autentificare și personalizare."
              },
              {
                title: "Date despre animale",
                desc: "Nume, specie, rasă, dată naștere, fotografii, informații medicale — utilizate exclusiv pentru funcționalitățile aplicației."
              },
              {
                title: "Date medicale ale animalelor",
                desc: "Vaccinări, tratamente, greutate, programări veterinare — stocate securizat și accesibile doar proprietarului."
              },
              {
                title: "Date de localizare (opțional)",
                desc: "Locația GPS a animalului — colectată doar dacă utilizatorul activează explicit funcția PetGuardian."
              },
              {
                title: "Date de utilizare",
                desc: "Informații despre modul de utilizare a aplicației, pentru îmbunătățirea serviciilor."
              },
              {
                title: "Date de plată",
                desc: "Procesate de furnizori terți (Stripe). Nu stocăm date complete de card."
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border p-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                <p className="font-semibold text-sm mb-1">{item.title}</p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">3. Utilizarea datelor</h2>
          <ul className="space-y-2 text-sm" style={{ color: "var(--muted)" }}>
            {[
              "Furnizarea și îmbunătățirea serviciilor aplicației",
              "Trimiterea notificărilor despre vaccinări, programări și scadențe",
              "Facilitarea comunicării cu veterinari și furnizori de servicii",
              "Procesarea plăților pentru servicii premium",
              "Detectarea și prevenirea fraudelor",
              "Respectarea obligațiilor legale",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span style={{ color: "var(--primary)" }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">4. Partajarea datelor</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
            Nu vindem datele personale ale utilizatorilor. Partajăm date cu:
          </p>
          <ul className="space-y-2 text-sm" style={{ color: "var(--muted)" }}>
            <li>• <strong>Supabase</strong> — infrastructură baze de date (UE/SUA)</li>
            <li>• <strong>Vercel</strong> — hosting web (SUA)</li>
            <li>• <strong>Expo / EAS</strong> — build și distribuție aplicație mobilă</li>
            <li>• <strong>Stripe</strong> — procesare plăți (dacă este cazul)</li>
            <li>• <strong>Autorități legale</strong> — când suntem obligați prin lege</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">5. Permisiuni aplicație mobilă</h2>
          <div className="space-y-2">
            {[
              { perm: "Localizare (GPS)", use: "Funcția PetGuardian — urmărire GPS animal", optional: true },
              { perm: "Camera", use: "Fotografierea animalului pentru profil", optional: true },
              { perm: "Notificări push", use: "Alerte programări, vaccinări, mesaje", optional: true },
              { perm: "Stocare", use: "Salvarea documentelor medicale local", optional: true },
            ].map((item) => (
              <div key={item.perm} className="flex items-center justify-between rounded-xl border p-3" style={{ borderColor: "var(--card-border)" }}>
                <div>
                  <p className="text-sm font-semibold">{item.perm}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{item.use}</p>
                </div>
                <span className="text-xs rounded-full px-2 py-1" style={{ background: "color-mix(in srgb, #16a34a 12%, transparent)", color: "#16a34a" }}>
                  Opțional
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">6. Drepturile utilizatorilor (GDPR)</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
            În conformitate cu Regulamentul General privind Protecția Datelor (GDPR), aveți dreptul la:
          </p>
          <ul className="space-y-1 text-sm" style={{ color: "var(--muted)" }}>
            <li>• <strong>Acces</strong> — solicitarea unei copii a datelor dvs.</li>
            <li>• <strong>Rectificare</strong> — corectarea datelor inexacte</li>
            <li>• <strong>Ștergere</strong> — ștergerea contului și a tuturor datelor asociate</li>
            <li>• <strong>Portabilitate</strong> — exportul datelor în format standard</li>
            <li>• <strong>Opoziție</strong> — retragerea consimțământului pentru prelucrare</li>
          </ul>
          <p className="text-sm mt-3" style={{ color: "var(--muted)" }}>
            Ștergerea contului este disponibilă din aplicație: Profil → Setări → Șterge cont.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">7. Securitate</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Datele sunt stocate cu criptare la repaus și în tranzit (TLS). Accesul la date este controlat
            prin Row Level Security (RLS) în baza de date — fiecare utilizator accesează exclusiv propriile date.
            Autentificarea este gestionată de Supabase Auth cu suport pentru 2FA.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">8. Copii</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Aplicația nu este destinată utilizatorilor sub 16 ani. Nu colectăm în mod intenționat date
            de la minori. Dacă descoperim că am colectat date de la un minor, le ștergem imediat.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">9. Modificări ale politicii</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Ne rezervăm dreptul de a modifica această politică. Modificările semnificative vor fi
            notificate prin email sau notificare în aplicație cu cel puțin 30 de zile înainte de intrarea
            în vigoare.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">10. Contact</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Pentru orice întrebări legate de confidențialitate, ne puteți contacta la:
          </p>
          <div className="mt-3 rounded-xl border p-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
            <p className="text-sm font-semibold">{companyName}</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Email: {contactEmail}</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Web: petcare.app/politica-confidentialitate</p>
          </div>
        </section>

      </div>
    </main>
  );
}
