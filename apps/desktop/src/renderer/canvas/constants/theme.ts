export const palette = {
  type: {
    bit: "#55d48a",
    float: "#f2b94b",
    s32: "#61a9ff",
    u32: "#51d4ef",
    s64: "#9f7dff",
    u64: "#e178ff",
    port: "#9aa6ac",
    default: "#c2d0d6",
  },
  direction: {
    in: "rgba(122, 180, 255, 0.95)",
    out: "rgba(242, 185, 75, 0.95)",
    io: "rgba(216, 122, 255, 0.95)",
    default: "rgba(255, 255, 255, 0.7)",
  },
  label: {
    local: "rgba(122, 230, 208, 0.14)",
    global: "rgba(233, 107, 255, 0.14)",
    default: "rgba(255, 255, 255, 0.06)",
  },
  pill: {
    in: "rgba(122, 180, 255, 0.12)",
    out: "rgba(242, 185, 75, 0.12)",
    io: "rgba(216, 122, 255, 0.12)",
  },
} as const;
