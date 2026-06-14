import { auth } from "@/lib/auth";
import { getUserProfileDto } from "@/services/user";
import { UserAvatar } from "@/components/user-avatar";
import { ProfileForm } from "./profile-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) {
    return null;
  }

  const profile = await getUserProfileDto(session.user.id);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold text-amber-800 sm:text-3xl">
          Settings
        </h1>
        <p className="text-sm text-stone-500">Manage your account.</p>
      </div>

      <div className="rounded-xl border border-stone-200/70 bg-white/70 p-5 backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <UserAvatar
            name={profile.name}
            email={profile.email}
            className="size-12 border-[3px] text-base"
          />
          <div className="min-w-0">
            {profile.name && (
              <p className="truncate font-medium text-stone-700">
                {profile.name}
              </p>
            )}
            <p className="truncate text-sm text-stone-500">{profile.email}</p>
          </div>
        </div>

        <ProfileForm initialName={profile.name ?? ""} />
      </div>
    </div>
  );
}
