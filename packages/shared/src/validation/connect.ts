/**
 * Validare Zod pentru modulul PetConnect (forum: postări + comentarii).
 */

import { z } from 'zod';
import { CONNECT_CATEGORIES } from '../types/connect';

const CATEGORY_TUPLE = CONNECT_CATEGORIES as unknown as [string, ...string[]];

export const ForumPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Titlul trebuie să aibă minim 3 caractere')
    .max(100, 'Titlul poate avea maxim 100 de caractere'),
  body: z
    .string()
    .trim()
    .min(10, 'Conținutul trebuie să aibă minim 10 caractere')
    .max(2000, 'Conținutul poate avea maxim 2000 de caractere'),
  category: z.enum(CATEGORY_TUPLE, {
    errorMap: () => ({ message: 'Categorie invalidă' }),
  }),
});

export type ForumPostForm = z.infer<typeof ForumPostSchema>;

export const ForumCommentSchema = z.object({
  post_id: z.string().uuid('ID postare invalid'),
  body: z
    .string()
    .trim()
    .min(2, 'Comentariul trebuie să aibă minim 2 caractere')
    .max(500, 'Comentariul poate avea maxim 500 de caractere'),
});

export type ForumCommentForm = z.infer<typeof ForumCommentSchema>;
