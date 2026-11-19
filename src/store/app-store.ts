"use client";

import { create } from "zustand";

export type ViewKey =
  | "dashboard"
  | "new-eval"
  | "subjects"
  | "history"
  | "report";

interface AppState {
  view: ViewKey;
  selectedSubjectId: string | null;
  selectedEvaluationId: string | null;
  /** Para forzar refetch de listados cuando hay cambios */
  listVersion: number;
  setView: (v: ViewKey) => void;
  selectSubject: (id: string | null) => void;
  selectEvaluation: (id: string | null) => void;
  bumpListVersion: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "dashboard",
  selectedSubjectId: null,
  selectedEvaluationId: null,
  listVersion: 0,
  setView: (v) => set({ view: v }),
  selectSubject: (id) => set({ selectedSubjectId: id }),
  selectEvaluation: (id) => set({ selectedEvaluationId: id }),
  bumpListVersion: () => set((s) => ({ listVersion: s.listVersion + 1 })),
}));
