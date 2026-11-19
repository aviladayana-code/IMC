/**
 * Motor de cálculo y clasificación del IMC (Índice de Masa Corporal).
 * Basado en criterios OMS para adultos ≥ 20 años.
 *
 * El IMC (Índice de Quetelet) evalúa la relación entre masa corporal y
 * la estatura al cuadrado; NO mide directamente composición corporal.
 */

export type BMICategory =
  | "bajo_peso"
  | "normal"
  | "sobrepeso"
  | "obesidad_i"
  | "obesidad_ii"
  | "obesidad_iii"
  | "pediatrico"
  | "indeterminado";

export interface BMIResult {
  bmi: number | null;
  bmiFormatted: string;
  /** Resultado del desarrollo matemático, ej: "78.4 / (1.765)²" */
  mathTrace: string;
  category: BMICategory;
  /** Etiqueta legible de la categoría */
  categoryLabel: string;
  /** Rango numérico legible, ej: "25.0 - 29.9 kg/m²" */
  categoryRange: string;
  /** Color semántico para badges / charts */
  colorToken: "blue" | "green" | "amber" | "orange" | "red" | "deep-red" | "muted";
  /** Riesgo metabólico asociado (interpretación técnica) */
  riskLabel: string;
  /** ¿Aplica criterios pediátricos (edad < 20 años)? */
  isPediatric: boolean;
  /** Nota técnica para mostrar al usuario */
  technicalNote: string;
}

export interface BMIInput {
  weightKg: number | null | undefined;
  heightCm: number | null | undefined;
  age?: number | null;
}

const RANGES: Record<
  Exclude<BMICategory, "pediatrico" | "indeterminado">,
  { label: string; range: string; color: BMIResult["colorToken"]; risk: string }
> = {
  bajo_peso: {
    label: "Bajo peso",
    range: "< 18.5 kg/m²",
    color: "blue",
    risk: "Riesgo nutricional / deficiencia",
  },
  normal: {
    label: "Peso normal (Normopeso)",
    range: "18.5 - 24.9 kg/m²",
    color: "green",
    risk: "Riesgo metabólico bajo",
  },
  sobrepeso: {
    label: "Sobrepeso",
    range: "25.0 - 29.9 kg/m²",
    color: "amber",
    risk: "Riesgo metabólico leve",
  },
  obesidad_i: {
    label: "Obesidad Grado I",
    range: "30.0 - 34.9 kg/m²",
    color: "orange",
    risk: "Riesgo metabólico moderado",
  },
  obesidad_ii: {
    label: "Obesidad Grado II",
    range: "35.0 - 39.9 kg/m²",
    color: "red",
    risk: "Riesgo metabólico alto",
  },
  obesidad_iii: {
    label: "Obesidad Grado III",
    range: "≥ 40.0 kg/m²",
    color: "deep-red",
    risk: "Riesgo metabólico muy alto",
  },
};

export const BMI_RANGE_POINTS = [
  { label: "Bajo <18.5", value: 18.5, color: "var(--bmi-blue, #3b82f6)" },
  { label: "Normal 18.5-24.9", value: 24.9, color: "var(--bmi-green, #10b981)" },
  { label: "Sobrep. 25-29.9", value: 29.9, color: "var(--bmi-amber, #f59e0b)" },
  { label: "Obes. ≥30", value: 30, color: "var(--bmi-red, #ef4444)" },
];

/** Valida rangos plausibles de peso y estatura */
export function validateMeasurement(
  weightKg: number | null | undefined,
  heightCm: number | null | undefined,
): { weightValid: boolean; heightValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const weightValid =
    typeof weightKg === "number" &&
    isFinite(weightKg) &&
    weightKg >= 20 &&
    weightKg <= 300;
  const heightValid =
    typeof heightCm === "number" &&
    isFinite(heightCm) &&
    heightCm >= 50 &&
    heightCm <= 250;

  if (weightKg != null && !weightValid) errors.push("Peso fuera del rango fisiológico (20-300 kg).");
  if (heightCm != null && !heightValid) errors.push("Estatura fuera del rango plausible (50-250 cm).");
  return { weightValid, heightValid, errors };
}

