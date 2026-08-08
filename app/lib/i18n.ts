/**
 * Bilingual strings, en and fr-CA.
 *
 * The point is not decoration: a bilingual site lets the Gherkin
 * `# language: fr` path be demonstrated live rather than promised, which is the
 * Bill 96 angle in the Quebec market. It also gives the canon a second dataset
 * over the same flows.
 *
 * English is the default and its strings are unchanged from before this
 * existed, so every existing suite that matches on English text keeps working.
 */

export type Locale = "en" | "fr-CA";

export const LOCALE_KEY = "sqa_locale";
export const LOCALES: Locale[] = ["en", "fr-CA"];

export const MESSAGES = {
  en: {
    "nav.search": "Search Flights",
    "nav.trips": "My Trips",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.logout": "Logout",
    "nav.greeting": "Hi, {name}",
    "nav.language": "Language",

    "logout.confirm": "Sign out of SQALOGIC Air?",

    "search.title": "Search flights",
    "search.from": "From",
    "search.to": "To",
    "search.date": "Departure date",
    "search.passengers": "Passengers",
    "search.oneway": "One way",
    "search.roundtrip": "Round trip",
    "search.submit": "Search flights",
    // The CTA flips label between releases on purpose — that instability is a
    // feature of the bed, so it is preserved inside each language rather than
    // flattened by translating.
    "search.submitAlt": "Find Flights",
    "search.favourites": "Favourite airports",
    "search.favouritesHint": "Drag to reorder.",
    "search.reset": "Reset order",

    "results.departing": "Departing {date}",
    "results.select": "Select",
    "results.nonstop": "Non-stop",
    "results.searching": "Searching flights",

    "trips.title": "My trips",
    "trips.filter": "Filter by route, passenger, date…",
    "trips.found": "{count} trips found",
    "trips.reference": "Reference",
    "trips.from": "From",
    "trips.to": "To",
    "trips.date": "Date",
    "trips.seat": "Seat",
    "trips.bag": "Bag",
    "trips.price": "Price",
    "trips.status": "Status",
    "trips.actions": "Actions",
    "trips.active": "Active",
    "trips.cancelled": "Cancelled",
    "trips.view": "View",
    "trips.cancel": "Cancel",
    "trips.eticket": "E-ticket",
    "trips.selected": "{count} selected",
    "trips.cancelSelected": "Cancel selected",
    "trips.page": "Page {page} of {total}",
    "trips.prev": "‹ Prev",
    "trips.next": "Next ›",
    "trips.empty": "No matching trips",
  },
  "fr-CA": {
    "nav.search": "Rechercher des vols",
    "nav.trips": "Mes voyages",
    "nav.login": "Connexion",
    "nav.register": "S'inscrire",
    "nav.logout": "Déconnexion",
    "nav.greeting": "Bonjour, {name}",
    "nav.language": "Langue",

    "logout.confirm": "Se déconnecter de SQALOGIC Air?",

    "search.title": "Rechercher des vols",
    "search.from": "De",
    "search.to": "À",
    "search.date": "Date de départ",
    "search.passengers": "Passagers",
    "search.oneway": "Aller simple",
    "search.roundtrip": "Aller-retour",
    "search.submit": "Rechercher des vols",
    "search.submitAlt": "Trouver des vols",
    "search.favourites": "Aéroports favoris",
    "search.favouritesHint": "Glissez pour réordonner.",
    "search.reset": "Réinitialiser l'ordre",

    "results.departing": "Départ le {date}",
    "results.select": "Choisir",
    "results.nonstop": "Sans escale",
    "results.searching": "Recherche de vols",

    "trips.title": "Mes voyages",
    "trips.filter": "Filtrer par trajet, passager, date…",
    "trips.found": "{count} voyages trouvés",
    "trips.reference": "Référence",
    "trips.from": "De",
    "trips.to": "À",
    "trips.date": "Date",
    "trips.seat": "Siège",
    "trips.bag": "Bagage",
    "trips.price": "Prix",
    "trips.status": "Statut",
    "trips.actions": "Actions",
    "trips.active": "Actif",
    "trips.cancelled": "Annulé",
    "trips.view": "Voir",
    "trips.cancel": "Annuler",
    "trips.eticket": "Billet électronique",
    "trips.selected": "{count} sélectionnés",
    "trips.cancelSelected": "Annuler la sélection",
    "trips.page": "Page {page} sur {total}",
    "trips.prev": "‹ Précédent",
    "trips.next": "Suivant ›",
    "trips.empty": "Aucun voyage correspondant",
  },
} as const;

export type MessageKey = keyof (typeof MESSAGES)["en"];

/** `?lang=fr` and `?lang=fr-CA` both mean French; anything else is English. */
export function resolveLocale(search: string, stored: string | null): Locale {
  const raw = new URLSearchParams(search).get("lang");
  const pick = (v: string | null): Locale | null => {
    if (!v) return null;
    const lower = v.toLowerCase();
    if (lower === "fr" || lower === "fr-ca") return "fr-CA";
    if (lower === "en" || lower === "en-ca") return "en";
    return null;
  };
  return pick(raw) ?? pick(stored) ?? "en";
}

export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>
): string {
  // Fall back to English rather than showing a raw key: a missing translation
  // should degrade to readable text, not to debug output on screen.
  const table = MESSAGES[locale] ?? MESSAGES.en;
  const template: string = table[key] ?? MESSAGES.en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name) =>
    name in vars ? String(vars[name]) : whole
  );
}
