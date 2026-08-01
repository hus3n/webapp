import bcrypt from "bcryptjs";
import { BCRYPT_SALT_ROUNDS } from "./config";

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS);
}

export function verifyPassword(
  password: string,
  hash: string
): boolean {
  return bcrypt.compareSync(password, hash);
}
