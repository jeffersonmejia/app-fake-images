import "server-only";

import { BcryptPasswordHasher } from "./bcrypt-password-hasher";
import { PrismaUserRepository } from "./prisma-user-repository";
import { getPrismaClient } from "@/shared/infrastructure/prisma";

export function createAuthServices() {
  return {
    users: new PrismaUserRepository(getPrismaClient()),
    passwords: new BcryptPasswordHasher(),
  };
}
