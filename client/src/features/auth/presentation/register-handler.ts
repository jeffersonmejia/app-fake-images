import { z } from "zod";
import type { UserRole } from "../domain/user";
import { RegisterUser, EmailAlreadyRegisteredError } from "../application/register-user";
import { createAuthServices } from "../infrastructure/auth-services";
import { apiError } from "@/shared/presentation/api-error";

const registrationSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z
    .string()
    .min(12)
    .max(72)
    .refine((value) => new TextEncoder().encode(value).length <= 72),
});

export async function handleRegistration(request: Request, role: UserRole) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(request, 400, "VALIDATION_ERROR", "El cuerpo de la solicitud no es válido.");
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      request,
      400,
      "VALIDATION_ERROR",
      "Ingresa un correo válido y una contraseña de al menos 12 caracteres.",
    );
  }

  try {
    const { users, passwords } = createAuthServices();
    const user = await new RegisterUser(users, passwords).execute({
      ...parsed.data,
      role,
    });
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError || hasDatabaseCode(error, "P2002")) {
      return apiError(request, 409, "CONFLICT", "Ya existe una cuenta con ese correo.");
    }
    return apiError(request, 503, "DATABASE_UNAVAILABLE", "No se pudo crear la cuenta en este momento.");
  }
}

function hasDatabaseCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
