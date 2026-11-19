import { z } from "zod";
import { AuthenticateUser, InvalidCredentialsError } from "@/features/auth/application/authenticate-user";
import { createAuthServices } from "@/features/auth/infrastructure/auth-services";
import { createSession } from "@/features/auth/infrastructure/session";
import { apiError } from "@/shared/presentation/api-error";

const loginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(72),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(request, 400, "VALIDATION_ERROR", "El cuerpo de la solicitud no es válido.");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(request, 400, "VALIDATION_ERROR", "Ingresa tu correo y contraseña.");
  }

  try {
    const { users, passwords } = createAuthServices();
    const user = await new AuthenticateUser(users, passwords).execute(parsed.data);
    await createSession(user);
    return Response.json({ user });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return apiError(request, 401, "UNAUTHENTICATED", "El correo o la contraseña no coinciden.");
    }
    return apiError(request, 503, "DATABASE_UNAVAILABLE", "No se pudo iniciar sesión en este momento.");
  }
}
