import Link from "next/link";
import { Coins } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logoutAction } from "@/app/actions";
import { Pokeball } from "@/components/pokeball";
import { PokeballBackground } from "@/components/pokeball-background";
import { Button } from "@/components/ui/button";
import { getDailyGiftStatusDto } from "@/services/user";
import { NavLinks } from "./_components/nav-links";
import { DailyGiftButton } from "./_daily-gift/button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const [user, dailyGiftStatus] = session
    ? await Promise.all([
        db.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, email: true, coins: true },
        }),
        getDailyGiftStatusDto(session.user.id),
      ])
    : [null, null];

  return (
    <div className="relative min-h-svh overflow-hidden bg-gradient-to-br from-rose-100 via-orange-50 to-amber-100">
      <PokeballBackground />
      <header className="relative z-10 border-b border-stone-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between gap-3 py-3 sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-6">
              <Link href="/" className="flex shrink-0 items-center gap-2">
                <Pokeball className="size-8" />
                <span className="hidden font-heading text-xl leading-none font-semibold text-stone-700 sm:inline">
                  My Pokémon
                </span>
              </Link>
              <NavLinks className="hidden sm:flex" />
            </div>
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              {user && (
                <span className="hidden min-w-0 max-w-[10rem] truncate text-sm text-stone-600 sm:inline">
                  {user.name ?? user.email}
                </span>
              )}
              <span
                aria-label={`Coin balance: ${user?.coins ?? 0}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-base font-bold leading-none tabular-nums text-amber-800 ring-2 ring-amber-300 ring-inset"
              >
                <Coins className="size-4" aria-hidden />
                <span className="relative top-px">{user?.coins ?? 0}</span>
              </span>
              {dailyGiftStatus && <DailyGiftButton status={dailyGiftStatus} />}
              <form action={logoutAction} className="shrink-0">
                <Button type="submit" variant="outline" size="sm">
                  Logout
                </Button>
              </form>
            </div>
          </div>
          <div className="border-t border-stone-200/70 py-2 sm:hidden">
            <NavLinks />
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
