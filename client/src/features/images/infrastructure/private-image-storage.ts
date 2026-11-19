import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export class ImageTooLargeError extends Error {}
export class InvalidImageError extends Error {}

export async function savePrivateImage(input: {
  originalName: string;
  declaredMimeType: string;
  bytes: Uint8Array;
  extension: "jpg" | "png" | "webp";
}) {
  if (input.bytes.length === 0) throw new InvalidImageError();
  if (input.bytes.length > MAX_IMAGE_BYTES) throw new ImageTooLargeError();
  if (input.declaredMimeType && !["image/jpeg", "image/png", "image/webp"].includes(input.declaredMimeType)) {
    throw new InvalidImageError();
  }

  const storageDirectory = path.resolve(/* turbopackIgnore: true */
    process.cwd(),
    process.env.IMAGE_STORAGE_DIR ?? "../var/private-images",
  );
  const publicDirectory = path.resolve(process.cwd(), "public");
  const relativeFromPublic = path.relative(publicDirectory, storageDirectory);
  if (relativeFromPublic === "" || (!relativeFromPublic.startsWith("..") && !path.isAbsolute(relativeFromPublic))) {
    throw new Error("El almacenamiento privado no puede estar dentro de public/.");
  }

  const storageKey = `${crypto.randomUUID()}.${input.extension}`;
  const destination = path.join(/* turbopackIgnore: true */ storageDirectory, storageKey);
  const originalName = path
    .basename(input.originalName.replaceAll("\\", "/"))
    .replace(/[^\p{L}\p{N}._ -]/gu, "_")
    .slice(0, 255) || "imagen";

  await mkdir(storageDirectory, { recursive: true, mode: 0o700 });
  await writeFile(destination, input.bytes, { flag: "wx", mode: 0o600 });

  return {
    storageKey,
    originalName,
    absolutePath: destination,
    remove: () => unlink(destination),
  };
}
