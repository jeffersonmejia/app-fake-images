import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type {
  NewUser,
  UserRecord,
  UserRepository,
} from "../domain/user";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, role: true },
    });
  }

  create(user: NewUser): Promise<UserRecord> {
    return this.prisma.user.create({
      data: user,
      select: { id: true, email: true, passwordHash: true, role: true },
    });
  }
}
