import type {
  ImageVerificationPort,
  ImageVerificationResult,
  VerifyImageInput,
} from "../domain/image-verification";

export class VerifyImage {
  constructor(private readonly verificationPort: ImageVerificationPort) {}

  async execute(input: VerifyImageInput): Promise<ImageVerificationResult> {
    if (!/^[a-f0-9]{64}$/i.test(input.sha256)) {
      return {
        status: "INCONCLUSIVE",
        imageSha256: input.sha256,
        reasonCode: "INVALID_IMAGE_HASH",
      };
    }

    const result = await this.verificationPort.verify(input);

    if (result.imageSha256.toLowerCase() !== input.sha256.toLowerCase()) {
      return {
        status: "INCONCLUSIVE",
        imageSha256: input.sha256,
        provider: result.provider,
        modelVersion: result.modelVersion,
        latencyMs: result.latencyMs,
        reasonCode: "VERIFICATION_HASH_MISMATCH",
      };
    }

    return result;
  }
}
