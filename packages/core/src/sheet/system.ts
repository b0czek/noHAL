import { isSystemComponent } from "../componentSystem";
import { getSheet } from "../graph";
import { createId, slugify } from "../id";
import type {
  ComponentDefinition,
  NoHALProject,
  SheetDefinition,
  SheetNode,
} from "../types";
import { moveSelectionIntoSubsheet } from "./subsheetMove";
import {
  createDefaultSheetThreadOutputs,
  firstSheetThreadOutputId,
  getSheetThreadOutputs,
} from "./threads";

export const SYSTEM_SHEET_NAME = "System";

const SYSTEM_SUBSHEET_INSTANCE_BASE = "system";
const KNOWN_SYSTEM_HAL_COMPONENT_NAMES = new Set([
  "motion",
  "axis",
  "halui",
  "joint",
  "spindle",
  "ini",
  "iocontrol",
]);

function createSystemSheet(parentSheetId: string): SheetDefinition {
  return {
    id: createId("sheet"),
    name: SYSTEM_SHEET_NAME,
    parentSheetId,
    nodes: [],
    ports: [],
    labels: [],
    comments: [],
    directConnections: [],
    labelAnchors: [],
    hal: {
      threadOutputs: createDefaultSheetThreadOutputs(),
    },
  };
}

function nextUniqueName(base: string, used: ReadonlySet<string>): string {
  if (!used.has(base)) return base;
  let index = 2;
  while (used.has(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}

function defaultNodePosition(sheet: SheetDefinition): { x: number; y: number } {
  const index = sheet.nodes.length;
  return {
    x: 120 + (index % 4) * 280,
    y: 100 + Math.floor(index / 4) * 180,
  };
}

function ensureSystemInstanceName(rootSheet: SheetDefinition): string {
  const used = new Set(rootSheet.nodes.map((node) => node.instanceName));
  return nextUniqueName(
    slugify(SYSTEM_SUBSHEET_INSTANCE_BASE).replace(/-/g, "_") || "system",
    used,
  );
}

function isSystemSheetCandidate(component: ComponentDefinition | undefined) {
  if (!component) return false;
  if (isSystemComponent(component)) return true;
  return KNOWN_SYSTEM_HAL_COMPONENT_NAMES.has(component.halComponentName);
}

export function findSystemSheet(project: NoHALProject): SheetDefinition | null {
  const rootSheet = project.sheets[project.rootSheetId];
  if (!rootSheet) return null;

  for (const node of rootSheet.nodes) {
    if (node.kind !== "sheet") continue;
    const childSheet = project.sheets[node.sheetId];
    if (childSheet?.name === SYSTEM_SHEET_NAME) return childSheet;
  }

  for (const sheet of Object.values(project.sheets)) {
    if (sheet.parentSheetId !== rootSheet.id) continue;
    if (sheet.name === SYSTEM_SHEET_NAME) return sheet;
  }

  return null;
}

export function findSystemSheetNode(project: NoHALProject): SheetNode | null {
  const rootSheet = project.sheets[project.rootSheetId];
  const systemSheet = findSystemSheet(project);
  if (!rootSheet || !systemSheet) return null;
  for (const node of rootSheet.nodes) {
    if (node.kind !== "sheet") continue;
    if (node.sheetId === systemSheet.id) return node;
  }
  return null;
}

export function ensureSystemSheet(
  project: NoHALProject,
  preferredPosition?: { x: number; y: number },
): {
  rootSheet: SheetDefinition;
  systemSheet: SheetDefinition;
  systemSheetNode: SheetNode;
} {
  const rootSheet = getSheet(project, project.rootSheetId);

  let systemSheet = findSystemSheet(project);
  if (!systemSheet) {
    systemSheet = createSystemSheet(rootSheet.id);
    project.sheets[systemSheet.id] = systemSheet;
  } else if (systemSheet.parentSheetId !== rootSheet.id) {
    systemSheet.parentSheetId = rootSheet.id;
  }

  if (!systemSheet.hal) systemSheet.hal = {};
  systemSheet.hal.threadOutputs = [...getSheetThreadOutputs(systemSheet)];

  let systemSheetNode = findSystemSheetNode(project);
  if (!systemSheetNode) {
    systemSheetNode = {
      id: createId("node"),
      kind: "sheet",
      sheetId: systemSheet.id,
      instanceName: ensureSystemInstanceName(rootSheet),
      position: preferredPosition ?? defaultNodePosition(rootSheet),
    };
    rootSheet.nodes.push(systemSheetNode);
  } else if (preferredPosition && systemSheetNode.instanceName === "system") {
    systemSheetNode.position = { ...preferredPosition };
  }

  const defaultRootOutputId = firstSheetThreadOutputId(rootSheet);
  const threadMap = { ...(systemSheetNode.hal?.threadMap ?? {}) };
  for (const childOutput of getSheetThreadOutputs(systemSheet)) {
    if (!threadMap[childOutput.id])
      threadMap[childOutput.id] = defaultRootOutputId;
  }
  systemSheetNode.hal = { ...(systemSheetNode.hal ?? {}), threadMap };

  return { rootSheet, systemSheet, systemSheetNode };
}

export function moveRootSystemComponentsToSystemSheet(
  project: NoHALProject,
): void {
  const rootSheet = project.sheets[project.rootSheetId];
  if (!rootSheet) return;

  const movedNodes = rootSheet.nodes.filter(
    (node) =>
      node.kind === "component" &&
      isSystemSheetCandidate(project.library.components[node.componentId]),
  );
  const movedNodeIds = new Set(movedNodes.map((node) => node.id));
  const preferredPosition =
    movedNodes.length > 0
      ? {
          x: Math.min(...movedNodes.map((node) => node.position.x)),
          y: Math.min(...movedNodes.map((node) => node.position.y)),
        }
      : undefined;
  const { systemSheet, systemSheetNode } = ensureSystemSheet(
    project,
    preferredPosition,
  );

  if (movedNodes.length === 0) return;

  const rootLabelAnchorsByLabelId = new Map<
    string,
    typeof rootSheet.labelAnchors
  >();
  for (const anchor of rootSheet.labelAnchors) {
    const list = rootLabelAnchorsByLabelId.get(anchor.labelId);
    if (list) list.push(anchor);
    else rootLabelAnchorsByLabelId.set(anchor.labelId, [anchor]);
  }

  const movedLabelIds = new Set(
    rootSheet.labels
      .filter((label) => {
        const anchors = rootLabelAnchorsByLabelId.get(label.id) ?? [];
        return (
          anchors.length > 0 &&
          anchors.every(
            (anchor) =>
              anchor.endpoint.kind === "node-pin" &&
              movedNodeIds.has(anchor.endpoint.nodeId),
          )
        );
      })
      .map((label) => label.id),
  );
  moveSelectionIntoSubsheet(project, {
    parentSheetId: rootSheet.id,
    childSheetId: systemSheet.id,
    subsheetNode: systemSheetNode,
    movedNodeIds: movedNodes.map((node) => node.id),
    movedLabelIds: [...movedLabelIds],
  });
}
