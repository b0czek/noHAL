export function typeFill(type: string): string {
  switch (type) {
    case "bit":
      return "#55d48a";
    case "float":
      return "#f2b94b";
    case "s32":
      return "#61a9ff";
    case "u32":
      return "#51d4ef";
    case "s64":
      return "#9f7dff";
    case "u64":
      return "#e178ff";
    case "port":
      return "#9aa6ac";
    default:
      return "#c2d0d6";
  }
}

export function dirStroke(direction: string): string {
  switch (direction) {
    case "in":
      return "rgba(122, 180, 255, 0.95)";
    case "out":
      return "rgba(242, 185, 75, 0.95)";
    case "io":
      return "rgba(216, 122, 255, 0.95)";
    default:
      return "rgba(255, 255, 255, 0.7)";
  }
}

export function labelFill(scope: string): string {
  switch (scope) {
    case "local":
      return "rgba(122, 230, 208, 0.14)";
    case "hierarchical":
      return "rgba(242, 185, 75, 0.14)";
    case "global":
      return "rgba(233, 107, 255, 0.14)";
    default:
      return "rgba(255, 255, 255, 0.06)";
  }
}

export function directionPillFill(direction: string): string {
  if (direction === "in") return "rgba(122, 180, 255, 0.12)";
  if (direction === "out") return "rgba(242, 185, 75, 0.12)";
  return "rgba(216, 122, 255, 0.12)";
}
