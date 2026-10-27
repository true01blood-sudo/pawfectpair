# PetCare Services — Specificații tehnice aplicație mobilă (iOS + Android)

**Versiune document:** 1.0  
**Data:** Octombrie 2026  
**Platforme țintă:** iOS 16+ · Android 10+ (API 29+)  
**Website sincronizat:** pawfectpair.app

---

## Cuprins

1. [Viziune și scop](#1-viziune-și-scop)
2. [Arhitectura generală](#2-arhitectura-generală)
3. [Stack tehnologic](#3-stack-tehnologic)
4. [Structura repository](#4-structura-repository)
5. [Module aplicație — prioritizate](#5-module-aplicație--prioritizate)
6. [Sincronizare web ↔ mobil](#6-sincronizare-web--mobil)
7. [Autentificare și autorizare](#7-autentificare-și-autorizare)
8. [Securitatea codului și a datelor](#8-securitatea-codului-și-a-datelor)
9. [Protecția datelor — GDPR](#9-protecția-datelor--gdpr)
10. [Stocare locală și offline](#10-stocare-locală-și-offline)
11. [Notificări push](#11-notificări-push)
12. [Testare și QA](#12-testare-și-qa)
13. [CI/CD și deployment](#13-cicd-și-deployment)
14. [Monetizare](#14-monetizare)
15. [Cerințe App Store / Google Play](#15-cerințe-app-store--google-play)
16. [Fișă de risc și limitări cunoscute](#16-fișă-de-risc-și-limitări-cunoscute)

---

## 1. Viziune și scop

PetCare Services este o platformă pentru deținătorii de animale de companie din România, oferind:

- Profiluri digitale pentru animale (fișă medicală, calendar vaccinări, greutate)
- PetMatch — sistem de tip „Tinder" pentru găsirea de companioni
- Comunitate și mesagerie între proprietari
- Planificator medical și notificări de scadențe
- Educație și sfaturi despre îngrijirea animalelor
- Secțiune adopții
- Magazin cu produse pentru animale *(faza viitoare)*

**Principiu de bază:** aplicația mobilă este o extensie a site-ului web — același cont, aceleași date, aceeași experiență.

---

## 2. Arhitectura generală

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENȚI                              │
│   Web (Next.js)    │    iOS (React Native)  │  Android (RN) │
└────────────────────┴───────────────────────┴────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Supabase (BaaS)   │
                    │  ─ PostgreSQL DB   │
                    │  ─ Auth (JWT)      │
                    │  ─ Storage (S3)    │
                    │  ─ Realtime (WS)   │
                    │  ─ Edge Functions  │
                    └───────────────────┘
```

**Regulă cheie:** nu există un API server propriu. Toți clienții comunică direct cu Supabase prin:
- **Supabase JS SDK** (web)
- **Supabase React Native SDK** (mobil)

Row Level Security (RLS) pe fiecare tabel Supabase garantează că un utilizator poate accesa doar propriile date.

---

## 3. Stack tehnologic

### 3.1 Aplicație mobilă

| Componentă | Tehnologie | Motivație |
|---|---|---|
| Framework UI | **React Native 0.75+** | Cod partajat cu web (logică, tipuri, validare) |
| Build tool | **Expo SDK 52+** | OTA updates, EAS Build, module native simple |
| Navigare | **React Navigation 7** | Standard industrie, deep linking, tab navigator |
| State global | **Zustand** | Simplu, performant, fără boilerplate Redux |
| Data fetching | **TanStack Query 5** | Cache, retry, optimistic updates, offline |
| Supabase client | **@supabase/supabase-js 2** + **@supabase/auth-helpers-expo** | Același SDK ca pe web |
| Stocare securizată | **expo-secure-store** | Keychain (iOS) / Keystore (Android) |
| Imagini | **expo-image** | Cache nativ, placeholder, priority loading |
| Upload fișiere | **expo-image-picker** + **expo-file-system** | Acces galerie + cameră |
| Notificări | **expo-notifications** | Unified push (APNs + FCM) |
| Biometrie | **expo-local-authentication** | Face ID / Touch ID / Fingerprint |
| Deep linking | **expo-linking** | URL scheme `pawfectpair://` |
| Fonturi | **expo-font** + Google Fonts | Identitate vizuală consistentă cu web |
| Localizare | **i18next + react-i18next** | Română implicit, extensibil |
| Validare forms | **Zod** | Același schema ca pe web (cod partajat) |
| Testare | **Jest + React Native Testing Library** | Unit + component tests |
| E2E | **Maestro** | *(faza viitoare)* |

### 3.2 Servicii backend (existente)

| Serviciu | Utilizare |
|---|---|
| Supabase Auth | JWT, OAuth (Google, Facebook, Apple) |
| Supabase Database | PostgreSQL, RLS, real-time subscriptions |
| Supabase Storage | Bucket `public-media` (avatare, poze animale) |
| Supabase Edge Functions | Webhook Facebook, logică server-side complexă |
| Vercel | Găzduire web (nu afectează mobil) |

### 3.3 Cod partajat web ↔ mobil

Într-un monorepo structura `packages/shared` poate conține:

```
packages/shared/
  ├── types/          # Tipuri TypeScript (Pet, Profile, MedicalRecord, etc.)
  ├── validation/     # Scheme Zod (validare identică pe toate platformele)
  ├── constants/      # SPECIES_OPTIONS, tip medical, etc.
  └── utils/          # Funcții pure (formatare dată, calcul vârstă, etc.)
```

---

## 4. Structura repository

```
pawfectpair.app/
├── web/                          # Aplicație Next.js (existentă)
│   ├── src/
│   └── ...
├── mobile/                       # Aplicație React Native (nouă)
│   ├── app/                      # Expo Router (file-based navigation)
│   │   ├── (auth)/
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── (tabs)/
│   │   │   ├── index.tsx         # Home / Dashboard
│   │   │   ├── petmatch.tsx      # PetMatch swipe
│   │   │   ├── comunitate.tsx    # Mesaje + matches
│   │   │   ├── profil.tsx        # Profil utilizator
│   │   │   └── _layout.tsx       # Tab bar config
│   │   ├── animale/
│   │   │   ├── [id]/
│   │   │   │   ├── index.tsx     # Fișă medicală
│   │   │   │   ├── edit.tsx      # Editare profil animal
│   │   │   │   └── greutate.tsx  # Log greutate
│   │   │   └── nou.tsx           # Adaugă animal
│   │   ├── planificator.tsx
│   │   ├── educatie/
│   │   ├── adoptii/
│   │   └── _layout.tsx           # Root layout (auth guard)
│   ├── components/               # Componente UI reutilizabile
│   │   ├── ui/                   # Button, Input, Card, Avatar, etc.
│   │   ├── pet/                  # PetCard, PetPlaceholder, PetForm
│   │   ├── medical/              # MedicalRecord, WeightChart
│   │   └── match/                # SwipeCard, MatchAnimation
│   ├── hooks/                    # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── usePets.ts
│   │   ├── useProfile.ts
│   │   └── useNotifications.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Supabase client mobil
│   │   │   └── queries.ts        # Funcții reutilizabile DB
│   │   ├── storage.ts            # Secure storage helpers
│   │   └── push.ts               # Push notification helpers
│   ├── store/                    # Zustand stores
│   │   ├── auth.store.ts
│   │   └── ui.store.ts
│   ├── assets/
│   │   ├── images/
│   │   └── fonts/
│   ├── app.json                  # Config Expo
│   ├── eas.json                  # Config EAS Build/Submit
│   └── package.json
├── packages/
│   └── shared/                   # Cod partajat (tipuri, validare, constante)
│       ├── types/
│       ├── validation/
│       ├── constants/
│       └── utils/
├── package.json                  # Workspace root (npm workspaces / pnpm)
└── MOBILE_APP_SPEC.md            # Acest document
```

---

## 5. Module aplicație — prioritizate

### FAZA 1 — MVP (de implementat la lansare)

#### 5.1 Autentificare

**Funcționalități:**
- Login cu email + parolă
- Înregistrare cont nou
- Login cu Google (OAuth)
- Login cu Facebook (OAuth)
- Login cu Apple *(obligatoriu pe iOS conform App Store guidelines)*
- Resetare parolă prin email
- Persistarea sesiunii (auto-login la redeschidere)
- Logout

**Flux OAuth mobil:**
```
App → supabase.auth.signInWithOAuth() 
    → Browser extern (WebAuthSession) 
    → Redirect pawfectpair://auth/callback 
    → App preia token-ul
```

**Complexitate:** Medie  
**Notă:** Apple Sign In este obligatoriu pe iOS dacă există alte opțiuni de social login.

---

#### 5.2 Profil utilizator

**Funcționalități:**
- Vizualizare profil (avatar, nume, email, telefon)
- Editare nume, telefon, avatar (foto din galerie sau cameră)
- Schimbare parolă
- Ștergere cont (cu confirmare explicită + email GDPR)

**Tabele Supabase:** `profiles`

**Complexitate:** Mică

---

#### 5.3 Profiluri animale

**Funcționalități:**
- Lista animalelor mele
- Adăugare animal (nume, specie, sex, rasă, dată naștere, poză, note)
- Editare profil animal
- Ștergere animal (confirmare + ștergere cascade: medical_records, weight_logs, pet_likes)
- Upload poză (galerie sau cameră) → Supabase Storage

**Tabele Supabase:** `pets`

**Complexitate:** Mică

---

#### 5.4 Fișă medicală

**Funcționalități:**
- Istoric medical al animalului (vaccinări, tratamente, intervenții, alergii, control)
- Adăugare înregistrare medicală (tip, titlu, dată, scadență, note)
- Vizualizare scadențe apropiate (în 30 de zile)
- Log greutate cu vizualizare progres (chart simplu)

**Tabele Supabase:** `medical_records`, `weight_logs`

**Complexitate:** Mică-Medie

---

#### 5.5 PetMatch

**Funcționalități:**
- Swipe card (Da ❤️ / Nu ✕) pentru animale din comunitate
- Filtre: specie, sex
- Animație la match (cele două animale se potrivesc reciproc)
- Notificare push la match nou

**Tabele Supabase:** `pet_likes`, `matches`

**Complexitate:** Medie  
**Notă:** Animația de match (similar Tinder) necesită Reanimated 3.

---

#### 5.6 Mesagerie comunitate

**Funcționalități:**
- Lista conversații (matches cu mesaje)
- Chat în timp real (Supabase Realtime)
- Trimitere mesaj text
- Indicator mesaje necitite

**Tabele Supabase:** `messages`, `matches`

**Complexitate:** Medie-Mare  
**Notă:** Real-time necesită gestionare atentă a subscriptions pentru a evita memory leaks.

---

#### 5.7 Navigare și UI general

**Funcționalități:**
- Tab bar cu 4 tab-uri: Home, PetMatch, Comunitate, Profil
- Header consistent cu back button
- Ecran splash + onboarding (prima rulare)
- Suport light/dark mode
- Compatibilitate notch (safe area insets)
- Pull-to-refresh pe listele principale

**Complexitate:** Mică

---

### FAZA 2 — Post-lansare (prioritate înaltă)

#### 5.8 Notificări push — detalii extinse

*(Vezi secțiunea 11)*

**Funcționalități:**
- Scadențe medicale (cu X zile înainte — configurabil de utilizator)
- Match nou la PetMatch
- Mesaj nou în chat
- Anunțuri platformă (opțional, opt-in)

**Complexitate:** Mare — **dezvoltare ulterioară**

---

#### 5.9 Planificator

**Funcționalități:**
- Calendar cu evenimente (vaccinări, vizite veterinar, baie, tuns, etc.)
- Adăugare eveniment cu reminder
- Recurență (lunar, anual)
- Sincronizare cu calendar nativ al telefonului *(opțional)*

**Complexitate:** Mare — **dezvoltare ulterioară**

---

#### 5.10 Educație și sfaturi

**Funcționalități:**
- Articole despre îngrijirea animalelor (categorizate pe specie)
- Citire offline (content caching)
- Marcaj favorit

**Complexitate:** Mică-Medie — **dezvoltare ulterioară**

---

#### 5.11 Adopții

**Funcționalități:**
- Listă animale disponibile pentru adopție
- Filtre (specie, sex, vârstă, locație)
- Formular cerere adopție
- Comunicare cu adăpost

**Complexitate:** Medie — **dezvoltare ulterioară**

---

### FAZA 3 — Funcționalități complexe (dezvoltare ulterioară)

#### 5.12 Localizare și hartă

**Funcționalități:**
- Găsire veterinari apropiați
- Parcuri pet-friendly
- Animale pentru adopție în zonă
- Harta evenimentelor comunitate

**Bibliotecă:** `react-native-maps` + Google Maps SDK  
**Complexitate:** Mare — **dezvoltare ulterioară**  
**Cost suplimentar:** Google Maps API (billing per request)

---

#### 5.13 Magazin (e-commerce)

**Funcționalități:**
- Catalog produse
- Coș cumpărături
- Integrare plată (Stripe sau Netopia)
- Istoric comenzi
- Livrare (integrare curier)

**Complexitate:** Foarte mare — **dezvoltare ulterioară**  
**Notă:** Necesită entitate juridică, cont merchant, conformitate fiscală.

---

#### 5.14 Recomandări AI

**Funcționalități:**
- Sugestii diete bazate pe specie/vârstă/greutate
- Alertă anomalii (scădere bruscă greutate, scadențe expirate)
- Recomandare veterinar bazată pe simptome descrise

**Complexitate:** Foarte mare — **dezvoltare ulterioară**  
**Notă:** Necesită integrare LLM (Claude API sau similar) + disclaimer medical.

---

#### 5.15 Teleconsultație veterinară

**Funcționalități:**
- Video call cu veterinar parteneri
- Programare și plată sesiune
- Rețete digitale

**Complexitate:** Extremă — **dezvoltare ulterioară**  
**Notă:** Necesită parteneriate, cadru legal, licențe medicale veterinare.

---

## 6. Sincronizare web ↔ mobil

### 6.1 Principii

1. **Single source of truth:** Supabase PostgreSQL — nu există date separate pe web vs. mobil.
2. **Același cont:** token-ul JWT Supabase este valid pe ambele platforme.
3. **Real-time:** modificările din web apar instant în aplicație via Supabase Realtime (WebSocket).

### 6.2 Sesiune partajată

- Web: token stocat în cookie HttpOnly (gestionat de `@supabase/ssr`)
- Mobil: token stocat în `expo-secure-store` (Keychain/Keystore, criptat la nivel de OS)
- **Nu există sincronizare directă web↔mobil** — ambele citesc/scriu aceeași bază de date

### 6.3 Upload imagini

Ambele platforme încarcă în același bucket Supabase Storage (`public-media`):
```
Structura path: {user_id}/{uuid}.{ext}
URL public: https://{project}.supabase.co/storage/v1/object/public/public-media/{path}
```

### 6.4 Politică de cache

```typescript
// Configurare TanStack Query — recomandat
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minute — date considerate fresh
      gcTime: 1000 * 60 * 60 * 24,   // 24 ore — păstrate în memorie offline
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
  },
});
```

---

## 7. Autentificare și autorizare

### 7.1 Flux autentificare

```
Utilizator → App → supabase.auth.signIn*()
                 → Supabase returnează: access_token (JWT, 1h) + refresh_token (rotit)
                 → App stochează în expo-secure-store
                 → La fiecare request: Bearer {access_token} în header
                 → La expirare: supabase.auth.refreshSession() automat (SDK)
```

### 7.2 JWT — structura token

Token-ul Supabase conține:
- `sub`: UUID utilizator (user_id)
- `email`: emailul utilizatorului
- `role`: `authenticated` (sau `anon` pentru neautentificați)
- `exp`: timestamp expirare
- `app_metadata.provider`: `email` / `google` / `facebook`

**Verificare pe server:** Supabase verifică semnătura JWT cu cheia secretă internă. Nu expuneți `SUPABASE_SERVICE_ROLE_KEY` niciodată în codul client.

### 7.3 Row Level Security (RLS)

Fiecare tabel are politici RLS active. Exemple:

```sql
-- Utilizatorul vede doar propriile animale
CREATE POLICY "owner_only" ON pets
  FOR ALL USING (owner_id = auth.uid());

-- Utilizatorul vede doar propriile înregistrări medicale (via join)
CREATE POLICY "owner_medical" ON medical_records
  FOR ALL USING (
    pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid())
  );

-- Messages: trimițătorul sau destinatarul pot citi
CREATE POLICY "participants_only" ON messages
  FOR SELECT USING (
    sender_id = auth.uid() OR
    match_id IN (
      SELECT id FROM matches 
      WHERE pet_a_id IN (SELECT id FROM pets WHERE owner_id = auth.uid())
         OR pet_b_id IN (SELECT id FROM pets WHERE owner_id = auth.uid())
    )
  );
```

### 7.4 Apple Sign In (obligatoriu iOS)

```typescript
import * as AppleAuthentication from 'expo-apple-authentication';

async function handleAppleLogin() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken!,
  });
}
```

**Configurare necesară:**
- Apple Developer Account — Certificates, Identifiers & Profiles
- Service ID creat pentru web, App ID cu Sign In with Apple capability
- Supabase: Auth → Providers → Apple → Client ID + Secret Key

### 7.5 Biometrie (opțional, recomandat)

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

async function authenticateWithBiometrics() {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Autentifică-te pentru a accesa PawfectPair',
    fallbackLabel: 'Folosește parola',
    cancelLabel: 'Anulează',
  });
  return result.success;
}
```

Biometria NU înlocuiește autentificarea Supabase — validează local că utilizatorul corect folosește dispozitivul, înainte de a folosi token-ul deja stocat.

---

## 8. Securitatea codului și a datelor

### 8.1 Variabile de mediu

```bash
# mobile/.env (NICIODATĂ în git)
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Chei cu prefixul EXPO_PUBLIC_ sunt vizibile în codul bundled (inevitabil pentru client-side)
# Cheia anon este publică prin design — securitatea vine din RLS, nu din ascunderea cheii
# NICIODATĂ nu puneți SERVICE_ROLE_KEY în client
```

**Regulă absolută:** `SUPABASE_SERVICE_ROLE_KEY` există doar în:
- Supabase Edge Functions (server-side)
- Variabile de mediu Vercel (server-side Next.js)
- **Niciodată în codul React Native / Next.js client**

### 8.2 Stocare securizată token

```typescript
// lib/storage.ts
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'pawfectpair_auth';

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(`${STORAGE_KEY}_${key}`);
  },
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(`${STORAGE_KEY}_${key}`, value, {
      keychainAccessibility: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(`${STORAGE_KEY}_${key}`);
  },
};

// Folosit în client Supabase:
const supabase = createClient(url, anonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // false pe mobil
  },
});
```

### 8.3 Certificate pinning (recomandat faza 2)

Previne atacuri MITM (man-in-the-middle) chiar dacă utilizatorul are instalat un certificat root fals:

```typescript
// Implementat via react-native-ssl-pinning sau expo-build-properties
// Pini SHA256 ai certificatelor Supabase / Cloudflare
// Necesită rebuild nativ la rotirea certificatelor
```

**Complexitate:** Mare — **dezvoltare ulterioară**

### 8.4 Validare input

Toate input-urile sunt validate cu **Zod** înainte de trimitere la Supabase:

```typescript
// packages/shared/validation/pet.ts
import { z } from 'zod';

export const PetSchema = z.object({
  name: z.string().min(1, 'Numele este obligatoriu').max(50),
  species: z.enum(['Câine', 'Pisică', 'Iepure', 'Hamster', 'Pasăre', 'Alt animal']),
  sex: z.enum(['male', 'female', 'unknown']).default('unknown'),
  breed: z.string().max(50).optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  notes: z.string().max(2000).optional(),
  photo_url: z.string().url().optional().nullable(),
});

export type PetInput = z.infer<typeof PetSchema>;
```

### 8.5 Protecție XSS / Injection

- React Native nu execută HTML raw → risc XSS redus față de web
- **Nu folosiți** `dangerouslySetInnerHTML` sau `eval()`
- Orice URL afișat ca link să treacă prin whitelist de scheme: `https://`, `mailto:`, `pawfectpair://`
- Validare server-side în RLS (nu vă bazați doar pe validarea client)

### 8.6 Securitate upload fișiere

```typescript
// Restricții la upload imagini
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

async function uploadPetPhoto(file: File | Blob, userId: string) {
  if (file.size > MAX_FILE_SIZE) throw new Error('Fișierul depășește 5MB');
  
  // Path izolat per utilizator — nu poate suprascrie fișierele altora
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  
  const { error } = await supabase.storage
    .from('public-media')
    .upload(path, file, {
      cacheControl: '3600',
      contentType: 'image/jpeg',
      upsert: false,
    });
    
  if (error) throw error;
}
```

**Politică bucket Supabase Storage:**
```sql
-- Oricine poate citi (imagini publice)
CREATE POLICY "public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'public-media');

-- Doar utilizatorul autentificat poate upload în propriul folder
CREATE POLICY "user_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'public-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Utilizatorul poate șterge doar propriile fișiere
CREATE POLICY "user_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'public-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

### 8.7 Protecție brute force

Supabase Auth are rate limiting built-in:
- Max 5 încercări login greșite → captcha sau cooldown
- Max 30 request-uri OTP pe oră per IP

Pe mobil, adăugați blocaj local după 3 încercări consecutive eșuate:
```typescript
// Stocat în SecureStore, nu în AsyncStorage
let failedAttempts = 0;
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minute
```

### 8.8 Ofuscarea codului

EAS Build cu `expo-crypto-utils` sau Hermes engine obfuscare:

```json
// app.json
{
  "expo": {
    "jsEngine": "hermes",
    "android": {
      "enableProguardInReleaseBuilds": true,
      "enableShrinkResourcesInReleaseBuilds": true
    }
  }
}
```

---

## 9. Protecția datelor — GDPR

### 9.1 Date colectate

| Categorie | Date | Stocare | Necesitate |
|---|---|---|---|
| Cont | Email, parolă (hash), dată înregistrare | Supabase Auth | Autentificare |
| Profil | Nume, telefon, avatar | DB + Storage | Funcționalitate |
| Animal | Toate câmpurile pet | DB + Storage | Core feature |
| Medical | Înregistrări medicale, greutate | DB | Core feature |
| Activitate | Like-uri, matches, mesaje | DB | PetMatch |
| Tehnic | IP la login, user agent | Supabase Logs (auto) | Securitate |

### 9.2 Drepturi utilizatori

Implementat via pagini web (deja existente) + endpoint-uri accesibile din app:

| Drept GDPR | Implementare |
|---|---|
| Dreptul la informare | `/legal/confidentialitate` |
| Dreptul de acces | Export date la cerere (email support) |
| Dreptul la rectificare | Edit profil, edit animale |
| Dreptul la ștergere | Buton „Solicită ștergerea contului" → email |
| Dreptul la portabilitate | Export JSON la cerere (faza viitoare) |
| Dreptul de opoziție | Opt-out notificări push |

### 9.3 Ștergere cont — flux complet

```typescript
// Necesită Supabase Edge Function (service role)
// Nu se poate face client-side — service_role_key nu e pe client

// edge-functions/delete-account/index.ts
export async function deleteUserAccount(userId: string) {
  // 1. Șterg toate datele utilizatorului în ordine (cascade)
  await supabase.from('messages').delete().in('sender_id', [userId]);
  await supabase.from('pet_likes').delete().in('from_pet_id', 
    supabase.from('pets').select('id').eq('owner_id', userId)
  );
  await supabase.from('pets').delete().eq('owner_id', userId);
  await supabase.from('profiles').delete().eq('id', userId);
  // 2. Șterg fișierele din Storage
  const { data: files } = await supabase.storage
    .from('public-media')
    .list(userId);
  if (files?.length) {
    await supabase.storage.from('public-media')
      .remove(files.map(f => `${userId}/${f.name}`));
  }
  // 3. Șterg contul Auth
  await supabase.auth.admin.deleteUser(userId);
}
```

### 9.4 Copii sub 16 ani

PetCare Services nu este destinat persoanelor sub 16 ani. La înregistrare:
- Checkbox explicit: „Confirm că am cel puțin 16 ani"
- Nu colectăm vârsta — declarație pe proprie răspundere

### 9.5 Transfer internațional de date

Supabase EU region (`eu-central-1` — Frankfurt) — date stocate în UE, fără transfer în țări terțe.

---

## 10. Stocare locală și offline

### 10.1 Nivele de stocare

| Tip date | Stocare | Motiv |
|---|---|---|
| Token JWT | `expo-secure-store` | Criptat, protejat de OS |
| Preferințe UI | `AsyncStorage` | Non-sensitive, simplu |
| Cache date | TanStack Query (în memorie) | Gestionat automat |
| Cache persistent | `@tanstack/query-async-storage-persister` | Offline access |
| Draft mesaje | `AsyncStorage` | Recuperare la crash |

### 10.2 Comportament offline

Aplicația afișează date din cache când nu există conexiune:

```typescript
import { useQuery } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: fetchMyPets,
    // La offline, date din cache sunt afișate fără eroare
    networkMode: 'offlineFirst',
  });
}
```

Acțiunile write (adaugă animal, trimite mesaj) necesită conexiune și afișează eroare clară dacă lipsește.

---

## 11. Notificări push

### 11.1 Arhitectura

```
App → expo-notifications → FCM (Android) / APNs (iOS)
                        ← Supabase Edge Function (trigger)
```

### 11.2 Token-uri push

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

async function registerForPushNotifications(userId: string) {
  if (!Device.isDevice) return; // Nu funcționează pe simulator
  
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  
  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: 'your-expo-project-id', // din app.json
  })).data;
  
  // Salvăm token-ul în Supabase, asociat user-ului
  await supabase
    .from('push_tokens')
    .upsert({ user_id: userId, token, platform: Platform.OS });
}
```

**Tabel necesar:**
```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'ios' | 'android'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform)
);
```

### 11.3 Trimitere notificări (server-side)

```typescript
// supabase/functions/send-push/index.ts
// Declanșat de trigger DB sau manual

async function sendPushNotification(userId: string, title: string, body: string, data?: object) {
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId);
    
  const messages = tokens?.map(({ token }) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: data ?? {},
  }));
  
  // Expo Push API (gratuit până la volum mare)
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
}
```

**Complexitate:** Mare — **dezvoltare ulterioară (Faza 2)**

---

## 12. Testare și QA

### 12.1 Tipuri de teste

| Tip | Tool | Acoperire țintă |
|---|---|---|
| Unit tests | Jest | Funcții pure, validare Zod, utils |
| Component tests | React Native Testing Library | Componente UI izolate |
| Integration tests | Jest + Supabase local | Fluxuri complete (login, adaugă pet) |
| E2E | Maestro | Scenarii critice (login → petmatch) |
| Manual | Dispozitive fizice | UI/UX, gesturi, notificări |

### 12.2 Strategia de testare minimă

**Prioritate 1 — trebuie să existe înainte de lansare:**
- Test login/logout
- Test adaugă/editează/șterge animal
- Test upload imagine
- Test PetMatch swipe

**Prioritate 2 — post-lansare:**
- Test mesagerie real-time
- Test notificări push
- Test offline behavior

### 12.3 Testare pe dispozitive

**iOS:**
- iPhone SE (ecran mic — 375px)
- iPhone 14 Pro (Dynamic Island)
- iPad (dacă suportăm tablet)

**Android:**
- Pixel 7 (Android 13, referință)
- Samsung Galaxy A series (Android 12, popular în România)
- Android 10 (versiunea minimă suportată)

---

## 13. CI/CD și deployment

### 13.1 EAS Build (Expo Application Services)

```json
// eas.json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true,
      "ios": { "enterpriseProvisioning": "automatic" },
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "...", "ascAppId": "..." },
      "android": { "serviceAccountKeyPath": "./google-play-key.json" }
    }
  }
}
```

### 13.2 OTA Updates (Over The Air)

```typescript
// app.json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/{project-id}",
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 3000
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

**Avantaj:** Bug fixes JS/React Native se publică fără App Store review.  
**Limitare:** Modificările native (permissions, native modules) necesită rebuild complet.

### 13.3 Pipeline GitHub Actions

```yaml
# .github/workflows/mobile.yml
name: Mobile CI

on:
  push:
    branches: [main]
    paths: ['mobile/**', 'packages/shared/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd mobile && npm ci
      - run: cd mobile && npm test

  build-preview:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd mobile && eas build --platform all --profile preview --non-interactive
```

### 13.4 Variabile secrete în CI

Stocate în GitHub Secrets / Expo EAS Secrets — niciodată hardcodate:
- `EXPO_TOKEN`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `APPLE_APP_SPECIFIC_PASSWORD` *(pentru submit)*
- `GOOGLE_PLAY_SERVICE_ACCOUNT` *(JSON, pentru submit)*

---

## 14. Monetizare

**Notă:** Toate opțiunile de monetizare sunt planificate pentru Faza 3+ și necesită decizie de business înainte de implementare tehnică.

### 14.1 Opțiuni identificate

| Model | Complexitate | Notă |
|---|---|---|
| Abonament premium (PetCare Services Plus) | Medie | RevenueCat + StoreKit2/Google Billing |
| Comision magazin | Mare | Necesită entitate juridică |
| Anunțuri targetate | Medie | Necesită consimțământ GDPR explicit |
| Donații adopții | Mică | Stripe Checkout |
| Comision teleconsultații | Foarte mare | Cadru legal complex |

### 14.2 Implementare abonament (dacă se decide)

```typescript
// Folosit RevenueCat — abstractizează StoreKit (iOS) și Google Play Billing
import Purchases from 'react-native-purchases';

// La init app:
Purchases.configure({ apiKey: REVENUECAT_API_KEY });

// Verificare entitlement:
const { entitlements } = await Purchases.getCustomerInfo();
const isPremium = entitlements.active['premium'] !== undefined;
```

**Important:** App Store și Google Play rețin 15-30% din abonamente.  
**Complexitate:** Mare — **dezvoltare ulterioară**

---

## 15. Cerințe App Store / Google Play

### 15.1 Apple App Store

| Cerință | Status | Notă |
|---|---|---|
| Apple Developer Account | Necesar | 99 USD/an |
| App icon 1024×1024px | ✅ Generat | `web/public/app-icon-1024.png` |
| Screenshots iPhone + iPad | De creat | Minim 3 screenshots per dimensiune |
| Privacy Policy URL | ✅ Există | `pawfectpair.app/legal/confidentialitate` |
| Support URL | ✅ Există | `pawfectpair.app/suport` |
| Apple Sign In | Obligatoriu | Dacă există alte social login |
| Age Rating | 4+ | Fără conținut restricționat |
| App Review Info | Necesar | Cont demo pentru reviewer |

### 15.2 Google Play Store

| Cerință | Status | Notă |
|---|---|---|
| Google Play Developer Account | Necesar | 25 USD (one-time) |
| App icon 512×512px | De derivat din 1024px | |
| Feature graphic 1024×500px | De creat | Banner pe pagina magazin |
| Screenshots telefon + tabletă | De creat | Minim 2 per formfactor |
| Privacy Policy URL | ✅ Există | |
| Data Safety section | De completat | Declarare date colectate |
| Target API level | Android 14 (API 34) | Obligatoriu din 2024 |
| App signing | Google manages signing | Recomandat |

### 15.3 Permissions necesare

**iOS (Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>PetCare Services folosește camera pentru a fotografia animalul tău de companie.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>PetCare Services accesează galeria pentru a selecta o poză a animalului tău.</string>

<key>NSUserNotificationsUsageDescription</key>
<string>PetCare Services te anunță despre scadențe medicale și match-uri noi.</string>

<!-- Faza 2: -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>PetCare Services folosește locația pentru a găsi veterinari și animale apropiați.</string>
```

**Android (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.INTERNET" />
<!-- Faza 2: -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

---

## 16. Fișă de risc și limitări cunoscute

### 16.1 Riscuri tehnice

| Risc | Probabilitate | Impact | Mitigare |
|---|---|---|---|
| Rotire certificat Supabase | Mică | Critic | OTA update rapid |
| Rate limiting Supabase (plan free) | Medie | Mare | Upgrade plan la 500+ utilizatori activi |
| Respingere App Store Review | Medie | Mediu | Cont demo, testare completă înainte de submit |
| Token OAuth expirat (Facebook) | Mică | Mediu | Handle auto-refresh în SDK |
| APNS / FCM token invalidat | Medie | Mic | Cleanup periodic token-uri inactive |

### 16.2 Limitări platforma free Supabase

La planul Free Supabase:
- 500MB bază de date
- 1GB Storage
- 50.000 utilizatori autentificați activi/lună
- Proiectul se „îngheață" după 1 săptămână inactivitate

**La >100 utilizatori activi:** upgrade la planul Pro ($25/lună).

### 16.3 Dependențe critice

```
pawfectpair.app ─── Supabase (auth, db, storage)
                ─── Vercel (web hosting)
                ─── Expo EAS (mobile build/deploy)
                ─── Apple Developer Program (iOS)
                ─── Google Play Console (Android)
                ─── Supabase OAuth Apps: Google Cloud, Facebook Developers
```

Orice dintre acestea poate afecta funcționalitatea dacă se schimbă politici sau prețuri.

---

## Anexă — Comenzi utile dezvoltare

```bash
# Instalare dependențe mobile
cd mobile && npm install

# Start development server
npx expo start

# Build pentru simulator iOS
npx expo run:ios

# Build pentru emulator Android  
npx expo run:android

# Build cloud (EAS) — preview
eas build --platform all --profile preview

# Build cloud (EAS) — producție
eas build --platform all --profile production

# Submit la App Store / Google Play
eas submit --platform ios
eas submit --platform android

# Update OTA
eas update --branch main --message "Fix: descriere"

# Teste
npm test
npm run test:coverage

# TypeScript check
npx tsc --noEmit

# Lint
npx eslint . --ext .ts,.tsx
```

---

*Document generat: Octombrie 2026*  
*Ultima actualizare: la modificarea structurii proiectului sau a stack-ului tehnologic*
