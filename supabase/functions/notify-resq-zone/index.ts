// supabase/functions/notify-resq-zone/index.ts
// Trimite notificări push Expo utilizatorilor din zona unui caz 'pierdut' nou.
// Declanșat de triggerul on_resq_case_insert din migrația 0038.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100; // limita API Expo per request

interface ResQPayload {
  case_id: string;
  name: string;
  species: string;
  city: string | null;
  lat: number;
  lng: number;
  photo_url: string | null;
  contact_phone: string | null;
}

interface PushToken {
  token: string;
  user_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let payload: ResQPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!payload.lat || !payload.lng) {
    return new Response(JSON.stringify({ sent: 0, reason: 'no coordinates' }), { status: 200 });
  }

  // Client cu service_role — necesită SUPABASE_SERVICE_ROLE_KEY în env
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Găsește userii cu token-uri în raza cazului (PostGIS ST_DWithin)
  const { data: tokens, error } = await supabase.rpc('get_tokens_in_radius', {
    case_lat: payload.lat,
    case_lng: payload.lng,
  });

  if (error) {
    console.error('[notify-resq-zone] RPC error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!tokens || (tokens as PushToken[]).length === 0) {
    console.log('[notify-resq-zone] No tokens in radius for case', payload.case_id);
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  const cityStr = payload.city ? ` în ${payload.city}` : '';
  const messages = (tokens as PushToken[]).map(({ token }) => ({
    to: token,
    sound: 'default',
    title: `🐾 Animal pierdut${cityStr}`,
    body: `${payload.name} (${payload.species}) a fost raportat(ă) pierdut(ă) în zona ta. Ajuți?`,
    data: {
      screen: 'resq_case',
      case_id: payload.case_id,
    },
    priority: 'high',
    channelId: 'resq-alerts', // Android notification channel
  }));

  let totalSent = 0;
  const errors: string[] = [];

  // Trimite în batch-uri de 100
  for (let i = 0; i < messages.length; i += EXPO_BATCH_SIZE) {
    const batch = messages.slice(i, i + EXPO_BATCH_SIZE);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(batch),
      });

      if (res.ok) {
        totalSent += batch.length;
      } else {
        const text = await res.text();
        errors.push(`batch ${i / EXPO_BATCH_SIZE}: ${text}`);
      }
    } catch (e) {
      errors.push(`batch ${i / EXPO_BATCH_SIZE}: ${String(e)}`);
    }
  }

  console.log(`[notify-resq-zone] case=${payload.case_id} sent=${totalSent} errors=${errors.length}`);

  return new Response(
    JSON.stringify({ sent: totalSent, errors: errors.length > 0 ? errors : undefined }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
