// Schedule the pg_cron job that reconciles Sales closes (Stripe high-ticket ->
// won on booked iClosed calls). Derives URL + Bearer from the evergreen-refresh
// job so no secret is hardcoded. Runs every 30 min. Run once:
//   node scripts/cron-sales-calls-setup.mjs
import { readFileSync } from "node:fs";
import pg from "pg";

const password = readFileSync(new URL("./.dbpass", import.meta.url), "utf8").trim();
const client = new pg.Client({
  host: "aws-0-eu-west-3.pooler.supabase.com",
  port: 5432,
  user: "postgres.mneoavdbfpqgwzzhttnx",
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});
await client.connect();

const { rows } = await client.query(`select command from cron.job where jobname = 'evergreen-refresh'`);
if (!rows.length) throw new Error("evergreen-refresh not found");
const cmd = rows[0].command.replace("/api/cron/evergreen", "/api/cron/sales-calls");
if (cmd === rows[0].command) throw new Error("could not rewrite path");

await client
  .query(`select cron.unschedule('sales-calls-refresh') where exists (select 1 from cron.job where jobname='sales-calls-refresh')`)
  .catch(() => {});
const made = await client.query(`select cron.schedule('sales-calls-refresh', '*/30 * * * *', $1) as jobid`, [cmd]);
console.log("scheduled sales-calls-refresh jobid:", made.rows[0].jobid);
const all = await client.query(`select jobname, schedule from cron.job order by jobname`);
console.log("jobs:", all.rows.map((j) => `${j.jobname} (${j.schedule})`).join(", "));
await client.end();
