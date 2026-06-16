import Image from "next/image";

function spriteUrl(pokeApiId: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeApiId}.png`;
}

type SpriteVariant = "card" | "feature";

const VARIANT_STYLES: Record<
  SpriteVariant,
  { container: string; image: string; intrinsic: number }
> = {
  card: {
    container: "flex size-28 shrink-0 items-center justify-center sm:size-32",
    image:
      "size-24 drop-shadow-sm transition-transform duration-200 motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:scale-110 sm:size-28",
    intrinsic: 192,
  },
  feature: {
    container:
      "flex size-44 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-amber-100/80 to-transparent sm:size-52",
    image: "size-36 drop-shadow-md sm:size-44",
    intrinsic: 208,
  },
};

export function PokemonSprite({
  pokeApiId,
  name,
  variant,
}: {
  pokeApiId: number;
  name: string;
  variant: SpriteVariant;
}) {
  const style = VARIANT_STYLES[variant];

  return (
    <div className={style.container}>
      <Image
        src={spriteUrl(pokeApiId)}
        alt={name}
        width={style.intrinsic}
        height={style.intrinsic}
        className={style.image}
      />
    </div>
  );
}
