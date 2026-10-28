// Linkuri oficiale de descărcare a aplicației — un singur loc de schimbat
// când se actualizează campania sau când apare varianta iOS.

// Pentru butoane vizibile ("Descarcă aplicația") — include parametrul
// de campanie pentru atribuire trafic.
export const ANDROID_APP_URL =
  "https://play.google.com/store/apps/details?id=app.pawfectpair.mobile&pcampaignid=web_share";

// Pentru date structurate (JSON-LD, sameAs) — fără parametri de
// tracking, motoarele de căutare preferă URL-ul canonic.
export const ANDROID_APP_URL_CANONICAL =
  "https://play.google.com/store/apps/details?id=app.pawfectpair.mobile";

export const IOS_APP_URL: string | null = null;
