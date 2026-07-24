"use client";

// Keeping one learner's progress the same on every device they use.
//
// The shape of this is dictated by one rule: **the local device is never
// blocked and never waits.** Someone practising on a train with no signal must
// have exactly the app they had yesterday. So progress lives in localStorage as
// it always has, and this layer is a background reconciler on top:
//
//   sign in  → pull the cloud row, merge it with what's on this device,
//              write the merged result both places
//   change   → push, debounced, so a burst of answers is one request
//
// The merge (lib/core/sync.ts) is what makes this safe to run repeatedly and in
// any order — pushing twice, or racing two devices, converges rather than
// clobbers. Nothing here needs to be careful about ordering, because the
// algebra already is.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Progress } from "../core/progress";
import { mergeProgress, progressDiffers } from "../core/sync";
import { getSupabase, cloudSyncConfigured } from "./supabase";

export type SyncStatus = "off" | "signed-out" | "syncing" | "synced" | "error";

export interface CloudSync {
  status: SyncStatus;
  /** Signed-in learner's email, when there is one. */
  email: string | null;
  lastSyncedAt: Date | null;
  error: string | null;
  sendMagicLink: (email: string) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
}

/** Wait this long after the last change before pushing, so a run of answers
 *  becomes one write instead of a dozen. */
const PUSH_DEBOUNCE_MS = 2500;

export function useCloudSync(
  progress: Progress,
  applyMerged: (next: Progress) => void,
  hydrated: boolean,
): CloudSync {
  const [status, setStatus] = useState<SyncStatus>(cloudSyncConfigured ? "signed-out" : "off");
  const [email, setEmail] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Latest progress, without making every callback depend on it.
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const applyRef = useRef(applyMerged);
  applyRef.current = applyMerged;

  const userIdRef = useRef<string | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** What we last wrote or read, to skip no-op pushes. */
  const lastRemote = useRef<Progress | null>(null);

  /** Pull, merge, then write the result back to whichever side is behind. */
  const reconcile = useCallback(async () => {
    const supabase = getSupabase();
    const userId = userIdRef.current;
    if (!supabase || !userId) return;

    setStatus("syncing");
    setError(null);
    try {
      const { data, error: readErr } = await supabase
        .from("progress")
        .select("data")
        .eq("user_id", userId)
        .maybeSingle();
      if (readErr) throw readErr;

      const local = progressRef.current;
      const remote = (data?.data as Progress | undefined) ?? null;
      const merged = remote ? mergeProgress(local, remote) : local;

      // Only touch local state when the cloud actually contributed something,
      // so a routine sync never causes a pointless re-render mid-lesson.
      if (progressDiffers(merged, local)) applyRef.current(merged);

      if (!remote || progressDiffers(merged, remote)) {
        const { error: writeErr } = await supabase
          .from("progress")
          .upsert({ user_id: userId, data: merged, updated_at: new Date().toISOString() });
        if (writeErr) throw writeErr;
      }

      lastRemote.current = merged;
      setLastSyncedAt(new Date());
      setStatus("synced");
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  }, []);

  // Follow the session: reconcile on sign-in, stand down on sign-out.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    let cancelled = false;
    const adopt = (user: { id: string; email?: string } | null) => {
      if (cancelled) return;
      userIdRef.current = user?.id ?? null;
      setEmail(user?.email ?? null);
      if (user) {
        void reconcile();
      } else {
        lastRemote.current = null;
        setStatus("signed-out");
        setLastSyncedAt(null);
      }
    };

    void supabase.auth.getUser().then(({ data }) => adopt(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      adopt(session?.user ?? null),
    );

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [reconcile]);

  // Push local changes, debounced. Skips when nothing meaningful changed, so
  // idle time costs no requests.
  useEffect(() => {
    if (!hydrated || !userIdRef.current) return;
    if (lastRemote.current && !progressDiffers(progress, lastRemote.current)) return;

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => void reconcile(), PUSH_DEBOUNCE_MS);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [progress, hydrated, reconcile]);

  const sendMagicLink = useCallback(async (address: string) => {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, message: "Cloud sync isn't configured for this build." };
    const { error: err } = await supabase.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: `${window.location.origin}/account` },
    });
    if (err) return { ok: false, message: err.message };
    return { ok: true, message: `Check ${address} for a sign-in link.` };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    // Progress stays on the device — signing out shouldn't feel like deletion.
    await supabase.auth.signOut();
  }, []);

  return { status, email, lastSyncedAt, error, sendMagicLink, signOut, syncNow: reconcile };
}
