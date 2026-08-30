// "lead" = ušao u pipeline ali poziv JOŠ NIJE zakazan (lead za zakazivanje);
// NE računa se kao zakazan poziv. "scheduled" = poziv zakazan (Call Booked +).
export type Stage = "lead" | "scheduled" | "showed_up" | "won" | "lost" | "no_show";

export interface CallRow {
  id: string;
  contact_name: string | null;
  contact_phone: string | null;
  package: string | null;
  amount: number;
  currency: string;
  stage: Stage;
  lost_reason: string | null;
  date: string; // ISO — scheduled_at || created_at
}

// U SALES dashboardu se prodaje SAMO "Korak Ispred" (high-ticket); Edit u Novac
// se prodaje kroz webinar, ne kroz sales pozive — zato ovde nije u listi.
// `name` MORA da se poklapa sa labelom koju adapter (ghl.ts) generiše. Iznos se
// uzima iz GHL amount polja (vidi ghl.ts); cena ovde je samo referentna.
export const PACKAGES: { name: string; color: string; price: number | null }[] = [
  { name: "Korak Ispred", color: "#7895ed", price: 2500 },
  { name: "Custom", color: "#9aa0aa", price: null },
];

export const PACKAGE_FALLBACK_COLOR = "#9aa0aa";

// One evergreen webinar day (precomputed aggregate from evergreen_webinars).
// Segments: no-show → <pitch → reached-pitch → full-pitch (increasing watch depth).
export interface EvergreenDay {
  date: string;          // ISO date (YYYY-MM-DD)
  registrants: number;
  attendees: number;
  noShow: number;
  beforePitch: number;
  reachedPitch: number;
  fullPitch: number;
  conversions: number;
  recording: string;
  occurred: boolean;     // webinar (20:00 Belgrade) already started? if not, attendance is N/A
}

// ── DM department (Instagram DM funnel) ──
// Jedan dan agregata iz dm_daily. Sve metrike su dnevne. Redosled levka:
// outbound → konverzacije (>2 poruke) → booking link → zakazan → payment link → kupovina.
export interface DmDay {
  date: string;        // YYYY-MM-DD (Europe/Belgrade)
  outbound: number;    // poruke poslate (Burno)
  inbound: number;     // poruke primljene
  conversations: number; // nove konverzacije (>2 poruke) tog dana
  bookingLinks: number;  // poslati iClosed booking linkovi
  paymentLinks: number;  // poslati payment linkovi
  appointments: number;  // zakazani pozivi (iClosed, source=burno)
  purchases: number;     // kupovine (Stripe, source=burno)
  revenue: number;       // prihod (EUR)
}

