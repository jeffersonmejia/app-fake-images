import { createHash } from "node:crypto";
import { detectImageFormat } from "@/features/images/infrastructure/image-format";
import { HttpImageVerification } from "@/features/images/infrastructure/http-image-verification";
import { VerifyImage } from "@/features/images/application/verify-image";
import { ImageTooLargeError, InvalidImageError, savePrivateImage } from "@/features/images/infrastructure/private-image-storage";
import { apiError } from "@/shared/presentation/api-error";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_IMAGE_BYTES + 1024 * 1024) {
    return apiError(request, 413, "VALIDATION_ERROR", "La imagen supera el tamaño máximo de 10 MB.");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError(request, 400, "VALIDATION_ERROR", "No se pudo leer la imagen enviada.");
  }

  const image = formData.get("image");
  if (!(image instanceof File)) {
    return apiError(request, 400, "VALIDATION_ERROR", "Selecciona una imagen para analizar.");
  }
  if (image.size === 0 || image.size > MAX_IMAGE_BYTES) {
    return apiError(request, 413, "VALIDATION_ERROR", "La imagen debe pesar entre 1 byte y 10 MB.");
  }

  const bytes = new Uint8Array(await image.arrayBuffer());
  const detected = detectImageFormat(bytes);
  if (!detected) {
    return apiError(request, 415, "VALIDATION_ERROR", "Usa una imagen JPEG, PNG o WebP válida.");
  }

  let storedImage: Awaited<ReturnType<typeof savePrivateImage>>;
  try {
    storedImage = await savePrivateImage({
      originalName: image.name,
      declaredMimeType: detected.mimeType,
      bytes,
      extension: detected.extension,
    });
  } catch (error) {
    if (error instanceof ImageTooLargeError) {
      return apiError(request, 413, "VALIDATION_ERROR", "La imagen supera el tamaño máximo de 10 MB.");
    }
    if (error instanceof InvalidImageError) {
      return apiError(request, 415, "VALIDATION_ERROR", "La imagen enviada no es válida.");
    }
    return apiError(request, 503, "INTERNAL_ERROR", "No se pudo preparar la imagen para su análisis.");
  }

  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const verification = await new VerifyImage(new HttpImageVerification()).execute({
    storageKey: storedImage.storageKey,
    sha256,
    mimeType: detected.mimeType,
  });
  return Response.json({
    ...verification,
    imageUrl: `/uploaded-images/${storedImage.storageKey}`,
  }, { headers: { "cache-control": "no-store" } });
}
