export const durationToMs = (value: string, fallbackMs: number) => {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) {
    return fallbackMs;
  }

  const amount = Number(match[1]);
  switch (match[2]) {
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    default:
      return fallbackMs;
  }
};
