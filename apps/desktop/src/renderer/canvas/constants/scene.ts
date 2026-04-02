export const scene = {
  width: 2200,
  height: 1400,
  placementHitFill: "rgba(0,0,0,0.001)",
  stage: {
    minWidth: 320,
    minHeight: 240,
  },
  marquee: {
    // biome-ignore lint/style/noMagicNumbers: Dash patterns are clearer inline than as single-use aliases.
    dash: [6, 4] as number[],
    fill: "rgba(120, 180, 255, 0.16)",
    stroke: "rgba(120, 180, 255, 0.92)",
    strokeWidth: 1,
    cornerRadius: 2,
  },
} as const;
