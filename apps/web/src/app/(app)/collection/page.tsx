import { auth } from "@/lib/auth";
import { getUserCollectionDto } from "@/services/user-pokemon";
import { CollectionGrid } from "./_components/collection-grid";

export default async function CollectionPage() {
  const session = await auth();
  if (!session) {
    return null;
  }

  const initial = await getUserCollectionDto(session.user.id);

  return <CollectionGrid initial={initial} />;
}
