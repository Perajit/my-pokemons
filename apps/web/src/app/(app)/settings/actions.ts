"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { UnauthorizedError, ValidationError } from "@/services/errors";
import { updateUserProfile, type UserProfileDto } from "@/services/user";
import { runAction, type ActionResult } from "@/lib/action-result";
import { validateDisplayName } from "./validation";

export async function updateProfileAction(
  name: string,
): Promise<ActionResult<{ user: UserProfileDto }>> {
  return runAction(async () => {
    const session = await auth();
    if (!session) {
      throw new UnauthorizedError();
    }

    const error = validateDisplayName(name);
    if (error) {
      throw new ValidationError(error, "INVALID_NAME");
    }

    const user = await updateUserProfile(session.user.id, {
      name: name.trim(),
    });
    revalidatePath("/", "layout");
    return { user };
  });
}
