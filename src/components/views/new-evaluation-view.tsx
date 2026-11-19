"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/store/app-store";
import {
  useSubjects,
  useCreateSubject,
} from "@/hooks/use-anthropometry";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BMIGauge } from "@/components/bmi/bmi-gauge";
import { classifyBMI, validateMeasurement, colorTokenToClasses } from "@/lib/bmi";
import { cn } from "@/lib/utils";
import {
  UserCheck,
  Plus,
  Search,
  Scale,
  Ruler,
  Calendar,
  Save,
  Loader2,
  CheckCircle2,
  Activity,
  AlertTriangle,
  ChevronRight,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const CONTEXT_TAGS = [
  { key: "ayuno", label: "Ayuno verificado", icon: "⏱" },
  { key: "post-entreno", label: "Post-entrenamiento", icon: "🏁" },
  { key: "euhidratado", label: "Euhidratado", icon: "💧" },
  { key: "hipertrofia", label: "Atleta de hipertrofia", icon: "🏋" },
  { key: "pre-competencia", label: "Pre-competencia", icon: "🎯" },
  { key: "rehabilitacion", label: "En rehabilitación", icon: "🩹" },
];

export function NewEvaluationView() {
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const createSubject = useCreateSubject();
  const queryClient = useQueryClient();
  const setView = useAppStore((s) => s.setView);
  const selectSubject = useAppStore((s) => s.selectSubject);
  const selectedSubjectId = useAppStore((s) => s.selectedSubjectId);

  const [search, setSearch] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);
  const [newSubject, setNewSubject] = useState({
    fullName: "",
    identification: "",
    sex: "M" as "M" | "F",
    sportContext: "",
    observations: "",
  });

  // Form state
  const [evaluationDate, setEvaluationDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [age, setAge] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [observations, setObservations] = useState("");
  const [professionalNotes, setProfessionalNotes] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Mutación para crear evaluación (subjectId se pasa en cada llamada)
  const [savingEval, setSavingEval] = useState(false);

  // Si hay un sujeto seleccionado en store, usarlo
  const filtered = useMemo(() => {
    if (!subjects) return [];
    if (!search.trim()) return subjects;
    const q = search.toLowerCase();
    return subjects.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.identification.toLowerCase().includes(q),
    );
  }, [subjects, search]);

  const selected = useMemo(
    () => subjects?.find((s) => s.id === selectedSubjectId) ?? null,
    [subjects, selectedSubjectId],
  );

  // Cuando se selecciona un sujeto existente, salir del modo "crear nuevo"
  useEffect(() => {
    if (selected) setCreatingNew(false);
  }, [selected]);

  const bmiResult = useMemo(
    () =>
      classifyBMI({
        weightKg: parseFloat(weight),
        heightCm: parseFloat(height),
        age: parseInt(age, 10),
      }),
    [weight, height, age],
  );

  const validation = validateMeasurement(parseFloat(weight), parseFloat(height));

  const isFormValid =
    (selected || (creatingNew && newSubject.fullName && newSubject.identification)) &&
    evaluationDate &&
    age &&
    parseInt(age, 10) > 0 &&
    weight &&
    parseFloat(weight) > 0 &&
    height &&
    parseFloat(height) > 0 &&
    validation.weightValid &&
    validation.heightValid;

  async function handleSubmit() {
    if (!isFormValid) {
      toast.error("Complete los campos obligatorios");
      return;
    }

    setSavingEval(true);
    let subjectId = selectedSubjectId;

    try {
      // Crear sujeto si estamos en modo creación
      if (creatingNew && !subjectId) {
        const created = await createSubject.mutateAsync({
          fullName: newSubject.fullName,
          identification: newSubject.identification,
          sex: newSubject.sex,
          sportContext: newSubject.sportContext || undefined,
          observations: newSubject.observations || undefined,
        });
        subjectId = created.subject.id;
        selectSubject(subjectId);
        setCreatingNew(false);
      }

      if (!subjectId) {
        toast.error("Debe seleccionar o crear un evaluado");
        return;
      }

      // Crear evaluación vía fetch directo (evita hooks condicionales)
      const res = await fetch(`/api/subjects/${subjectId}/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluationDate,
          age: parseInt(age, 10),
          weight: parseFloat(weight),
          height: parseFloat(height),
          observations: observations || undefined,
          measurementContext: activeTags.join(",") || undefined,
          professionalNotes: professionalNotes || undefined,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Error al registrar evaluación");
      }

      // Invalidar queries para refrescar
      queryClient.invalidateQueries({ queryKey: ["subject", subjectId] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      const { bumpListVersion } = useAppStore.getState();
      bumpListVersion();

      toast.success("Evaluación registrada correctamente");
      // Limpiar
      setWeight("");
      setHeight("");
      setAge("");
      setObservations("");
      setProfessionalNotes("");
      setActiveTags([]);
      setView("history");
    } catch (e: any) {
      toast.error(e.message || "Error al registrar evaluación");
    } finally {
      setSavingEval(false);
    }
  }

  const colorClasses = colorTokenToClasses(bmiResult.colorToken);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva evaluación antropométrica</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Capture los datos del evaluado, las mediciones corporales y obtenga el cálculo diagnóstico en vivo.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Columna izquierda: sujeto + medidas */}
        <div className="lg:col-span-3 space-y-6">
          {/* Selector de sujeto */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    Sujeto a evaluar
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Seleccione un evaluado existente o cree uno nuevo
                  </CardDescription>
                </div>
                <Button
                  variant={creatingNew ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCreatingNew((v) => !v);
                    selectSubject(null);
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  {creatingNew ? "Cancelando..." : "Crear nuevo"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {creatingNew ? (
                <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Nombre completo *</Label>
                      <Input
                        value={newSubject.fullName}
                        onChange={(e) => setNewSubject({ ...newSubject, fullName: e.target.value })}
                        placeholder="Ej: Carlos Mendoza"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Identificación / código *</Label>
                      <Input
                        value={newSubject.identification}
                        onChange={(e) => setNewSubject({ ...newSubject, identification: e.target.value })}
                        placeholder="DNI, pasaporte o ID interno"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Sexo biológico</Label>
                      <Select
                        value={newSubject.sex}
                        onValueChange={(v) => setNewSubject({ ...newSubject, sex: v as "M" | "F" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Femenino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Contexto deportivo (opcional)</Label>
                      <Input
                        value={newSubject.sportContext}
                        onChange={(e) => setNewSubject({ ...newSubject, sportContext: e.target.value })}
                        placeholder="Ej: Rugby, sedentario, halterofilia..."
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Observaciones generales (opcional)</Label>
                      <Textarea
                        value={newSubject.observations}
                        onChange={(e) => setNewSubject({ ...newSubject, observations: e.target.value })}
                        rows={2}
                        placeholder="Antecedentes relevantes del sujeto..."
                      />
                    </div>
                  </div>
                </div>
              ) : selected ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                    {selected.fullName.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{selected.fullName}</p>
                      <Badge variant="secondary" className="text-[10px]">{selected.identification}</Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {selected.sex === "M" ? "Masculino" : "Femenino"}
                      </Badge>
                    </div>
                    {selected.sportContext && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{selected.sportContext}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectSubject(null)}
                  >
                    Cambiar
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar por nombre o identificación..."
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-72 overflow-y-auto rounded-lg border border-border divide-y">
                    {subjectsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)
                    ) : filtered.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No se encontraron evaluados. Cree uno nuevo.
                      </div>
                    ) : (
                      filtered.slice(0, 20).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => selectSubject(s.id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left"
                        >
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">
                            {s.fullName.split(" ").slice(0, 2).map((x) => x[0]).join("").toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.fullName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {s.identification} · {s._count.evaluations} evaluación(es)
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Datos basales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos basales</CardTitle>
              <CardDescription className="text-xs">Información contextual de la evaluación</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Fecha de evaluación *
                </Label>
                <Input
                  type="date"
                  value={evaluationDate}
                  onChange={(e) => setEvaluationDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Edad (años) *</Label>
                <Input
                  type="number"
                  min={1}
                  max={110}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Ej: 26"
                />
              </div>
            </CardContent>
          </Card>

          {/* Antropometría */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-primary" /> Antropometría básica
                  </CardTitle>
                  <CardDescription className="text-xs">Mediciones corporales principales</CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px]">Balanza · Estadiómetro</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Peso */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Scale className="h-3 w-3" /> Peso corporal (kg) *
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Rango: 20 - 300 kg</span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    min={20}
                    max={300}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="0.0"
                    className={cn("pr-16 h-12 text-lg font-metric font-semibold", weight && !validation.weightValid && "border-destructive focus-visible:ring-destructive")}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">kg</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[-1, -0.5, -0.1, +0.1, +0.5, +1].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        const v = parseFloat(weight) || 70;
                        setWeight(Math.max(20, Math.min(300, v + d)).toFixed(1));
                      }}
                      className="px-2 py-1 text-[10px] rounded bg-muted hover:bg-accent text-muted-foreground font-metric"
                    >
                      {d > 0 ? `+${d}` : d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estatura */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Ruler className="h-3 w-3" /> Estatura en bipedestación (cm) *
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Rango: 50 - 250 cm</span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.5"
                    min={50}
                    max={250}
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="0.0"
                    className={cn("pr-16 h-12 text-lg font-metric font-semibold", height && !validation.heightValid && "border-destructive focus-visible:ring-destructive")}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">cm</span>
                </div>
                {height && validation.heightValid && (
                  <p className="text-[11px] text-muted-foreground">
                    Equivale a: <span className="font-metric">{(parseFloat(height) / 100).toFixed(3)} m</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contexto + Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contexto de la medición</CardTitle>
              <CardDescription className="text-xs">Etiquetas rápidas y observaciones clínicas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {CONTEXT_TAGS.map((t) => {
                  const active = activeTags.includes(t.key);
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        setActiveTags((prev) =>
                          active ? prev.filter((k) => k !== t.key) : [...prev, t.key],
                        );
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      <span className="mr-1">{t.icon}</span>
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Observaciones clínicas (opcional)</Label>
                <Textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={3}
                  placeholder="Notas sobre biotipo, pliegues cutáneos, condiciones de medición..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notas / recomendaciones profesionales (opcional)</Label>
                <Textarea
                  value={professionalNotes}
                  onChange={(e) => setProfessionalNotes(e.target.value)}
                  rows={2}
                  placeholder="Recomendaciones del evaluador..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: cálculo en vivo */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Cálculo diagnóstico en vivo
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] font-metric">OMS · Quetelet</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fórmula */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Fórmula matemática:</span>
                  <code className="font-metric">IMC = Masa (kg) / [Talla (m)]²</code>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Desarrollo:</p>
                    <p className="font-metric text-sm font-semibold text-foreground">{bmiResult.mathTrace}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="font-metric text-3xl font-bold tracking-tight">{bmiResult.bmiFormatted}</span>
                      <span className="text-xs font-semibold text-primary">kg/m²</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gauge visual */}
              <div className="space-y-2">
                <BMIGauge
                  bmi={bmiResult.bmi}
                  isPediatric={bmiResult.isPediatric}
                  size="md"
                />
                <div className={cn("flex items-center gap-2 px-3 py-2 rounded-md", colorClasses.bg)}>
                  <span className={cn("h-2.5 w-2.5 rounded-full", colorClasses.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-semibold", colorClasses.text)}>{bmiResult.categoryLabel}</p>
                    {bmiResult.categoryRange && (
                      <p className="text-[10px] text-muted-foreground">{bmiResult.categoryRange}</p>
                    )}
                  </div>
                  {bmiResult.riskLabel && (
                    <Badge variant="outline" className="text-[10px]">{bmiResult.riskLabel}</Badge>
                  )}
                </div>
              </div>

              {/* Alerta pediátrica */}
              {bmiResult.isPediatric && (
                <Alert className="border-sky-200 bg-sky-50 text-sky-900">
                  <AlertTriangle className="h-4 w-4 text-sky-600" />
                  <AlertDescription className="text-xs">
                    <strong>Protocolo pediátrico / adolescente:</strong> Para menores de 20 años los criterios OMS adultos no aplican directamente. Se requiere interpretación por IMC para la edad (Z-score OMS).
                  </AlertDescription>
                </Alert>
              )}

              {/* Validación */}
              {(weight || height) && (validation.errors.length > 0) && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {validation.errors.join(" ")}
                  </AlertDescription>
                </Alert>
              )}

              {/* Aclaración científica */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  <p className="text-xs font-semibold text-primary">Aclaración fisiológica obligatoria</p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  El Índice de Quetelet (IMC) evalúa la proporción masa-estatura y no discrimina
                  masa magra esquelética de masa adiposa visceral. En deportistas activos, valores
                  elevados pueden reflejar hipertrofia muscular, no sobrepeso graso.
                </p>
              </div>

              {/* Submit */}
              <Button
                className="w-full"
                size="lg"
                disabled={!isFormValid || createSubject.isPending || savingEval}
                onClick={handleSubmit}
              >
                {createSubject.isPending || savingEval ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar evaluación
                  </>
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Cifrado y persistencia inmediata
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
