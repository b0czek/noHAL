import { palette } from "./constants/theme";

export function typeFill(type: string): string {
  return (
    palette.type[type as keyof typeof palette.type] ?? palette.type.default
  );
}

export function dirStroke(direction: string): string {
  return (
    palette.direction[direction as keyof typeof palette.direction] ??
    palette.direction.default
  );
}

export function labelFill(scope: string): string {
  return (
    palette.label[scope as keyof typeof palette.label] ?? palette.label.default
  );
}

export function directionPillFill(direction: string): string {
  return (
    palette.pill[direction as keyof typeof palette.pill] ?? palette.pill.io
  );
}
