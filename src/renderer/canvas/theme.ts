import {
  DIRECTION_PILL_FILL_IN,
  DIRECTION_PILL_FILL_IO,
  DIRECTION_PILL_FILL_OUT,
  DIR_STROKE_DEFAULT,
  DIR_STROKE_IN,
  DIR_STROKE_IO,
  DIR_STROKE_OUT,
  LABEL_FILL_DEFAULT,
  LABEL_FILL_GLOBAL,
  LABEL_FILL_HIERARCHICAL,
  LABEL_FILL_LOCAL,
  TYPE_FILL_BIT,
  TYPE_FILL_DEFAULT,
  TYPE_FILL_FLOAT,
  TYPE_FILL_PORT,
  TYPE_FILL_S32,
  TYPE_FILL_S64,
  TYPE_FILL_U32,
  TYPE_FILL_U64,
} from "./constants";

export function typeFill(type: string): string {
  switch (type) {
    case "bit":
      return TYPE_FILL_BIT;
    case "float":
      return TYPE_FILL_FLOAT;
    case "s32":
      return TYPE_FILL_S32;
    case "u32":
      return TYPE_FILL_U32;
    case "s64":
      return TYPE_FILL_S64;
    case "u64":
      return TYPE_FILL_U64;
    case "port":
      return TYPE_FILL_PORT;
    default:
      return TYPE_FILL_DEFAULT;
  }
}

export function dirStroke(direction: string): string {
  switch (direction) {
    case "in":
      return DIR_STROKE_IN;
    case "out":
      return DIR_STROKE_OUT;
    case "io":
      return DIR_STROKE_IO;
    default:
      return DIR_STROKE_DEFAULT;
  }
}

export function labelFill(scope: string): string {
  switch (scope) {
    case "local":
      return LABEL_FILL_LOCAL;
    case "hierarchical":
      return LABEL_FILL_HIERARCHICAL;
    case "global":
      return LABEL_FILL_GLOBAL;
    default:
      return LABEL_FILL_DEFAULT;
  }
}

export function directionPillFill(direction: string): string {
  if (direction === "in") return DIRECTION_PILL_FILL_IN;
  if (direction === "out") return DIRECTION_PILL_FILL_OUT;
  return DIRECTION_PILL_FILL_IO;
}
