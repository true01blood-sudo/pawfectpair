export type Locale = "ro" | "en" | "fr" | "de" | "it";

export const translations = {
  ro: {
    nav: {
      adoptii: "Adopții", veterinari: "Veterinari", magazin: "Magazin",
      comunitate: "Comunitate", forum: "Forum", petresq: "PetResQ", sos: "SOS",
      cont: "Cont", profilMeu: "Profilul meu",
    },
    hero: {
      badge: "Platforma nr. 1 pentru animale de companie",
      title: "Totul pentru",
      accent: "animalul tău",
      titleEnd: ",\nîntr-o singură aplicație.",
      subtitle: "Îngrijire, siguranță, servicii și produse — gratuit, în română.",
      searchPlaceholder: "Caută veterinari, adopții, produse...",
      searchBtn: "Caută",
      downloadAndroid: "Descarcă pe Android",
      createAccount: "Creează cont gratuit →",
    },
    categories: [
      "Veterinari", "Adopții", "Magazin", "GPS & Siguranță",
      "Training", "Comunitate", "Pierdut/Găsit", "Urgențe SOS",
    ],
    offers: {
      label: "Ce oferim",
      title: "Patru promisiuni. O singură aplicație.",
    },
    promises: [
      {
        title: "Îngrijire", subtitle: "Sănătatea animalului, mereu la îndemână",
        desc: "Dosare medicale, vaccinuri, greutate, remindere și consultații.",
        cta: "Descoperă îngrijire",
      },
      {
        title: "Siguranță", subtitle: "Mereu știi unde este și ce i se întâmplă",
        desc: "GPS live, geofencing, urgențe medicale și recuperarea animalelor pierdute.",
        cta: "Descoperă siguranța",
      },
      {
        title: "Servicii", subtitle: "Specialiști verificați, programări rapide",
        desc: "Veterinari apropiați, dresori certificați și pensiuni — rezervări directe.",
        cta: "Descoperă servicii",
      },
      {
        title: "Produse", subtitle: "Recomandări adaptate rasei și vârstei",
        desc: "Magazin personalizat — hrană, jucării, accesorii și mai mult.",
        cta: "Descoperă produse",
      },
    ],
    profile: {
      label: "Centrul experienței",
      title: "Profilul animalului tău —",
      titleLine2: "motivul pentru care revii zilnic",
      desc: "Adaugă animalul o singură dată. Pet Care Services îți organizează automat sănătatea, programările și istoricul complet.",
      createCta: "Creează profil gratuit →",
      goToProfile: "Mergi la profilul animalului →",
      features: [
        { label: "Vaccinuri & tratamente", sub: "Remindere automate" },
        { label: "Grafic greutate", sub: "Evoluție în timp" },
        { label: "Fișă medicală completă", sub: "Exportabilă PDF" },
        { label: "Calendar îngrijire", sub: "Evenimente & scadențe" },
      ],
    },
    services: {
      label: "Servicii",
      title: "Veterinari, produse și GPS",
      items: [
        { title: "Veterinari", desc: "Caută, compară și programează în câteva secunde", cta: "Caută veterinari" },
        { title: "PetMarket", desc: "Produse recomandate pentru rasa și vârsta animalului tău", cta: "Deschide magazinul" },
        { title: "PetGuardian", desc: "GPS live + alerte când iese din zona sigură", cta: "Activează în aplicație" },
      ],
    },
    adoptii: { label: "Adopții", title: "Animale care caută o familie", viewAll: "Vezi toate →", addListing: "Adaugă anunț", noListings: "Nicio adopție disponibilă momentan" },
    community: {
      label: "Comunitate", title: "Alături de alți stăpâni",
      items: [
        { title: "Forum & Sfaturi", desc: "Întrebări, recomandări și experiențe de la alți stăpâni." },
        { title: "Animale Pierdute / Găsite", desc: "Alertează comunitatea. Fiecare ajutor contează." },
        { title: "PetSOS — Urgențe", desc: "Prim ajutor și acces imediat la datele animalului tău." },
      ],
    },
    plus: {
      badge: "✦ Pawfect+",
      title: "Un singur nivel.\nTot ce are nevoie animalul tău.",
      desc: "Nu cumperi module separate. Cumperi liniștea că animalul tău e în siguranță.",
      comingSoon: "Disponibil în curând",
    },
    download: {
      title: "Descarcă Pet Care Services gratuit",
      subtitle: "Disponibil pe Android. iOS — în curând.",
      googlePlay: "Google Play",
      webAccount: "Sau creează cont pe web →",
    },
  },

  en: {
    nav: {
      adoptii: "Adoptions", veterinari: "Vets", magazin: "Shop",
      comunitate: "Community", forum: "Forum", petresq: "PetResQ", sos: "SOS",
      cont: "Account", profilMeu: "My Profile",
    },
    hero: {
      badge: "The #1 platform for pet owners",
      title: "Everything for",
      accent: "your pet",
      titleEnd: ",\nin one single app.",
      subtitle: "Care, safety, services and products — free, in your language.",
      searchPlaceholder: "Search vets, adoptions, products...",
      searchBtn: "Search",
      downloadAndroid: "Download on Android",
      createAccount: "Create free account →",
    },
    categories: [
      "Vets", "Adoptions", "Shop", "GPS & Safety",
      "Training", "Community", "Lost/Found", "SOS Emergencies",
    ],
    offers: {
      label: "What we offer",
      title: "Four promises. One single app.",
    },
    promises: [
      {
        title: "Care", subtitle: "Your pet's health, always within reach",
        desc: "Medical records, vaccines, weight tracking, reminders and consultations.",
        cta: "Discover care",
      },
      {
        title: "Safety", subtitle: "Always know where they are and what's happening",
        desc: "Live GPS, geofencing, medical emergencies and lost pet recovery.",
        cta: "Discover safety",
      },
      {
        title: "Services", subtitle: "Verified specialists, fast bookings",
        desc: "Nearby vets, certified trainers and boarding — direct reservations.",
        cta: "Discover services",
      },
      {
        title: "Products", subtitle: "Recommendations tailored to breed and age",
        desc: "Personalised shop — food, toys, accessories and more.",
        cta: "Discover products",
      },
    ],
    profile: {
      label: "The experience hub",
      title: "Your pet's profile —",
      titleLine2: "the reason you come back every day",
      desc: "Add your pet once. Pet Care Services automatically organises their health, appointments and complete history.",
      createCta: "Create free profile →",
      goToProfile: "Go to pet profile →",
      features: [
        { label: "Vaccines & treatments", sub: "Automatic reminders" },
        { label: "Weight chart", sub: "Progress over time" },
        { label: "Complete medical file", sub: "PDF export" },
        { label: "Care calendar", sub: "Events & due dates" },
      ],
    },
    services: {
      label: "Services",
      title: "Vets, products and GPS",
      items: [
        { title: "Veterinarians", desc: "Find, compare and book in seconds", cta: "Find vets" },
        { title: "PetMarket", desc: "Products recommended for your pet's breed and age", cta: "Open shop" },
        { title: "PetGuardian", desc: "Live GPS + alerts when they leave the safe zone", cta: "Activate in app" },
      ],
    },
    adoptii: { label: "Adoptions", title: "Animals looking for a home", viewAll: "View all →", addListing: "Add listing", noListings: "No adoptions available at the moment" },
    community: {
      label: "Community", title: "Together with other owners",
      items: [
        { title: "Forum & Advice", desc: "Questions, recommendations and experiences from other owners." },
        { title: "Lost / Found Pets", desc: "Alert the community. Every bit of help counts." },
        { title: "PetSOS — Emergencies", desc: "First aid and instant access to your pet's data." },
      ],
    },
    plus: {
      badge: "✦ Pawfect+",
      title: "One level.\nEverything your pet needs.",
      desc: "Don't buy separate modules. Buy peace of mind that your pet is safe.",
      comingSoon: "Coming soon",
    },
    download: {
      title: "Download Pet Care Services for free",
      subtitle: "Available on Android. iOS — coming soon.",
      googlePlay: "Google Play",
      webAccount: "Or create a web account →",
    },
  },

  fr: {
    nav: {
      adoptii: "Adoptions", veterinari: "Vétérinaires", magazin: "Boutique",
      comunitate: "Communauté", forum: "Forum", petresq: "PetResQ", sos: "SOS",
      cont: "Compte", profilMeu: "Mon profil",
    },
    hero: {
      badge: "La plateforme n°1 pour les animaux de compagnie",
      title: "Tout pour",
      accent: "votre animal",
      titleEnd: ",\ndans une seule application.",
      subtitle: "Soins, sécurité, services et produits — gratuit, dans votre langue.",
      searchPlaceholder: "Cherchez vétérinaires, adoptions, produits...",
      searchBtn: "Chercher",
      downloadAndroid: "Télécharger sur Android",
      createAccount: "Créer un compte gratuit →",
    },
    categories: [
      "Vétérinaires", "Adoptions", "Boutique", "GPS & Sécurité",
      "Dressage", "Communauté", "Perdu/Trouvé", "Urgences SOS",
    ],
    offers: {
      label: "Ce que nous offrons",
      title: "Quatre promesses. Une seule application.",
    },
    promises: [
      {
        title: "Soins", subtitle: "La santé de votre animal, toujours à portée",
        desc: "Dossiers médicaux, vaccins, poids, rappels et consultations.",
        cta: "Découvrir les soins",
      },
      {
        title: "Sécurité", subtitle: "Sachez toujours où il est et ce qui lui arrive",
        desc: "GPS en direct, géofencing, urgences médicales et récupération d'animaux perdus.",
        cta: "Découvrir la sécurité",
      },
      {
        title: "Services", subtitle: "Spécialistes vérifiés, réservations rapides",
        desc: "Vétérinaires proches, dresseurs certifiés et pensions — réservations directes.",
        cta: "Découvrir les services",
      },
      {
        title: "Produits", subtitle: "Recommandations adaptées à la race et à l'âge",
        desc: "Boutique personnalisée — nourriture, jouets, accessoires et plus.",
        cta: "Découvrir les produits",
      },
    ],
    profile: {
      label: "Le centre de l'expérience",
      title: "Le profil de votre animal —",
      titleLine2: "la raison pour laquelle vous revenez chaque jour",
      desc: "Ajoutez votre animal une seule fois. Pet Care Services organise automatiquement sa santé, ses rendez-vous et son historique complet.",
      createCta: "Créer un profil gratuit →",
      goToProfile: "Aller au profil de l'animal →",
      features: [
        { label: "Vaccins & traitements", sub: "Rappels automatiques" },
        { label: "Courbe de poids", sub: "Évolution dans le temps" },
        { label: "Dossier médical complet", sub: "Export PDF" },
        { label: "Calendrier de soins", sub: "Événements & échéances" },
      ],
    },
    services: {
      label: "Services",
      title: "Vétérinaires, produits et GPS",
      items: [
        { title: "Vétérinaires", desc: "Trouvez, comparez et réservez en quelques secondes", cta: "Chercher des vétérinaires" },
        { title: "PetMarket", desc: "Produits recommandés pour la race et l'âge de votre animal", cta: "Ouvrir la boutique" },
        { title: "PetGuardian", desc: "GPS en direct + alertes quand il quitte la zone sûre", cta: "Activer dans l'application" },
      ],
    },
    adoptii: { label: "Adoptions", title: "Animaux qui cherchent une famille", viewAll: "Voir tout →", addListing: "Ajouter une annonce", noListings: "Aucune adoption disponible pour le moment" },
    community: {
      label: "Communauté", title: "Avec d'autres propriétaires",
      items: [
        { title: "Forum & Conseils", desc: "Questions, recommandations et expériences d'autres propriétaires." },
        { title: "Animaux Perdus / Trouvés", desc: "Alertez la communauté. Chaque aide compte." },
        { title: "PetSOS — Urgences", desc: "Premiers secours et accès immédiat aux données de votre animal." },
      ],
    },
    plus: {
      badge: "✦ Pawfect+",
      title: "Un seul niveau.\nTout ce dont votre animal a besoin.",
      desc: "N'achetez pas de modules séparés. Achetez la tranquillité d'esprit que votre animal est en sécurité.",
      comingSoon: "Disponible bientôt",
    },
    download: {
      title: "Téléchargez Pet Care Services gratuitement",
      subtitle: "Disponible sur Android. iOS — bientôt.",
      googlePlay: "Google Play",
      webAccount: "Ou créez un compte web →",
    },
  },

  de: {
    nav: {
      adoptii: "Adoptionen", veterinari: "Tierärzte", magazin: "Shop",
      comunitate: "Community", forum: "Forum", petresq: "PetResQ", sos: "SOS",
      cont: "Konto", profilMeu: "Mein Profil",
    },
    hero: {
      badge: "Die Nr. 1 Plattform für Haustierbesitzer",
      title: "Alles für",
      accent: "Ihr Haustier",
      titleEnd: ",\nin einer einzigen App.",
      subtitle: "Pflege, Sicherheit, Dienste und Produkte — kostenlos, in Ihrer Sprache.",
      searchPlaceholder: "Tierärzte, Adoptionen, Produkte suchen...",
      searchBtn: "Suchen",
      downloadAndroid: "Auf Android herunterladen",
      createAccount: "Kostenloses Konto erstellen →",
    },
    categories: [
      "Tierärzte", "Adoptionen", "Shop", "GPS & Sicherheit",
      "Training", "Community", "Verloren/Gefunden", "SOS Notfälle",
    ],
    offers: {
      label: "Was wir anbieten",
      title: "Vier Versprechen. Eine einzige App.",
    },
    promises: [
      {
        title: "Pflege", subtitle: "Die Gesundheit Ihres Tieres, immer griffbereit",
        desc: "Krankenakten, Impfungen, Gewicht, Erinnerungen und Konsultationen.",
        cta: "Pflege entdecken",
      },
      {
        title: "Sicherheit", subtitle: "Wissen Sie immer, wo es ist und was mit ihm passiert",
        desc: "Live-GPS, Geofencing, medizinische Notfälle und Wiederfindung verlorener Tiere.",
        cta: "Sicherheit entdecken",
      },
      {
        title: "Dienste", subtitle: "Geprüfte Spezialisten, schnelle Buchungen",
        desc: "Nahegelegene Tierärzte, zertifizierte Trainer und Pensionen — Direktbuchungen.",
        cta: "Dienste entdecken",
      },
      {
        title: "Produkte", subtitle: "Empfehlungen angepasst an Rasse und Alter",
        desc: "Personalisierter Shop — Futter, Spielzeug, Zubehör und mehr.",
        cta: "Produkte entdecken",
      },
    ],
    profile: {
      label: "Das Erlebniszentrum",
      title: "Das Profil Ihres Tieres —",
      titleLine2: "der Grund, warum Sie täglich zurückkehren",
      desc: "Fügen Sie Ihr Tier einmal hinzu. Pet Care Services organisiert automatisch Gesundheit, Termine und die vollständige Geschichte.",
      createCta: "Kostenloses Profil erstellen →",
      goToProfile: "Zum Tierprofil →",
      features: [
        { label: "Impfungen & Behandlungen", sub: "Automatische Erinnerungen" },
        { label: "Gewichtsdiagramm", sub: "Entwicklung im Laufe der Zeit" },
        { label: "Vollständige Krankenakte", sub: "PDF-Export" },
        { label: "Pflegekalender", sub: "Ereignisse & Fristen" },
      ],
    },
    services: {
      label: "Dienste",
      title: "Tierärzte, Produkte und GPS",
      items: [
        { title: "Tierärzte", desc: "Finden, vergleichen und in Sekunden buchen", cta: "Tierärzte suchen" },
        { title: "PetMarket", desc: "Produkte empfohlen für Rasse und Alter Ihres Tieres", cta: "Shop öffnen" },
        { title: "PetGuardian", desc: "Live-GPS + Alarme wenn es die sichere Zone verlässt", cta: "In App aktivieren" },
      ],
    },
    adoptii: { label: "Adoptionen", title: "Tiere die eine Familie suchen", viewAll: "Alle anzeigen →", addListing: "Anzeige hinzufügen", noListings: "Derzeit keine Adoptionen verfügbar" },
    community: {
      label: "Community", title: "Zusammen mit anderen Besitzern",
      items: [
        { title: "Forum & Ratschläge", desc: "Fragen, Empfehlungen und Erfahrungen anderer Besitzer." },
        { title: "Verlorene / Gefundene Tiere", desc: "Alarmieren Sie die Community. Jede Hilfe zählt." },
        { title: "PetSOS — Notfälle", desc: "Erste Hilfe und sofortiger Zugriff auf Ihre Tierdaten." },
      ],
    },
    plus: {
      badge: "✦ Pawfect+",
      title: "Eine Stufe.\nAlles was Ihr Tier braucht.",
      desc: "Kaufen Sie keine separaten Module. Kaufen Sie die Gewissheit, dass Ihr Tier sicher ist.",
      comingSoon: "Demnächst verfügbar",
    },
    download: {
      title: "Pet Care Services kostenlos herunterladen",
      subtitle: "Verfügbar auf Android. iOS — demnächst.",
      googlePlay: "Google Play",
      webAccount: "Oder Webkonto erstellen →",
    },
  },
  it: {
    nav: {
      adoptii: "Adozioni", veterinari: "Veterinari", magazin: "Negozio",
      comunitate: "Comunità", forum: "Forum", petresq: "PetResQ", sos: "SOS",
      cont: "Account", profilMeu: "Il mio profilo",
    },
    hero: {
      badge: "La piattaforma n°1 per i proprietari di animali",
      title: "Tutto per",
      accent: "il tuo animale",
      titleEnd: ",\nin un'unica app.",
      subtitle: "Cura, sicurezza, servizi e prodotti — gratis, nella tua lingua.",
      searchPlaceholder: "Cerca veterinari, adozioni, prodotti...",
      searchBtn: "Cerca",
      downloadAndroid: "Scarica su Android",
      createAccount: "Crea account gratuito →",
    },
    categories: [
      "Veterinari", "Adozioni", "Negozio", "GPS & Sicurezza",
      "Addestramento", "Comunità", "Perso/Trovato", "Emergenze SOS",
    ],
    offers: { label: "Cosa offriamo", title: "Quattro promesse. Un'unica app." },
    promises: [
      { title: "Cura", subtitle: "La salute del tuo animale, sempre a portata di mano", desc: "Cartelle cliniche, vaccini, peso, promemoria e consultazioni.", cta: "Scopri la cura" },
      { title: "Sicurezza", subtitle: "Sai sempre dove si trova e cosa gli succede", desc: "GPS in tempo reale, geofencing, emergenze mediche e recupero animali smarriti.", cta: "Scopri la sicurezza" },
      { title: "Servizi", subtitle: "Specialisti verificati, prenotazioni rapide", desc: "Veterinari vicini, addestratori certificati e pensioni — prenotazioni dirette.", cta: "Scopri i servizi" },
      { title: "Prodotti", subtitle: "Consigli adattati a razza ed età", desc: "Negozio personalizzato — cibo, giocattoli, accessori e altro.", cta: "Scopri i prodotti" },
    ],
    profile: {
      label: "Il centro dell'esperienza", title: "Il profilo del tuo animale —", titleLine2: "il motivo per cui torni ogni giorno",
      desc: "Aggiungi il tuo animale una volta sola. Pet Care Services organizza automaticamente salute, appuntamenti e cronologia completa.",
      createCta: "Crea profilo gratuito →", goToProfile: "Vai al profilo dell'animale →",
      features: [
        { label: "Vaccini & trattamenti", sub: "Promemoria automatici" },
        { label: "Grafico del peso", sub: "Evoluzione nel tempo" },
        { label: "Cartella medica completa", sub: "Esporta PDF" },
        { label: "Calendario delle cure", sub: "Eventi & scadenze" },
      ],
    },
    services: {
      label: "Servizi", title: "Veterinari, prodotti e GPS",
      items: [
        { title: "Veterinari", desc: "Trova, confronta e prenota in pochi secondi", cta: "Cerca veterinari" },
        { title: "PetMarket", desc: "Prodotti consigliati per la razza e l'età del tuo animale", cta: "Apri il negozio" },
        { title: "PetGuardian", desc: "GPS in tempo reale + avvisi quando esce dalla zona sicura", cta: "Attiva nell'app" },
      ],
    },
    adoptii: { label: "Adozioni", title: "Animali che cercano una famiglia", viewAll: "Vedi tutti →", addListing: "Aggiungi annuncio", noListings: "Nessuna adozione disponibile al momento" },
    community: {
      label: "Comunità", title: "Insieme ad altri proprietari",
      items: [
        { title: "Forum & Consigli", desc: "Domande, raccomandazioni ed esperienze di altri proprietari." },
        { title: "Animali Persi / Trovati", desc: "Avvisa la comunità. Ogni aiuto conta." },
        { title: "PetSOS — Emergenze", desc: "Primo soccorso e accesso immediato ai dati del tuo animale." },
      ],
    },
    plus: {
      badge: "✦ Pawfect+",
      title: "Un solo livello.\nTutto ciò di cui il tuo animale ha bisogno.",
      desc: "Non comprare moduli separati. Compra la tranquillità che il tuo animale sia al sicuro.",
      comingSoon: "Disponibile presto",
    },
    download: {
      title: "Scarica Pet Care Services gratuitamente",
      subtitle: "Disponibile su Android. iOS — prossimamente.",
      googlePlay: "Google Play",
      webAccount: "O crea un account web →",
    },
  },
} as const;

export type Translations = (typeof translations)["ro"];

export function getT(locale: Locale): Translations {
  return (translations[locale] ?? translations.en) as Translations;
}
