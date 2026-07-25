import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Drepturile tale GDPR",
  description: "Drepturile tale privind datele personale pe PawfectPair, conform GDPR.",
};

const rights = [
  { title: "Dreptul de acces", text: "Poți cere o copie a datelor pe care le deținem despre tine." },
  { title: "Dreptul la rectificare", text: "Poți corecta oricând datele din profilul tău sau al animalelor tale, direct din aplicație." },
  { title: "Dreptul la ștergere", text: "Poți cere ștergerea completă a contului și a datelor asociate (\"dreptul de a fi uitat\")." },
  { title: "Dreptul la restricționarea prelucrării", text: "Poți cere limitarea modului în care folosim datele tale, în anumite situații." },
  { title: "Dreptul la portabilitate", text: "Poți cere datele tale într-un format structurat, pentru a le transfera altui serviciu." },
  { title: "Dreptul de opoziție", text: "Te poți opune prelucrării bazate pe interes legitim." },
  { title: "Dreptul de a retrage consimțământul", text: "Pentru autentificarea prin Google sau alte procesări bazate pe consimțământ, îl poți retrage oricând." },
  { title: "Dreptul de a depune plângere", text: "Te poți adresa Autorității Naționale de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)." },
];

export default function GdprPage() {
  return (
    <>
      <h1>Drepturile tale GDPR</h1>
      <p>
        Ca utilizator PawfectPair din Uniunea Europeană, ai următoarele
        drepturi conform Regulamentului (UE) 2016/679:
      </p>

      <div className="not-prose mt-6 grid gap-3 sm:grid-cols-2">
        {rights.map((r) => (
          <div key={r.title} className="rounded-xl border p-4">
            <p className="font-semibold">{r.title}</p>
            <p className="mt-1 text-sm text-zinc-600">{r.text}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8">Cum îți exerciți drepturile</h2>
      <ul>
        <li>Direct din aplicație: secțiunea <a href="/profil">Profilul meu</a> pentru corectare/ștergere de date.</li>
        <li>Prin email, la contact@pawfectpair.app — răspundem în cel mult 30 de zile.</li>
      </ul>

      <p className="mt-8 rounded-xl border border-dashed p-4 text-xs text-zinc-500">
        Notă: acest document este un draft funcțional pentru lansarea
        inițială și nu reprezintă consultanță juridică.
      </p>
    </>
  );
}
