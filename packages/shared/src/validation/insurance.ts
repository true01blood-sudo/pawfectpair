/**
 * Validare Zod pentru modulul PetInsurance (polițe + despăgubiri).
 */

import { z } from 'zod';
import { POLICY_TYPES, POLICY_STATUSES, CLAIM_STATUSES } from '../types/insurance';

const TYPE_TUPLE = POLICY_TYPES as unknown as [string, ...string[]];
const POLICY_STATUS_TUPLE = POLICY_STATUSES as unknown as [string, ...string[]];
const CLAIM_STATUS_TUPLE = CLAIM_STATUSES as unknown as [string, ...string[]];

/** Sumă maximă exprimată în bani (100.000 RON) */
export const INSURANCE_MAX_AMOUNT_CENTS = 10_000_000;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Dată invalidă (AAAA-LL-ZZ)')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2100;
  }, 'Data trebuie să fie între anii 2000 și 2100');

const moneyCents = z
  .number()
  .int('Suma trebuie să fie un număr întreg (bani)')
  .min(0, 'Suma nu poate fi negativă')
  .max(INSURANCE_MAX_AMOUNT_CENTS, `Suma maximă este ${INSURANCE_MAX_AMOUNT_CENTS / 100} RON`);

/** Poliță nouă/editată */
export const InsurancePolicySchema = z
  .object({
    pet_id: z
      .string()
      .uuid('ID animal invalid')
      .nullable()
      .optional()
      .transform((v) => (v === undefined ? null : v)),
    provider: z
      .string()
      .trim()
      .min(2, 'Numele asigurătorului trebuie să aibă minim 2 caractere')
      .max(60, 'Numele asigurătorului poate avea maxim 60 de caractere'),
    policy_number: z
      .string()
      .trim()
      .max(60, 'Numărul poliței poate avea maxim 60 de caractere')
      .optional()
      .transform((v) => (v === '' || v === undefined ? null : v)),
    policy_type: z.enum(TYPE_TUPLE, {
      errorMap: () => ({ message: 'Tip de poliță invalid' }),
    }),
    premium_cents: moneyCents,
    coverage_limit_cents: moneyCents.nullable().optional().transform((v) => (v === undefined ? null : v)),
    deductible_cents: moneyCents.nullable().optional().transform((v) => (v === undefined ? null : v)),
    start_date: isoDate,
    end_date: isoDate,
    notes: z
      .string()
      .trim()
      .max(500, 'Notele pot avea maxim 500 de caractere')
      .optional()
      .transform((v) => (v === '' || v === undefined ? null : v)),
  })
  .superRefine((d, ctx) => {
    if (d.end_date <= d.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data de final trebuie să fie după data de început',
        path: ['end_date'],
      });
      return;
    }
    // Maxim 5 ani (comparație calendaristică, corectă și pentru ani bisecți)
    const start = new Date(`${d.start_date}T00:00:00Z`);
    const end = new Date(`${d.end_date}T00:00:00Z`);
    const max = new Date(start);
    max.setUTCFullYear(max.getUTCFullYear() + 5);
    if (end.getTime() > max.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Polita poate avea maxim 5 ani',
        path: ['end_date'],
      });
    }
  });

export type InsurancePolicyForm = z.infer<typeof InsurancePolicySchema>;

/** Despăgubire nouă */
export const InsuranceClaimSchema = z.object({
  policy_id: z.string().uuid('ID poliță invalid'),
  claim_date: isoDate,
  description: z
    .string()
    .trim()
    .min(10, 'Descrierea trebuie să aibă minim 10 caractere')
    .max(1000, 'Descrierea poate avea maxim 1000 de caractere'),
  amount_cents: moneyCents,
});

export type InsuranceClaimForm = z.infer<typeof InsuranceClaimSchema>;

/** Tranziții de status */
export const PolicyStatusSchema = z.enum(POLICY_STATUS_TUPLE, {
  errorMap: () => ({ message: 'Status poliță invalid' }),
});

export const ClaimStatusSchema = z.enum(CLAIM_STATUS_TUPLE, {
  errorMap: () => ({ message: 'Status despăgubire invalid' }),
});
