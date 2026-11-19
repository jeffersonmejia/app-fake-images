import type {
  NewUser,
  PasswordHasher,
  UserRecord,
  UserRepository,
  UserRole,
} from "../domain/user";

export class EmailAlreadyRegisteredError extends Error {}

export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
  ) {}

  async execute(input: {
    email: string;
    password: string;
    role: UserRole;
  }): Promise<Omit<UserRecord, "passwordHash">> {
    const email = input.email.trim().toLowerCase();
    if (await this.users.findByEmail(email)) {
      throw new EmailAlreadyRegisteredError();
    }

    const user: NewUser = {
      email,
      passwordHash: await this.passwords.hash(input.password),
      role: input.role,
    };
    const created = await this.users.create(user);
    return { id: created.id, email: created.email, role: created.role };
  }
}
