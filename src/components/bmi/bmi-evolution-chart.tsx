"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  Legend,
} from "recharts";
import type { EvaluationItem } from "@/hooks/use-anthropometry";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface BMIEvolutionChartProps {
  evaluations: EvaluationItem[];
  height?: number;
}

const ZONES = [
  { y1: 0, y2: 18.5, fill: "oklch(0.62 0.18 240 / 0.07)", label: "Bajo" },
  { y1: 18.5, y2: 25, fill: "oklch(0.70 0.15 155 / 0.10)", label: "Normal" },
  { y1: 25, y2: 30, fill: "oklch(0.78 0.15 75 / 0.10)", label: "Sobrep." },
  { y1: 30, y2: 35, fill: "oklch(0.68 0.19 50 / 0.10)", label: "Obes. I" },
  { y1: 35, y2: 40, fill: "oklch(0.62 0.22 25 / 0.10)", label: "Obes. II" },
  { y1: 40, y2: 50, fill: "oklch(0.50 0.23 15 / 0.10)", label: "Obes. III" },
];

export function BMIEvolutionChart({ evaluations, height = 280 }: BMIEvolutionChartProps) {
  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
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
    }));

  const minBmi = Math.min(...data.map((d) => d.imc));
  const maxBmi = Math.max(...data.map((d) => d.imc));
  let yMin = Math.floor(Math.max(0, Math.min(minBmi - 3, 18)));
  let yMax = Math.ceil(Math.max(maxBmi + 3, 30));
  if (yMax - yMin < 12) yMax = yMin + 12;
  yMax = Math.min(yMax, 50);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 12, right: 24, bottom: 12, left: 0 }}>
        <defs>
          <linearGradient id="imcLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.45 0.09 200)" />
            <stop offset="100%" stopColor="oklch(0.55 0.12 195)" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 200)" vertical={false} />
        {ZONES.map((z, i) => (
          <ReferenceArea
            key={i}
            y1={Math.max(z.y1, yMin)}
            y2={Math.min(z.y2, yMax)}
            fill={z.fill}
            fillOpacity={1}
            ifOverflow="extendDomain"
          />
        ))}
        <XAxis
          dataKey="label"
          stroke="oklch(0.55 0.02 210)"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: "oklch(0.91 0.01 200)" }}
        />
        <YAxis
          domain={[yMin, yMax]}
          stroke="oklch(0.55 0.02 210)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={36}
          unit=""
          label={{
            value: "IMC (kg/m²)",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 11, fill: "oklch(0.55 0.02 210)" },
            offset: 12,
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid oklch(0.91 0.01 200)",
            borderRadius: 8,
            fontSize: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
          labelStyle={{ fontWeight: 600, color: "oklch(0.20 0.02 220)" }}
          formatter={(value: number, name: string) => {
            if (name === "imc") return [`${value} kg/m²`, "IMC"];
            return [value, name];
          }}
        />
        <ReferenceLine y={18.5} stroke="oklch(0.62 0.18 240)" strokeDasharray="4 4" strokeOpacity={0.5} />
        <ReferenceLine y={25} stroke="oklch(0.78 0.15 75)" strokeDasharray="4 4" strokeOpacity={0.5} />
        <ReferenceLine y={30} stroke="oklch(0.68 0.19 50)" strokeDasharray="4 4" strokeOpacity={0.5} />
        <Line
          type="monotone"
          dataKey="imc"
          stroke="url(#imcLine)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "oklch(0.45 0.09 200)", stroke: "white", strokeWidth: 2 }}
          activeDot={{ r: 6, fill: "oklch(0.45 0.09 200)", stroke: "white", strokeWidth: 2 }}
          isAnimationActive
          animationDuration={800}
        />
        <Legend
          verticalAlign="top"
          height={28}
          iconType="line"
          formatter={(v) => (
            <span style={{ fontSize: 11, color: "oklch(0.55 0.02 210)" }}>
              {v === "imc" ? "IMC (kg/m²)" : v}
            </span>
          )}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
