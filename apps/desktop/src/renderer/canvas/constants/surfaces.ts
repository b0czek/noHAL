export const surface = {
  pin: {
    radius: 6,
    haloFill: "rgba(122, 230, 208, 0.18)",
    haloRadiusPadding: 4,
    stroke: "rgba(6, 12, 15, 0.95)",
    hitStrokeWidth: 10,
    setpRing: {
      stroke: "rgba(242, 185, 75, 0.78)",
      fill: "rgba(242, 185, 75, 0.12)",
      radiusPadding: 2.5,
    },
  },
  border: {
    pending: "rgba(122,230,208,0.45)",
    selected: "rgba(122, 230, 208, 0.6)",
    selectedLabel: "rgba(122,230,208,0.5)",
    neutral: "rgba(255,255,255,0.08)",
  },
  chipFill: "rgba(255,255,255,0.02)",
  portPanelFill: "rgba(8, 21, 27, 0.95)",
  node: {
    fill: "rgba(10, 20, 25, 0.96)",
  },
  systemNode: {
    fill: "rgba(11, 24, 28, 0.98)",
    border: "rgba(122, 230, 208, 0.22)",
  },
  sheetNode: {
    fill: "rgba(17, 14, 9, 0.96)",
    border: "rgba(242, 185, 75, 0.18)",
  },
  radius: {
    md: 10,
    pill: 999,
  },
  baseStrokeWidth: 1,
} as const;
