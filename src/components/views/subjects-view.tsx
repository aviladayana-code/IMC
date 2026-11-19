"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/store/app-store";
import {
  useSubjects,
  useDeleteSubject,
  useUpdateSubject,
  type SubjectListItem,
} from "@/hooks/use-anthropometry";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { format, parseISO, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import {
  Search,
  Plus,
  Users,
  Trash2,
  Edit3,
  History,
  FileText,
  Mail,
  Phone,
  IdCard,
  User,
  Filter,
} from "lucide-react";
import { classifyBMI, colorTokenToClasses } from "@/lib/bmi";
import { cn } from "@/lib/utils";

export function SubjectsView() {
  const { data: subjects, isLoading } = useSubjects();
  const deleteSubject = useDeleteSubject();
  const setView = useAppStore((s) => s.setView);
  const selectSubject = useAppStore((s) => s.selectSubject);
  const selectedSubjectId = useAppStore((s) => s.selectedSubjectId);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "M" | "F">("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!subjects) return [];
    let list = subjects;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.identification.toLowerCase().includes(q),
      );
    }
    if (filter !== "all") list = list.filter((s) => s.sex === filter);
    return list;
  }, [subjects, search, filter]);

  const editing = subjects?.find((s) => s.id === editId);
  const deleting = subjects?.find((s) => s.id === deleteId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Evaluados</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de sujetos: búsqueda, edición, comparación y eliminación de registros.
          </p>
        </div>
        <Button size="sm" onClick={() => setView("new-eval")}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo evaluado
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o identificación..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)
          : filtered.length === 0
            ? (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No se encontraron evaluados</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setView("new-eval")}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Crear el primer evaluado
                </Button>
              </div>
            )
            : filtered.map((s) => (
              <SubjectCard
                key={s.id}
                subject={s}
                selected={s.id === selectedSubjectId}
                onSelect={() => {
                  selectSubject(s.id);
                  setView("history");
                }}
                onEdit={() => setEditId(s.id)}
                onDelete={() => setDeleteId(s.id)}
                onReport={() => {
                  selectSubject(s.id);
                  setView("report");
                }}
              />
            ))}
      </div>

      {/* Diálogo editar */}
      {editing && (
        <EditSubjectDialog
          key={editing.id}
          open={!!editing}
          subject={editing}
          onClose={() => setEditId(null)}
        />
      )}

      {/* Diálogo eliminar */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar evaluado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente a <strong>{deleting?.fullName}</strong> ({deleting?.identification})
              y todas sus evaluaciones asociadas. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteSubject.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SubjectCard({
  subject,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onReport,
}: {
  subject: SubjectListItem;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
}) {
  const last = subject.evaluations[0];
  const bmiResult = last
    ? classifyBMI({ weightKg: last.weight, heightCm: last.height })
    : null;
  const classes = bmiResult ? colorTokenToClasses(bmiResult.colorToken) : null;
  const initials = subject.fullName.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();

  return (
    <Card className={cn("transition-all hover:shadow-md", selected && "ring-2 ring-primary")}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{subject.fullName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="outline" className="text-[10px] font-metric py-0">{subject.identification}</Badge>
              <Badge variant="secondary" className="text-[10px] py-0">
                {subject.sex === "M" ? "M" : "F"}
              </Badge>
            </div>
          </div>
        </div>

        {subject.sportContext && (
          <p className="text-[11px] text-muted-foreground line-clamp-1">{subject.sportContext}</p>
        )}

        {/* Última evaluación */}
        {last ? (
          <div className="rounded-md bg-muted/40 p-2.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                Última evaluación
              </span>
              <span className="text-[10px] text-muted-foreground">
                {format(parseISO(last.evaluationDate), "dd MMM yyyy", { locale: es })}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-metric text-xl font-bold">{last.bmi.toFixed(2)}</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", classes?.bg, classes?.text)}>
                {bmiResult?.categoryLabel.split(" ")[0]}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {last.weight.toFixed(1)} kg · {last.height.toFixed(1)} cm
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border p-2.5 text-center">
            <p className="text-[11px] text-muted-foreground">Sin evaluaciones</p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Button size="sm" variant="default" className="h-8 text-xs flex-1" onClick={onSelect}>
            <History className="h-3 w-3 mr-1" /> Historial
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onReport} title="Generar informe">
            <FileText className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onEdit} title="Editar">
            <Edit3 className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs text-destructive hover:text-destructive" onClick={onDelete} title="Eliminar">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EditSubjectDialog({
  open,
  subject,
  onClose,
}: {
  open: boolean;
  subject?: SubjectListItem;
  onClose: () => void;
}) {
  const update = useUpdateSubject(subject?.id ?? "");
  const [form, setForm] = useState({
    fullName: subject?.fullName ?? "",
    identification: subject?.identification ?? "",
    sex: (subject?.sex ?? "M") as "M" | "F",
    sportContext: subject?.sportContext ?? "",
    observations: subject?.observations ?? "",
  });

  async function handleSave() {
    if (!subject) return;
    await update.mutateAsync({
      fullName: form.fullName,
      identification: form.identification,
      sex: form.sex,
      sportContext: form.sportContext || null,
      observations: form.observations || null,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar evaluado</DialogTitle>
          <DialogDescription>Modifique los datos del sujeto seleccionado.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Nombre completo</Label>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Identificación</Label>
              <Input value={form.identification} onChange={(e) => setForm({ ...form, identification: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sexo</Label>
              <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v as "M" | "F" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Contexto deportivo</Label>
            <Input value={form.sportContext} onChange={(e) => setForm({ ...form, sportContext: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Observaciones</Label>
            <Textarea
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
