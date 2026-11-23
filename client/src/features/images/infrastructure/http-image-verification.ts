import "server-only";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type {
  ImageVerificationPort,
  ImageVerificationResult,
} from "../domain/image-verification";

const inferenceResponseSchema = z.object({
  image_sha256: z.string().regex(/^[a-f0-9]{64}$/i),
  classification: z.enum(["PROBABLE_REAL", "PROBABLE_AI"]),
  score: z.number().finite().min(0).max(1),
  model_version: z.string().min(1),
  latency_ms: z.number().int().nonnegative(),
});

export class HttpImageVerification implements ImageVerificationPort {
  async verify(input: Parameters<ImageVerificationPort["verify"]>[0]): Promise<ImageVerificationResult> {
    const serviceUrl = process.env.IMAGE_VERIFICATION_URL;
    if (!serviceUrl) {
      return {
        status: "NOT_CONFIGURED",
        imageSha256: input.sha256,
        reasonCode: "IMAGE_VERIFICATION_PROVIDER_NOT_CONFIGURED",
      };
    }

    try {
      const url = new URL(serviceUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Invalid service protocol");

      const storageDirectory = path.resolve(process.cwd(), process.env.IMAGE_STORAGE_DIR ?? "../var/private-images");
      const imagePath = path.resolve(storageDirectory, input.storageKey);
      if (path.dirname(imagePath) !== storageDirectory) throw new Error("Invalid storage key");

      const imageBytes = await readFile(imagePath);
      const actualHash = createHash("sha256").update(imageBytes).digest("hex");
      if (actualHash !== input.sha256.toLowerCase()) {
        return {
          status: "INCONCLUSIVE",
          imageSha256: input.sha256,
          reasonCode: "IMAGE_HASH_MISMATCH_BEFORE_VERIFICATION",
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": input.mimeType,
          "x-image-sha256": actualHash,
        },
        body: new Blob([imageBytes], { type: input.mimeType }),
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) {
        return {
          status: "UNAVAILABLE",
          imageSha256: input.sha256,
          provider: "cnn-frecuencias",
          reasonCode: response.status >= 400 && response.status < 500 ? "IMAGE_VERIFICATION_REJECTED_INPUT" : "IMAGE_VERIFICATION_SERVICE_UNAVAILABLE",
        };
      }

      const parsed = inferenceResponseSchema.safeParse(await response.json());
      if (!parsed.success) {
        return {
          status: "INCONCLUSIVE",
          imageSha256: input.sha256,
          provider: "cnn-frecuencias",
          reasonCode: "INVALID_IMAGE_VERIFICATION_RESPONSE",
        };
      }

      const result = parsed.data;
      return {
        status: result.classification === "PROBABLE_REAL" ? "APPROVED" : "REJECTED",
        imageSha256: result.image_sha256,
        classification: result.classification,
        score: result.score,
        provider: "cnn-frecuencias",
        modelVersion: result.model_version,
        latencyMs: result.latency_ms,
        reasonCode: result.classification === "PROBABLE_REAL" ? "IMAGE_PROBABLY_REAL" : "IMAGE_PROBABLY_AI",
      };
    } catch (error) {
      return {
        status: "UNAVAILABLE",
        imageSha256: input.sha256,
        provider: "cnn-frecuencias",
        reasonCode: error instanceof DOMException && error.name === "TimeoutError"
          ? "IMAGE_VERIFICATION_TIMEOUT"
          : "IMAGE_VERIFICATION_SERVICE_UNAVAILABLE",
      };
    }
  }
}
