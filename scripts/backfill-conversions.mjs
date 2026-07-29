// Backfill evergreen conversions from GHL dated bought tags.
//   node scripts/backfill-conversions.mjs [--dry]
//
// Per webinar day there is a dated purchase tag
//   evergreen_webinar_<DD_MM_YY>_bought_eun
// (e.g. evergreen_webinar_03_07_26_bought_eun). We count contacts carrying it
// via GHL contact-search `total` and write it to evergreen_webinars.conversions.
// Deterministic per-day attribution (no email matching). Re-runnable.
//
// Needs in .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// and GHL_TIBOR_TOKEN (GHL Private Integration Token, contacts.readonly).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry");
const LOCATION_ID = "Zyilin5HFiDuC461lVdk";
const GHL_BASE = "https://services.leadconnectorhq.com";

function loadEnv() {
  const out = {};
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

// "2026-07-06" -> "06_07_26"  (DD_MM_YY, same stamp as segment tags)
function stampOf(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}_${m}_${y.slice(2)}`;
}

async function ghlCountTag(token, tag) {
  const res = await fetch(`${GHL_BASE}/contacts/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "floumate-tagger/1.0",
    },
    body: JSON.stringify({
      locationId: LOCATION_ID,
      pageLimit: 1,
      filters: [{ field: "tags", operator: "contains", value: tag }],
    }),
  });
  if (!res.ok) throw new Error(`GHL search ${res.status} for ${tag}`);
  const d = await res.json();
  return Number(d?.total) || 0;
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY, ghl = env.GHL_TIBOR_TOKEN;
  if (!url || !key) throw new Error("Missing Supabase creds in .env.local");
  if (!ghl) throw new Error("Missing GHL_TIBOR_TOKEN in .env.local");
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: org } = await sb.from("organizations").select("id").eq("slug", "tibor").single();
  if (!org) throw new Error("tibor org not found");

  const { data: days, error } = await sb
    .from("evergreen_webinars")
    .select("webinar_date, registrants, attendees, seg_full_pitch, conversions")
    .eq("org_id", org.id)
    .order("webinar_date");
  if (error) throw new Error(error.message);

  console.log(DRY ? "DRY RUN — no writes\n" : "Writing conversions to Supabase\n");
  console.log("Day         tag                                    bought  %reg   %att   %full");
  console.log("-".repeat(84));

  for (const d of days) {
    const stamp = stampOf(d.webinar_date);
    const tag = `evergreen_webinar_${stamp}_bought_eun`;
    let bought = 0;
    try { bought = await ghlCountTag(ghl, tag); }
    catch (e) { console.log(`${d.webinar_date}  ${tag}  ERR ${e.message}`); continue; }

    const pReg = d.registrants ? ((bought / d.registrants) * 100).toFixed(1) : "0.0";
    const pAtt = d.attendees ? ((bought / d.attendees) * 100).toFixed(1) : "0.0";
    const pFull = d.seg_full_pitch ? ((bought / d.seg_full_pitch) * 100).toFixed(1) : "0.0";
    console.log(`${d.webinar_date}  ${tag.padEnd(38)}  ${String(bought).padStart(4)}  ${pReg.padStart(5)}  ${pAtt.padStart(5)}  ${pFull.padStart(5)}`);

    if (!DRY) {
      const { error: e2 } = await sb.from("evergreen_webinars")
        .update({ conversions: bought, updated_at: new Date().toISOString() })
        .eq("org_id", org.id).eq("webinar_date", d.webinar_date);
      if (e2) throw new Error(`update ${d.webinar_date}: ${e2.message}`);
    }
  }
  console.log(DRY ? "\n(dry — nothing written)" : "\nDone.");
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
