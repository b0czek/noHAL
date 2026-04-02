export const buildLayout = {
  maxColumns: 4,
  origin: {
    x: 120,
    y: 120,
  },
  gap: {
    column: 70,
    row: 70,
  },
  sideLabel: {
    gapX: 14,
    startY: 44,
    stepY: 28,
    halfHeight: 11,
  },
  bottomLabel: {
    startX: 20,
    stepX: 58,
    perRow: 4,
    gapY: 14,
    stepY: 28,
    halfHeight: 11,
  },
  fallbackLabel: {
    origin: {
      x: 90,
      y: 80,
    },
    pitch: {
      column: 280,
      row: 70,
    },
  },
} as const;

export const buildGroup = {
  gap: {
    x: 150,
    y: 130,
  },
  row: {
    widthMin: 1100,
    widthBias: 1.3,
  },
  maxNetFanout: 6,
} as const;

export const buildNode = {
  width: 240,
  header: {
    height: 28,
  },
  side: {
    rowHeight: 24,
    labelClearance: 50,
    labelGap: 16,
  },
  bottom: {
    height: 26,
    bandGap: 10,
    padding: 12,
    pin: {
      radius: 6,
      columnStep: 30,
      pillWidth: 22,
      textPadding: 10,
      dotGap: 6,
      fontSize: 11,
    },
  },
  pill: {
    horizontalPadding: 16,
    horizontalSingleExtra: 20,
    horizontalStepBasePadding: 6,
    horizontalStepGap: 8,
    bandInset: 4,
  },
} as const;

export const buildText = {
  mono: {
    charWidthAt12: 7.2,
    baseFontSize: 12,
  },
  sans: {
    charWidthAt10: 5.8,
    baseFontSize: 10,
  },
} as const;

export const buildLabel = {
  scope: {
    leftPadding: 16,
    gap: 8,
  },
  rightPadding: 10,
  pinSortFallbackIndex: 9999,
  fallback: {
    columns: 6,
    rowJitter: 4,
  },
  duplicateOffset: 12,
  io: {
    rotation: 90,
  },
} as const;
