import path from "node:path";
import type { HalValueType } from "../../src/types/index.ts";

export const COMPONENTS_SUBMAKEFILE_PATH = "src/hal/components/Submakefile";
export const CONV_TEMPLATE_PATH = "src/hal/components/conv.comp.in";

type ConvType = Exclude<HalValueType, "port">;

export function parseConvCompTypesFromPath(
  filePath: string,
): { fromType: ConvType; toType: ConvType } | null {
  const match =
    /^conv_(bit|s32|u32|s64|u64|float)_(bit|s32|u32|s64|u64|float)\.comp$/.exec(
      path.basename(filePath),
    );
  if (!match) return null;
  return { fromType: match[1] as ConvType, toType: match[2] as ConvType };
}

export function listSyntheticConvCompFiles(
  submakefileContent: string,
): string[] {
  const files = new Set<string>();
  const pattern = /^hal\/components\/(conv_[a-z0-9]+_[a-z0-9]+\.comp):/gm;
  for (const match of submakefileContent.matchAll(pattern)) {
    files.add(`src/hal/components/${match[1]}`);
  }
  return [...files.values()].sort((a, b) => a.localeCompare(b));
}

function convUtype(type: ConvType): string {
  switch (type) {
    case "bit":
      return "bool";
    case "s32":
      return "rtapi_s32";
    case "u32":
      return "rtapi_u32";
    case "s64":
      return "rtapi_s64";
    case "u64":
      return "rtapi_u64";
    case "float":
      return "real_t";
  }
}

function convMax(type: ConvType): string {
  switch (type) {
    case "bit":
      return "1";
    case "s32":
      return "RTAPI_INT32_MAX";
    case "u32":
      return "RTAPI_UINT32_MAX";
    case "s64":
      return "RTAPI_INT64_MAX";
    case "u64":
      return "RTAPI_UINT64_MAX";
    case "float":
      return "Never_Used";
  }
}

function convMin(type: ConvType): string {
  switch (type) {
    case "bit":
      return "0";
    case "s32":
      return "RTAPI_INT32_MIN";
    case "u32":
      return "0";
    case "s64":
      return "RTAPI_INT64_MIN";
    case "u64":
      return "0";
    case "float":
      return "Never_Used";
  }
}

function convMaxCheckEnabled(fromType: ConvType, toType: ConvType): boolean {
  return (
    fromType === "float" ||
    toType === "bit" ||
    (toType === "s32" && fromType !== "bit") ||
    (fromType === "u64" && toType !== "float") ||
    (fromType === "s64" && toType === "u32")
  );
}

function convMinCheckEnabled(fromType: ConvType, toType: ConvType): boolean {
  return (
    fromType === "float" ||
    (fromType === "s64" && toType !== "float") ||
    (fromType === "s32" &&
      (toType === "u32" || toType === "u64" || toType === "bit"))
  );
}

function convClampDisabled(fromType: ConvType, toType: ConvType): boolean {
  return (
    toType === "float" ||
    fromType === "bit" ||
    (fromType === "u32" && (toType === "u64" || toType === "s64")) ||
    (fromType === "s32" && toType === "s64")
  );
}

function convFunctionFloatMode(fromType: ConvType, toType: ConvType): string {
  return fromType === "float" || toType === "float" ? "" : "nofp";
}

export function synthesizeConvCompContent(
  template: string,
  fromType: ConvType,
  toType: ConvType,
): string {
  const replacements: Record<string, string> = {
    "@IN@": fromType,
    "@OUT@": toType,
    "@CC@": convClampDisabled(fromType, toType) ? "//" : "",
    "@MIN@": convMin(toType),
    "@MAX@": convMax(toType),
    "@FP@": convFunctionFloatMode(fromType, toType),
    "@TYPI@": convUtype(fromType),
    "@TYPO@": convUtype(toType),
    "@MINEN@": convMinCheckEnabled(fromType, toType) ? "0" : "1",
    "@MAXEN@": convMaxCheckEnabled(fromType, toType) ? "0" : "1",
  };

  let content = template;
  for (const [token, value] of Object.entries(replacements)) {
    content = content.split(token).join(value);
  }
  return content;
}
