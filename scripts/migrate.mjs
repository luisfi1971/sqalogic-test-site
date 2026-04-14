#!/usr/bin/env node
// Idempotent migration runner using Supabase Management API.
// Reads SQL files from supabase/migrations/ in alphabetical order and runs them.
// Tracks applied migrations in a _migrations table inside the project.
//
// Env vars required:
//   SUPABASE_ACCESS_TOKEN  — Personal Access Token (sbp_...)
//   SUPABASE_PROJECT_REF   — project ref (otsnvbswdezscwhbodsv)
//
// Usage: node scripts/migrate.mjs   (or `npm run migrate`)

import fs from "node:fs";
import path from "node:path";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;

if (!token || !ref) {
  console.error("Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF");
  process.exit(1);
}

const endpoint = `https://api.supabase.com/v1/projects/${ref}/database/query`;

async function run(sql) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return text ? JSON.parse(text) : [];
}

async function ensureTable() {
  await run(`
    create table if not exists public._migrations (
      name text primary key,
      applied_at timestamptz default now()
    );
  `);
}

async function applied() {
  const rows = await run(`select name from public._migrations order by name`);
  return new Set(rows.map((r) => r.name));
}

async function main() {
  const dir = path.resolve("supabase/migrations");
  if (!fs.existsSync(dir)) {
    console.log("No supabase/migrations directory.");
    return;
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  if (!files.length) {
    console.log("No migrations.");
    return;
  }
  await ensureTable();
  const done = await applied();
  let applied_count = 0;
  for (const f of files) {
    if (done.has(f)) {
      console.log(`skip ${f}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(dir, f), "utf8");
    process.stdout.write(`apply ${f} ... `);
    await run(sql);
    await run(`insert into public._migrations(name) values ('${f.replace(/'/g, "''")}')`);
    applied_count++;
    console.log("ok");
  }
  console.log(`Done. ${applied_count} migration(s) applied.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
