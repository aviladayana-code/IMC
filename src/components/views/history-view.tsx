"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/store/app-store";
import {
  useSubjects,
  useSubject,
  useDeleteEvaluation,
  type EvaluationItem,
} from "@/hooks/use-anthropometry";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BMIEvolutionChart } from "@/components/bmi/bmi-evolution-chart";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { classifyBMI, colorTokenToClasses, compareEvaluations } from "@/lib/bmi";
import { cn } from "@/lib/utils";
import {
  History as HistoryIcon,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeftRight,
  Trash2,
  ChevronDown,
  ChevronUp,
  Activity,
  Scale,
  Ruler,
  User,
  ArrowRight,
} from "lucide-react";

export function HistoryView() {
  const { data: subjects } = useSubjects();
  const selectedSubjectId = useAppStore((s) => s.selectedSubjectId);
  const selectSubject = useAppStore((s) => s.selectSubject);
  const setView = useAppStore((s) => s.setView);
  const [compareWith, setCompareWith] = useState<string>("");

  const subjectDetail = useSubject(selectedSubjectId);
  const evaluations = subjectDetail.data?.evaluations ?? null;
  const loadingDetail = subjectDetail.isLoading;

  const selected = subjects?.find((s) => s.id === selectedSubjectId);

  const sortedEvals = useMemo(
    () =>
      evaluations
        ? [...evaluations].sort(
            (a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime(),
          )
        : [],
    [evaluations],
  );

  // Comparación seleccionada
  const compareEval = sortedEvals.find((e) => e.id === compareWith);
  const currentEval = sortedEvals[0];
  const comparison =
    currentEval && compareEval && currentEval.id !== compareEval.id
      ? compareEvaluations(
          { weight: currentEval.weight, bmi: currentEval.bmi, date: currentEval.evaluationDate },
          { weight: compareEval.weight, bmi: compareEval.bmi, date: compareEval.evaluationDate },
        )
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Historial de evaluaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Evolución longitudinal del IMC y comparación entre mediciones.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setView("new-eval")}>
          <Activity className="h-4 w-4 mr-2" />
          Nueva evaluación
        </Button>
      </div>

      {/* Selector de sujeto */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">
                Evaluado seleccionado
              </label>
              <Select
                value={selectedSubjectId ?? ""}
                onValueChange={(v) => selectSubject(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un evaluado para ver su historial" />
                </SelectTrigger>
                <SelectContent>
                  {(subjects ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.fullName} · {s.identification}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSubjectId && (
              <Button variant="outline" size="sm" onClick={() => setView("report")}>
                Generar informe
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedSubjectId ? (
        <Card>
          <CardContent className="py-16 text-center">
            <HistoryIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Seleccione un evaluado para ver su historial completo de evaluaciones
            </p>
          </CardContent>
        </Card>
      ) : loadingDetail ? (
        <div className="space-y-4">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          {/* Resumen del sujeto */}
          {selected && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shrink-0">
                    {selected.fullName.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-base">{selected.fullName}</h2>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <Badge variant="outline" className="text-[10px]">{selected.identification}</Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {selected.sex === "M" ? "Masculino" : "Femenino"}
                      </Badge>
                      {selected.sportContext && (
                        <Badge variant="outline" className="text-[10px]">{selected.sportContext}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Evaluaciones</p>
                      <p className="text-lg font-metric font-semibold">{sortedEvals.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">IMC actual</p>
                      <p className="text-lg font-metric font-semibold">
                        {currentEval ? currentEval.bmi.toFixed(2) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Última fecha</p>
                      <p className="text-xs font-medium mt-1">
                        {currentEval ? format(parseISO(currentEval.evaluationDate), "dd/MM/yy") : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de evolución */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Evolución del IMC
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Trayectoria longitudinal con zonas OMS de referencia
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <BMIEvolutionChart evaluations={sortedEvals.slice().reverse()} />
            </CardContent>
          </Card>

          {/* Comparación entre fechas */}
          {sortedEvals.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-primary" />
                  Comparación entre evaluaciones
                </CardTitle>
                <CardDescription className="text-xs">
                  Seleccione una evaluación previa para comparar con la más reciente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs text-muted-foreground">Comparar última con...</label>
                    <Select value={compareWith} onValueChange={setCompareWith}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione evaluación previa" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedEvals.slice(1).map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {format(parseISO(e.evaluationDate), "dd MMM yyyy", { locale: es })} · IMC {e.bmi.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {comparison && compareEval && currentEval && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <ComparisonCard
                      label="Variación peso"
                      value={`${comparison.weightDelta > 0 ? "+" : ""}${comparison.weightDelta} kg`}
                      delta={comparison.weightDelta}
                    />
                    <ComparisonCard
                      label="Variación IMC"
                      value={`${comparison.bmiDelta > 0 ? "+" : ""}${comparison.bmiDelta} kg/m²`}
                      delta={comparison.bmiDelta}
                    />
                    <ComparisonCard
                      label="Periodo entre mediciones"
                      value={`${comparison.daysBetween} días`}
                    />
                    <ComparisonCard
                      label="Tasa de cambio IMC"
                      value={`${(comparison.bmiDelta / Math.max(1, comparison.daysBetween) * 30).toFixed(3)} /mes`}
                      delta={comparison.bmiDelta}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tabla de evaluaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalle de evaluaciones</CardTitle>
              <CardDescription className="text-xs">
                {sortedEvals.length} registro(s) ordenados del más reciente al más antiguo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortedEvals.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Este evaluado no tiene evaluaciones registradas
                </div>
              ) : (
                sortedEvals.map((e, idx) => (
                  <EvaluationRow
                    key={e.id}
                    evaluation={e}
                    isLatest={idx === 0}
                    onCompare={() => setCompareWith(e.id)}
                    canDelete={sortedEvals.length > 1}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ComparisonCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: number;
}) {
  const Icon = delta == null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const color = delta == null ? "text-muted-foreground" : delta > 0 ? "text-amber-600" : delta < 0 ? "text-emerald-600" : "text-muted-foreground";
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</span>
        <Icon className={cn("h-3.5 w-3.5", color)} />
      </div>
      <p className={cn("text-base font-metric font-semibold", color)}>{value}</p>
    </div>
  );
}

function EvaluationRow({
  evaluation,
  isLatest,
  onCompare,
  canDelete,
}: {
  evaluation: EvaluationItem;
  isLatest: boolean;
  onCompare: () => void;
  canDelete: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteEval = useDeleteEvaluation();

  const bmiResult = classifyBMI({
    weightKg: evaluation.weight,
    heightCm: evaluation.height,
    age: evaluation.age,
  });
  const classes = colorTokenToClasses(bmiResult.colorToken);

  const contextTags = evaluation.measurementContext?.split(",").filter(Boolean) ?? [];

  return (
    <>
      <div className="rounded-lg border border-border/60 hover:border-primary/30 transition-colors">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-3 p-3 text-left"
        >
          <div className="flex flex-col items-center shrink-0">
            <div className={cn("h-10 w-10 rounded-lg flex flex-col items-center justify-center", classes.bg)}>
              <span className={cn("font-metric font-bold text-sm leading-tight", classes.text)}>
                {evaluation.bmi.toFixed(1)}
              </span>
              <span className={cn("text-[8px] font-medium", classes.text)}>IMC</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">
                {format(parseISO(evaluation.evaluationDate), "dd MMM yyyy", { locale: es })}
              </p>
              {isLatest && (
                <Badge className="text-[9px] py-0 h-4 bg-primary text-primary-foreground">Última</Badge>
              )}
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", classes.bg, classes.text)}>
                {bmiResult.categoryLabel}
              </span>
              {evaluation.isPediatric && (
                <Badge variant="outline" className="text-[9px] py-0 h-4">Pediátrico</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Scale className="h-3 w-3" /> {evaluation.weight} kg</span>
              <span className="flex items-center gap-1"><Ruler className="h-3 w-3" /> {evaluation.height} cm</span>
              <span className="flex items-center gap-1"><User className="h-3 w-3" /> {evaluation.age} a</span>
            </div>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {expanded && (
          <div className="border-t border-border/60 p-3 space-y-3 bg-muted/20">
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Desarrollo matemático</p>
                <code className="font-metric text-[11px]">{bmiResult.mathTrace} = {bmiResult.bmiFormatted}</code>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Riesgo asociado</p>
                <p>{bmiResult.riskLabel || "—"}</p>
              </div>
              {evaluation.observations && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Observaciones</p>
                  <p className="text-muted-foreground">{evaluation.observations}</p>
                </div>
              )}
              {evaluation.professionalNotes && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Notas profesionales</p>
                  <p className="text-muted-foreground">{evaluation.professionalNotes}</p>
                </div>
              )}
              {contextTags.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Contexto de medición</p>
                  <div className="flex flex-wrap gap-1">
                    {contextTags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[9px] py-0">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Profesional evaluador</p>
                <p>{evaluation.evaluatorName ?? "—"}</p>
                {evaluation.evaluatorCredential && (
                  <p className="text-[10px] text-muted-foreground">{evaluation.evaluatorCredential}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={onCompare}>
                <ArrowLeftRight className="h-3 w-3 mr-1" />
                Comparar
              </Button>
              {canDelete && (
                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta evaluación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente la evaluación del {format(parseISO(evaluation.evaluationDate), "dd/MM/yyyy")}.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteEval.mutate(evaluation.id);
                setConfirmDelete(false);
              }}
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
