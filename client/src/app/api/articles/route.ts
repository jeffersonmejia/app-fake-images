import { z } from "zod";
import { getCurrentUser } from "@/features/auth/infrastructure/session";
import { getPrismaClient } from "@/shared/infrastructure/prisma";
import { apiError } from "@/shared/presentation/api-error";

const draftSchema = z.object({
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().trim().min(1).max(500),
  body: z.string().trim().min(1).max(100_000),
  coverImageId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    return apiError(request, 503, "DATABASE_UNAVAILABLE", "No se pudo comprobar la sesión.");
  }
  if (!user) return apiError(request, 401, "UNAUTHENTICATED", "Inicia sesión para crear un borrador.");
  if (user.role !== "JOURNALIST") return apiError(request, 403, "FORBIDDEN", "Esta acción requiere una cuenta de periodista.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(request, 400, "VALIDATION_ERROR", "El cuerpo de la solicitud no es válido.");
  }

  const parsed = draftSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(request, 400, "VALIDATION_ERROR", "Revisa el título, enlace, resumen y contenido del borrador.");
  }

  try {
    const prisma = getPrismaClient();
    if (parsed.data.coverImageId) {
      const ownedImage = await prisma.imageAsset.findFirst({
        where: { id: parsed.data.coverImageId, uploadedById: user.id },
        select: { id: true },
      });
      if (!ownedImage) return apiError(request, 404, "IMAGE_NOT_FOUND", "No encontramos esa imagen en tu cuenta.");
    }

    const article = await prisma.article.create({
      data: { ...parsed.data, authorId: user.id },
      select: { id: true, title: true, slug: true, status: true, createdAt: true },
    });
    return Response.json({ article }, { status: 201 });
  } catch (error) {
    if (hasDatabaseCode(error, "P2002")) {
      return apiError(request, 409, "DUPLICATE_SLUG", "Ya existe un artículo con ese enlace.");
    }
    return apiError(request, 503, "DATABASE_UNAVAILABLE", "No se pudo guardar el borrador.");
  }
}

function hasDatabaseCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
