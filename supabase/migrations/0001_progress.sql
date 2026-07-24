-- ─────────────────────────────────────────────────────────────────────────
-- One learner, one row.
--
-- The whole Progress object is stored as a single jsonb blob rather than
-- normalised into tables. That's a deliberate choice: the shape is already
-- serializable by design (lib/core/progress.ts), it's only read and written
-- whole, and merging happens client-side in lib/core/sync.ts where it can be
-- unit-tested without a database. Normalising it would buy queries nobody runs
-- and cost the portability the core was built for.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

-- Every policy carries an ownership predicate. `to authenticated` on its own is
-- authentication without authorization — it would let any signed-in user read
-- every learner's row.
drop policy if exists progress_select_own on public.progress;
create policy progress_select_own on public.progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists progress_insert_own on public.progress;
create policy progress_insert_own on public.progress
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- UPDATE needs both USING and WITH CHECK: without WITH CHECK a user could
-- reassign their row's user_id to somebody else.
drop policy if exists progress_update_own on public.progress;
create policy progress_update_own on public.progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Deleting your account should be able to take your data with it.
drop policy if exists progress_delete_own on public.progress;
create policy progress_delete_own on public.progress
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Table access is separate from row access: RLS decides which rows are visible
-- once the role can reach the table at all.
grant select, insert, update, delete on public.progress to authenticated;

-- Anonymous callers have no business here; sync requires a signed-in learner.
revoke all on public.progress from anon;
