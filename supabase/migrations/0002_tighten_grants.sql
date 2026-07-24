-- ─────────────────────────────────────────────────────────────────────────
-- Trim the default grants down to what sync actually needs.
--
-- Supabase's default privileges hand `authenticated` the full set on new tables
-- in `public`, which quietly includes TRUNCATE — and TRUNCATE is not row-level.
-- It ignores RLS completely, so a policy set that carefully scopes every read
-- and write to `auth.uid() = user_id` would still sit behind a verb that can
-- empty the table for everyone. TRIGGER and REFERENCES are equally unnecessary
-- for a client role.
--
-- Row policies decide which rows; this decides which verbs exist at all.
-- ─────────────────────────────────────────────────────────────────────────

revoke truncate, trigger, references on public.progress from authenticated;

-- And make sure future tables don't quietly re-acquire them.
alter default privileges in schema public
  revoke truncate, trigger, references on tables from authenticated;
