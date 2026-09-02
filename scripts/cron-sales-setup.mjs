// Create/replace the pg_cron job that reconciles evergreen_sales against Stripe
// as a safety net behind the live webhook. Derives the endpoint URL + Bearer
// from the existing 'evergreen-refresh' job so no secret is hardcoded here.
// Runs every 30 min; the webhook does the real-time capture. Run once:
//   node scripts/cron-sales-setup.mjs
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
await client.connect();

const { rows } = await client.query(
  `select jobname, schedule, command from cron.job where jobname = 'evergreen-refresh'`
);
if (!rows.length) throw new Error("evergreen-refresh job not found — cannot derive URL/bearer");
const base = rows[0].command;
// swap the path /api/cron/evergreen -> /api/cron/sales, keep host + Bearer header
const salesCmd = base.replace("/api/cron/evergreen", "/api/cron/sales");
if (salesCmd === base) throw new Error("could not rewrite path in command");

await client.query(`select cron.unschedule('evergreen-sales-refresh') where exists
  (select 1 from cron.job where jobname='evergreen-sales-refresh')`).catch(() => {});
const { rows: made } = await client.query(
  `select cron.schedule('evergreen-sales-refresh', '*/30 * * * *', $1) as jobid`,
  [salesCmd]
);
console.log("scheduled evergreen-sales-refresh, jobid:", made[0].jobid);
const { rows: all } = await client.query(
  `select jobname, schedule from cron.job where jobname like 'evergreen%' order by jobname`
);
console.log("jobs:", all);
await client.end();
