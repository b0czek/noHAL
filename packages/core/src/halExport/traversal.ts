import { getNodePins, getSheet, invertDirection } from "../graph";
import { isValidHalName } from "../halNames";
import type { NoHALProject, SheetDefinition } from "../types";
import {
  addHint,
  endpointId,
  pushFatal,
  pushGlobalLabelMember,
  registerEndpoint,
} from "./context";
import type { ExportContext } from "./context";
import { chooseBoundarySignalName, joinInstancePath } from "./naming";

export interface TraversalResult {
  boundaryPortEndpointIds: Record<string, string>;
}

function createLocalEndpointIdMap(
  ctx: ExportContext,
  project: NoHALProject,
  sheet: SheetDefinition,
  pathParts: string[],
): Map<string, string> {
  const map = new Map<string, string>();

  for (const port of sheet.ports) {
    const id = endpointId(ctx, "boundary");
    registerEndpoint(ctx, {
      id,
      kind: "sheet-boundary",
      type: port.type,
      direction: invertDirection(port.direction),
      boundarySignalPath: chooseBoundarySignalName(pathParts, port.name),
    });
    addHint(ctx, id, {
      kind: "boundary",
      name: chooseBoundarySignalName(pathParts, port.name),
    });
    map.set(`port:${port.id}`, id);
  }

  for (const node of sheet.nodes) {
    const pins = getNodePins(project, node);
    for (const pin of pins) {
      const localKey = `node:${node.id}:${pin.key}`;
      const id = endpointId(ctx, "ep");
      if (node.kind === "component") {
        const instancePath = joinInstancePath([
          ...pathParts,
          node.instanceName,
        ]);
        registerEndpoint(ctx, {
          id,
          kind: "component-pin",
          type: pin.type,
          direction: pin.direction,
          halPinPath: `${instancePath}.${pin.name}`,
          exportStage: node.exportStage === "postgui" ? "postgui" : "main",
        });
      } else {
        registerEndpoint(ctx, {
          id,
          kind: "bridge",
          type: pin.type,
          direction: pin.direction,
        });
      }
      map.set(localKey, id);
    }
  }

  return map;
}

function localEndpointRefToId(
  map: Map<string, string>,
  ref:
    | { kind: "node-pin"; nodeId: string; pinKey: string }
    | { kind: "sheet-port"; portId: string },
): string {
  const key =
    ref.kind === "node-pin"
      ? `node:${ref.nodeId}:${ref.pinKey}`
      : `port:${ref.portId}`;
  const value = map.get(key);
  if (!value) throw new Error(`Missing local endpoint map entry: ${key}`);
  return value;
}

export function traverseSheetInstance(
  ctx: ExportContext,
  project: NoHALProject,
  sheetId: string,
  pathParts: string[],
  sheetStack: string[] = [],
): TraversalResult {
  if (sheetStack.includes(sheetId)) {
    ctx.warnings.push(
      `Recursive sheet hierarchy detected at '${[...pathParts].join(".") || "Top"}' (${sheetId}); skipping nested expansion`,
    );
    return { boundaryPortEndpointIds: {} };
  }

  const nextStack = [...sheetStack, sheetId];
  const sheet = getSheet(project, sheetId);
  const localIds = createLocalEndpointIdMap(ctx, project, sheet, pathParts);
  const duplicateNodeInstanceNames = new Set<string>();
  const nodeInstanceNames = new Set<string>();
  for (const node of sheet.nodes) {
    if (!isValidHalName(node.instanceName)) {
      pushFatal(
        ctx,
        `Node '${node.id}' has invalid HAL instance name '${node.instanceName}'`,
      );
    }
    if (nodeInstanceNames.has(node.instanceName)) {
      duplicateNodeInstanceNames.add(node.instanceName);
    } else {
      nodeInstanceNames.add(node.instanceName);
    }
  }
  for (const name of duplicateNodeInstanceNames) {
    pushFatal(
      ctx,
      `Duplicate instance name '${name}' in sheet '${sheet.name}' can produce ambiguous HAL paths`,
    );
  }

  for (const node of sheet.nodes) {
    if (node.kind === "component") {
      const component = project.library.components[node.componentId];
      if (component) {
        ctx.componentInstances.push({
          componentName: component.halComponentName,
          componentId: node.componentId,
          instancePath: joinInstancePath([...pathParts, node.instanceName]),
          parentSheetPath: joinInstancePath(pathParts),
          runtimeKind: component.runtime?.kind ?? "unknown",
          exportStage: node.exportStage === "postgui" ? "postgui" : "main",
        });
        for (const pin of component.pins) {
          if (pin.arrayLen !== undefined || pin.name.includes("#")) {
            ctx.warnings.push(
              `Array pin export is not expanded yet (${component.halComponentName}.${pin.name}) on ${node.instanceName}`,
            );
          }
        }
      } else {
        ctx.warnings.push(
          `Missing component definition '${node.componentId}' for node '${node.instanceName}'`,
        );
      }
    }
  }

  for (const conn of sheet.directConnections) {
    const a = localEndpointRefToId(localIds, conn.a);
    const b = localEndpointRefToId(localIds, conn.b);
    ctx.union.union(a, b);
    const explicitSignalName = conn.signalName?.trim();
    if (explicitSignalName) {
      addHint(ctx, a, { kind: "connection", name: explicitSignalName });
      addHint(ctx, b, { kind: "connection", name: explicitSignalName });
    }
  }

  const labelsById = new Map(sheet.labels.map((label) => [label.id, label]));
  const localBuckets = new Map<string, string[]>();

  for (const anchor of sheet.labelAnchors) {
    const label = labelsById.get(anchor.labelId);
    if (!label) {
      ctx.warnings.push(
        `Missing label '${anchor.labelId}' in sheet '${sheet.name}'`,
      );
      continue;
    }
    const endpoint = localEndpointRefToId(localIds, anchor.endpoint);
    const scopeKey = label.name;

    if (label.scope === "global") {
      addHint(ctx, endpoint, { kind: "global", name: label.name });
      pushGlobalLabelMember(ctx, label.name, endpoint);
      continue;
    }

    addHint(ctx, endpoint, {
      kind: "local",
      name: chooseBoundarySignalName(pathParts, label.name),
    });
    const list = localBuckets.get(scopeKey);
    if (list) list.push(endpoint);
    else localBuckets.set(scopeKey, [endpoint]);
  }

  for (const endpoints of localBuckets.values()) {
    for (let i = 1; i < endpoints.length; i += 1)
      ctx.union.union(endpoints[0], endpoints[i]);
  }

  for (const node of sheet.nodes) {
    if (node.kind !== "sheet") continue;

    const child = traverseSheetInstance(
      ctx,
      project,
      node.sheetId,
      [...pathParts, node.instanceName],
      nextStack,
    );
    const childSheet = getSheet(project, node.sheetId);
    for (const port of childSheet.ports) {
      const parentPinId = localIds.get(`node:${node.id}:${port.id}`);
      const childBoundaryId = child.boundaryPortEndpointIds[port.id];
      if (!parentPinId || !childBoundaryId) {
        ctx.warnings.push(
          `Sheet boundary bridge missing for subsheet '${node.instanceName}' port '${port.name}'`,
        );
        continue;
      }
      ctx.union.union(parentPinId, childBoundaryId);
    }
  }

  const boundaryPortEndpointIds: Record<string, string> = {};
  for (const port of sheet.ports) {
    const id = localIds.get(`port:${port.id}`);
    if (id) boundaryPortEndpointIds[port.id] = id;
  }
  return { boundaryPortEndpointIds };
}
