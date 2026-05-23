import { auth } from "@/lib/auth";
import { logoutAction } from "./actions";
import { Pokeball } from "@/components/pokeball";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function HomePage() {
  const session = await auth();
  const displayName = session?.user?.name ?? session?.user?.email;

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-rose-100 via-orange-50 to-amber-100 p-4">
      <Card className="w-full max-w-sm py-6 text-center shadow-xl">
        <CardHeader className="flex flex-col items-center gap-3 px-6">
          <Pokeball className="size-16" />
          <CardTitle className="text-2xl">Welcome, {displayName}!</CardTitle>
          <CardDescription>Your Pokémon are waiting for you.</CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <form action={logoutAction}>
            <Button type="submit" variant="outline">
              Logout
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
