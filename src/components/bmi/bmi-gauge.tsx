"use client";

import { cn } from "@/lib/utils";
import { classifyBMI, colorTokenToClasses, type BMIResult } from "@/lib/bmi";

interface BMIGaugeProps {
  bmi: number | null;
  isPediatric?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Gauge visual del IMC con barra segmentada OMS y marcador posicional.
 */
export function BMIGauge({ bmi, isPediatric = false, size = "md" }: BMIGaugeProps) {
  const result: BMIResult = classifyBMI({
    weightKg: bmi != null ? 1 : null, // dummy; we already have bmi
    heightCm: 1,
    age: isPediatric ? 15 : 25,
  });

  // Direct classification by bmi value (override since we already have bmi)
  let category: BMIResult["category"] = "indeterminado";
  if (bmi == null || !isFinite(bmi)) category = "indeterminado";
  else if (isPediatric) category = "pediatrico";
  else if (bmi < 18.5) category = "bajo_peso";
  else if (bmi < 25) category = "normal";
  else if (bmi < 30) category = "sobrepeso";
  else if (bmi < 35) category = "obesidad_i";
  else if (bmi < 40) category = "obesidad_ii";
  else category = "obesidad_iii";

  // Posición relativa en una escala 15-45 (para visualización)
  const min = 15;
  const max = 45;
  const clamped = bmi == null ? 0 : Math.max(min, Math.min(max, bmi));
  const pct = bmi == null ? 0 : ((clamped - min) / (max - min)) * 100;

  const segments = [
    { from: min, to: 18.5, color: "bg-sky-500", label: "Bajo" },
    { from: 18.5, to: 25, color: "bg-emerald-500", label: "Normal" },
    { from: 25, to: 30, color: "bg-amber-500", label: "Sobrep." },
    { from: 30, to: 35, color: "bg-orange-500", label: "Obes. I" },
    { from: 35, to: 40, color: "bg-red-500", label: "Obes. II" },
    { from: 40, to: max, color: "bg-rose-700", label: "Obes. III" },
  ];

  const heights = size === "sm" ? "h-2" : size === "lg" ? "h-4" : "h-3";

  return (
    <div className="space-y-2">
      {/* Escala visual */}
      <div className="relative">
        <div className={cn("flex w-full overflow-hidden rounded-full", heights)}>
          {segments.map((s, i) => {
            const width = ((s.to - s.from) / (max - min)) * 100;
            return (
              <div
                key={i}
                className={cn("h-full", s.color)}
                style={{ width: `${width}%` }}
                title={`${s.label}: ${s.from}-${s.to}`}
              />
            );
          })}
        </div>
        {/* Marcador del IMC actual */}
        {bmi != null && isFinite(bmi) && (
          <div
            className="absolute -top-1 -bottom-1 w-[3px] bg-foreground shadow-md ring-2 ring-background rounded-full transition-all"
            style={{ left: `calc(${pct}% - 1.5px)` }}
            aria-label={`IMC ${bmi.toFixed(2)}`}
          />
        )}
      </div>
      {/* Etiquetas */}
      <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
        <span>15</span>
        <span>18.5</span>
        <span>25</span>
        <span>30</span>
        <span>35</span>
        <span>40+</span>
      </div>
    </div>
  );
}

export function BMIBadge({ result }: { result: BMIResult }) {
  const classes = colorTokenToClasses(result.colorToken);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        classes.bg,
        classes.text,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", classes.dot)} />
      {result.categoryLabel}
    </span>
  );
}
