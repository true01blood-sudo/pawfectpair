/**
 * Tipuri pentru modulul PetMarket — marketplace de produse pet.
 * Construiește pe tabelele upstream `products` / `orders` / `order_items`
 * (0001_init), extinse cu 0030 (condiție, oraș, status, declin stoc automat).
 */

import type { Profile } from './profile';

/** Categorii de produse (listă fixă pentru UI) */
export type MarketCategory =
  | 'food'        // hrană & delicatese
  | 'accessories' // accesorii (lese, boluri, cuști)
  | 'toys'        // jucării
  | 'grooming'    // îngrijire & igienă
  | 'health'      // sănătate (suplimente, antiparazitare)
  | 'transport'   // transport (cage, ham, scaune auto)
  | 'clothing'    // îmbrăcăminte
  | 'other';      // alte produse

export const MARKET_CATEGORIES = [
  'food',
  'accessories',
  'toys',
  'grooming',
  'health',
  'transport',
  'clothing',
  'other',
] as const;

export const MARKET_CATEGORY_EMOJI: Record<MarketCategory, string> = {
  food: '🍖',
  accessories: '🎾',
  toys: '🧸',
  grooming: '🧼',
  health: '💊',
  transport: '🧳',
  clothing: '👕',
  other: '📦',
};

/** Condiția produsului */
export type MarketCondition = 'new' | 'like_new' | 'used';

export const MARKET_CONDITIONS = ['new', 'like_new', 'used'] as const;

/** Statusul anunțului */
export type MarketProductStatus = 'active' | 'sold';

export const MARKET_PRODUCT_STATUSES = ['active', 'sold'] as const;

/** Statusul comenzii */
export type MarketOrderStatus =
  | 'pending'   // plasată
  | 'paid'      // plătită (confirmată de vânzător)
  | 'shipped'   // expediată / predată
  | 'completed' // finalizată
  | 'cancelled';// anulată

export const MARKET_ORDER_STATUSES = [
  'pending',
  'paid',
  'shipped',
  'completed',
  'cancelled',
] as const;

/** Produs (anunț) — corespunde tabelului `products` */
export interface MarketProduct {
  id: string;
  seller_id: string | null;
  name: string;
  description: string | null;
  category: string | null;      // liber în web; mobilul folosește categoriile fixe
  price_cents: number;
  currency: string;             // 'RON'
  stock: number;
  photo_url: string | null;
  /** câmpuri adăugate de 0030 */
  condition?: MarketCondition | null;
  city?: string | null;
  status?: MarketProductStatus | null;
  delivery_info?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketProductWithSeller extends MarketProduct {
  seller?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
}

/** Linie comandă */
export interface MarketOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  product?: Pick<MarketProduct, 'id' | 'name' | 'photo_url'> | null;
}

/** Comandă */
export interface MarketOrder {
  id: string;
  buyer_id: string;
  status: MarketOrderStatus;
  total_cents: number;
  currency: string;
  created_at: string;
  updated_at?: string;
}

export interface MarketOrderWithItems extends MarketOrder {
  items?: MarketOrderItem[];
  buyer?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
}

/** Filtre listare produse */
export interface MarketFilters {
  category?: MarketCategory | null;
  condition?: MarketCondition | null;
  search?: string;
}

/** Input creare/editare produs */
export interface MarketProductInput {
  name: string;
  description?: string | null;
  category: MarketCategory;
  price_cents: number;
  stock: number;
  condition: MarketCondition;
  city: string;
  delivery_info?: string | null;
  photo_url?: string | null;
}

/** Input plasare comandă */
export interface MarketOrderInput {
  product_id: string;
  quantity: number;
}
