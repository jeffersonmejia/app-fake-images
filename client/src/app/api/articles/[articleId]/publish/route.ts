import { z } from "zod";
import { getCurrentUser } from "@/features/auth/infrastructure/session";
import { getPrismaClient } from "@/shared/infrastructure/prisma";
import { apiError } from "@/shared/presentation/api-error";

type RouteContext = { params: Promise<{ articleId: string }> };

export async function POST(request: Request, context: RouteContext) {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    return apiError(request, 503, "DATABASE_UNAVAILABLE", "No se pudo comprobar la sesión.");
  }
  if (!user) return apiError(request, 401, "UNAUTHENTICATED", "Inicia sesión para continuar.");
  if (user.role !== "JOURNALIST") return apiError(request, 403, "FORBIDDEN", "Esta acción requiere una cuenta de periodista.");

  const { articleId } = await context.params;
  if (!z.string().uuid().safeParse(articleId).success) {
    return apiError(request, 404, "ARTICLE_NOT_FOUND", "No encontramos ese artículo.");
  }

  try {
    const prisma = getPrismaClient();
    const result = await prisma.$transaction(async (transaction) => {
      const article = await transaction.article.findFirst({
        where: { id: articleId, authorId: user.id },
        select: { id: true, status: true, coverImageId: true },
      });
      if (!article) return { kind: "not-found" as const };
      if (article.status !== "DRAFT") return { kind: "not-draft" as const };
      if (!article.coverImageId) return { kind: "image-required" as const };

      const image = await transaction.imageAsset.findUnique({
        where: { id: article.coverImageId },
        select: { sha256: true },
      });
      if (!image) return { kind: "image-required" as const };

      const approval = await transaction.imageVerification.findFirst({
        where: {
          imageAssetId: article.coverImageId,
          imageSha256: image.sha256,
          status: "APPROVED",
        },
        select: { id: true },
      });
      if (!approval) return { kind: "image-not-verified" as const };

      const published = await transaction.article.update({
        where: { id: article.id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
        select: { id: true, title: true, slug: true, status: true, publishedAt: true },
      });
      return { kind: "published" as const, article: published };
    }, { isolationLevel: "Serializable" });

    if (result.kind === "not-found") return apiError(request, 404, "ARTICLE_NOT_FOUND", "No encontramos ese borrador en tu cuenta.");
    if (result.kind === "not-draft") return apiError(request, 409, "CONFLICT", "Solo se pueden publicar borradores.");
    if (result.kind === "image-required") return apiError(request, 409, "IMAGE_NOT_VERIFIED", "El artículo necesita una imagen vigente aprobada.");
    if (result.kind === "image-not-verified") return apiError(request, 409, "IMAGE_NOT_VERIFIED", "La imagen no tiene una aprobación vigente; el artículo continúa como borrador.");
    return Response.json({ article: result.article });
  } catch {
    return apiError(request, 503, "DATABASE_UNAVAILABLE", "No se pudo publicar el artículo en este momento.");
  }
}
