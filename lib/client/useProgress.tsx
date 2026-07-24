"use client";

// ─────────────────────────────────────────────────────────────────────────
// React binding over the portable progress store.
//
// Backed by a single context Provider (mounted in app/layout.tsx) so every
// surface — the page *and* the persistent bottom tab bar — reads and writes one
// shared state. Screens call useProgress() exactly as before. The core stays
// framework-agnostic; this is the only stateful glue.
// ─────────────────────────────────────────────────────────────────────────

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  type Progress,
  freshProgress,
  loadProgress,
  saveProgress,
  gradeItem as _gradeItem,
  completeLesson as _completeLesson,
  completeScenario as _completeScenario,
  markAksharMastered as _markAksharMastered,
  completeGrammar as _completeGrammar,
  setOnboarding as _setOnboarding,
  award as _award,
  touchProgress,
} from "../core/progress";
import type { Grade3 } from "../core/srs";
import { useCloudSync, type CloudSync } from "./useCloudSync";

export interface ProgressApi {
  progress: Progress;
  hydrated: boolean;
  gradeItem: (itemId: string, grade: Grade3) => void;
  completeLesson: (lessonId: string) => void;
  completeScenario: (scenarioId: string) => void;
  markAkshar: (aksharId: string) => void;
  completeGrammar: (conceptId: string) => void;
  finishOnboarding: (goal: string, motivation: string, wantsGrammar?: boolean) => void;
  award: (xp: number) => void;
  setProgress: (next: Progress) => void;
  /** Cross-device sync. Always present; `status: "off"` when unconfigured. */
  sync: CloudSync;
}

function useProgressState(): ProgressApi {
  const [progress, setProgress] = useState<Progress>(freshProgress);
  const [hydrated, setHydrated] = useState(false);

  // Ref mirrors state so memoized callbacks never read stale progress.
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const loaded = loadProgress();
    setProgress(loaded);
    progressRef.current = loaded;
    setHydrated(true);
  }, []);

  const update = useCallback((next: Progress) => {
    const stamped = touchProgress(next);
    progressRef.current = stamped;
    setProgress(stamped);
    saveProgress(stamped);
  }, []);

  const gradeItem = useCallback(
    (itemId: string, grade: Grade3) => update(_gradeItem(progressRef.current, itemId, grade)),
    [update],
  );
  const completeLesson = useCallback(
    (lessonId: string) => update(_completeLesson(progressRef.current, lessonId)),
    [update],
  );
  const completeScenario = useCallback(
    (scenarioId: string) => update(_completeScenario(progressRef.current, scenarioId)),
    [update],
  );
  const markAkshar = useCallback(
    (aksharId: string) => update(_markAksharMastered(progressRef.current, aksharId)),
    [update],
  );
  const completeGrammar = useCallback(
    (conceptId: string) => update(_completeGrammar(progressRef.current, conceptId)),
    [update],
  );
  const finishOnboarding = useCallback(
    (goal: string, motivation: string, wantsGrammar = false) =>
      update(_setOnboarding(progressRef.current, goal, motivation, wantsGrammar)),
    [update],
  );
  const award = useCallback((xp: number) => update(_award(progressRef.current, xp)), [update]);

  // Reconciles this device with the cloud when someone's signed in. Deliberately
  // last: it observes progress and can write back, but nothing above depends on
  // it, so the app is identical with sync switched off.
  const sync = useCloudSync(progress, update, hydrated);

  return {
    progress,
    hydrated,
    gradeItem,
    completeLesson,
    completeScenario,
    markAkshar,
    completeGrammar,
    finishOnboarding,
    award,
    setProgress: update,
    sync,
  };
}

const ProgressContext = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const api = useProgressState();
  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>;
}

/** Access the shared learner progress. Must be inside <ProgressProvider>. */
export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error("useProgress must be used within <ProgressProvider> (see app/layout.tsx)");
  }
  return ctx;
}
