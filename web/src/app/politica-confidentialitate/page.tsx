import { redirect } from "next/navigation";

// Pagină veche, duplicat orfan al /legal/confidentialitate (conținut
// inconsistent: alt email de contact, altă dată de actualizare, nelinkată
// nicăieri în navigare). Păstrată ca redirect, nu ștearsă, în caz că
// există linkuri externe/indexări vechi către acest URL.
export default function PoliticaConfidentialitateRedirect() {
  redirect("/legal/confidentialitate");
}
