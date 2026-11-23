export type ImageVerificationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "INCONCLUSIVE"
  | "UNAVAILABLE"
  | "NOT_CONFIGURED";

export type VerifyImageInput = {
  storageKey: string;
  sha256: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
};

export type ImageVerificationResult = {
  status: ImageVerificationStatus;
  imageSha256: string;
  classification?: "PROBABLE_REAL" | "PROBABLE_AI";
  score?: number;
  provider?: string;
  modelVersion?: string;
  latencyMs?: number;
  reasonCode?: string;
};

export interface ImageVerificationPort {
  verify(input: VerifyImageInput): Promise<ImageVerificationResult>;
}
