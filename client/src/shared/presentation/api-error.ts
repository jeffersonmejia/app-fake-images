export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "DATABASE_UNAVAILABLE"
  | "IMAGE_NOT_VERIFIED"
  | "IMAGE_NOT_FOUND"
  | "ARTICLE_NOT_FOUND"
  | "DUPLICATE_SLUG"
  | "INTERNAL_ERROR";

export function apiError(
  request: Request,
  status: number,
  code: ApiErrorCode,
  message: string,
): Response {
  const requestedId = request.headers.get("x-correlation-id");
  const correlationId =
    requestedId && /^[a-zA-Z0-9._-]{1,100}$/.test(requestedId)
      ? requestedId
      : crypto.randomUUID();

  return Response.json(
    {
      error: { code, message, correlationId },
    },
    {
      status,
      headers: { "x-correlation-id": correlationId },
    },
  );
}
