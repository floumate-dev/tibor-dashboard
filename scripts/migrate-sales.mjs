// Apply migration 007 (evergreen_sales + sync trigger) to the live Supabase
// (mneo) via the Postgres pooler. Password from scripts/.dbpass (gitignored).
// Idempotent (create table if not exists / create or replace). Run:
//   node scripts/migrate-sales.mjs
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

const sql = readFileSync(new URL("../supabase/migrations/007_evergreen_sales.sql", import.meta.url), "utf8");

await client.connect();
console.log("Connected. Applying 007_evergreen_sales.sql ...");
await client.query(sql);
const { rows } = await client.query(
  `select table_name from information_schema.tables
   where table_schema='public' and table_name = 'evergreen_sales'`
);
console.log("evergreen_sales present:", rows.length === 1);
const { rows: trg } = await client.query(
  `select tgname from pg_trigger where tgname = 'evergreen_sales_aiud'`
);
console.log("trigger present:", trg.length === 1);
await client.end();
console.log("done.");
