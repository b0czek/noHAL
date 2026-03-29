export const wire = {
  path: {
    endpointStubLength: 14,
    bezierPull: 0.4,
    tension: 0.25,
  },
  line: {
    stroke: {
      selected: "rgba(140, 244, 224, 0.92)",
      default: "rgba(122, 230, 208, 0.75)",
      pending: "rgba(122, 230, 208, 0.55)",
    },
    width: {
      selected: 2.75,
      default: 2.25,
      pending: 2,
      hit: 14,
    },
  },
  pending: {
    // biome-ignore lint/style/noMagicNumbers: Dash patterns are clearer inline than as single-use aliases.
    dash: [8, 6] as number[],
  },
  waypoint: {
    radius: 6,
    selectedRadius: 7,
    fill: "rgba(8, 18, 22, 0.95)",
    selectedFill: "rgba(140, 244, 224, 0.22)",
    stroke: "rgba(140, 244, 224, 0.95)",
    strokeWidth: 2,
    hitStrokeWidth: 14,
  },
  labelAnchor: {
    stroke: "rgba(242, 185, 75, 0.72)",
    strokeWidth: 1.7,
    // biome-ignore lint/style/noMagicNumbers: Dash patterns are clearer inline than as single-use aliases.
    dash: [7, 5] as number[],
  },
} as const;
