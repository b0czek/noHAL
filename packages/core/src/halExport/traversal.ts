import { resolveComponentPinsForInstance } from "../component/instance";
import { isSystemComponent, resolveNodeExportStage } from "../component/system";
import { getNodePins, getSheet, invertDirection } from "../graph";
import { isValidHalName } from "../halNames";
import type { NoHALProject, SheetDefinition } from "../types";
import type { ExportContext } from "./context";
import {
  addHint,
  endpointId,
  pushFatal,
  pushGlobalLabelMember,
  registerEndpoint,
} from "./context";
import {
  chooseBoundarySignalName,
  joinInstancePath,
  resolveExportedInstancePath,
} from "./naming";

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
    const component =
      node.kind === "component"
        ? project.library.components[node.componentId]
        : undefined;
    const exportStage = resolveNodeExportStage(
      component,
      node.kind === "component" ? node.exportStage : undefined,
    );
    const pins = getNodePins(project, node);
    const instancePath =
      node.kind === "component"
        ? resolveExportedInstancePath(pathParts, node.instanceName, component)
        : undefined;
    if (instancePath) {
      if (ctx.exportedInstancePaths.has(instancePath)) {
        pushFatal(
          ctx,
          `Duplicate exported instance path '${instancePath}' detected; component instances must be unique across the project export namespace`,
        );
      } else {
        ctx.exportedInstancePaths.add(instancePath);
      }
    }
    for (const pin of pins) {
      const localKey = `node:${node.id}:${pin.key}`;
      const id = endpointId(ctx, "ep");
      if (node.kind === "component") {
        registerEndpoint(ctx, {
          id,
          kind: "component-pin",
          type: pin.type,
          direction: pin.direction,
          halPinPath: `${instancePath}.${pin.name}`,
          exportStage,
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
  ctx: ExportContext,
  map: Map<string, string>,
  sheetName: string,
  ref:
    | { kind: "node-pin"; nodeId: string; pinKey: string }
    | { kind: "sheet-port"; portId: string },
): string | null {
  const key =
    ref.kind === "node-pin"
      ? `node:${ref.nodeId}:${ref.pinKey}`
      : `port:${ref.portId}`;
  const value = map.get(key);
  if (!value) {
    pushFatal(ctx, `Sheet '${sheetName}' references missing endpoint '${key}'`);
    return null;
  }
  return value;
}

function validateSheetNodeInstanceNames(
  ctx: ExportContext,
  sheet: SheetDefinition,
): void {
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
      continue;
    }
    nodeInstanceNames.add(node.instanceName);
  }

  for (const name of duplicateNodeInstanceNames) {
    pushFatal(
      ctx,
      `Duplicate instance name '${name}' in sheet '${sheet.name}' can produce ambiguous HAL paths`,
    );
  }
}

function collectComponentInstances(
  ctx: ExportContext,
  project: NoHALProject,
  sheet: SheetDefinition,
  pathParts: string[],
): void {
  for (const node of sheet.nodes) {
    if (node.kind !== "component") continue;
    const component = project.library.components[node.componentId];
    if (!component) {
      ctx.warnings.push(
        `Missing component definition '${node.componentId}' for node '${node.instanceName}'`,
      );
      continue;
    }
    if (!isSystemComponent(component)) {
      ctx.componentInstances.push({
        componentName: component.halComponentName,
        componentId: node.componentId,
        instancePath: resolveExportedInstancePath(
          pathParts,
          node.instanceName,
          component,
        ),
        ...(node.instanceConfigValues
          ? { instanceConfigValues: { ...node.instanceConfigValues } }
          : {}),
        parentSheetPath: joinInstancePath(pathParts),
        runtimeKind: component.runtime?.kind ?? "unknown",
        exportStage: resolveNodeExportStage(component, node.exportStage),
      });
    }
    for (const pin of resolveComponentPinsForInstance(
      component,
      node.instanceConfigValues,
    )) {
      if (pin.arrayLen === undefined && !pin.name.includes("#")) continue;
      ctx.warnings.push(
        `Array pin export is not expanded yet (${component.halComponentName}.${pin.name}) on ${node.instanceName}`,
      );
    }
  }
}

function connectSheetDirectConnections(
  ctx: ExportContext,
  localIds: Map<string, string>,
  sheet: SheetDefinition,
): void {
  for (const conn of sheet.directConnections) {
    const a = localEndpointRefToId(ctx, localIds, sheet.name, conn.a);
    const b = localEndpointRefToId(ctx, localIds, sheet.name, conn.b);
    if (!a || !b) continue;
    ctx.union.union(a, b);
    const explicitSignalName = conn.signalName?.trim();
    if (!explicitSignalName) continue;
    addHint(ctx, a, { kind: "connection", name: explicitSignalName });
    addHint(ctx, b, { kind: "connection", name: explicitSignalName });
  }
}

function connectSheetLabels(args: {
  ctx: ExportContext;
  localIds: Map<string, string>;
  sheet: SheetDefinition;
  pathParts: string[];
}): void {
  const { ctx, localIds, sheet, pathParts } = args;
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
    const endpoint = localEndpointRefToId(
      ctx,
      localIds,
      sheet.name,
      anchor.endpoint,
    );
    if (!endpoint) continue;

    if (label.scope === "global") {
      addHint(ctx, endpoint, { kind: "global", name: label.name });
      pushGlobalLabelMember(ctx, label.name, endpoint);
      continue;
    }

    addHint(ctx, endpoint, {
      kind: "local",
      name: chooseBoundarySignalName(pathParts, label.name),
    });
    const list = localBuckets.get(label.name);
    if (list) list.push(endpoint);
    else localBuckets.set(label.name, [endpoint]);
  }

  for (const endpoints of localBuckets.values()) {
    for (let i = 1; i < endpoints.length; i += 1) {
      ctx.union.union(endpoints[0], endpoints[i]);
    }
  }
}

function connectChildSheetBoundaries(args: {
  ctx: ExportContext;
  project: NoHALProject;
  sheet: SheetDefinition;
  localIds: Map<string, string>;
  pathParts: string[];
  nextStack: string[];
}): void {
  const { ctx, project, sheet, localIds, pathParts, nextStack } = args;
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
}

function buildBoundaryPortEndpointIds(
  localIds: Map<string, string>,
  sheet: SheetDefinition,
): Record<string, string> {
  const boundaryPortEndpointIds: Record<string, string> = {};
  for (const port of sheet.ports) {
    const id = localIds.get(`port:${port.id}`);
    if (id) boundaryPortEndpointIds[port.id] = id;
  }
  return boundaryPortEndpointIds;
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
  validateSheetNodeInstanceNames(ctx, sheet);
  collectComponentInstances(ctx, project, sheet, pathParts);
  connectSheetDirectConnections(ctx, localIds, sheet);
  connectSheetLabels({ ctx, localIds, sheet, pathParts });
  connectChildSheetBoundaries({
    ctx,
    project,
    sheet,
    localIds,
    pathParts,
    nextStack,
  });
  return {
    boundaryPortEndpointIds: buildBoundaryPortEndpointIds(localIds, sheet),
  };
}
