import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { classifyBMI, validateMeasurement } from "@/lib/bmi";

const EvalUpdateSchema = z.object({
  evaluationDate: z.string().optional(),
  age: z.number().int().min(1).max(110).optional(),
  weight: z.number().min(20).max(300).optional(),
  height: z.number().min(50).max(250).optional(),
  observations: z.string().optional().nullable(),
  measurementContext: z.string().optional().nullable(),
  professionalNotes: z.string().optional().nullable(),
});

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const parsed = EvalUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 },
      );
    }
    const data = parsed.data;
    const current = await db.evaluation.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 });

    const weight = data.weight ?? current.weight;
    const height = data.height ?? current.height;
    const age = data.age ?? current.age;

    const v = validateMeasurement(weight, height);
    if (!v.weightValid || !v.heightValid) {
      return NextResponse.json({ error: v.errors.join(" ") }, { status: 400 });
    }
    const bmiResult = classifyBMI({ weightKg: weight, heightCm: height, age });

    const updated = await db.evaluation.update({
      where: { id },
      data: {
        ...(data.evaluationDate !== undefined ? { evaluationDate: new Date(data.evaluationDate) } : {}),
        ...(data.age !== undefined ? { age: data.age } : {}),
        ...(data.weight !== undefined ? { weight: data.weight } : {}),
        ...(data.height !== undefined ? { height: data.height } : {}),
        ...(data.observations !== undefined ? { observations: data.observations } : {}),
        ...(data.measurementContext !== undefined ? { measurementContext: data.measurementContext } : {}),
        ...(data.professionalNotes !== undefined ? { professionalNotes: data.professionalNotes } : {}),
        bmi: bmiResult.bmi ?? 0,
        classification: bmiResult.category,
        isPediatric: bmiResult.isPediatric,
      },
    });
    return NextResponse.json({ evaluation: updated });
  } catch (e) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  await db.evaluation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
