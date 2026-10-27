/**
 * Calcul vârstă animal pe baza datei de naștere.
 */

export interface AgeBreakdown {
  years: number;
  months: number;
  total_months: number;
  label: string;
}

/** Calculează vârsta în ani + luni */
export function calcAge(birthDate: string | null | undefined): AgeBreakdown | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;

  const now = new Date();
  if (birth > now) {
    return { years: 0, months: 0, total_months: 0, label: '—' };
  }

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  // ajustează dacă ziua nu a venit încă luna asta
  if (now.getDate() < birth.getDate()) {
    months = Math.max(0, months - 1);
  }

  const total_months = years * 12 + months;

  let label: string;
  if (years === 0 && months === 0) {
    label = 'Sub o lună';
  } else if (years === 0) {
    label = months === 1 ? '1 lună' : `${months} luni`;
  } else if (months === 0) {
    label = years === 1 ? '1 an' : `${years} ani`;
  } else {
    const yLabel = years === 1 ? '1 an' : `${years} ani`;
    const mLabel = months === 1 ? '1 lună' : `${months} luni`;
    label = `${yLabel} ${mLabel}`;
  }

  return { years, months, total_months, label };
}
