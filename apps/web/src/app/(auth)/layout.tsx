import { Pokeball } from "@/components/pokeball";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-gradient-to-br from-rose-100 via-orange-50 to-amber-100 p-4">
      <div className="flex items-center gap-3">
        <Pokeball className="size-11" />
        <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
          My Pokémons
        </span>
      </div>
      {children}
    </div>
  );
}
