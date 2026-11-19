import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const SubjectCreateSchema = z.object({
  fullName: z.string().min(2, "El nombre es obligatorio"),
  identification: z.string().min(2, "La identificación es obligatoria"),
  sex: z.enum(["M", "F"]),
  observations: z.string().optional().nullable(),
  sportContext: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  const subjects = await db.subject.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q } },
            { identification: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    include: {
      evaluations: {
        orderBy: { evaluationDate: "desc" },
        take: 1,
        select: {
          id: true,
          evaluationDate: true,
          bmi: true,
          classification: true,
          weight: true,
          height: true,
        },
      },
      _count: { select: { evaluations: true } },
    },
    take: 100,
  });

  return NextResponse.json({ subjects });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = SubjectCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 },
      );
    }
    const { fullName, identification, sex, observations, sportContext } = parsed.data;

    const existing = await db.subject.findUnique({ where: { identification } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un evaluado con esa identificación" },
        { status: 409 },
      );
    }

    const subject = await db.subject.create({
      data: {
        fullName,
        identification,
        sex,
        observations: observations || null,
        sportContext: sportContext || null,
        createdBy: user.id,
      },
    });
    return NextResponse.json({ subject });
  } catch (e: any) {
    return NextResponse.json({ error: "Error al crear evaluado" }, { status: 500 });
  }
}
