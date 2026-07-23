"use client";

// ─────────────────────────────────────────────────────────────────────────
// React binding over the portable progress store. Screens use this hook; the
// core stays framework-agnostic. State is hydrated from localStorage on mount
// and persisted on every change.
// ─────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Progress,
  freshProgress,
  loadProgress,
  saveProgress,
  gradeItem as _gradeItem,
  completeLesson as _completeLesson,
  completeScenario as _completeScenario,
  markAksharMastered as _markAksharMastered,
  setOnboarding as _setOnboarding,
  award as _award,
} from "../core/progress";
import type { Grade3 } from "../core/srs";

export function useProgress() {
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
    progressRef.current = next;
    setProgress(next);
    saveProgress(next);
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
  const finishOnboarding = useCallback(
    (goal: string, motivation: string) =>
      update(_setOnboarding(progressRef.current, goal, motivation)),
    [update],
  );
  const award = useCallback((xp: number) => update(_award(progressRef.current, xp)), [update]);

  return {
    progress,
    hydrated,
    gradeItem,
    completeLesson,
    completeScenario,
    markAkshar,
    finishOnboarding,
    award,
    setProgress: update,
  };
}
