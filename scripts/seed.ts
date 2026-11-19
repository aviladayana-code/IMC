import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const email = "demo@kinemetrix.app";
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Seed user already exists:", email);
    process.exit(0);
  }
  const hashed = await bcrypt.hash("demo1234", 10);
  const user = await db.user.create({
    data: {
      email,
      name: "Dr. Demo Evaluador",
      password: hashed,
      credential: "Lic. Educación Física - ISAK Nivel 1",
      specialty: "Antropometría y Composición Corporal",
      role: "evaluator",
    },
  });
  console.log("Seed user created:", user.email);

  // Crear un evaluado de ejemplo con historial
  const subj = await db.subject.create({
    data: {
      fullName: "Carlos Mendoza",
      identification: "AT-2041",
      sex: "M",
      observations: "Atleta de rugby - Primera División",
      sportContext: "Rugby Union · Fuerza-Potencia",
      createdBy: user.id,
    },
  });

  const e1 = await db.evaluation.create({
    data: {
      subjectId: subj.id,
      evaluationDate: new Date("2024-08-15"),
      age: 26,
      weight: 76.2,
      height: 176.5,
      bmi: 76.2 / Math.pow(1.765, 2),
      classification: "sobrepeso",
      observations: "Inicio pretemporada",
      measurementContext: "Ayuno Verificado,Euhidratado",
      evaluatorId: user.id,
      evaluatorName: user.name,
      evaluatorCredential: user.credential,
    },
  });
  const e2 = await db.evaluation.create({
    data: {
      subjectId: subj.id,
      evaluationDate: new Date("2024-12-10"),
      age: 27,
      weight: 78.4,
      height: 176.5,
      bmi: 78.4 / Math.pow(1.765, 2),
      classification: "sobrepeso",
      observations: "Ciclo de hipertrofia completado",
      measurementContext: "Post-entrenamiento",
      professionalNotes: "Incremento de masa magra observable. Recomendable complementar con evaluación de pliegues cutáneos.",
      evaluatorId: user.id,
      evaluatorName: user.name,
      evaluatorCredential: user.credential,
    },
  });
  console.log("Seed evaluations created:", e1.id, e2.id);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
