import type {
  PasswordHasher,
  UserRecord,
  UserRepository,
} from "../domain/user";

export class InvalidCredentialsError extends Error {}

export class AuthenticateUser {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
  ) {}

  async execute(input: {
    email: string;
    password: string;
  }): Promise<Omit<UserRecord, "passwordHash">> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    const passwordIsValid = user
      ? await this.passwords.verify(input.password, user.passwordHash)
      : false;

    if (!user || !passwordIsValid) throw new InvalidCredentialsError();

    return { id: user.id, email: user.email, role: user.role };
  }
}
