export const FEED_COOLDOWN_SECONDS = parseInt(
  process.env.FEED_COOLDOWN_SECONDS ?? "1800",
  10,
);

export const PLAY_COOLDOWN_SECONDS = parseInt(
  process.env.PLAY_COOLDOWN_SECONDS ?? "1200",
  10,
);
