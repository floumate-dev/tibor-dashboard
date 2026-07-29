// Apply migration 004 (evergreen tables) to the live Supabase (mneo) via the
// Postgres pooler. Reads the DB password from scripts/.dbpass (gitignored).
// Idempotent: 004 uses `create table if not exists`. Run:
//   node scripts/migrate-evergreen.mjs
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

const sql = readFileSync(new URL("../supabase/migrations/004_evergreen_webinars.sql", import.meta.url), "utf8");

await client.connect();
console.log("Connected. Applying 004_evergreen_webinars.sql ...");
await client.query(sql);
const { rows } = await client.query(
  `select table_name from information_schema.tables
   where table_schema='public' and table_name like 'evergreen%' order by table_name`
);
console.log("evergreen tables now present:", rows.map((r) => r.table_name));
await client.end();
console.log("done.");
