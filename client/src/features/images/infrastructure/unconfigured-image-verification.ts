import type {
  ImageVerificationPort,
  ImageVerificationResult,
} from "../domain/image-verification";

export class UnconfiguredImageVerification implements ImageVerificationPort {
  async verify(input: Parameters<ImageVerificationPort["verify"]>[0]): Promise<ImageVerificationResult> {
    return {
      status: "NOT_CONFIGURED",
      imageSha256: input.sha256,
      reasonCode: "IMAGE_VERIFICATION_PROVIDER_NOT_CONFIGURED",
    };
  }
}
