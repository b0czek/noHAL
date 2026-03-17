import { getVisibleNodePins } from "@nohal/core/src/graph";
import type { NoHALProject, SheetDefinition } from "@nohal/core/src/types";
import type { EndpointSide, SheetLookup } from "./types";

const sheetLookupCache = new WeakMap<SheetDefinition, SheetLookup>();

export function getSheetLookup(
  project: NoHALProject,
  sheet: SheetDefinition,
): SheetLookup {
  const cached = sheetLookupCache.get(sheet);
  if (cached) return cached;

  const lookup: SheetLookup = {
    nodesById: new Map(),
    portsById: new Map(),
    labelsById: new Map(),
    nodePinSidesById: new Map(),
  };

  for (const node of sheet.nodes) {
    lookup.nodesById.set(node.id, node);
    const pinSides = new Map<string, EndpointSide>();
    for (const pin of getVisibleNodePins(project, sheet, node)) {
      pinSides.set(pin.key, pin.side);
    }
    lookup.nodePinSidesById.set(node.id, pinSides);
  }
  for (const port of sheet.ports) lookup.portsById.set(port.id, port);
  for (const label of sheet.labels) lookup.labelsById.set(label.id, label);

  sheetLookupCache.set(sheet, lookup);
  return lookup;
}
