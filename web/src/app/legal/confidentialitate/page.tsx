import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de confidențialitate",
  description: "Cum colectează și folosește PawfectPair datele tale personale.",
};

export default function ConfidentialitatePage() {
  return (
    <>
      <h1>Politica de confidențialitate</h1>
      <p className="text-sm text-zinc-500">Ultima actualizare: 25 iulie 2026</p>

      <p>
        Această politică explică ce date colectăm prin PawfectPair, de ce, și
        cum îți poți exercita drepturile conform Regulamentului (UE) 2016/679
        (GDPR).
      </p>

      <h2>1. Operatorul de date</h2>
      <p>PawfectPair — contact@pawfectpair.app</p>

      <h2>2. Ce date colectăm</h2>
      <ul>
        <li><strong>Cont:</strong> nume, email, parolă (criptată), fotografie de profil (opțional).</li>
        <li><strong>Animale de companie:</strong> nume, specie, rasă, vârstă, fotografii, note.</li>
        <li><strong>Adopții:</strong> anunțuri publicate, aplicații de adopție, mesaje.</li>
        <li><strong>Programări veterinare:</strong> date de programare, motiv vizită.</li>
        <li><strong>Marketplace:</strong> comenzi plasate, produse publicate (pentru conturi de tip magazin).</li>
        <li><strong>Autentificare socială:</strong> dacă alegi &quot;Continuă cu Google&quot;, primim numele, emailul și fotografia asociate contului Google, conform permisiunilor acordate de tine.</li>
        <li><strong>Date tehnice:</strong> cookie-uri de sesiune necesare autentificării.</li>
      </ul>

      <h2>3. Temei legal și scop</h2>
      <ul>
        <li><strong>Executarea contractului</strong> — creare cont, adopții, programări, comenzi.</li>
        <li><strong>Interes legitim</strong> — securitatea platformei, prevenirea fraudei.</li>
        <li><strong>Consimțământ</strong> — autentificare cu Google, comunicări opționale.</li>
      </ul>

      <h2>4. Cu cine partajăm datele</h2>
      <p>
        Datele sunt găzduite prin Supabase (bază de date, autentificare,
        stocare fișiere) și platforma este servită prin Hostinger. Datele
        relevante unei interacțiuni (ex: aplicație de adopție, programare
        veterinară) sunt vizibile părții cu care interacționezi (centru de
        adopție, cabinet veterinar). Nu vindem datele tale către terți.
      </p>

      <h2>5. Cât timp păstrăm datele</h2>
      <p>
        Păstrăm datele contului cât timp acesta este activ. Poți solicita
        ștergerea completă a contului și a datelor asociate oricând.
      </p>

      <h2>6. Drepturile tale (GDPR)</h2>
      <p>Vezi pagina dedicată <a href="/legal/gdpr">Drepturile tale GDPR</a> pentru detalii și modul de exercitare.</p>

      <h2>7. Cookie-uri</h2>
      <p>
        Folosim exclusiv cookie-uri esențiale, necesare pentru menținerea
        sesiunii de autentificare. Nu folosim cookie-uri de tracking
        publicitar.
      </p>

      <h2>8. Securitate</h2>
      <p>
        Parolele sunt criptate; accesul la date este restricționat prin
        politici de securitate la nivel de rând (Row Level Security) —
        fiecare utilizator vede și modifică doar datele proprii sau cele
        partajate explicit prin interacțiune (ex: o cerere de adopție e
        vizibilă și centrului de adopție).
      </p>

      <h2>9. Contact</h2>
      <p>Pentru orice solicitare privind datele tale: contact@pawfectpair.app</p>

      <p className="mt-8 rounded-xl border border-dashed p-4 text-xs text-zinc-500">
        Notă: acest document este un draft funcțional pentru lansarea
        inițială și nu reprezintă consultanță juridică. Recomandăm
        revizuirea lui de către un specialist în protecția datelor înainte
        de lansarea publică oficială.
      </p>
    </>
  );
}
