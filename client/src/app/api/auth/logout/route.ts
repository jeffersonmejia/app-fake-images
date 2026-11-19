import { destroySession } from "@/features/auth/infrastructure/session";

export async function POST() {
  await destroySession();
  return Response.json({ status: "ok" });
}
