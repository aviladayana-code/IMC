"use client";

import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Users,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  PlusCircle,
  FileText,
  Scale,
  Ruler,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  useSubjects,
  type SubjectListItem,
} from "@/hooks/use-anthropometry";
import { classifyBMI, colorTokenToClasses } from "@/lib/bmi";
import { cn } from "@/lib/utils";

export function DashboardView() {
  const setView = useAppStore((s) => s.setView);
  const selectSubject = useAppStore((s) => s.selectSubject);
  const { data: subjects, isLoading } = useSubjects();

  const all = subjects ?? [];
  const totalSubjects = all.length;
  const totalEvaluations = all.reduce((sum, s) => sum + s._count.evaluations, 0);

  // Últimas evaluaciones
  const lastEvals = all
    .map((s) => ({
      subject: s,
      last: s.evaluations[0],
    }))
    .filter((x) => x.last)
    .sort((a, b) => new Date(b.last.evaluationDate).getTime() - new Date(a.last.evaluationDate).getTime())
    .slice(0, 5);

  // Distribución por categoría (basada en última eval de cada sujeto)
  const dist = all
    .filter((s) => s.evaluations[0])
    .reduce<Record<string, number>>((acc, s) => {
      const cat = s.evaluations[0].classification;
      acc[cat] = (acc[cat] ?? 0) + 1;
      return acc;
    }, {});

  const distLabels: Record<string, { label: string; color: string }> = {
    bajo_peso: { label: "Bajo peso", color: "bg-sky-500" },
    normal: { label: "Normal", color: "bg-emerald-500" },
    sobrepeso: { label: "Sobrepeso", color: "bg-amber-500" },
    obesidad_i: { label: "Obesidad I", color: "bg-orange-500" },
    obesidad_ii: { label: "Obesidad II", color: "bg-red-500" },
    obesidad_iii: { label: "Obesidad III", color: "bg-rose-700" },
    pediatrico: { label: "Pediátrico", color: "bg-cyan-500" },
    indeterminado: { label: "Indeterminado", color: "bg-muted" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Panel principal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen de actividad, indicadores clave y accesos rápidos a la operatoria del sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setView("subjects")}>
            <Users className="h-4 w-4 mr-2" />
            Ver evaluados
          </Button>
          <Button size="sm" onClick={() => setView("new-eval")}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nueva evaluación
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Evaluados registrados"
          value={isLoading ? null : totalSubjects}
          icon={Users}
          color="text-primary"
          sub="Sujetos en base de datos"
        />
        <StatCard
          label="Evaluaciones totales"
          value={isLoading ? null : totalEvaluations}
          icon={ClipboardList}
          color="text-cyan-700"
          sub="Mediciones antropométricas"
        />
        <StatCard
          label="Promedio IMC"
          value={
            isLoading
              ? null
              : all
                  .filter((s) => s.evaluations[0])
                  .reduce((sum, s) => sum + s.evaluations[0].bmi, 0) /
                Math.max(1, all.filter((s) => s.evaluations[0]).length)
          }
          format={(n) => n.toFixed(2)}
          icon={Activity}
          color="text-emerald-700"
          sub="Última medición por sujeto"
        />
        <StatCard
          label="Distribución principal"
          value={
            isLoading
              ? null
              : Object.entries(dist).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
          }
          icon={TrendingUp}
          color="text-amber-700"
          sub="Categoría más frecuente"
          renderValue={(raw) => (
            <span className="text-base font-semibold text-foreground">
              {raw === "—" ? "—" : distLabels[raw as string]?.label ?? raw}
            </span>
          )}
        />
      </div>

      {/* Distribución visual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribución por clasificación OMS</CardTitle>
          <CardDescription className="text-xs">
            Basada en la última evaluación registrada de cada sujeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(dist).length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No hay evaluaciones registradas todavía
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(dist)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => {
                  const meta = distLabels[cat] ?? { label: cat, color: "bg-muted" };
                  const pct = (count / totalSubjects) * 100;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-32 shrink-0">
                        <span className={cn("h-3 w-3 rounded-sm", meta.color)} />
                        <span className="text-sm">{meta.label}</span>
                      </div>
                      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", meta.color)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {count} · {pct.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Últimas evaluaciones + accesos rápidos */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Evaluaciones recientes</CardTitle>
                <CardDescription className="text-xs">Últimas mediciones registradas en el sistema</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setView("history")}>
                Ver historial
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : lastEvals.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Aún no se registraron evaluaciones
              </div>
            ) : (
              lastEvals.map(({ subject, last }) => {
                const result = classifyBMI({
                  weightKg: last.weight,
                  heightCm: last.height,
                });
                const classes = colorTokenToClasses(result.colorToken);
                return (
                  <button
                    key={subject.id}
                    onClick={() => {
                      selectSubject(subject.id);
                      setView("history");
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-accent/30 transition-colors text-left"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                      {subject.fullName.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{subject.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {subject.identification} · {format(parseISO(last.evaluationDate), "dd MMM yyyy", { locale: es })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-metric font-semibold">{last.bmi.toFixed(2)}</p>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", classes.bg, classes.text)}>
                        {result.categoryLabel.split(" ")[0]}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Accesos rápidos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accesos rápidos</CardTitle>
            <CardDescription className="text-xs">Operaciones frecuentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickLink
              icon={PlusCircle}
              title="Registrar nueva evaluación"
              desc="Capturar medidas antropométricas"
              onClick={() => setView("new-eval")}
            />
            <QuickLink
              icon={Users}
              title="Administrar evaluados"
              desc="Buscar, editar y eliminar sujetos"
              onClick={() => setView("subjects")}
            />
            <QuickLink
              icon={FileText}
              title="Generar informe PDF"
              desc="Documento profesional exportable"
              onClick={() => setView("report")}
            />
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-900">Aclaración científica</p>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    El IMC evalúa la proporción masa/estatura. No discrimina masa magra de masa adiposa ni mide composición corporal.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  format,
  icon: Icon,
  color,
  sub,
  renderValue,
}: {
  label: string;
  value: number | string | null;
  format?: (n: number) => string;
  icon: any;
  color?: string;
  sub?: string;
  renderValue?: (raw: any) => React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
          <Icon className={cn("h-4 w-4", color ?? "text-muted-foreground")} />
        </div>
        {value === null ? (
          <Skeleton className="h-8 w-20" />
        ) : renderValue ? (
          renderValue(value)
        ) : (
          <p className="text-2xl font-metric font-semibold tracking-tight">
            {typeof value === "number" ? (format ? format(value) : value) : value}
          </p>
        )}
        {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function QuickLink({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: any;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-accent/30 transition-colors text-left group"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-[11px] text-muted-foreground truncate">{desc}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
    </button>
  );
}
