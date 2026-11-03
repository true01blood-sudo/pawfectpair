import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * cache() memoizes per-request (React server render scope) — fara asta,
 * fiecare pagina + layout.tsx isi crea propriul client si repeta
 * auth.getUser() (round-trip real catre Supabase Auth, nu doar citire
 * de cookie), de obicei de 2+ ori pe navigare. Gasit in auditul de
 * performanta — contribuitor real la incarcarea lenta raportata.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component; ignore if middleware refreshes sessions
          }
        },
      },
    },
  );
});

/**
 * Userul autentificat curent, memoizat per-request. Inlocuieste
 * `(await createClient()).auth.getUser()` apelat separat in layout.tsx
 * SI in fiecare page.tsx — acum e un singur round-trip real catre
 * Supabase Auth per request, indiferent de cate ori e chemat getUser().
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
