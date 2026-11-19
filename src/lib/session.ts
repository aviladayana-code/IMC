import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  credential: string | null;
  specialty: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const u = await db.user.findUnique({
    where: { id: (session.user as any).id },
    select: { id: true, email: true, name: true, credential: true, specialty: true },
  });
  return u;
}
