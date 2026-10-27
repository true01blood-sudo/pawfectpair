/**
 * Utils PetMarket — funcții pure pentru filtrare/sortare produse,
 * tranziții de status comandă și formatare preț.
 * Testate unitar în packages/shared/__tests__/market.test.ts.
 */
import type {
  MarketCategory,
  MarketOrderStatus,
  MarketOrderWithItems,
  MarketFilters,
  MarketProductWithSeller,
} from '../types/market';
import { MARKET_CATEGORIES } from '../types/market';

/** Normalizează text pentru căutare diacritice-insensibilă (RO). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .trim();
}

/** Mapază o categorie liberă (din web/DB) pe o categorie cunoscută; fallback 'other'. */
export function categoryKey(category: string | null | undefined): MarketCategory {
  if (!category) return 'other';
  const norm = normalize(category);
  const direct = MARKET_CATEGORIES.find((c) => c === norm);
  if (direct) return direct;
  const alias: Record<string, MarketCategory> = {
    hrana: 'food',
    accesorii: 'accessories',
    jucarii: 'toys',
    ingrijire: 'grooming',
    igiena: 'grooming',
    sanatate: 'health',
    transport: 'transport',
    imbracaminte: 'clothing',
    alte: 'other',
  };
  return alias[norm] ?? 'other';
}

/** Filtrare produse: categorie, condiție, text (nume + descriere). */
export function filterProducts(
  products: MarketProductWithSeller[],
  filters: MarketFilters
): MarketProductWithSeller[] {
  const search = filters.search ? normalize(filters.search) : null;
  return products.filter((p) => {
    if (filters.category && categoryKey(p.category) !== filters.category) return false;
    if (filters.condition && (p.condition ?? 'used') !== filters.condition) return false;
    if (search) {
      const haystack = normalize(`${p.name} ${p.description ?? ''}`);
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

/** Sortare: cele mai recente primele. */
export function sortProducts(products: MarketProductWithSeller[]): MarketProductWithSeller[] {
  return [...products].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/** Total comandă în bani, pe baza liniilor. */
export function orderTotalCents(
  items: { quantity: number; unit_price_cents: number }[]
): number {
  return items.reduce((sum, it) => sum + it.quantity * it.unit_price_cents, 0);
}

/**
 * Tranziții permise ale statusului comenzii:
 * pending → paid | cancelled; paid → shipped | cancelled;
 * shipped → completed | cancelled; completed/cancelled = final.
 */
const ORDER_TRANSITIONS: Record<MarketOrderStatus, MarketOrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function canTransitionOrder(from: MarketOrderStatus, to: MarketOrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** Formatare preț din bani (ex: 12345 → "123,45 RON") folosind Intl. */
export function formatPrice(cents: number, locale: string, currency = 'RON'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

/** Rezumat status comenzi: numără câte comenzi sunt într-un status dat. */
export function countOrdersByStatus(
  orders: MarketOrderWithItems[],
  status: MarketOrderStatus
): number {
  return orders.filter((o) => o.status === status).length;
}
