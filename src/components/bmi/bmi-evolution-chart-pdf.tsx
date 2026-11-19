"use client";

import type { EvaluationItem } from "@/hooks/use-anthropometry";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface BMIEvolutionChartPDFProps {
  evaluations: EvaluationItem[];
  height?: number;
  width?: number;
}

/**
 * Chart de evolución del IMC para PDF.
 * SVG plano sin dependencias de Recharts/Tailwind para evitar
 * problemas con html2canvas (no soporta oklch/lab).
 * Todos los colores son hex/rgba.
 */
export function BMIEvolutionChartPDF({
  evaluations,
  height = 260,
  width = 680,
}: BMIEvolutionChartPDFProps) {
  if (!evaluations || evaluations.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 200,
          border: "1px dashed #cbd5e1",
          color: "#64748b",
          fontFamily: "Arial, sans-serif",
          fontSize: 12,
          borderRadius: 8,
        }}
      >
        Sin evaluaciones previas para graficar evolución
      </div>
    );
  }

  const data = [...evaluations]
    .sort((a, b) => new Date(a.evaluationDate).getTime() - new Date(b.evaluationDate).getTime())
    .map((e) => ({
      date: e.evaluationDate,
      label: format(parseISO(e.evaluationDate), "dd/MM/yy", { locale: es }),
      imc: +e.bmi.toFixed(2),
      peso: +e.weight.toFixed(1),
    }));

  // Layout
  const margin = { top: 28, right: 28, bottom: 36, left: 50 };
  const W = width;
  const H = height;
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  // Y domain (IMC)
  const minBmi = Math.min(...data.map((d) => d.imc));
  const maxBmi = Math.max(...data.map((d) => d.imc));
  let yMin = Math.floor(Math.max(0, Math.min(minBmi - 3, 18)));
  let yMax = Math.ceil(Math.max(maxBmi + 3, 30));
  if (yMax - yMin < 12) yMax = yMin + 12;
  yMax = Math.min(yMax, 50);

  // Zonas OMS
  const zones = [
    { y1: 0, y2: 18.5, fill: "rgba(59,130,246,0.07)" },
    { y1: 18.5, y2: 25, fill: "rgba(16,185,129,0.10)" },
    { y1: 25, y2: 30, fill: "rgba(245,158,11,0.10)" },
    { y1: 30, y2: 35, fill: "rgba(249,115,22,0.10)" },
    { y1: 35, y2: 40, fill: "rgba(239,68,68,0.10)" },
    { y1: 40, y2: 50, fill: "rgba(190,18,60,0.10)" },
  ];

  // Escalas
  const xScale = (i: number) => margin.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const yScale = (v: number) => margin.top + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  // Puntos y línea
  const points = data.map((d, i) => ({ x: xScale(i), y: yScale(d.imc), ...d }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Ticks Y (cada ~5 unidades)
  const yTicks: number[] = [];
  const tickStep = yMax - yMin <= 15 ? 3 : 5;
  for (let v = Math.ceil(yMin / tickStep) * tickStep; v <= yMax; v += tickStep) {
    yTicks.push(v);
  }

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ background: "#ffffff", fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      {/* Título leyenda */}
      <text x={margin.left} y={16} fontSize={11} fill="#0F766E" fontWeight={700}>
        Evolución del IMC (kg/m²)
      </text>
      <text x={W - margin.right} y={16} fontSize={10} fill="#64748b" textAnchor="end">
        {data.length} evaluaciones
      </text>

      {/* Zonas OMS */}
      {zones.map((z, i) => {
        const y1 = yScale(Math.max(z.y1, yMin));
        const y2 = yScale(Math.min(z.y2, yMax));
        if (y2 >= y1) return null;
        return <rect key={i} x={margin.left} y={y2} width={innerW} height={y1 - y2} fill={z.fill} />;
      })}

      {/* Líneas de referencia OMS */}
      {[18.5, 25, 30].map((v) => {
        if (v < yMin || v > yMax) return null;
        const y = yScale(v);
        return (
          <g key={v}>
            <line x1={margin.left} y1={y} x2={margin.left + innerW} y2={y} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
            <text x={margin.left + innerW + 4} y={y + 3} fontSize={9} fill="#64748b">
              {v}
            </text>
          </g>
        );
      })}

      {/* Grid horizontal */}
      {yTicks.map((v) => {
        const y = yScale(v);
        return (
          <g key={`grid-${v}`}>
            <line x1={margin.left} y1={y} x2={margin.left + innerW} y2={y} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="2 3" />
            <text x={margin.left - 6} y={y + 3} fontSize={10} fill="#64748b" textAnchor="end">
              {v}
            </text>
          </g>
        );
      })}

      {/* Ejes */}
      <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + innerH} stroke="#cbd5e1" strokeWidth={1.5} />
      <line x1={margin.left} y1={margin.top + innerH} x2={margin.left + innerW} y2={margin.top + innerH} stroke="#cbd5e1" strokeWidth={1.5} />

      {/* Etiqueta eje Y */}
      <text
        x={12}
        y={margin.top + innerH / 2}
        fontSize={10}
        fill="#64748b"
        textAnchor="middle"
        transform={`rotate(-90 12 ${margin.top + innerH / 2})`}
      >
        IMC (kg/m²)
      </text>

      {/* Línea IMC */}
      {data.length > 1 && (
        <path d={linePath} fill="none" stroke="#0F766E" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      )}

      {/* Puntos */}
      {points.map((p, i) => (
        <g key={`pt-${i}`}>
          <circle cx={p.x} cy={p.y} r={5} fill="#0F766E" stroke="#ffffff" strokeWidth={2.5} />
          <text x={p.x} y={p.y - 12} fontSize={10} fontWeight={700} fill="#0F766E" textAnchor="middle">
            {p.imc}
          </text>
          <text x={p.x} y={margin.top + innerH + 16} fontSize={9} fill="#64748b" textAnchor="middle">
            {p.label}
          </text>
        </g>
      ))}

      {/* Leyenda inferior */}
      <g transform={`translate(${margin.left}, ${H - 8})`}>
        <rect x={0} y={-10} width={10} height={3} fill="#0F766E" />
        <text x={14} y={-7} fontSize={9} fill="#64748b">IMC (kg/m²)</text>
        <rect x={120} y={-10} width={10} height={3} fill="#10b981" />
        <text x={134} y={-7} fontSize={9} fill="#64748b">Peso (kg)</text>
      </g>
    </svg>
  );
}
