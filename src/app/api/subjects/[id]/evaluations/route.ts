import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { classifyBMI, validateMeasurement } from "@/lib/bmi";

const EvalCreateSchema = z.object({
  evaluationDate: z.string(),
  age: z.number().int().min(1).max(110),
  weight: z.number().min(20).max(300),
  height: z.number().min(50).max(250),
  observations: z.string().optional().nullable(),
  measurementContext: z.string().optional().nullable(),
  professionalNotes: z.string().optional().nullable(),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  const evaluations = await db.evaluation.findMany({
    where: { subjectId: id },
    orderBy: { evaluationDate: "asc" },
  });
  return NextResponse.json({ evaluations });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const parsed = EvalCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 },
      );
    }
    const { weight, height, age } = parsed.data;
    const v = validateMeasurement(weight, height);
    if (!v.weightValid || !v.heightValid) {
      return NextResponse.json(
        { error: v.errors.join(" ") || "Valores fuera de rango" },
        { status: 400 },
      );
    }
    const bmiResult = classifyBMI({ weightKg: weight, heightCm: height, age });

    const subject = await db.subject.findUnique({ where: { id } });
    if (!subject) return NextResponse.json({ error: "Evaluado no encontrado" }, { status: 404 });

    const evaluation = await db.evaluation.create({
      data: {
        subjectId: id,
        evaluationDate: new Date(parsed.data.evaluationDate),
        age: parsed.data.age,
        weight,
        height,
        bmi: bmiResult.bmi ?? 0,
        classification: bmiResult.category,
        observations: parsed.data.observations || null,
        measurementContext: parsed.data.measurementContext || null,
        professionalNotes: parsed.data.professionalNotes || null,
        isPediatric: bmiResult.isPediatric,
        evaluatorId: user.id,
        evaluatorName: user.name,
        evaluatorCredential: user.credential,
      },
    });
    return NextResponse.json({ evaluation });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Error al crear evaluación" }, { status: 500 });
  }
}
