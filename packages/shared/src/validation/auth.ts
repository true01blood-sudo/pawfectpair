import { z } from 'zod';

export const EmailSchema = z
  .string()
  .min(1, 'Emailul este obligatoriu')
  .email('Email invalid');

export const PasswordSchema = z
  .string()
  .min(8, 'Parola trebuie să aibă minim 8 caractere')
  .max(72, 'Parola poate avea maxim 72 de caractere')
  .regex(/[A-Za-z]/, 'Parola trebuie să conțină cel puțin o literă')
  .regex(/[0-9]/, 'Parola trebuie să conțină cel puțin o cifră');

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Parola este obligatorie'),
});

export const RegisterSchema = z
  .object({
    email: EmailSchema,
    password: PasswordSchema,
    confirmPassword: z.string().min(1, 'Confirmă parola'),
    full_name: z.string().min(1, 'Numele este obligatoriu').max(80),
    age_consent: z.literal(true, {
      errorMap: () => ({ message: 'Trebuie să confirmi că ai cel puțin 16 ani' })
    }),
    terms_consent: z.literal(true, {
      errorMap: () => ({ message: 'Trebuie să accepți Termenii și Condițiile' })
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Parolele nu coincid',
    path: ['confirmPassword']
  });

export const ResetPasswordSchema = z.object({
  email: EmailSchema,
});

export type LoginForm = z.infer<typeof LoginSchema>;
export type RegisterForm = z.infer<typeof RegisterSchema>;
export type ResetPasswordForm = z.infer<typeof ResetPasswordSchema>;
