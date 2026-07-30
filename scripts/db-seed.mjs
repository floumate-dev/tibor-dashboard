import { readFileSync } from "node:fs";
import pg from "pg";

const password = readFileSync(new URL("./.dbpass", import.meta.url), "utf8").trim();
const ref = "mneoavdbfpqgwzzhttnx";

const client = new pg.Client({
  host: "aws-0-eu-west-3.pooler.supabase.com",
  port: 5432,
  user: `postgres.${ref}`,
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

// Test rows. external_id prefixed `seedtest_` so they can be wiped in one query
// before go-live: delete from calls where external_id like 'seedtest_%';
const rows = [
  ["Marko Jovanović", "+381 64 123 4567", "Korak Ispred", 2500, "won", null, "2026-06-08T14:00:00"],
  ["Ana Petrović", "+381 65 987 6543", null, 0, "lost", "Skupo mi je trenutno, možda za par meseci", "2026-06-08T12:30:00"],
  ["Stefan Nikolić", "+381 63 555 1234", "Custom", 1000, "won", null, "2026-06-08T10:00:00"],
  ["Jelena Marković", "+381 60 111 2233", null, 0, "no_show", null, "2026-06-07T16:00:00"],
  ["Nikola Tomić", "+381 64 888 9900", "Edit u Novac", 141, "won", null, "2026-06-07T11:00:00"],
  ["Milica Stojanović", "+381 65 444 5566", null, 0, "lost", "Već učim editing preko YouTube-a, ne treba mi kurs", "2026-06-06T17:30:00"],
  ["Petar Ilić", "+381 63 222 3344", "Edit u Novac", 47, "won", null, "2026-06-06T13:00:00"],
  ["Tijana Đorđević", "+381 60 777 8899", null, 0, "lost", "Moram da pitam roditelje, ja sam još student", "2026-06-06T09:30:00"],
  ["Aleksandar Pavlović", "+381 64 333 4455", null, 0, "showed_up", null, "2026-06-05T15:00:00"],
  ["Korak Ispred", "+381 65 666 7788", "Korak Ispred", 2500, "won", null, "2026-06-05T11:00:00"],
  ["Lazar Mitrović", "+381 64 909 1212", null, 0, "lost", "Ne odgovara mi sad, putujem sledećih mesec dana", "2026-06-04T18:00:00"],
  ["Dragana Nikolić", "+381 63 343 5656", null, 0, "lost", "Nemam dovoljno jak računar za editing trenutno", "2026-06-04T12:00:00"],
  ["Igor Stanković", "+381 60 565 7878", null, 0, "lost", "Ne mogu sad, čekam povraćaj poreza", "2026-06-03T10:30:00"],
  ["Đorđe Simić", "+381 60 676 8989", "Edit u Novac", 98, "won", null, "2026-06-01T10:00:00"],
  ["Milan Lukić", "+381 65 898 1010", "Edit u Novac", 141, "won", null, "2026-05-30T13:30:00"],
  ["Teodora Ristić", "+381 63 010 1212", "Edit u Novac", 47, "won", null, "2026-05-29T12:00:00"],
  ["Filip Kovačević", "+381 64 232 3434", null, 0, "no_show", null, "2026-05-28T15:30:00"],
  ["Jovana Radić", "+381 60 454 5656", "Edit u Novac", 98, "won", null, "2026-05-27T11:00:00"],
  ["Uroš Petrović", "+381 65 676 7878", null, 0, "scheduled", null, "2026-05-26T17:00:00"],
  ["Ivana Đukić", "+381 63 898 9090", "Edit u Novac", 141, "won", null, "2026-05-25T10:00:00"],
];

await client.connect();
const { rows: orgRows } = await client.query(`select id from organizations where slug='tibor'`);
const orgId = orgRows[0].id;

let n = 0;
for (let i = 0; i < rows.length; i++) {
  const [name, phone, pkg, amount, stage, lost, sched] = rows[i];
  const ext = `seedtest_${i + 1}`;
  const closed = ["won", "lost", "no_show"].includes(stage) ? sched : null;
  await client.query(
    `insert into calls (org_id, external_id, contact_name, contact_phone, package, amount, currency, stage, lost_reason, scheduled_at, closed_at, source)
     values ($1,$2,$3,$4,$5,$6,'EUR',$7,$8,$9,$10,'direct')
     on conflict (org_id, external_id) do update set
       contact_name=excluded.contact_name, package=excluded.package, amount=excluded.amount,
       stage=excluded.stage, lost_reason=excluded.lost_reason, scheduled_at=excluded.scheduled_at,
       closed_at=excluded.closed_at`,
    [orgId, ext, name, phone, pkg, amount, stage, lost, sched, closed]
  );
  n++;
}
console.log(`Upserted ${n} test rows.`);

const agg = (await client.query(
  `select
     count(*)::int total,
     count(*) filter (where stage='won')::int won,
     count(*) filter (where stage='no_show')::int no_show,
     coalesce(sum(amount) filter (where stage='won'),0)::int revenue
   from calls where org_id=$1`,
  [orgId]
)).rows[0];
console.log("Aggregates:", agg);

const byPkg = (await client.query(
  `select package, count(*)::int n, sum(amount)::int rev
   from calls where org_id=$1 and stage='won' group by package order by rev desc`,
  [orgId]
)).rows;
console.log("Won by package:", byPkg);

await client.end();
