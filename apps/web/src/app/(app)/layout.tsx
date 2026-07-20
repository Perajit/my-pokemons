import Link from "next/link";
import { auth } from "@/lib/auth";
import { Pokeball } from "@/components/pokeball";
import { PokeballBackground } from "@/components/pokeball-background";
import { getMeDto } from "@/services/me";
import { AppProviders } from "./_components/app-providers";
import { NavLinks } from "./_components/nav-links";
import { AppHeader } from "./_components/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const me = session ? await getMeDto(session.user.id) : null;

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
            {me && <AppHeader initial={me} />}
          </div>
          <div className="border-t border-stone-200/70 py-2 sm:hidden">
            <NavLinks />
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <AppProviders>{children}</AppProviders>
      </main>
    </div>
  );
}
