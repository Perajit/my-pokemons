import { PokeballWatermark } from "./pokeball-watermark";

export function PokeballBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <PokeballWatermark className="absolute -top-20 -right-20 size-72 rotate-[25deg] opacity-[0.07] sm:size-80" />
      <PokeballWatermark className="absolute -bottom-24 -left-24 size-80 -rotate-[25deg] opacity-[0.07] sm:size-96" />
    </div>
  );
}
