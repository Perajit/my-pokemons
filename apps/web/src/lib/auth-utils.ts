import bcrypt from "bcryptjs";
import { db } from "./db";

export async function authorizeUser(credentials: {
  email: string;
  password: string;
}): Promise<{ id: string; email: string; name: string | null } | null> {
  const user = await db.user.findUnique({
    where: { email: credentials.email },
  });
  if (!user) {
    return null;
  }
  const valid = await bcrypt.compare(credentials.password, user.passwordHash);
  if (!valid) {
    return null;
  }
  return { id: user.id, email: user.email, name: user.name };
}
