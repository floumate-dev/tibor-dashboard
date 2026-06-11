/**
 * Attribution tracking: captures where each lead came from.
 *
 * Custom params (primary, what Aleksa reads in the Google Sheet):
 *   - src          → high-level channel (instagram, youtube, linkedin, email, dm, ...)
 *   - sub_src      → granular identifier (story-april, video-42, ad-q2-launch, ...)
 *
 * Standard UTMs (secondary, captured "for free" for future paid-ad / GA / Meta Pixel
 * integrations, but not primary reading):
 *   - utm_source, utm_medium, utm_campaign, utm_content, utm_term
 *
 * Plus context:
 *   - referrer     → document.referrer on first entry (where they clicked from)
 *   - landingPage  → the first URL they hit on our site (pathname + query)
 *
 * Storage: window.localStorage under STORAGE_KEY.
 *
 * First-touch rule:
 *   - If URL has `src` OR any UTM param → overwrite (new attribution event).
 *   - Otherwise → keep existing record. If no record exists yet, write a
 *     baseline "direct" record using document.referrer as a hint.
 */

const STORAGE_KEY = 'wt_attribution';

export interface Attribution {
  src: string;
  sub_src: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  referrer: string;
  landingPage: string;
  capturedAt: string;
}

const EMPTY: Attribution = {
  src: '',
  sub_src: '',
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  utm_content: '',
  utm_term: '',
  referrer: '',
  landingPage: '',
  capturedAt: '',
};

function readStored(): Attribution | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Attribution>;
    return { ...EMPTY, ...parsed };
  } catch {
    return null;
  }
}

function writeStored(attr: Attribution): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attr));
  } catch {
    /* storage disabled — silently ignore */
  }
}

/**
 * Called on every client-side page load. Applies the first-touch rule.
 */
export function captureAttribution(): Attribution {
  if (typeof window === 'undefined') return { ...EMPTY };

  const url = new URL(window.location.href);
  const p = url.searchParams;

  const urlHas = (k: string) => p.has(k) && p.get(k)!.trim() !== '';
  const getParam = (k: string) => (p.get(k) ?? '').trim();

  // A URL counts as a "new attribution event" if it specifies src or any utm_*.
  const hasNewAttribution =
    urlHas('src') ||
    urlHas('utm_source') ||
    urlHas('utm_medium') ||
    urlHas('utm_campaign') ||
    urlHas('utm_content') ||
    urlHas('utm_term');

  const existing = readStored();

  if (!hasNewAttribution && existing) {
    // First-touch record already exists, don't touch it.
    return existing;
  }

  // Build a fresh record either because:
  //   (a) the URL carries new attribution — overwrite, OR
  //   (b) no record exists yet — seed a baseline.
  const referrer = (typeof document !== 'undefined' && document.referrer) || '';

  // Fallback src if no explicit src/utm_source: use referrer hostname, otherwise "direct".
  let fallbackSrc = 'direct';
  if (referrer) {
    try {
      fallbackSrc = new URL(referrer).hostname.replace(/^www\./, '');
    } catch {
      /* leave as "direct" */
    }
  }

  const next: Attribution = {
    src: getParam('src') || getParam('utm_source') || fallbackSrc,
    sub_src: getParam('sub_src') || getParam('utm_campaign') || '',
    utm_source: getParam('utm_source'),
    utm_medium: getParam('utm_medium'),
    utm_campaign: getParam('utm_campaign'),
    utm_content: getParam('utm_content'),
    utm_term: getParam('utm_term'),
    referrer,
    landingPage: url.pathname + url.search,
    capturedAt: new Date().toISOString(),
  };

  writeStored(next);
  return next;
}

/**
 * Read the current attribution record. If none exists, returns an empty
 * record (all fields empty strings). Never throws.
 */
export function getAttribution(): Attribution {
  return readStored() ?? { ...EMPTY };
}
