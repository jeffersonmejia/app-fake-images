export type UserRole = "READER" | "JOURNALIST";

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
};

export type NewUser = {
  email: string;
  passwordHash: string;
  role: UserRole;
};

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  create(user: NewUser): Promise<UserRecord>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, passwordHash: string): Promise<boolean>;
}
