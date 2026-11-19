import { getCurrentUser } from "@/features/auth/infrastructure/session";
import { apiError } from "@/shared/presentation/api-error";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError(request, 401, "UNAUTHENTICATED", "Inicia sesión para continuar.");
    return Response.json({ user });
  } catch {
    return apiError(request, 503, "DATABASE_UNAVAILABLE", "No se pudo consultar la sesión.");
  }
}
