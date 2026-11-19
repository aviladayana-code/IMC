import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const RegisterSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  credential: z.string().optional(),
  specialty: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 },
      );
    }
    const { name, email, password, credential, specialty } = parsed.data;
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email" },
        { status: 409 },
      );
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
        credential: credential || null,
        specialty: specialty || null,
        role: "evaluator",
      },
      select: { id: true, name: true, email: true, credential: true, specialty: true },
    });
    return NextResponse.json({ user });
  } catch (e: any) {
    return NextResponse.json({ error: "Error al registrar" }, { status: 500 });
  }
}
