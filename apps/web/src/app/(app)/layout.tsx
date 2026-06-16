import Link from "next/link";
import { CoinBadge } from "@/components/coin-badge";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Pokeball } from "@/components/pokeball";
import { PokeballBackground } from "@/components/pokeball-background";
import { getDailyGiftStatusDto } from "@/services/user";
import { NavLinks } from "./_components/nav-links";
import { DailyGiftButton } from "./_daily-gift/button";
import { UserMenu } from "./_user-menu/menu";

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
              <CoinBadge value={user?.coins ?? 0} label="Coin balance" />
              {dailyGiftStatus && <DailyGiftButton status={dailyGiftStatus} />}
              {user && (
                <UserMenu user={{ name: user.name, email: user.email }} />
              )}
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