// Demo dataset za vizuelnu proveru DM taba pre nego što webhooks pošalju podatke
// (/tibor?demo=1). Dani u zadnjih ~14 dana relativno na 2026-08-29.
export const DEMO_DM: DmDay[] = [
  { date: "2026-08-16", outbound: 62, inbound: 28, conversations: 11, bookingLinks: 5, paymentLinks: 2, appointments: 3, purchases: 1, revenue: 2500 },
  { date: "2026-08-17", outbound: 74, inbound: 33, conversations: 14, bookingLinks: 6, paymentLinks: 1, appointments: 4, purchases: 0, revenue: 0 },
  { date: "2026-08-18", outbound: 58, inbound: 21, conversations: 9, bookingLinks: 4, paymentLinks: 3, appointments: 2, purchases: 2, revenue: 4000 },
  { date: "2026-08-19", outbound: 81, inbound: 39, conversations: 16, bookingLinks: 7, paymentLinks: 2, appointments: 5, purchases: 1, revenue: 2500 },
  { date: "2026-08-20", outbound: 69, inbound: 30, conversations: 12, bookingLinks: 5, paymentLinks: 2, appointments: 3, purchases: 1, revenue: 1800 },
  { date: "2026-08-21", outbound: 47, inbound: 18, conversations: 7, bookingLinks: 3, paymentLinks: 1, appointments: 2, purchases: 0, revenue: 0 },
  { date: "2026-08-22", outbound: 35, inbound: 12, conversations: 5, bookingLinks: 2, paymentLinks: 0, appointments: 1, purchases: 0, revenue: 0 },
  { date: "2026-08-23", outbound: 41, inbound: 15, conversations: 6, bookingLinks: 3, paymentLinks: 1, appointments: 1, purchases: 1, revenue: 2500 },
  { date: "2026-08-24", outbound: 78, inbound: 36, conversations: 15, bookingLinks: 8, paymentLinks: 3, appointments: 6, purchases: 2, revenue: 5000 },
  { date: "2026-08-25", outbound: 85, inbound: 42, conversations: 18, bookingLinks: 9, paymentLinks: 4, appointments: 5, purchases: 2, revenue: 4300 },
  { date: "2026-08-26", outbound: 72, inbound: 31, conversations: 13, bookingLinks: 6, paymentLinks: 2, appointments: 4, purchases: 1, revenue: 2500 },
  { date: "2026-08-27", outbound: 90, inbound: 45, conversations: 19, bookingLinks: 10, paymentLinks: 5, appointments: 7, purchases: 3, revenue: 6800 },
  { date: "2026-08-28", outbound: 66, inbound: 27, conversations: 11, bookingLinks: 5, paymentLinks: 2, appointments: 3, purchases: 1, revenue: 2500 },
  { date: "2026-08-29", outbound: 53, inbound: 22, conversations: 8, bookingLinks: 4, paymentLinks: 1, appointments: 2, purchases: 1, revenue: 2500 },
];

