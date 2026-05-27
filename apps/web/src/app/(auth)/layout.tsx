import { Pokeball } from "@/components/pokeball";
import { PokeballBackground } from "@/components/pokeball-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden bg-gradient-to-br from-rose-100 via-orange-50 to-amber-100 p-4">
      <PokeballBackground />
      <div className="relative z-10 flex items-center gap-3">
        <Pokeball className="size-11" />
        <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
          My Pokémon
        </span>
      </div>
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}
