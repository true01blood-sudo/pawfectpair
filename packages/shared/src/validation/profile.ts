import { z } from 'zod';

export const ProfileSchema = z.object({
  full_name: z.string().min(1, 'Numele este obligatoriu').max(80, 'Maxim 80 de caractere').nullable().optional(),
  phone: z
    .string()
    .regex(/^(\+?4?0?7\d{8}|\+?\d{10,15})$/, 'Număr de telefon invalid (ex: +40712345678)')
    .nullable()
    .optional(),
  avatar_url: z.string().url('URL avatar invalid').nullable().optional(),
  bio: z.string().max(300, 'Bio maxim 300 de caractere').nullable().optional(),
});

export type ProfileForm = z.infer<typeof ProfileSchema>;
