/**
 * Validare Zod pentru modulul PetMarket (produse + comenzi).
 */

import { z } from 'zod';
import {
  MARKET_CATEGORIES,
  MARKET_CONDITIONS,
  MARKET_ORDER_STATUSES,
} from '../types/market';

const CATEGORY_TUPLE = MARKET_CATEGORIES as unknown as [string, ...string[]];
const CONDITION_TUPLE = MARKET_CONDITIONS as unknown as [string, ...string[]];
const ORDER_STATUS_TUPLE = MARKET_ORDER_STATUSES as unknown as [string, ...string[]];

/** Prețul maxim: 100.000 RON (10.000.000 bani) */
export const MARKET_MAX_PRICE_CENTS = 10_000_000;
/** Cantitatea maximă per comandă */
export const MARKET_MAX_ORDER_QUANTITY = 10;

export const MarketProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Numele trebuie să aibă minim 2 caractere')
    .max(80, 'Numele poate avea maxim 80 de caractere'),
  description: z
    .string()
    .trim()
    .max(800, 'Descrierea poate avea maxim 800 de caractere')
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
  category: z.enum(CATEGORY_TUPLE, {
    errorMap: () => ({ message: 'Categorie invalidă' }),
  }),
  price_cents: z
    .number()
    .int('Prețul trebuie să fie întreg (bani)')
    .min(0, 'Prețul nu poate fi negativ')
    .max(MARKET_MAX_PRICE_CENTS, 'Prețul este prea mare'),
  stock: z
    .number()
    .int('Stocul trebuie să fie întreg')
    .min(0, 'Stocul nu poate fi negativ')
    .max(9999, 'Stocul este prea mare'),
  condition: z.enum(CONDITION_TUPLE, {
    errorMap: () => ({ message: 'Condiție invalidă' }),
  }),
  city: z
    .string()
    .trim()
    .min(2, 'Orașul trebuie să aibă minim 2 caractere')
    .max(60, 'Orașul poate avea maxim 60 de caractere'),
  delivery_info: z
    .string()
    .trim()
    .max(300, 'Informațiile de livrare pot avea maxim 300 de caractere')
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
  photo_url: z
    .string()
    .url('URL poză invalid')
    .optional()
    .nullable()
    .transform((v) => (v === undefined ? null : v)),
});

export type MarketProductForm = z.infer<typeof MarketProductSchema>;

export const MarketOrderSchema = z.object({
  product_id: z.string().uuid('ID produs invalid'),
  quantity: z
    .number()
    .int('Cantitatea trebuie să fie întreagă')
    .min(1, 'Minim 1 bucată')
    .max(MARKET_MAX_ORDER_QUANTITY, `Maxim ${MARKET_MAX_ORDER_QUANTITY} bucăți per comandă`),
});

export type MarketOrderForm = z.infer<typeof MarketOrderSchema>;

export const MarketOrderStatusSchema = z.enum(ORDER_STATUS_TUPLE, {
  errorMap: () => ({ message: 'Status comandă invalid' }),
});

export const MarketProductStatusSchema = z.enum(['active', 'sold'] as unknown as [string, ...string[]], {
  errorMap: () => ({ message: 'Status produs invalid' }),
});
