// Primeni DM migracije (005 tabele + 006 funkcije) na živi Supabase (mneo) preko
// Postgres pooler-a. Lozinka iz scripts/.dbpass (gitignored). Idempotentno:
// 005 koristi `create table if not exists`, 006 `create or replace function`.
// Pokreni:  node scripts/migrate-dm.mjs
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

const read = (f) => readFileSync(new URL(`../supabase/migrations/${f}`, import.meta.url), "utf8");

await client.connect();
console.log("Connected. Applying 005_dm_metrics.sql ...");
await client.query(read("005_dm_metrics.sql"));
console.log("  tables done.");
console.log("Applying 006_dm_functions.sql ...");
await client.query(read("006_dm_functions.sql"));
console.log("  functions done.");

const tables = (await client.query(
  `select table_name from information_schema.tables
   where table_schema='public' and table_name like 'dm_%' order by table_name`
)).rows.map((r) => r.table_name);
console.log("dm_* tables now present:", tables);

const fns = (await client.query(
  `select routine_name from information_schema.routines
   where routine_schema='public' and routine_name like 'dm_apply_%' order by routine_name`
)).rows.map((r) => r.routine_name);
console.log("dm_apply_* functions:", fns);

await client.end();
console.log("done.");
