import { createId } from "./id";
import type { SheetDefinition, SheetThreadOutputDefinition } from "./types";

export function createDefaultSheetThreadOutputs(): SheetThreadOutputDefinition[] {
  return [{ id: createId("sheetthread"), name: "main" }];
}

export function getSheetThreadOutputs(
  sheet: SheetDefinition,
): SheetThreadOutputDefinition[] {
  const outputs = sheet.hal?.threadOutputs;
  if (outputs && outputs.length > 0) return outputs;
  return createDefaultSheetThreadOutputs();
}

export function firstSheetThreadOutputId(sheet: SheetDefinition): string {
  return getSheetThreadOutputs(sheet)[0]?.id ?? "default";
}

export function normalizeSheetThreadOutputs(
  value: unknown,
): SheetThreadOutputDefinition[] {
  const raw = Array.isArray(value) ? value : [];
  const out: SheetThreadOutputDefinition[] = [];
  const usedNames = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<SheetThreadOutputDefinition>;
    const name = (candidate.name ?? "").trim();
    if (!name || usedNames.has(name)) continue;
    out.push({
      id:
        typeof candidate.id === "string" && candidate.id.trim()
          ? candidate.id
          : createId("sheetthread"),
      name,
      ...(typeof candidate.halThreadId === "string" &&
      candidate.halThreadId.trim()
        ? { halThreadId: candidate.halThreadId.trim() }
        : {}),
    });
    usedNames.add(name);
  }
  if (out.length > 0) return out;
  return createDefaultSheetThreadOutputs();
}
