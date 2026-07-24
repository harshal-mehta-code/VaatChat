// ─────────────────────────────────────────────────────────────────────────
// Prove row-level security actually isolates learners.
//
//   npm run check:rls
//
// Policy SQL that *looks* right and policy SQL that *is* right are different
// things, and the failure mode here is silent: one learner reading another's
// progress produces no error and no crash. So this signs in as two real users
// and checks the boundary from the outside, with the same publishable key the
// browser uses.
//
// Creates two throwaway users and deletes them again. Safe to re-run.
// ─────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!url || !publishable || !serviceRole) {
  console.error("✗ Missing Supabase env. Run: vercel env pull --yes");
  process.exit(1);
}

const admin = createClient(url, serviceRole, { auth: { persistSession: false } });
const stamp = Date.now();
const people = [
  { label: "A", email: `rls-check-a-${stamp}@vaatchat.test`, password: `pw-${stamp}-a!` },
  { label: "B", email: `rls-check-b-${stamp}@vaatchat.test`, password: `pw-${stamp}-b!` },
];

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

const ids: Record<string, string> = {};
const clients: Record<string, ReturnType<typeof createClient>> = {};

try {
  for (const p of people) {
    const { data, error } = await admin.auth.admin.createUser({
      email: p.email,
      password: p.password,
      email_confirm: true,
    });
    if (error) throw new Error(`creating ${p.label}: ${error.message}`);
    ids[p.label] = data.user!.id;

    const c = createClient(url, publishable, { auth: { persistSession: false } });
    const { error: signInErr } = await c.auth.signInWithPassword({
      email: p.email,
      password: p.password,
    });
    if (signInErr) throw new Error(`signing in ${p.label}: ${signInErr.message}`);
    clients[p.label] = c;
  }

  const A = clients.A;
  const B = clients.B;

  console.log("\nwhat a learner can do with their own row:");
  const wroteA = await A.from("progress").upsert({ user_id: ids.A, data: { xp: 11, secret: "A" } });
  check("write their own row", !wroteA.error, wroteA.error?.message);
  const readA = await A.from("progress").select("data").eq("user_id", ids.A).maybeSingle();
  check(
    "read their own row back",
    !readA.error && (readA.data?.data as { xp?: number })?.xp === 11,
    readA.error?.message,
  );
  const updA = await A.from("progress").update({ data: { xp: 12 } }).eq("user_id", ids.A);
  check("update their own row", !updA.error, updA.error?.message);

  await B.from("progress").upsert({ user_id: ids.B, data: { xp: 99, secret: "B" } });

  console.log("\nwhat they cannot do to somebody else's:");
  const peek = await A.from("progress").select("data").eq("user_id", ids.B);
  check(
    "cannot read another learner's row",
    !peek.error && (peek.data?.length ?? 0) === 0,
    peek.error ? peek.error.message : `got ${peek.data?.length} row(s)`,
  );

  const all = await A.from("progress").select("user_id");
  check(
    "an unfiltered select returns only their own row",
    !all.error && all.data?.length === 1 && all.data[0].user_id === ids.A,
    `got ${all.data?.length} row(s)`,
  );

  const steal = await A.from("progress").update({ data: { xp: 0 } }).eq("user_id", ids.B);
  const stillB = await admin.from("progress").select("data").eq("user_id", ids.B).maybeSingle();
  check(
    "cannot overwrite another learner's row",
    (stillB.data?.data as { secret?: string })?.secret === "B",
    "B's data was modified",
  );

  const reassign = await A.from("progress").update({ user_id: ids.B }).eq("user_id", ids.A);
  check(
    "cannot hand their row to another user id",
    Boolean(reassign.error),
    "the WITH CHECK predicate did not block reassignment",
  );

  const impersonate = await A.from("progress").insert({ user_id: ids.B, data: { xp: 1 } });
  check("cannot insert a row owned by someone else", Boolean(impersonate.error));

  console.log("\nwhat a signed-out visitor can do:");
  const anon = createClient(url, publishable, { auth: { persistSession: false } });
  const anonRead = await anon.from("progress").select("user_id");
  check(
    "anonymous reads nothing",
    Boolean(anonRead.error) || (anonRead.data?.length ?? 0) === 0,
    `got ${anonRead.data?.length} row(s)`,
  );
  const anonWrite = await anon.from("progress").insert({ user_id: ids.A, data: { xp: 0 } });
  check("anonymous cannot write", Boolean(anonWrite.error));

  void steal;
} catch (e) {
  failures++;
  console.error(`\n✗ ${(e as Error).message}`);
} finally {
  for (const label of Object.keys(ids)) {
    await admin.auth.admin.deleteUser(ids[label]).catch(() => {});
  }
}

if (failures > 0) {
  console.error(`\n✗ ${failures} isolation check(s) failed.\n`);
  process.exit(1);
}
console.log("\n✓ Learners are isolated: own row readable and writable, nobody else's.\n");
