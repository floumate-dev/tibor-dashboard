export interface Country {
  iso: string;   // ISO 3166-1 alpha-2
  name: string;
  dial: string;  // with leading +
  flag: string;
}

// Country list covers WatchTime's typical client base + Balkan region used by Aleksa's network.
// Mirrors the set used on edumena.org/forma-2026.
export const COUNTRIES: Country[] = [
  { iso: 'US', name: 'United States',  dial: '+1',   flag: '🇺🇸' },
  { iso: 'GB', name: 'United Kingdom', dial: '+44',  flag: '🇬🇧' },
  { iso: 'CA', name: 'Canada',         dial: '+1',   flag: '🇨🇦' },
  { iso: 'AU', name: 'Australia',      dial: '+61',  flag: '🇦🇺' },
  { iso: 'RS', name: 'Serbia',         dial: '+381', flag: '🇷🇸' },
  { iso: 'HR', name: 'Croatia',        dial: '+385', flag: '🇭🇷' },
  { iso: 'BA', name: 'Bosnia',         dial: '+387', flag: '🇧🇦' },
  { iso: 'ME', name: 'Montenegro',     dial: '+382', flag: '🇲🇪' },
  { iso: 'MK', name: 'Macedonia',      dial: '+389', flag: '🇲🇰' },
  { iso: 'SI', name: 'Slovenia',       dial: '+386', flag: '🇸🇮' },
  { iso: 'XK', name: 'Kosovo',         dial: '+383', flag: '🇽🇰' },
  { iso: 'AL', name: 'Albania',        dial: '+355', flag: '🇦🇱' },
  { iso: 'DE', name: 'Germany',        dial: '+49',  flag: '🇩🇪' },
  { iso: 'AT', name: 'Austria',        dial: '+43',  flag: '🇦🇹' },
  { iso: 'CH', name: 'Switzerland',    dial: '+41',  flag: '🇨🇭' },
  { iso: 'FR', name: 'France',         dial: '+33',  flag: '🇫🇷' },
  { iso: 'IT', name: 'Italy',          dial: '+39',  flag: '🇮🇹' },
  { iso: 'ES', name: 'Spain',          dial: '+34',  flag: '🇪🇸' },
  { iso: 'NL', name: 'Netherlands',    dial: '+31',  flag: '🇳🇱' },
  { iso: 'BE', name: 'Belgium',        dial: '+32',  flag: '🇧🇪' },
  { iso: 'SE', name: 'Sweden',         dial: '+46',  flag: '🇸🇪' },
  { iso: 'NO', name: 'Norway',         dial: '+47',  flag: '🇳🇴' },
  { iso: 'DK', name: 'Denmark',        dial: '+45',  flag: '🇩🇰' },
  { iso: 'FI', name: 'Finland',        dial: '+358', flag: '🇫🇮' },
  { iso: 'IE', name: 'Ireland',        dial: '+353', flag: '🇮🇪' },
  { iso: 'PT', name: 'Portugal',       dial: '+351', flag: '🇵🇹' },
  { iso: 'PL', name: 'Poland',         dial: '+48',  flag: '🇵🇱' },
  { iso: 'CZ', name: 'Czech Republic', dial: '+420', flag: '🇨🇿' },
  { iso: 'SK', name: 'Slovakia',       dial: '+421', flag: '🇸🇰' },
  { iso: 'HU', name: 'Hungary',        dial: '+36',  flag: '🇭🇺' },
  { iso: 'RO', name: 'Romania',        dial: '+40',  flag: '🇷🇴' },
  { iso: 'BG', name: 'Bulgaria',       dial: '+359', flag: '🇧🇬' },
  { iso: 'GR', name: 'Greece',         dial: '+30',  flag: '🇬🇷' },
  { iso: 'TR', name: 'Turkey',         dial: '+90',  flag: '🇹🇷' },
  { iso: 'AE', name: 'UAE',            dial: '+971', flag: '🇦🇪' },
  { iso: 'SA', name: 'Saudi Arabia',   dial: '+966', flag: '🇸🇦' },
  { iso: 'IL', name: 'Israel',         dial: '+972', flag: '🇮🇱' },
  { iso: 'IN', name: 'India',          dial: '+91',  flag: '🇮🇳' },
  { iso: 'SG', name: 'Singapore',      dial: '+65',  flag: '🇸🇬' },
  { iso: 'ZA', name: 'South Africa',   dial: '+27',  flag: '🇿🇦' },
  { iso: 'MX', name: 'Mexico',         dial: '+52',  flag: '🇲🇽' },
  { iso: 'BR', name: 'Brazil',         dial: '+55',  flag: '🇧🇷' },
];

export const DEFAULT_COUNTRY_ISO = 'US';

export function findCountryByIso(iso: string): Country | undefined {
  if (!iso) return undefined;
  const upper = iso.toUpperCase();
  return COUNTRIES.find((c) => c.iso === upper);
}

/**
 * Given a combined phone value like "+381 60 123 4567", find the matching
 * country by longest-dial-code prefix. Returns the country and the local
 * part (without the dial code).
 */
export function parsePhoneValue(value: string): { country: Country | null; local: string } {
  if (!value) return { country: null, local: '' };
  const trimmed = value.trim();
  // Sort descending by dial length so +381 matches before +3, +44 before +4, etc.
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (trimmed.startsWith(c.dial)) {
      return { country: c, local: trimmed.slice(c.dial.length).trim() };
    }
  }
  return { country: null, local: trimmed };
}
