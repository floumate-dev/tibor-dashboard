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
const has = async (t) => {
  const { rows } = await client.query(
    `select 1 from information_schema.tables where table_schema='public' and table_name=$1`,
    [t]
  );
  return rows.length > 0;
};

await client.connect();
const before = (await client.query(
  `select table_name from information_schema.tables where table_schema='public' order by table_name`
)).rows.map((r) => r.table_name);
console.log("Tables before:", before);

if (!(await has("organizations"))) {
  console.log("Applying 001_initial_schema.sql ...");
  await client.query(read("001_initial_schema.sql"));
  console.log("  done.");
} else {
  console.log("001 already applied (organizations exists). Skipping.");
}

if (!(await has("calls"))) {
  console.log("Applying 002_sales_calls.sql ...");
  await client.query(read("002_sales_calls.sql"));
  console.log("  done.");
} else {
  console.log("002 already applied (calls exists). Skipping.");
}

const after = (await client.query(
  `select table_name from information_schema.tables where table_schema='public' order by table_name`
)).rows.map((r) => r.table_name);
console.log("Tables after:", after);

const org = (await client.query(`select id, slug from organizations where slug='tibor'`)).rows[0];
console.log("Tibor org:", org);

await client.end();
