/**
 * Teste PetMarket — validare Zod + utils marketplace.
 */
import {
  MarketProductSchema,
  MarketOrderSchema,
  MARKET_MAX_ORDER_QUANTITY,
} from '../src/validation/market';
import {
  categoryKey,
  filterProducts,
  sortProducts,
  orderTotalCents,
  canTransitionOrder,
  formatPrice,
  countOrdersByStatus,
} from '../src/utils/market';
import type { MarketProductWithSeller } from '../src/types/market';

function makeProduct(overrides: Partial<MarketProductWithSeller> = {}): MarketProductWithSeller {
  return {
    id: 'p1',
    seller_id: '11111111-1111-1111-1111-111111111111',
    name: 'Hrană uscată premium',
    description: 'Pui și orez, pentru câini adulți.',
    category: 'food',
    price_cents: 12999,
    currency: 'RON',
    stock: 5,
    photo_url: null,
    condition: 'new',
    city: 'București',
    status: 'active',
    delivery_info: 'Ridicare personală sau curier',
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z',
    ...overrides,
  };
}

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Lesă retractabilă',
    category: 'accessories',
    price_cents: 8999,
    stock: 3,
    condition: 'new',
    city: 'Cluj-Napoca',
    ...overrides,
  };
}

describe('MarketProductSchema', () => {
  it('acceptă produs valid', () => {
    expect(MarketProductSchema.safeParse(validInput()).success).toBe(true);
  });

  it('respinge nume prea scurt', () => {
    expect(MarketProductSchema.safeParse(validInput({ name: 'a' })).success).toBe(false);
  });

  it('respinge categorie invalidă', () => {
    expect(MarketProductSchema.safeParse(validInput({ category: 'masini' })).success).toBe(false);
  });

  it('respinge preț negativ', () => {
    expect(MarketProductSchema.safeParse(validInput({ price_cents: -1 })).success).toBe(false);
  });

  it('respinge preț non-intreg', () => {
    expect(MarketProductSchema.safeParse(validInput({ price_cents: 10.5 })).success).toBe(false);
  });

  it('respinge stoc negativ', () => {
    expect(MarketProductSchema.safeParse(validInput({ stock: -2 })).success).toBe(false);
  });

  it('respinge oraș lipsă', () => {
    expect(MarketProductSchema.safeParse(validInput({ city: '' })).success).toBe(false);
  });

  it('golește opționale pe null', () => {
    const r = MarketProductSchema.safeParse(
      validInput({ description: '', delivery_info: '', photo_url: undefined })
    );
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.description).toBeNull();
      expect(r.data.delivery_info).toBeNull();
    }
  });

  it('respinge URL poză invalid', () => {
    expect(
      MarketProductSchema.safeParse(validInput({ photo_url: 'fisier.jpg' })).success
    ).toBe(false);
  });
});

describe('MarketOrderSchema', () => {
  it('acceptă comandă validă', () => {
    expect(
      MarketOrderSchema.safeParse({
        product_id: '11111111-1111-1111-1111-111111111111',
        quantity: 2,
      }).success
    ).toBe(true);
  });

  it('respinge cantitate 0', () => {
    expect(
      MarketOrderSchema.safeParse({
        product_id: '11111111-1111-1111-1111-111111111111',
        quantity: 0,
      }).success
    ).toBe(false);
  });

  it('respinge cantitate peste maxim', () => {
    expect(
      MarketOrderSchema.safeParse({
        product_id: '11111111-1111-1111-1111-111111111111',
        quantity: MARKET_MAX_ORDER_QUANTITY + 1,
      }).success
    ).toBe(false);
  });
});

describe('utils market', () => {
  it('categoryKey — directo + alias RO + fallback', () => {
    expect(categoryKey('food')).toBe('food');
    expect(categoryKey('hrana')).toBe('food');
    expect(categoryKey('Jucării')).toBe('toys');
    expect(categoryKey('Sanatate')).toBe('health');
    expect(categoryKey('electronice')).toBe('other');
    expect(categoryKey(null)).toBe('other');
  });

  it('filterProducts — categorie + căutare diacritice-insensibilă', () => {
    const products = [
      makeProduct(),
      makeProduct({ id: 'p2', name: 'Jucărie interactivă', category: 'toys' }),
      makeProduct({ id: 'p3', name: 'Bol ceramic', category: 'accessories', description: 'Pentru hrănire' }),
    ];
    const r1 = filterProducts(products, { category: 'toys' });
    expect(r1.map((p) => p.id)).toEqual(['p2']);

    const r2 = filterProducts(products, { search: 'hrană' });
    expect(r2.map((p) => p.id)).toEqual(['p1']);

    const r3 = filterProducts(products, { search: 'HRANIRE' });
    expect(r3.map((p) => p.id)).toEqual(['p3']);
  });

  it('filterProducts — condiție', () => {
    const products = [
      makeProduct({ condition: 'new' }),
      makeProduct({ id: 'p2', condition: 'used' }),
      makeProduct({ id: 'p3', condition: null }),
    ];
    expect(filterProducts(products, { condition: 'used' }).map((p) => p.id)).toEqual(['p2', 'p3']);
    // null condition = 'used' implicit
    expect(filterProducts(products, { condition: 'new' }).map((p) => p.id)).toEqual(['p1']);
  });

  it('sortProducts — cele mai recente primele', () => {
    const products = [
      makeProduct({ id: 'a', created_at: '2026-06-01T10:00:00Z' }),
      makeProduct({ id: 'b', created_at: '2026-06-10T10:00:00Z' }),
      makeProduct({ id: 'c', created_at: '2026-06-05T10:00:00Z' }),
    ];
    expect(sortProducts(products).map((p) => p.id)).toEqual(['b', 'c', 'a']);
  });

  it('orderTotalCents', () => {
    expect(
      orderTotalCents([
        { quantity: 2, unit_price_cents: 12999 },
        { quantity: 1, unit_price_cents: 5000 },
      ])
    ).toBe(30998);
    expect(orderTotalCents([])).toBe(0);
  });

  it('canTransitionOrder — fluxul complet', () => {
    expect(canTransitionOrder('pending', 'paid')).toBe(true);
    expect(canTransitionOrder('pending', 'shipped')).toBe(false);
    expect(canTransitionOrder('paid', 'shipped')).toBe(true);
    expect(canTransitionOrder('shipped', 'completed')).toBe(true);
    expect(canTransitionOrder('completed', 'cancelled')).toBe(false);
    expect(canTransitionOrder('cancelled', 'pending')).toBe(false);
    expect(canTransitionOrder('pending', 'cancelled')).toBe(true);
    expect(canTransitionOrder('shipped', 'cancelled')).toBe(true);
  });

  it('formatPrice — RON cu fallback', () => {
    const ro = formatPrice(12999, 'ro-RO');
    expect(ro).toContain('129');
    expect(formatPrice(0, 'ro-RO')).toContain('0');
    // fallback nu aruncă
    expect(formatPrice(100, 'xx-YY')).toBeTruthy();
  });

  it('countOrdersByStatus', () => {
    const orders = [
      { id: 'o1', buyer_id: 'u', status: 'pending', total_cents: 0, currency: 'RON', created_at: '' },
      { id: 'o2', buyer_id: 'u', status: 'pending', total_cents: 0, currency: 'RON', created_at: '' },
      { id: 'o3', buyer_id: 'u', status: 'completed', total_cents: 0, currency: 'RON', created_at: '' },
    ];
    expect(countOrdersByStatus(orders as never, 'pending')).toBe(2);
    expect(countOrdersByStatus(orders as never, 'cancelled')).toBe(0);
  });
});
