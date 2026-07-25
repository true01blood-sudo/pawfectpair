import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termeni și condiții",
  description: "Termenii și condițiile de utilizare a platformei PawfectPair.",
};

export default function TermeniPage() {
  return (
    <>
      <h1>Termeni și condiții</h1>
      <p className="text-sm text-zinc-500">Ultima actualizare: 25 iulie 2026</p>

      <p>
        Acești termeni guvernează utilizarea platformei PawfectPair
        (&quot;Platforma&quot;), operată de PawfectPair (&quot;noi&quot;,
        &quot;Compania&quot;). Prin crearea unui cont sau utilizarea
        Platformei, ești de acord cu acești termeni.
      </p>

      <h2>1. Ce este PawfectPair</h2>
      <p>
        PawfectPair este o platformă care conectează proprietari de animale
        de companie, veterinari, centre de adopție/asociații și magazine, prin
        module de: adopții, programări veterinare, marketplace, comunitate și
        socializare între animale de companie.
      </p>

      <h2>2. Contul tău</h2>
      <ul>
        <li>Trebuie să ai cel puțin 16 ani pentru a-ți crea un cont singur; sub această vârstă, contul se creează cu acordul unui părinte/tutore.</li>
        <li>Ești responsabil pentru păstrarea confidențialității parolei și pentru activitatea din contul tău.</li>
        <li>Informațiile furnizate (profil, animale, anunțuri) trebuie să fie reale și neînșelătoare.</li>
      </ul>

      <h2>3. Roluri și conturi speciale</h2>
      <p>
        Anumite conturi (veterinar/cabinet, magazin, centru de adopție/asociație)
        primesc funcționalități suplimentare de administrare a propriului
        conținut (programări, produse, anunțuri de adopție). Aceste conturi
        răspund pentru acuratețea informațiilor publicate (prețuri, stocuri,
        disponibilitate, stare de sănătate a animalelor).
      </p>

      <h2>4. Adopții</h2>
      <p>
        PawfectPair facilitează contactul dintre solicitanți și centrele/
        persoanele care oferă animale spre adopție, dar nu este parte în
        procesul de adopție și nu garantează exactitatea anunțurilor.
        Comercializarea animalelor prin secțiunea de adopții este interzisă.
      </p>

      <h2>5. Marketplace</h2>
      <p>
        Produsele din magazin sunt publicate de vânzători terți (conturi de
        tip magazin) sau, pentru produse importate din surse publice, de
        administratorii platformei în scop de populare a catalogului.
        Prețurile pot include un adaos comercial stabilit de platformă.
        Comenzile plasate prin Platformă reprezintă o înțelegere între
        cumpărător și vânzător; PawfectPair nu procesează în prezent plăți
        online și nu răspunde pentru livrarea sau calitatea produselor.
      </p>

      <h2>6. Programări veterinare</h2>
      <p>
        Programările sunt cereri transmise cabinetelor selectate; confirmarea
        finală aparține cabinetului veterinar. PawfectPair nu oferă consultații
        medicale și nu răspunde pentru actul medical veterinar.
      </p>

      <h2>7. Conduită și conținut interzis</h2>
      <ul>
        <li>Fără cruzime, abandon sau exploatare a animalelor promovată în orice formă.</li>
        <li>Fără hărțuire, discurs instigator la ură sau conținut ilegal.</li>
        <li>Fără conturi false sau utilizare frauduloasă a serviciilor.</li>
      </ul>
      <p>
        Ne rezervăm dreptul de a suspenda conturi care încalcă acești termeni.
      </p>

      <h2>8. Limitarea răspunderii</h2>
      <p>
        Platforma este oferită &quot;ca atare&quot;. În limita permisă de
        lege, PawfectPair nu răspunde pentru daune indirecte rezultate din
        utilizarea serviciilor, interacțiuni între utilizatori sau conținut
        publicat de terți.
      </p>

      <h2>9. Modificări</h2>
      <p>
        Putem actualiza acești termeni; vom afișa data ultimei actualizări.
        Continuarea utilizării Platformei după modificări reprezintă
        acceptarea lor.
      </p>

      <h2>10. Contact</h2>
      <p>Pentru întrebări: contact@pawfectpair.app</p>

      <p className="mt-8 rounded-xl border border-dashed p-4 text-xs text-zinc-500">
        Notă: acest document este un draft funcțional, generat pentru
        lansarea inițială a platformei, și nu reprezintă consultanță
        juridică. Recomandăm revizuirea lui de către un avocat înainte de
        lansarea publică oficială.
      </p>
    </>
  );
}
