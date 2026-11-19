import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { getCurrentUser } from "@/features/auth/infrastructure/session";
import { VerifyImage } from "@/features/images/application/verify-image";
import { UnconfiguredImageVerification } from "@/features/images/infrastructure/unconfigured-image-verification";
import { detectImageFormat } from "@/features/images/infrastructure/image-format";
import {
  ImageTooLargeError,
  InvalidImageError,
  savePrivateImage,
} from "@/features/images/infrastructure/private-image-storage";
import { getPrismaClient } from "@/shared/infrastructure/prisma";
import { apiError } from "@/shared/presentation/api-error";

const MAX_REQUEST_BYTES = 10 * 1024 * 1024 + 64 * 1024;
const fileMetadataSchema = z.object({
  name: z.string().min(1).max(1024),
  size: z.number().int().positive().max(10 * 1024 * 1024),
  type: z.string().max(100),
});

export async function POST(request: Request) {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    return apiError(request, 503, "DATABASE_UNAVAILABLE", "No se pudo comprobar la sesión.");
  }
  if (!user) return apiError(request, 401, "UNAUTHENTICATED", "Inicia sesión para subir imágenes.");
  if (user.role !== "JOURNALIST") return apiError(request, 403, "FORBIDDEN", "Esta acción requiere una cuenta de periodista.");

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    return apiError(request, 400, "VALIDATION_ERROR", "Envía una imagen en formato multipart/form-data.");
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return apiError(request, 413, "VALIDATION_ERROR", "La imagen supera el límite de 10 MB.");
  }

  let formData: FormData;
  try {
    const body = await readBoundedBody(request, MAX_REQUEST_BYTES);
    formData = await new Response(Buffer.from(body), { headers: { "content-type": contentType } }).formData();
  } catch (error) {
    if (error instanceof ImageTooLargeError) {
      return apiError(request, 413, "VALIDATION_ERROR", "La imagen supera el límite de 10 MB.");
    }
    return apiError(request, 400, "VALIDATION_ERROR", "No se pudo leer la imagen enviada.");
  }

  const file = formData.get("image");
  if (!(file instanceof File)) return apiError(request, 400, "VALIDATION_ERROR", "Selecciona una imagen.");

  const metadata = fileMetadataSchema.safeParse({ name: file.name, size: file.size, type: file.type });
  if (!metadata.success) return apiError(request, 400, "VALIDATION_ERROR", "La imagen debe pesar hasta 10 MB y usar JPEG, PNG o WebP.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const imageFormat = detectImageFormat(bytes);
  if (!imageFormat || (file.type && file.type !== imageFormat.mimeType)) {
    return apiError(request, 400, "VALIDATION_ERROR", "El contenido real del archivo no coincide con una imagen JPEG, PNG o WebP válida.");
  }

  let storedImage: Awaited<ReturnType<typeof savePrivateImage>> | undefined;
  try {
    storedImage = await savePrivateImage({
      originalName: metadata.data.name,
      declaredMimeType: imageFormat.mimeType,
      bytes,
      extension: imageFormat.extension,
    });

    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const verification = await new VerifyImage(new UnconfiguredImageVerification()).execute({
      storageKey: storedImage.storageKey,
      sha256,
      mimeType: imageFormat.mimeType,
    });
    const prisma = getPrismaClient();
    const image = await prisma.imageAsset.create({
      data: {
        id: randomUUID(),
        originalName: storedImage.originalName,
        storageKey: storedImage.storageKey,
        mimeType: imageFormat.mimeType,
        sizeBytes: bytes.length,
        sha256,
        uploadedById: user.id,
        verifications: {
          create: {
            imageSha256: verification.imageSha256,
            status: verification.status,
            provider: verification.provider,
            modelVersion: verification.modelVersion,
            latencyMs: verification.latencyMs,
          },
        },
      },
      select: { id: true, sha256: true, mimeType: true, sizeBytes: true },
    });

    return Response.json(
      { image, verification: { status: verification.status, reasonCode: verification.reasonCode } },
      { status: 201 },
    );
  } catch (error) {
    if (storedImage) await storedImage.remove().catch(() => undefined);
    if (error instanceof ImageTooLargeError) return apiError(request, 413, "VALIDATION_ERROR", "La imagen supera el límite de 10 MB.");
    if (error instanceof InvalidImageError) return apiError(request, 400, "VALIDATION_ERROR", "El archivo de imagen no es válido.");
    return apiError(request, 503, "DATABASE_UNAVAILABLE", "No se pudo guardar la imagen en este momento.");
  }
}

async function readBoundedBody(request: Request, maxBytes: number): Promise<Uint8Array> {
  if (!request.body) throw new InvalidImageError();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new ImageTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}