// Sample dataset for visual verification before the Supabase calls table is
// wired. Dates land inside the last-30-days window relative to 2026-06-08.
export const DEMO_CALLS: CallRow[] = [
  { id: "d1", contact_name: "Marko Jovanović", contact_phone: "+381 64 123 4567", package: "Korak Ispred", amount: 2500, currency: "EUR", stage: "won", lost_reason: null, date: "2026-06-08T14:00:00" },
  { id: "d2", contact_name: "Ana Petrović", contact_phone: "+381 65 987 6543", package: null, amount: 0, currency: "EUR", stage: "lost", lost_reason: "Skupo mi je trenutno, možda za par meseci", date: "2026-06-08T12:30:00" },
  { id: "d3", contact_name: "Stefan Nikolić", contact_phone: "+381 63 555 1234", package: "Custom", amount: 1000, currency: "EUR", stage: "won", lost_reason: null, date: "2026-06-08T10:00:00" },
  { id: "d4", contact_name: "Jelena Marković", contact_phone: "+381 60 111 2233", package: null, amount: 0, currency: "EUR", stage: "no_show", lost_reason: null, date: "2026-06-07T16:00:00" },
  { id: "d5", contact_name: "Nikola Tomić", contact_phone: "+381 64 888 9900", package: "Edit u Novac · 3 meseca", amount: 141, currency: "EUR", stage: "won", lost_reason: null, date: "2026-06-07T11:00:00" },
  { id: "d6", contact_name: "Milica Stojanović", contact_phone: "+381 65 444 5566", package: null, amount: 0, currency: "EUR", stage: "lost", lost_reason: "Već učim editing preko YouTube-a, ne treba mi kurs", date: "2026-06-06T17:30:00" },
  { id: "d7", contact_name: "Petar Ilić", contact_phone: "+381 63 222 3344", package: "Edit u Novac · 1 mesec", amount: 47, currency: "EUR", stage: "won", lost_reason: null, date: "2026-06-06T13:00:00" },
  { id: "d8", contact_name: "Tijana Đorđević", contact_phone: "+381 60 777 8899", package: null, amount: 0, currency: "EUR", stage: "lost", lost_reason: "Moram da pitam roditelje, ja sam još student", date: "2026-06-06T09:30:00" },
  { id: "d9", contact_name: "Aleksandar Pavlović", contact_phone: "+381 64 333 4455", package: null, amount: 0, currency: "EUR", stage: "showed_up", lost_reason: null, date: "2026-06-05T15:00:00" },
  { id: "d10", contact_name: "Sara Mihajlović", contact_phone: "+381 65 666 7788", package: "Korak Ispred", amount: 2500, currency: "EUR", stage: "won", lost_reason: null, date: "2026-06-05T11:00:00" },
  { id: "d11", contact_name: "Lazar Mitrović", contact_phone: "+381 64 909 1212", package: null, amount: 0, currency: "EUR", stage: "lost", lost_reason: "Ne odgovara mi sad, putujem sledećih mesec dana", date: "2026-06-04T18:00:00" },
  { id: "d12", contact_name: "Dragana Nikolić", contact_phone: "+381 63 343 5656", package: null, amount: 0, currency: "EUR", stage: "lost", lost_reason: "Nemam dovoljno jak računar za editing trenutno", date: "2026-06-04T12:00:00" },
  { id: "d13", contact_name: "Igor Stanković", contact_phone: "+381 60 565 7878", package: null, amount: 0, currency: "EUR", stage: "lost", lost_reason: "Ne mogu sad, čekam povraćaj poreza", date: "2026-06-03T10:30:00" },
  { id: "d14", contact_name: "Bojana Vasić", contact_phone: "+381 64 787 9090", package: null, amount: 0, currency: "EUR", stage: "lost", lost_reason: "Razmisliću još, javim do kraja nedelje", date: "2026-06-03T09:00:00" },
  { id: "d15", contact_name: "Vladimir Janković", contact_phone: "+381 65 121 3434", package: null, amount: 0, currency: "EUR", stage: "lost", lost_reason: "Cena mi deluje visoko za moj budžet trenutno", date: "2026-06-02T16:30:00" },
  { id: "d16", contact_name: "Katarina Marinković", contact_phone: "+381 63 232 4545", package: null, amount: 0, currency: "EUR", stage: "lost", lost_reason: "Nisam baš siguran da je za mene, treba mi vremena", date: "2026-06-02T11:30:00" },
  { id: "d17", contact_name: "Snežana Pavlović", contact_phone: "+381 64 454 6767", package: null, amount: 0, currency: "EUR", stage: "lost", lost_reason: "Već sam se upisao na drugi kurs, ne mogu oba", date: "2026-06-01T14:00:00" },
  { id: "d18", contact_name: "Đorđe Simić", contact_phone: "+381 60 676 8989", package: "Edit u Novac · Webinar ponuda", amount: 98, currency: "EUR", stage: "won", lost_reason: null, date: "2026-06-01T10:00:00" },
  { id: "d19", contact_name: "Milan Lukić", contact_phone: "+381 65 898 1010", package: "Edit u Novac · 3 meseca", amount: 141, currency: "EUR", stage: "won", lost_reason: null, date: "2026-05-30T13:30:00" },
  { id: "d20", contact_name: "Teodora Ristić", contact_phone: "+381 63 010 1212", package: "Edit u Novac · 1 mesec", amount: 47, currency: "EUR", stage: "won", lost_reason: null, date: "2026-05-29T12:00:00" },
  { id: "d21", contact_name: "Filip Kovačević", contact_phone: "+381 64 232 3434", package: null, amount: 0, currency: "EUR", stage: "no_show", lost_reason: null, date: "2026-05-28T15:30:00" },
  { id: "d22", contact_name: "Jovana Radić", contact_phone: "+381 60 454 5656", package: "Edit u Novac · Webinar ponuda", amount: 98, currency: "EUR", stage: "won", lost_reason: null, date: "2026-05-27T11:00:00" },
  { id: "d23", contact_name: "Uroš Petrović", contact_phone: "+381 65 676 7878", package: null, amount: 0, currency: "EUR", stage: "scheduled", lost_reason: null, date: "2026-05-26T17:00:00" },
  { id: "d24", contact_name: "Ivana Đukić", contact_phone: "+381 63 898 9090", package: "Edit u Novac · 3 meseca", amount: 141, currency: "EUR", stage: "won", lost_reason: null, date: "2026-05-25T10:00:00" },
];
