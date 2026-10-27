/**
 * Formatare dată — helpers partajate între web și mobil.
 */

/** Returnează YYYY-MM-DD în timezone local */
export function toDateInput(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Formatează ISO/YYYY-MM-DD în format RO: 12 oct. 2026 */
const RO_MONTHS = ['ian.', 'feb.', 'mar.', 'apr.', 'mai', 'iun.', 'iul.', 'aug.', 'sept.', 'oct.', 'nov.', 'dec.'];

export function formatDateRO(input: string | null | undefined): string {
  if (!input) return '—';
  const d = new Date(input);
  if (isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${RO_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Format scurt pentru listă: 12.10.2026 */
export function formatDateShortRO(input: string | null | undefined): string {
  if (!input) return '—';
  const d = new Date(input);
  if (isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}

/** Timp relativ în română: „acum 5 min", „ieri", „acum 3 zile" */
export function timeAgoRO(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '—';
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60_000);
  const hr = Math.floor(diff / 3_600_000);
  const day = Math.floor(diff / 86_400_000);

  if (min < 1) return 'acum';
  if (min < 60) return `acum ${min} min`;
  if (hr < 24) return `acum ${hr} h`;
  if (day === 1) return 'ieri';
  if (day < 7) return `acum ${day} zile`;
  if (day < 30) return `acum ${Math.floor(day / 7)} săpt.`;
  return formatDateShortRO(iso);
}

/** Număr de zile până la o dată (poate fi negativ dacă e în trecut) */
export function daysUntil(dateInput: string): number {
  const target = new Date(dateInput);
  if (isNaN(target.getTime())) return NaN;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
