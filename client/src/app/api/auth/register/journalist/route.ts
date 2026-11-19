import { handleRegistration } from "@/features/auth/presentation/register-handler";

export async function POST(request: Request) {
  return handleRegistration(request, "JOURNALIST");
}
