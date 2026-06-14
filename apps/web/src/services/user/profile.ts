import { db } from "@/lib/db";
import { NotFoundError } from "../errors";

// The user's editable profile. Wire format only — name stays nullable to mirror
// the column; the UI derives initials/avatar from name + email.
export type UserProfileDto = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
};

function toUserProfileDto(user: {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
}): UserProfileDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getUserProfileDto(
  userId: string,
): Promise<UserProfileDto> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  if (!user) {
    throw new NotFoundError("User");
  }
  return toUserProfileDto(user);
}

export async function updateUserProfile(
  userId: string,
  data: { name: string },
): Promise<UserProfileDto> {
  const user = await db.user.update({
    where: { id: userId },
    data: { name: data.name.trim() },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  return toUserProfileDto(user);
}
