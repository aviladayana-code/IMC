"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/store/app-store";
import {
  useSubjects,
  useSubject,
  type EvaluationItem,
  type SubjectDetail,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BMIEvolutionChart } from "@/components/bmi/bmi-evolution-chart";
import { BMIEvolutionChartPDF } from "@/components/bmi/bmi-evolution-chart-pdf";
import { classifyBMI, colorTokenToClasses } from "@/lib/bmi";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  FileText,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

const PRIMARY: [number, number, number] = [15, 118, 110]; // #0F766E
const TEAL_DARK: [number, number, number] = [8, 145, 178];
const TEXT_DARK: [number, number, number] = [26, 26, 46];
const MUTED: [number, number, number] = [100, 116, 139];
const AMBER_BG: [number, number, number] = [254, 243, 199];
const AMBER_TEXT: [number, number, number] = [120, 53, 15];
const BORDER: [number, number, number] = [229, 231, 235];

export function ReportView() {
  const { data: subjects } = useSubjects();
  const selectedSubjectId = useAppStore((s) => s.selectedSubjectId);
  const selectSubject = useAppStore((s) => s.selectSubject);
  const subjectDetail = useSubject(selectedSubjectId);
  const [evalId, setEvalId] = useState<string>("");
  const [professionalName, setProfessionalName] = useState("");
  const [professionalCredential, setProfessionalCredential] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [signature, setSignature] = useState("");
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Cargar info del profesional actual desde la sesión
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => {
        if (s?.user?.name) setProfessionalName(s.user.name);
      })
      .catch(() => {});
  }, []);

  const subject = subjectDetail.data;
  const sortedEvals = useMemo(
    () =>
      subject?.evaluations
        ? [...subject.evaluations].sort(
            (a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime(),
          )
        : [],
    [subject],
  );

  const currentEval = useMemo(() => {
    if (!sortedEvals.length) return null;
    return sortedEvals.find((e) => e.id === evalId) ?? sortedEvals[0];
  }, [sortedEvals, evalId]);

  useEffect(() => {
    if (currentEval?.evaluatorName && !professionalName) {
      setProfessionalName(currentEval.evaluatorName);
    }
    if (currentEval?.evaluatorCredential && !professionalCredential) {
      setProfessionalCredential(currentEval.evaluatorCredential);
    }
  }, [currentEval, professionalName, professionalCredential]);

  async function captureChartImage(): Promise<string | null> {
    const chartContainer = document.getElementById("report-chart-container");
    if (!chartContainer) return null;
    try {
      // Tomar el SVG dentro del contenedor y rasterizarlo manualmente con Canvas
      const svgEl = chartContainer.querySelector("svg");
      if (!svgEl) return null;
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.crossOrigin = "anonymous";
      const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = url;
      });

      const scale = 2;
      const w = (loaded.width || 680);
      const h = (loaded.height || 260);
      const canvas = document.createElement("canvas");
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(loaded, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      return canvas.toDataURL("image/png");
    } catch (e) {
      console.warn("No se pudo capturar el chart:", e);
      return null;
    }
  }

  async function generatePDF() {
    if (!subject || !currentEval) {
      toast.error("Faltan datos para generar el informe");
      return;
    }
    setGenerating(true);
    try {
      // Capturar el chart como imagen
      const chartImage = await captureChartImage();

      // Construir el PDF con primitivas de jsPDF (sin depender de pdf.html)
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "p" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const usableW = pageW - margin * 2;
      let y = margin;

      const ensureSpace = (h: number) => {
        if (y + h > pageH - margin - 8) {
          pdf.addPage();
          y = margin;
        }
      };

      // Encabezado: barra de color + título
      pdf.setFillColor(...PRIMARY);
      pdf.rect(0, 0, pageW, 22, "F");
      pdf.setFillColor(...TEAL_DARK);
      pdf.rect(0, 22, pageW, 2, "F");

      // Logo cuadrado
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, 5, 12, 12, 2, 2, "F");
      pdf.setTextColor(...PRIMARY);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("K", margin + 6, 13, { align: "center" });

      // Nombre app
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text("Kinemetrix", margin + 16, 11);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text("ANTROPOMETRÍA · IMC", margin + 16, 16);

      // Datos del informe (derecha)
      pdf.setFontSize(7);
      pdf.text("INFORME ANTROPOMÉTRICO", pageW - margin, 9, { align: "right" });
      pdf.setFont("helvetica", "normal");
      pdf.text(`N° ${currentEval.id.slice(-8).toUpperCase()}`, pageW - margin, 13, { align: "right" });
      pdf.text(`Emitido: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageW - margin, 17, { align: "right" });

      y = 32;

      // Título central
      pdf.setTextColor(...PRIMARY);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("INFORME DE EVALUACIÓN ANTROPOMÉTRICA", pageW / 2, y, { align: "center" });
      y += 4;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...MUTED);
      pdf.text("Índice de Masa Corporal (Quetelet) · Criterios OMS", pageW / 2, y, { align: "center" });
      y += 8;

      // Sección: Datos del evaluado
      y = drawSectionHeader(pdf, "DATOS DEL EVALUADO", y, margin, usableW);
      const dataRows: [string, string, string, string][] = [
        ["Nombre completo", subject.fullName, "Identificación", subject.identification],
        ["Sexo biológico", subject.sex === "M" ? "Masculino" : "Femenino", "Edad", `${currentEval.age} años`],
        ["Fecha evaluación", format(parseISO(currentEval.evaluationDate), "dd 'de' MMMM 'de' yyyy", { locale: es }), "Contexto deportivo", subject.sportContext ?? "—"],
      ];
      y = drawDataTable(pdf, dataRows, y, margin, usableW);
      y += 6;

      // Sección: Mediciones y cálculo
      ensureSpace(50);
      y = drawSectionHeader(pdf, "MEDICIONES ANTROPOMÉTRICAS Y CÁLCULO", y, margin, usableW);

      // 3 columnas: peso / estatura / fórmula
      const colW = usableW / 3;
      const cardH = 22;
      // Peso
      pdf.setFillColor(240, 253, 250);
      pdf.rect(margin, y, colW - 2, cardH, "F");
      pdf.setDrawColor(...BORDER);
      pdf.rect(margin, y, colW - 2, cardH, "S");
      pdf.setTextColor(...MUTED);
      pdf.setFontSize(7);
      pdf.text("PESO CORPORAL", margin + 3, y + 5);
      pdf.setTextColor(...PRIMARY);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.text(currentEval.weight.toFixed(1), margin + 3, y + 14);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text("kg", margin + 3 + pdf.getTextWidth(currentEval.weight.toFixed(1)) + 2, y + 14);

      // Estatura
      pdf.setFillColor(240, 253, 250);
      pdf.rect(margin + colW, y, colW - 2, cardH, "F");
      pdf.rect(margin + colW, y, colW - 2, cardH, "S");
      pdf.setTextColor(...MUTED);
      pdf.setFontSize(7);
      pdf.text("ESTATURA", margin + colW + 3, y + 5);
      pdf.setTextColor(...PRIMARY);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.text(currentEval.height.toFixed(1), margin + colW + 3, y + 14);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(`cm  ·  ${(currentEval.height / 100).toFixed(3)} m`, margin + colW + 3, y + 19);

      // Fórmula
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin + colW * 2, y, colW, cardH, "F");
      pdf.rect(margin + colW * 2, y, colW, cardH, "S");
      pdf.setTextColor(...MUTED);
      pdf.setFontSize(7);
      pdf.text("FÓRMULA (QUETELET)", margin + colW * 2 + 3, y + 5);
      pdf.setTextColor(...TEXT_DARK);
      pdf.setFont("courier", "bold");
      pdf.setFontSize(8);
      pdf.text("IMC = M (kg) / [T (m)]²", margin + colW * 2 + 3, y + 11);
      const bmiResult = classifyBMI({
        weightKg: currentEval.weight,
        heightCm: currentEval.height,
        age: currentEval.age,
      });
      pdf.setFont("courier", "normal");
      pdf.setFontSize(7.5);
      pdf.text(`= ${bmiResult.mathTrace}`, margin + colW * 2 + 3, y + 17);
      y += cardH + 4;

      // Resultado IMC grande
      ensureSpace(40);
      const resultH = 30;
      pdf.setFillColor(240, 253, 250);
      pdf.rect(margin, y, usableW / 2 - 2, resultH, "F");
      pdf.setDrawColor(...BORDER);
      pdf.rect(margin, y, usableW / 2 - 2, resultH, "S");
      pdf.setTextColor(...MUTED);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text("RESULTADO IMC", margin + usableW / 4, y + 6, { align: "center" });
      pdf.setTextColor(...PRIMARY);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(32);
      pdf.text(bmiResult.bmiFormatted, margin + usableW / 4, y + 20, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text("kg/m²", margin + usableW / 4, y + 26, { align: "center" });

      // Clasificación
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin + usableW / 2, y, usableW / 2, resultH, "F");
      pdf.rect(margin + usableW / 2, y, usableW / 2, resultH, "S");
      pdf.setTextColor(...MUTED);
      pdf.setFontSize(7);
      pdf.text("CLASIFICACIÓN OMS", margin + usableW / 2 + 4, y + 6);
      pdf.setTextColor(...PRIMARY);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      const catLines = pdf.splitTextToSize(bmiResult.categoryLabel, usableW / 2 - 8);
      pdf.text(catLines, margin + usableW / 2 + 4, y + 13);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...MUTED);
      pdf.text(`Rango: ${bmiResult.categoryRange || "—"}`, margin + usableW / 2 + 4, y + 21);
      // Risk badge
      pdf.setFillColor(...AMBER_BG);
      pdf.roundedRect(margin + usableW / 2 + 4, y + 24, 60, 5, 1, 1, "F");
      pdf.setTextColor(...AMBER_TEXT);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.text(bmiResult.riskLabel || "—", margin + usableW / 2 + 6, y + 27.5);

      y += resultH + 6;

      // Alerta pediátrica
      if (bmiResult.isPediatric) {
        ensureSpace(20);
        pdf.setFillColor(219, 234, 254);
        pdf.rect(margin, y, usableW, 14, "F");
        pdf.setFillColor(59, 130, 246);
        pdf.rect(margin, y, 2, 14, "F");
        pdf.setTextColor(30, 64, 175);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text("⚠ Protocolo Pediátrico / Adolescente", margin + 5, y + 6);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(30, 58, 138);
        const pedText = pdf.splitTextToSize(
          "Sujeto menor de 20 años. Los criterios adultos no aplican directamente. Se requiere interpretación por IMC para la edad (Z-score OMS) según referencias por sexo.",
          usableW - 10,
        );
        pdf.text(pedText, margin + 5, y + 11);
        y += 18;
      }

      // Interpretación técnica
      ensureSpace(50);
      y = drawSectionHeader(pdf, "INTERPRETACIÓN TÉCNICA", y, margin, usableW);
      pdf.setDrawColor(...BORDER);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(margin, y, usableW, 50, "S");
      pdf.setTextColor(...TEXT_DARK);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      const introText =
        "El Índice de Masa Corporal (IMC), también conocido como Índice de Quetelet, evalúa la relación entre la masa corporal total y la estatura al cuadrado. Para adultos ≥ 20 años, la OMS establece categorías basadas en puntos de corte estandarizados.";
      const introLines = pdf.splitTextToSize(introText, usableW - 8);
      pdf.text(introLines, margin + 4, y + 6);

      let innerY = y + 6 + introLines.length * 4.5;
      const resultText = `Resultado: Con un IMC de ${bmiResult.bmiFormatted} kg/m², el evaluado se clasifica en la categoría ${bmiResult.categoryLabel} (${bmiResult.categoryRange || "—"}).`;
      const resultLines = pdf.splitTextToSize(resultText, usableW - 8);
      pdf.text(resultLines, margin + 4, innerY);
      innerY += resultLines.length * 4.5 + 2;

      // Aclaración
      pdf.setFillColor(...AMBER_BG);
      pdf.roundedRect(margin + 4, innerY, usableW - 8, 14, 1.5, 1.5, "F");
      pdf.setTextColor(...AMBER_TEXT);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.text("ACLARACIÓN FISIOLÓGICA OBLIGATORIA", margin + 6, innerY + 4);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      const noteText =
        "El IMC NO constituye una medición directa de grasa corporal ni discrimina masa magra de adiposa. En deportistas, valores elevados pueden reflejar hipertrofia muscular, no exceso de adiposidad. No debe usarse como único criterio de salud.";
      const noteLines = pdf.splitTextToSize(noteText, usableW - 12);
      pdf.text(noteLines, margin + 6, innerY + 8);
      y += 50 + 6;

      // Observaciones de la medición
      if (currentEval.observations || currentEval.measurementContext) {
        ensureSpace(20);
        y = drawSectionHeader(pdf, "OBSERVACIONES DE LA MEDICIÓN", y, margin, usableW);
        const obsRows: [string, string][] = [];
        if (currentEval.measurementContext) {
          obsRows.push(["Contexto de medición", currentEval.measurementContext]);
        }
        if (currentEval.observations) {
          obsRows.push(["Observaciones clínicas", currentEval.observations]);
        }
        y = drawKeyValueBlock(pdf, obsRows, y, margin, usableW);
        y += 4;
      }

      // Gráfico de evolución
      if (chartImage && sortedEvals.length > 1) {
        ensureSpace(80);
        y = drawSectionHeader(pdf, "EVOLUCIÓN LONGITUDINAL DEL IMC", y, margin, usableW);
        const imgH = 70;
        pdf.setDrawColor(...BORDER);
        pdf.rect(margin, y, usableW, imgH + 8, "S");
        pdf.addImage(chartImage, "PNG", margin + 4, y + 4, usableW - 8, imgH);
        pdf.setTextColor(...MUTED);
        pdf.setFontSize(7);
        pdf.text(
          `Gráfico de evolución del IMC con zonas OMS · ${sortedEvals.length} evaluaciones`,
          pageW / 2,
          y + imgH + 6,
          { align: "center" },
        );
        y += imgH + 14;
      }

      // Recomendaciones profesionales
      if (recommendations.trim()) {
        ensureSpace(30);
        y = drawSectionHeader(pdf, "RECOMENDACIONES PROFESIONALES", y, margin, usableW);
        pdf.setDrawColor(...BORDER);
        pdf.rect(margin, y, usableW, 24, "S");
        pdf.setTextColor(...TEXT_DARK);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        const recLines = pdf.splitTextToSize(recommendations, usableW - 8);
        pdf.text(recLines.slice(0, 5), margin + 4, y + 6);
        y += 30;
      }

      // Notas del evaluador (si las hay)
      if (currentEval.professionalNotes) {
        ensureSpace(20);
        y = drawSectionHeader(pdf, "NOTAS DEL EVALUADOR", y, margin, usableW);
        pdf.setDrawColor(...BORDER);
        pdf.rect(margin, y, usableW, 18, "S");
        pdf.setTextColor(...TEXT_DARK);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        const noteLines2 = pdf.splitTextToSize(currentEval.professionalNotes, usableW - 8);
        pdf.text(noteLines2.slice(0, 4), margin + 4, y + 6);
        y += 22;
      }

      // Firmas
      ensureSpace(40);
      y += 10;
      const signY = y;
      pdf.setDrawColor(...TEXT_DARK);
      pdf.setLineWidth(0.3);
      pdf.line(margin + 20, signY, margin + usableW / 2 - 20, signY);
      pdf.line(margin + usableW / 2 + 20, signY, margin + usableW - 20, signY);
      pdf.setTextColor(...TEXT_DARK);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(signature || professionalName || "—", margin + usableW / 4, signY + 5, {
        align: "center",
      });
      pdf.text(subject.fullName, (pageW / 4) * 3, signY + 5, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...MUTED);
      pdf.text(
        professionalCredential || "Profesional evaluador",
        margin + usableW / 4,
        signY + 9,
        { align: "center" },
      );
      pdf.text(
        `Evaluado · ${subject.identification}`,
        (pageW / 4) * 3,
        signY + 9,
        { align: "center" },
      );
      y = signY + 14;

      // Footer en cada página
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setDrawColor(...BORDER);
        pdf.setLineWidth(0.2);
        pdf.line(margin, pageH - 12, pageW - margin, pageH - 12);
        pdf.setTextColor(...MUTED);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.text(
          "Kinemetrix · Plataforma de Evaluación Antropométrica e IMC",
          margin,
          pageH - 8,
        );
        pdf.text(
          `Página ${i} de ${pageCount}`,
          pageW - margin,
          pageH - 8,
          { align: "right" },
        );
        pdf.text(
          "El IMC no constituye una medición directa de composición corporal",
          pageW / 2,
          pageH - 4,
          { align: "center" },
        );
      }

      const filename = `Kinemetrix_Informe_${subject.identification.replace(/[^a-zA-Z0-9]/g, "_")}_${format(parseISO(currentEval.evaluationDate), "yyyyMMdd")}.pdf`;
      pdf.save(filename);
      toast.success("Informe PDF generado correctamente");
    } catch (e: any) {
      console.error("PDF ERROR:", e);
      toast.error("Error al generar PDF: " + (e?.message ?? "desconocido"));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Informe profesional PDF</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Documento técnico exportable con datos del evaluado, cálculo IMC, interpretación clínica y evolución.
        </p>
      </div>

      {/* Selector */}
      <Card>
        <CardContent className="p-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Evaluado</Label>
            <Select
              value={selectedSubjectId ?? ""}
              onValueChange={(v) => selectSubject(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un evaluado" />
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
          <div className="space-y-1.5">
            <Label className="text-xs">Evaluación a documentar</Label>
            <Select
              value={currentEval?.id ?? ""}
              onValueChange={setEvalId}
              disabled={!sortedEvals.length}
            >
              <SelectTrigger>
                <SelectValue placeholder="Última evaluación" />
              </SelectTrigger>
              <SelectContent>
                {sortedEvals.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {format(parseISO(e.evaluationDate), "dd MMM yyyy", { locale: es })} · IMC {e.bmi.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!selectedSubjectId ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Seleccione un evaluado para configurar y generar el informe
            </p>
          </CardContent>
        </Card>
      ) : subjectDetail.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : !subject ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Evaluado no encontrado</CardContent></Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuración */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos del profesional</CardTitle>
                <CardDescription className="text-xs">Aparecerán en el informe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre completo</Label>
                  <Input value={professionalName} onChange={(e) => setProfessionalName(e.target.value)} placeholder="Dr. / Lic. ..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Credencial profesional</Label>
                  <Input value={professionalCredential} onChange={(e) => setProfessionalCredential(e.target.value)} placeholder="Matrícula, especialidad..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Recomendaciones profesionales</Label>
                  <Textarea
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    rows={4}
                    placeholder="Recomendaciones específicas para el evaluado..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Firma (texto)</Label>
                  <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Ej: Dr. Juan Pérez" />
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full"
              size="lg"
              onClick={generatePDF}
              disabled={!currentEval || generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar informe PDF
                </>
              )}
            </Button>

            <div className="text-[11px] text-muted-foreground text-center px-2">
              El PDF incluye datos del evaluado, cálculo IMC con desarrollo matemático, clasificación OMS, interpretación técnica, gráfico de evolución (si existen evaluaciones previas) y espacio para firma del profesional.
            </div>
          </div>

          {/* Vista previa del informe */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Vista previa del informe</CardTitle>
                    <CardDescription className="text-xs">Documento PDF A4 - formato profesional</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[10px]">A4</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-3">
                  <ReportPreview
                    subject={subject}
                    evaluation={currentEval}
                    sortedEvals={sortedEvals}
                    professionalName={professionalName}
                    professionalCredential={professionalCredential}
                    recommendations={recommendations}
                    signature={signature}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Contenedor oculto del chart para html2canvas.
          Importante: debe usar colores RGB/HEX explícitos porque
          html2canvas no soporta oklch/lab. Forzamos un wrapper inline
          con colores RGB simples y un Shadow DOM aislado. */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: -99999,
          top: 0,
          width: 720,
          height: 320,
          background: "#ffffff",
          color: "#1a1a2e",
          fontFamily: "Helvetica, Arial, sans-serif",
          padding: 16,
          zIndex: -1,
        }}
      >
        <div
          id="report-chart-container"
          style={{
            // Forzar herencia con colores RGB simples para evitar oklch/lab
            background: "#ffffff",
            color: "#1a1a2e",
            ["--background" as any]: "#ffffff",
            ["--foreground" as any]: "#1a1a2e",
            ["--muted" as any]: "#f1f5f9",
            ["--muted-foreground" as any]: "#64748b",
            ["--border" as any]: "#e5e7eb",
            ["--primary" as any]: "#0F766E",
            ["--primary-foreground" as any]: "#ffffff",
          }}
        >
          {subject && sortedEvals.length > 0 && (
            <BMIEvolutionChartPDF evaluations={[...sortedEvals].reverse()} height={260} />
          )}
        </div>
      </div>
    </div>
  );
}

// === Helpers de dibujo PDF ===

function drawSectionHeader(
  pdf: jsPDF,
  title: string,
  y: number,
  margin: number,
  w: number,
): number {
  pdf.setFillColor(15, 118, 110);
  pdf.rect(margin, y, w, 7, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text(title, margin + 3, y + 5);
  return y + 7 + 2;
}

function drawDataTable(
  pdf: jsPDF,
  rows: [string, string, string, string][],
  y: number,
  margin: number,
  w: number,
): number {
  const colW = w / 4;
  const rowH = 8;
  rows.forEach((r) => {
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.2);
    pdf.rect(margin, y, w, rowH, "S");
    // Label 1
    pdf.setTextColor(100, 116, 139);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.text(r[0], margin + 2, y + 5);
    // Value 1
    pdf.setTextColor(26, 26, 46);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    const v1Lines = pdf.splitTextToSize(r[1], colW - 4);
    pdf.text(v1Lines[0], margin + colW + 2, y + 5);
    // Label 2
    pdf.setTextColor(100, 116, 139);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.text(r[2], margin + colW * 2 + 2, y + 5);
    // Value 2
    pdf.setTextColor(26, 26, 46);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    const v2Lines = pdf.splitTextToSize(r[3], colW - 4);
    pdf.text(v2Lines[0], margin + colW * 3 + 2, y + 5);
    y += rowH;
  });
  return y;
}

function drawKeyValueBlock(
  pdf: jsPDF,
  rows: [string, string][],
  y: number,
  margin: number,
  w: number,
): number {
  const rowH = 14;
  rows.forEach((r) => {
    pdf.setDrawColor(229, 231, 235);
    pdf.rect(margin, y, w, rowH, "S");
    pdf.setTextColor(100, 116, 139);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.text(r[0], margin + 2, y + 4);
    pdf.setTextColor(26, 26, 46);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    const lines = pdf.splitTextToSize(r[1], w - 4);
    pdf.text(lines.slice(0, 2), margin + 2, y + 9);
    y += rowH;
  });
  return y;
}

function ReportPreview({
  subject,
  evaluation,
  sortedEvals,
  professionalName,
  professionalCredential,
  recommendations,
  signature,
}: {
  subject: SubjectDetail;
  evaluation: EvaluationItem | null;
  sortedEvals: EvaluationItem[];
  professionalName: string;
  professionalCredential: string;
  recommendations: string;
  signature: string;
}) {
  if (!evaluation) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No hay evaluaciones para mostrar
      </div>
    );
  }
  const bmiResult = classifyBMI({
    weightKg: evaluation.weight,
    heightCm: evaluation.height,
    age: evaluation.age,
  });
  const classes = colorTokenToClasses(bmiResult.colorToken);
  const formattedDate = format(parseISO(evaluation.evaluationDate), "dd 'de' MMMM 'de' yyyy", { locale: es });
  const createdAt = format(new Date(), "dd/MM/yyyy HH:mm");

  return (
    <div className="bg-white rounded-lg border border-border overflow-hidden" style={{ aspectRatio: "1 / 1.414" }}>
      {/* Encabezado */}
      <div className="flex items-center justify-between bg-primary text-primary-foreground px-5 py-3 border-b-2 border-cyan-700">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-white text-primary font-bold flex items-center justify-center text-base">K</div>
          <div>
            <p className="font-bold text-base leading-tight">Kinemetrix</p>
            <p className="text-[8px] uppercase tracking-wider opacity-80">Antropometría · IMC</p>
          </div>
        </div>
        <div className="text-right text-[8px] opacity-90">
          <p className="font-semibold">INFORME ANTROPOMÉTRICO</p>
          <p>N° {evaluation.id.slice(-8).toUpperCase()}</p>
          <p>Emitido: {createdAt}</p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3 text-xs">
        <div className="text-center">
          <p className="text-sm font-bold text-primary">INFORME DE EVALUACIÓN ANTROPOMÉTRICA</p>
          <p className="text-[10px] text-muted-foreground mt-1">Índice de Masa Corporal (Quetelet) · Criterios OMS</p>
        </div>

        {/* Tabla datos */}
        <div className="border border-border rounded overflow-hidden">
          <div className="bg-primary text-primary-foreground px-3 py-1.5 text-[9px] uppercase tracking-wider font-semibold">Datos del evaluado</div>
          <table className="w-full text-[10px]">
            <tbody>
              <tr>
                <td className="px-3 py-1.5 border-b border-border text-muted-foreground w-1/4">Nombre</td>
                <td className="px-3 py-1.5 border-b border-border font-semibold w-1/4">{subject.fullName}</td>
                <td className="px-3 py-1.5 border-b border-border text-muted-foreground w-1/4">Identificación</td>
                <td className="px-3 py-1.5 border-b border-border font-semibold w-1/4">{subject.identification}</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 border-b border-border text-muted-foreground">Sexo</td>
                <td className="px-3 py-1.5 border-b border-border font-semibold">{subject.sex === "M" ? "Masculino" : "Femenino"}</td>
                <td className="px-3 py-1.5 border-b border-border text-muted-foreground">Edad</td>
                <td className="px-3 py-1.5 border-b border-border font-semibold">{evaluation.age} años</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 text-muted-foreground">Fecha</td>
                <td className="px-3 py-1.5 font-semibold">{formattedDate}</td>
                <td className="px-3 py-1.5 text-muted-foreground">Contexto</td>
                <td className="px-3 py-1.5 font-semibold">{subject.sportContext ?? "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mediciones + resultado */}
        <div className="grid grid-cols-3 gap-2">
          <div className="border border-border rounded p-2">
            <p className="text-[8px] uppercase text-muted-foreground">Peso</p>
            <p className="font-metric text-base font-bold text-primary">{evaluation.weight.toFixed(1)}<span className="text-[10px]"> kg</span></p>
          </div>
          <div className="border border-border rounded p-2">
            <p className="text-[8px] uppercase text-muted-foreground">Estatura</p>
            <p className="font-metric text-base font-bold text-primary">{evaluation.height.toFixed(1)}<span className="text-[10px]"> cm</span></p>
            <p className="text-[8px] text-muted-foreground">{(evaluation.height / 100).toFixed(3)} m</p>
          </div>
          <div className="col-span-1 border border-border rounded p-2 bg-muted/30 text-center">
            <p className="text-[8px] uppercase tracking-wider text-muted-foreground">Resultado IMC</p>
            <p className="font-metric text-2xl font-extrabold text-primary leading-none">{bmiResult.bmiFormatted}</p>
            <span className={cn("inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded font-medium", classes.bg, classes.text)}>
              {bmiResult.categoryLabel}
            </span>
          </div>
        </div>

        {/* Fórmula */}
        <div className="border border-border rounded p-2 bg-muted/20">
          <p className="text-[8px] uppercase text-muted-foreground">Fórmula aplicada (Quetelet)</p>
          <code className="font-metric text-[10px] font-semibold">IMC = Masa (kg) / [Talla (m)]² = {bmiResult.mathTrace}</code>
        </div>

        {/* Interpretación */}
        <div className="border border-border rounded">
          <div className="bg-primary text-primary-foreground px-3 py-1.5 text-[9px] uppercase tracking-wider font-semibold">Interpretación técnica</div>
          <div className="p-2 text-[10px] leading-relaxed space-y-1">
            <p>Con un IMC de <strong>{bmiResult.bmiFormatted} kg/m²</strong>, el evaluado se clasifica en <strong>{bmiResult.categoryLabel}</strong> ({bmiResult.categoryRange}).</p>
            <p className="text-amber-900 bg-amber-50 p-1.5 rounded"><strong>Aclaración:</strong> El IMC no constituye una medición directa de grasa corporal ni discrimina masa magra de adiposa. No debe usarse como único criterio de salud.</p>
          </div>
        </div>

        {recommendations && (
          <div className="border border-border rounded">
            <div className="bg-primary text-primary-foreground px-3 py-1.5 text-[9px] uppercase tracking-wider font-semibold">Recomendaciones profesionales</div>
            <div className="p-2 text-[10px]">{recommendations}</div>
          </div>
        )}

        {/* Footer firma */}
        <div className="grid grid-cols-2 gap-4 pt-4 mt-3">
          <div className="text-center">
            <div className="border-t border-foreground pt-1 mx-6">
              <p className="text-[10px] font-bold">{signature || professionalName || "—"}</p>
              <p className="text-[8px] text-muted-foreground">{professionalCredential || "Profesional evaluador"}</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-foreground pt-1 mx-6">
              <p className="text-[10px] font-bold">{subject.fullName}</p>
              <p className="text-[8px] text-muted-foreground">Evaluado · {subject.identification}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
