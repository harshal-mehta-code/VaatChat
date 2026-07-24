// ─────────────────────────────────────────────────────────────────────────
// Apply SQL migrations to the Supabase Postgres.
//
//   npm run migrate            # apply anything not yet applied
//   npm run migrate -- --list  # show what would run
//
// Files in supabase/migrations/*.sql run once each, in filename order, inside a
// transaction, and are recorded in _migrations. Re-running is a no-op.
//
// Uses POSTGRES_URL_NON_POOLING: DDL through a connection pooler can land on a
// different backend than the session that started the transaction.
// ─────────────────────────────────────────────────────────────────────────

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "supabase", "migrations");

const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!url) {
  console.error(
    "✗ No POSTGRES_URL_NON_POOLING in the environment.\n" +
      "  Run: vercel env pull --yes   (then npm run migrate)",
  );
  process.exit(1);
}

const listOnly = process.argv.includes("--list");

// Supabase presents a certificate signed by its own CA, which isn't in Node's
// trust store, so the handshake fails verification. This is a local developer
// tool run by the repo owner against their own database over TLS — the traffic
// is still encrypted, we're just not pinning the chain. Deliberately confined
// to this script; nothing the app serves ever relaxes TLS.
// `sslmode` in the URL wins over the client's ssl option, and pg currently reads
// `require` as full chain verification, so it has to come out for the setting
// below to apply at all.
const dsn = new URL(url);
dsn.searchParams.delete("sslmode");

const client = new pg.Client({
  connectionString: dsn.toString(),
  ssl: { rejectUnauthorized: false },
});
await client.connect();

await client.query(`
  create table if not exists public._migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  );
`);

const { rows } = await client.query<{ name: string }>("select name from public._migrations");
const applied = new Set(rows.map((r) => r.name));
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

let ran = 0;
for (const file of files) {
  if (applied.has(file)) {
    console.log(`  · ${file} (already applied)`);
    continue;
  }
  if (listOnly) {
    console.log(`  → ${file} (would apply)`);
    continue;
  }
  const sql = await readFile(path.join(dir, file), "utf8");
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into public._migrations (name) values ($1)", [file]);
    await client.query("commit");
    console.log(`  ✓ ${file}`);
    ran++;
  } catch (e) {
    await client.query("rollback");
    console.error(`  ✗ ${file} — ${(e as Error).message}`);
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log(listOnly ? "\nDry run." : `\n✓ ${ran} migration(s) applied.`);
