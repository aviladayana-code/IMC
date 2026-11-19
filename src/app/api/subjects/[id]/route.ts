import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const SubjectUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  identification: z.string().min(2).optional(),
  sex: z.enum(["M", "F"]).optional(),
  observations: z.string().optional().nullable(),
  sportContext: z.string().optional().nullable(),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  const subject = await db.subject.findUnique({
    where: { id },
    include: {
      evaluations: { orderBy: { evaluationDate: "asc" } },
    },
  });
  if (!subject) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ subject });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const parsed = SubjectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 },
      );
    }
    const data = parsed.data;
    if (data.identification) {
      const existing = await db.subject.findFirst({
        where: { identification: data.identification, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Ya existe un evaluado con esa identificación" },
          { status: 409 },
        );
      }
    }
    const updated = await db.subject.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
        ...(data.identification !== undefined ? { identification: data.identification } : {}),
        ...(data.sex !== undefined ? { sex: data.sex } : {}),
        ...(data.observations !== undefined ? { observations: data.observations } : {}),
        ...(data.sportContext !== undefined ? { sportContext: data.sportContext } : {}),
      },
    });
    return NextResponse.json({ subject: updated });
  } catch (e) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  await db.subject.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
