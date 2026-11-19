import { getPrismaClient } from "@/shared/infrastructure/prisma";
import { apiError } from "@/shared/presentation/api-error";

export async function GET(request: Request) {
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "connected" });
  } catch {
    return apiError(
      request,
      503,
      "DATABASE_UNAVAILABLE",
      "No se pudo conectar con la base de datos.",
    );
  }
}
