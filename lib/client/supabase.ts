"use client";

// The Supabase browser client, created once and shared.
//
// Everything the app stores is read and written *as the signed-in learner*, with
// row-level security doing the enforcing (supabase/migrations/0001_progress.sql).
// There is no server route in the middle and no service-role key anywhere near
// the browser — the publishable key plus RLS is the whole access model.
//
// Returns null when the keys aren't configured, and every caller treats that as
// "cloud sync is off" rather than an error. The app is fully usable with no
// account and no network; sync is an addition, never a dependency.

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Referenced statically so Next can inline them at build time.
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Whether this build has cloud sync available at all. */
export const cloudSyncConfigured = Boolean(URL_ && KEY);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!URL_ || !KEY) return null;
  if (typeof window === "undefined") return null;
  client ??= createBrowserClient(URL_, KEY);
  return client;
}
