import { z } from 'zod';

export const MessageSchema = z.object({
  match_id: z.string().uuid('ID match invalid'),
  content: z
    .string()
    .min(1, 'Mesajul nu poate fi gol')
    .max(2000, 'Mesajul poate avea maxim 2000 de caractere'),
});

export type MessageForm = z.infer<typeof MessageSchema>;
