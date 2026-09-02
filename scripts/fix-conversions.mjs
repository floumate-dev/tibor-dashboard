// Recompute evergreen per-day conversions from STRIPE (source of truth),
// attributed to the evergreen webinar via GHL last-touch (latest dated optin
// tag on/before the purchase date). Writes evergreen_webinars.conversions.
//   node scripts/fix-conversions.mjs           # DRY (per-day old vs new)
//   node scripts/fix-conversions.mjs --apply    # write corrected conversions
import { readFileSync } from "node:fs";
const APPLY = process.argv.includes("--apply");
const env = {}; for (const l of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) { const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim()); if (m) env[m[1]] = m[2]; }
const LOC = "Zyilin5HFiDuC461lVdk", BASE = "https://services.leadconnectorhq.com";
const H = { Authorization: `Bearer ${env.GHL_TIBOR_TOKEN}`, Version: "2021-07-28", "Content-Type": "application/json", Accept: "application/json", "User-Agent": "floumate" };
const CSV = "/Users/dusan/Downloads/unified_payments (3).csv";

function parseCSV(t){const rows=[];let row=[],f="",q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;}else if(c==='"')q=true;else if(c===','){row.push(f);f="";}else if(c==='\n'){row.push(f);rows.push(row);row=[];f="";}else if(c!=='\r')f+=c;}if(f.length||row.length){row.push(f);rows.push(row);}const h=rows.shift().map(x=>x.trim());return rows.filter(r=>r.length>1).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]??""])));}
const isEUN = r => /edit u novac/i.test(r["Statement Descriptor"] || "") || /edit u novac/i.test(r["Checkout Line Item Summary"] || "");
// unique buyer -> earliest initial-paid purchase date (>=30.06)
const buyers = new Map();
for (const r of parseCSV(readFileSync(CSV, "utf8"))) {
  if (r["Status"] !== "Paid" || !isEUN(r) || /update/i.test(r["Description"] || "")) continue;
  const d = (r["Created date (UTC)"] || "").slice(0, 10); if (d < "2026-06-30") continue;
  const e = (r["Customer Email"] || "").trim().toLowerCase(); if (!e) continue;
  if (!buyers.has(e) || d < buyers.get(e)) buyers.set(e, d);
}
console.log("Stripe Editunovac nove prodaje (unique buyer):", buyers.size);

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function tagsOf(email){
  const q = new URLSearchParams({ locationId: LOC, email });
  for (let a=0;a<6;a++){
    const r = await fetch(BASE + "/contacts/search/duplicate?" + q, { headers: H });
    if (r.status===429 || r.status>=500){ const ra=+(r.headers.get("retry-after")||0); await sleep(ra?ra*1000:600*2**a); continue; }
    if (!r.ok) return { err:r.status };
    const d = await r.json();
    return { tags: d?.contact ? (d.contact.tags||[]) : null }; // null = not in GHL
  }
  return { err:"maxretry" };
}
const OPTRE = /^evergreen_webinar_(\d{2})_(\d{2})_(\d{2})_optin$/;
async function mapLimit(items, lim, fn){let i=0;const w=Array.from({length:Math.min(lim,items.length)},async()=>{while(i<items.length){const idx=i++;await fn(items[idx]);await sleep(120);}});await Promise.all(w);}

const perDay = {}; let attributed=0, nonEvg=0, notInGhl=0, err=0;
const list = [...buyers.entries()];
await mapLimit(list, 2, async ([email, pdate]) => {
  const { tags, err:e } = await tagsOf(email);
  if (e) { err++; return; }
  if (tags === null) { notInGhl++; return; }
  const days = [];
  for (const t of tags){ const m=OPTRE.exec(t); if(m) days.push(`20${m[3]}-${m[2]}-${m[1]}`); }
  if (!days.length) { nonEvg++; return; }
  days.sort();
  const elig = days.filter(d => d <= pdate);
  const day = elig.length ? elig[elig.length-1] : days[0];
  perDay[day] = (perDay[day]||0)+1; attributed++;
});
console.log(`\nAtribuisano evergreen: ${attributed} | ne-evergreen: ${nonEvg} | nije u GHL: ${notInGhl} | greske: ${err}`);

// compare with current store + optionally write
const { createClient } = await import("@supabase/supabase-js");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: org } = await sb.from("organizations").select("id").eq("slug","tibor").single();
const { data: store } = await sb.from("evergreen_webinars").select("webinar_date, conversions").eq("org_id", org.id).order("webinar_date");
const oldTot = store.reduce((s,r)=>s+(r.conversions||0),0);
const newTot = Object.values(perDay).reduce((a,b)=>a+b,0);
console.log(`\nUkupno konverzije: STARO (bought_eun) ${oldTot} -> NOVO (Stripe) ${newTot}`);
console.log("Dani gde se menja (staro -> novo):");
for (const r of store){ const nw = perDay[r.webinar_date]||0; if (nw !== (r.conversions||0)) console.log(`  ${r.webinar_date}: ${r.conversions} -> ${nw}`); }
// dani atribuisani a nema ih u store-u?
for (const d of Object.keys(perDay)) if (!store.find(r=>r.webinar_date===d)) console.log(`  (van store-a) ${d}: ${perDay[d]}`);

if (APPLY){
  let n=0;
  for (const r of store){ const nw = perDay[r.webinar_date]||0; if (nw !== (r.conversions||0)){ await sb.from("evergreen_webinars").update({ conversions: nw, updated_at:new Date().toISOString() }).eq("org_id",org.id).eq("webinar_date",r.webinar_date); n++; } }
  console.log(`\nUPISANO: ${n} dana azurirano.`);
} else console.log("\n(DRY — nista upisano. Za pravo: --apply)");
