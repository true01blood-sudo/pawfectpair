import { NextRequest, NextResponse } from "next/server";

const SUPPORTED = ["ro", "en", "fr", "de", "it"] as const;
type Locale = (typeof SUPPORTED)[number];

const COUNTRY_LOCALE: Record<string, Locale> = {
  RO: "ro",
  FR: "fr",
  BE: "fr",
  LU: "fr",
  MC: "fr",
  DE: "de",
  AT: "de",
  LI: "de",
  IT: "it",
  SM: "it",
  VA: "it",
};

function detect(req: NextRequest): Locale {
  const cookie = req.cookies.get("locale")?.value as Locale | undefined;
  if (cookie && SUPPORTED.includes(cookie)) return cookie;

  // Vercel geo (production)
  const country = req.headers.get("x-vercel-ip-country") ?? "";
  if (country && COUNTRY_LOCALE[country]) return COUNTRY_LOCALE[country];

  // Browser Accept-Language (dev + fallback)
  const accept = req.headers.get("accept-language") ?? "";
  const primary = accept.split(",")[0]?.split("-")[0]?.toLowerCase();
  if (primary === "ro") return "ro";
  if (primary === "fr") return "fr";
  if (primary === "de") return "de";
  if (primary === "it") return "it";

  return "en";
}

export function proxy(req: NextRequest) {
  const locale = detect(req);
  const res = NextResponse.next();
  res.cookies.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  res.headers.set("x-locale", locale);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)" ],
};