export function classifyBMI(input: BMIInput): BMIResult {
  const { weightKg, heightCm, age } = input;
  const isPediatric = typeof age === "number" && age > 0 && age < 20;

  if (
    typeof weightKg !== "number" ||
    typeof heightCm !== "number" ||
    !isFinite(weightKg) ||
    !isFinite(heightCm) ||
    weightKg <= 0 ||
    heightCm <= 0
  ) {
    return {
      bmi: null,
      bmiFormatted: "--",
      mathTrace: "-- / --",
      category: "indeterminado",
      categoryLabel: "Ingrese peso y talla válidos",
      categoryRange: "",
      colorToken: "muted",
      riskLabel: "",
      isPediatric,
      technicalNote: "Se requieren peso y estatura para el cálculo.",
    };
  }

  const meters = heightCm / 100;
  const bmi = weightKg / Math.pow(meters, 2);
  const bmiFormatted = bmi.toFixed(2);
  const mathTrace = `${weightKg.toFixed(1)} / (${meters.toFixed(3)})²`;

  // Para menores de 20 años no se aplican automáticamente las categorías adultas.
  if (isPediatric) {
    return {
      bmi,
      bmiFormatted,
      mathTrace,
      category: "pediatrico",
      categoryLabel: "Evaluación pediátrica / adolescente",
      categoryRange: "IMC para la edad (Z-score OMS)",
      colorToken: "blue",
      riskLabel: "Requiere interpretación percentilar",
      isPediatric: true,
      technicalNote:
        "Para menores de 20 años, los criterios OMS no aplican directamente. " +
        "Se debe interpretar mediante IMC para la edad (percentiles o Z-score) " +
        "según referencias OMS por sexo. Se requiere evaluación específica.",
    };
  }

  let categoryKey: keyof typeof RANGES;
  if (bmi < 18.5) categoryKey = "bajo_peso";
  else if (bmi < 25) categoryKey = "normal";
  else if (bmi < 30) categoryKey = "sobrepeso";
  else if (bmi < 35) categoryKey = "obesidad_i";
  else if (bmi < 40) categoryKey = "obesidad_ii";
  else categoryKey = "obesidad_iii";

  const r = RANGES[categoryKey];
  return {
    bmi,
    bmiFormatted,
    mathTrace,
    category: categoryKey,
    categoryLabel: r.label,
    categoryRange: r.range,
    colorToken: r.color,
    riskLabel: r.risk,
    isPediatric: false,
    technicalNote:
      "El IMC (Índice de Quetelet) evalúa la proporción masa-estatura y no discrimina " +
      "masa magra esquelética de masa adiposa visceral. No constituye una medición directa " +
      "de grasa corporal ni debe utilizarse como único criterio de salud.",
  };
}

/** Calcula diferencia entre dos evaluaciones (para comparación) */
export interface ComparisonDelta {
  weightDelta: number;
  bmiDelta: number;
  daysBetween: number;
}

export function compareEvaluations(
  current: { weight: number; bmi: number; date: Date | string },
  previous: { weight: number; bmi: number; date: Date | string },
): ComparisonDelta {
  const d1 = new Date(current.date);
  const d2 = new Date(previous.date);
  const daysBetween = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
  return {
    weightDelta: +(current.weight - previous.weight).toFixed(2),
    bmiDelta: +(current.bmi - previous.bmi).toFixed(2),
    daysBetween,
  };
}

/** Mapeo de tokens de color a clases Tailwind para badges / chips */
export function colorTokenToClasses(token: BMIResult["colorToken"]) {
  const map: Record<BMIResult["colorToken"], { bg: string; text: string; dot: string; bar: string }> = {
    blue: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500", bar: "bg-sky-500" },
    green: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", bar: "bg-emerald-500" },
    amber: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", bar: "bg-amber-500" },
    orange: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", bar: "bg-orange-500" },
    red: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", bar: "bg-red-500" },
    "deep-red": { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-700", bar: "bg-rose-700" },
    muted: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground", bar: "bg-muted-foreground" },
  };
  return map[token];
}

/** Calcula edad a partir de fecha de nacimiento */
export function ageFromBirthdate(birthdate: Date | string, reference: Date = new Date()): number {
  const b = new Date(birthdate);
  let age = reference.getFullYear() - b.getFullYear();
  const m = reference.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && reference.getDate() < b.getDate())) age--;
  return age;
}
