"use server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { validateEmail, validatePassword } from "../validation";

export async function registerAction(
  _prevState: string | null,
  formData: FormData,
) {
  const name = (formData.get("name") as string) || undefined;
  const email = (formData.get("email") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";

  const emailError = validateEmail(email);
  if (emailError) {
    return emailError;
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return passwordError;
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return "Email already in use";
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.create({ data: { name, email, passwordHash } });

  await signIn("credentials", { email, password, redirectTo: "/collection" });
  return null;
}
