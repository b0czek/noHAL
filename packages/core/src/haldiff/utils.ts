import { sortBy } from "remeda";
import type { HalImportDraft } from "../types";
import type { HalGraphComponent } from "./internal";
import type { HalDiffConnectionSummary } from "./types";

export function attachmentKey(componentId: string, pinName: string): string {
  return `${componentId}\u0000${pinName}`;
}

export function valuesKey(values: string[]): string {
  return values.join("\u0001");
}

export function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export function compressComparableColorSignatures(
  leftSignaturesById: Map<string, string>,
  rightSignaturesById: Map<string, string>,
  prefix: string,
): { left: Map<string, string>; right: Map<string, string> } {
  const palette = new Map<string, string>();
  const allSignatures = uniqueSorted([
    ...leftSignaturesById.values(),
    ...rightSignaturesById.values(),
  ]);

  for (const signature of allSignatures) {
    palette.set(signature, `${prefix}${palette.size + 1}`);
  }

  const mapColors = (
    signaturesById: Map<string, string>,
  ): Map<string, string> => {
    const colorById = new Map<string, string>();
    for (const [id, signature] of signaturesById) {
      const color = palette.get(signature);
      if (!color) continue;
      colorById.set(id, color);
    }
    return colorById;
  };

  return {
    left: mapColors(leftSignaturesById),
    right: mapColors(rightSignaturesById),
  };
}

export function mapStateKey(valuesById: Map<string, string>): string {
  return valuesKey(
    sortBy(
      [...valuesById.entries()],
      ([id]) => id,
      ([, value]) => value,
    ).map(([, value]) => value),
  );
}

export function partitionStateKey(valuesById: Map<string, string>): string {
  const idsByValue = new Map<string, string[]>();
  for (const [id, value] of valuesById) {
    const existing = idsByValue.get(value);
    if (existing) existing.push(id);
    else idsByValue.set(value, [id]);
  }

  return valuesKey(
    sortBy(
      [...idsByValue.values()].map((ids) =>
        sortBy(ids, (id) => id).join("\u0002"),
      ),
      (groupKey) => groupKey,
    ),
  );
}

export function intersectStringLists(lists: string[][]): string[] {
  const [first, ...rest] = lists;
  if (!first) return [];
  const restSets = rest.map((list) => new Set(list));
  return first.filter((candidate) =>
    restSets.every((set) => set.has(candidate)),
  );
}

export function sortConnections(
  connections: HalDiffConnectionSummary[],
): HalDiffConnectionSummary[] {
  return sortBy(
    connections,
    (connection) => connection.componentType ?? "",
    (connection) => connection.componentInstanceName,
    (connection) => connection.pinName,
  );
}

export function buildComponentTypeByInstance(
  draft: HalImportDraft,
): Map<string, string | undefined> {
  const componentTypeByInstance = new Map<string, string | undefined>();
  for (const group of draft.componentGroups) {
    for (const instance of group.instances) {
      componentTypeByInstance.set(
        instance.instanceName,
        group.inferredHalComponentName,
      );
    }
  }
  return componentTypeByInstance;
}

export function collectCountMap(values: Iterable<string>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

export function compareCountMaps(
  kind: string,
  beforeCounts: Map<string, number>,
  afterCounts: Map<string, number>,
): string[] {
  const keys = uniqueSorted([...beforeCounts.keys(), ...afterCounts.keys()]);
  const differences: string[] = [];
  for (const key of keys) {
    const beforeCount = beforeCounts.get(key) ?? 0;
    const afterCount = afterCounts.get(key) ?? 0;
    if (beforeCount === afterCount) continue;
    differences.push(
      `${kind} signature count differs: before=${beforeCount}, after=${afterCount}, signature=${key}`,
    );
  }
  return differences;
}

export function componentPinNames(
  component: HalGraphComponent | undefined,
): string[] {
  if (!component) return [];
  return uniqueSorted(
    component.attachments.map((attachment) => attachment.pinName),
  );
}

export function sharedPinCount(
  beforeComponent: HalGraphComponent | undefined,
  afterComponent: HalGraphComponent | undefined,
): number {
  const beforePins = new Set(componentPinNames(beforeComponent));
  const afterPins = componentPinNames(afterComponent);
  return afterPins.filter((pinName) => beforePins.has(pinName)).length;
}

export function normalizeInstanceNameForHeuristic(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function nameSimilarityScore(beforeId: string, afterId: string): number {
  const beforeNormalized = normalizeInstanceNameForHeuristic(beforeId);
  const afterNormalized = normalizeInstanceNameForHeuristic(afterId);

  if (!beforeNormalized || !afterNormalized) return 0;
  if (beforeNormalized === afterNormalized) return 2;
  if (
    beforeNormalized.endsWith(afterNormalized) ||
    afterNormalized.endsWith(beforeNormalized)
  ) {
    return 1;
  }
  return 0;
}
