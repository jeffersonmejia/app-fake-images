import "server-only";

import { compare, hash } from "bcryptjs";
import type { PasswordHasher } from "../domain/user";

const SALT_ROUNDS = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return hash(password, SALT_ROUNDS);
  }

  verify(password: string, passwordHash: string): Promise<boolean> {
    return compare(password, passwordHash);
  }
}
