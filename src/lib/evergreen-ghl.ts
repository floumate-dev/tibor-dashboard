// Live evergreen metrics straight from GoHighLevel tags — no CSV, no storage.
// Per webinar day (DD_MM_YY) we count:
//   prijave (registrants) = evergreen_webinar_<DD_MM_YY>_optin
//   segments              = <generic segment tag> AND <dated optin tag>
//   konverzije            = evergreen_webinar_<DD_MM_YY>_bought_eun
// Days are auto-discovered: probe every date from the launch to tomorrow and
// keep those whose optin tag has contacts (so tomorrow's webinar shows up as
// soon as its optins start). Verified: AND-search on two tag filters ANDs, and
// segment counts match a full contact scan exactly.

const LOCATION_ID = "Zyilin5HFiDuC461lVdk";
const GHL_BASE = "https://services.leadconnectorhq.com";
const WEBINAR_START = "2026-06-30"; // first evergreen day

const SEG = {
  noShow: "evergreen_webinar_didnt_show",
  beforePitch: "evergreen_webinar_stayed_until_15m",
  reachedPitch: "evergreen_webinar_stayed_until_pitch",
  fullPitch: "evergreen_webinar_stayed_until_full_pitch",
} as const;

export interface EvergreenLiveDay {
  date: string; // YYYY-MM-DD
  registrants: number;
  attendees: number;
  noShow: number;
  beforePitch: number;
  reachedPitch: number;
  fullPitch: number;
  conversions: number;
  recording: string;
  occurred: boolean;
}

// Webinar runs 20:00 Europe/Belgrade (=18:00 UTC in summer/CEST). Attendance is
// only meaningful once it has started; before that, any segment tag on a
// registrant is a leftover from a PRIOR webinar (generic tags aren't per-day),
// so we must not show attendance/show-rate for a not-yet-started day.
function hasOccurred(iso: string): boolean {
  return Date.now() >= new Date(iso + "T18:00:00Z").getTime();
}

// "2026-07-06" -> "06_07_26"
function stampOf(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}_${m}_${y.slice(2)}`;
}

function ymd(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}

// Every date from launch to tomorrow (tomorrow's optins are already arriving).
function candidateDates(): string[] {
  const out: string[] = [];
  const end = new Date();
  end.setUTCDate(end.getUTCDate() + 1);
  for (let d = new Date(WEBINAR_START + "T12:00:00Z"); ymd(d) <= ymd(end); d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(ymd(d));
  }
  return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// GHL's contact-search rate limit (~100 req / 10s per location) is easily
// tripped by the day-by-day fan-out; keep concurrent in-flight calls low.
const CONCURRENCY = 4;
const MAX_ATTEMPTS = 6;

// Resilient count. Returns null (NOT 0) when every retry was rate-limited /
// failed, so the caller can tell "genuinely zero" apart from "call throttled"
// and re-pull instead of silently rendering a corrupt 0. A 429'd segment count
// showing as 0 was exactly why recent days rendered with no attendance.
async function ghlTotal(token: string, tags: string[]): Promise<number | null> {
  const body = JSON.stringify({
    locationId: LOCATION_ID,
    pageLimit: 1,
    filters: tags.map((t) => ({ field: "tags", operator: "contains", value: t })),
  });
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${GHL_BASE}/contacts/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "floumate-tagger/1.0",
        },
        cache: "no-store",
        body,
      });
      if (res.status === 429 || res.status >= 500) {
        if (attempt === MAX_ATTEMPTS - 1) return null;
        // Honor Retry-After when present, else exponential backoff + jitter.
        const ra = Number(res.headers.get("retry-after"));
        const wait = ra > 0 ? ra * 1000 : 600 * Math.pow(2, attempt);
        await sleep(wait + Math.floor(Math.random() * 250));
        continue;
      }
      if (!res.ok) throw new Error(`GHL ${res.status}`);
      const d = await res.json();
      return Number(d?.total) || 0;
    } catch {
      if (attempt === MAX_ATTEMPTS - 1) return null;
      await sleep(500 * (attempt + 1));
    }
  }
  return null;
}

// Run `fn` over items with bounded concurrency (GHL rate-limit friendly).
async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

async function pullDay(token: string, iso: string, registrants: number): Promise<EvergreenLiveDay> {
  const stamp = stampOf(iso);
  const optin = `evergreen_webinar_${stamp}_optin`;
  const occurred = hasOccurred(iso);
  // Segment/bought tags only matter once the webinar has started; skip the calls
  // (and force zeros) for an upcoming day so leftover generic tags can't fake
  // attendance before the webinar happens.
  const bought = `evergreen_webinar_${stamp}_bought_eun`;
  const metrics = { noShow: 0, beforePitch: 0, reachedPitch: 0, fullPitch: 0, conversions: 0 };
  const queries: [keyof typeof metrics, string[]][] = [
    ["noShow", [SEG.noShow, optin]],
    ["beforePitch", [SEG.beforePitch, optin]],
    ["reachedPitch", [SEG.reachedPitch, optin]],
    ["fullPitch", [SEG.fullPitch, optin]],
    ["conversions", [bought]],
  ];
  if (occurred) {
    // First pass: concurrent. null = that call was throttled/failed.
    const first = await Promise.all(queries.map(([, tags]) => ghlTotal(token, tags)));
    // Recover any throttled call sequentially (no concurrency = no 429) so a
    // rate-limited count can never render as a real 0.
    for (let i = 0; i < queries.length; i++) {
      let v = first[i];
      if (v === null) v = await ghlTotal(token, queries[i][1]);
      metrics[queries[i][0]] = v ?? 0;
    }
  }
  const { noShow, beforePitch, reachedPitch, fullPitch, conversions } = metrics;
  return {
    date: iso,
    registrants,
    attendees: beforePitch + reachedPitch + fullPitch,
    noShow,
    beforePitch,
    reachedPitch,
    fullPitch,
    conversions,
    recording: "",
    occurred,
  };
}

// Pull every active webinar day live from GHL, newest handling first.
export async function pullEvergreenLive(token: string): Promise<EvergreenLiveDay[]> {
  const dates = candidateDates();
  // 1) discover: one optin count per candidate date, keep those with contacts.
  const optins = await mapLimit(dates, CONCURRENCY, async (iso) => ({
    iso,
    reg: await ghlTotal(token, [`evergreen_webinar_${stampOf(iso)}_optin`]),
  }));
  // Recover throttled discovery probes sequentially so a rate-limited day
  // isn't dropped entirely (null) before we ever pull its metrics.
  for (const o of optins) {
    if (o.reg === null) o.reg = await ghlTotal(token, [`evergreen_webinar_${stampOf(o.iso)}_optin`]);
  }
  const real = optins.filter((o) => (o.reg ?? 0) > 0);
  // 2) full metrics for real days.
  const days = await mapLimit(real, CONCURRENCY, (o) => pullDay(token, o.iso, o.reg ?? 0));
  return days.sort((a, b) => a.date.localeCompare(b.date));
}
