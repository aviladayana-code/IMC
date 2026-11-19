"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { toast } from "sonner";

export interface SubjectListItem {
  id: string;
  fullName: string;
  identification: string;
  sex: string;
  observations: string | null;
  sportContext: string | null;
  createdAt: string;
  updatedAt: string;
  evaluations: {
    id: string;
    evaluationDate: string;
    bmi: number;
    classification: string;
    weight: number;
    height: number;
  }[];
  _count: { evaluations: number };
}

export interface EvaluationItem {
  id: string;
  subjectId: string;
  evaluationDate: string;
  age: number;
  weight: number;
  height: number;
  bmi: number;
  classification: string;
  observations: string | null;
  measurementContext: string | null;
  professionalNotes: string | null;
  isPediatric: boolean;
  evaluatorName: string | null;
  evaluatorCredential: string | null;
  evaluatorId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectDetail {
  id: string;
  fullName: string;
  identification: string;
  sex: string;
  observations: string | null;
  sportContext: string | null;
  createdAt: string;
  updatedAt: string;
  evaluations: EvaluationItem[];
}

export function useSubjects() {
  const listVersion = useAppStore((s) => s.listVersion);
  return useQuery<SubjectListItem[]>({
    queryKey: ["subjects", listVersion],
    queryFn: async () => {
      const res = await fetch("/api/subjects", { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar evaluados");
      const data = await res.json();
      return data.subjects;
    },
  });
}

export function useSearchSubjects(q: string) {
  return useQuery<SubjectListItem[]>({
    queryKey: ["subjects", "search", q],
    queryFn: async () => {
      const res = await fetch(`/api/subjects?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Error al buscar");
      const data = await res.json();
      return data.subjects;
    },
    enabled: q.length > 0,
  });
}

export function useSubject(id: string | null) {
  return useQuery<SubjectDetail>({
    queryKey: ["subject", id],
    queryFn: async () => {
      const res = await fetch(`/api/subjects/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar evaluado");
      const data = await res.json();
      return data.subject;
    },
    enabled: !!id,
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  const bump = useAppStore((s) => s.bumpListVersion);
  return useMutation({
    mutationFn: async (payload: {
      fullName: string;
      identification: string;
      sex: "M" | "F";
      observations?: string;
      sportContext?: string;
    }) => {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Error al crear");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      bump();
    },
    onError: (e: any) => toast.error(e.message || "Error al crear evaluado"),
  });
}

export function useUpdateSubject(id: string) {
  const qc = useQueryClient();
  const bump = useAppStore((s) => s.bumpListVersion);
  return useMutation({
    mutationFn: async (payload: Partial<{
      fullName: string;
      identification: string;
      sex: "M" | "F";
      observations: string | null;
      sportContext: string | null;
    }>) => {
      const res = await fetch(`/api/subjects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Error al actualizar");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subject", id] });
      qc.invalidateQueries({ queryKey: ["subjects"] });
      bump();
      toast.success("Evaluado actualizado");
    },
    onError: (e: any) => toast.error(e.message || "Error"),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  const bump = useAppStore((s) => s.bumpListVersion);
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      bump();
      toast.success("Evaluado eliminado");
    },
    onError: (e: any) => toast.error(e.message || "Error"),
  });
}

export function useCreateEvaluation(subjectId: string) {
  const qc = useQueryClient();
  const bump = useAppStore((s) => s.bumpListVersion);
  return useMutation({
    mutationFn: async (payload: {
      evaluationDate: string;
      age: number;
      weight: number;
      height: number;
      observations?: string;
      measurementContext?: string;
      professionalNotes?: string;
    }) => {
      const res = await fetch(`/api/subjects/${subjectId}/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Error al crear evaluación");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subject", subjectId] });
      qc.invalidateQueries({ queryKey: ["subjects"] });
      bump();
      toast.success("Evaluación registrada");
    },
    onError: (e: any) => toast.error(e.message || "Error"),
  });
}

export function useUpdateEvaluation(evalId: string) {
  const qc = useQueryClient();
  const bump = useAppStore((s) => s.bumpListVersion);
  return useMutation({
    mutationFn: async (payload: Partial<{
      evaluationDate: string;
      age: number;
      weight: number;
      height: number;
      observations: string | null;
      measurementContext: string | null;
      professionalNotes: string | null;
    }>) => {
      const res = await fetch(`/api/evaluations/${evalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Error al actualizar");
      }
      return res.json();
    },
    onSuccess: (_data, _vars, ctx) => {
      qc.invalidateQueries({ queryKey: ["subject"] });
      qc.invalidateQueries({ queryKey: ["subjects"] });
      bump();
      toast.success("Evaluación actualizada");
    },
    onError: (e: any) => toast.error(e.message || "Error"),
  });
}

export function useDeleteEvaluation() {
  const qc = useQueryClient();
  const bump = useAppStore((s) => s.bumpListVersion);
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/evaluations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar evaluación");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subject"] });
      qc.invalidateQueries({ queryKey: ["subjects"] });
      bump();
      toast.success("Evaluación eliminada");
    },
    onError: (e: any) => toast.error(e.message || "Error"),
  });
}
