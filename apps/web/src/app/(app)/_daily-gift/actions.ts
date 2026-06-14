"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/services/errors";
import { claimDailyGift } from "@/services/user";
import type { DailyGiftReward } from "@/services/user";
import { runAction, type ActionResult } from "@/lib/action-result";

export async function claimDailyGiftAction(): Promise<
  ActionResult<{ reward: DailyGiftReward }>
> {
  return runAction(async () => {
    const session = await auth();
    if (!session) {
      throw new UnauthorizedError();
    }
    const reward = await claimDailyGift(session.user.id);
    revalidatePath("/", "layout");
    return { reward };
  });
}
