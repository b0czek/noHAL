import { createId } from "@nohal/core/id";
import {
  isProtectedSystemNode,
  isProtectedSystemSheet,
} from "@nohal/core/sheet";
import type {
  NoHALProject,
  SheetDefinition,
  SheetEndpointRef,
  XY,
} from "@nohal/core/types";
import type { EditorSelection } from "../state/store/actions/types";
import {
  cloneEndpoint,
  cloneProject,
  ensureInstanceName,
  nextComponentInstanceName,
  nextName,
  syncProjectUi,
} from "../state/store/helpers";
import {
  buildSelectionForPastedItems,
  clipboardSnapshotOrigin,
} from "./snapshot";
import type { PastedSelectionIds, SelectionClipboardSnapshot } from "./types";

const PASTE_OFFSET_PX = 40;

type CloneValue = <T>(value: T) => T;

interface PasteMaps {
  nodeIdMap: Map<string, string>;
  labelIdMap: Map<string, string>;
  portIdMap: Map<string, string>;
}

interface PasteTranslation {
  translatePoint: (point: XY) => XY;
}

export interface SelectionClipboardPasteResult {
  project: NoHALProject;
  selection: EditorSelection;
  count: number;
}

export function pasteSelectionClipboardSnapshot(args: {
  project: NoHALProject;
  activeSheetId: string;
  clipboard: SelectionClipboardSnapshot;
  targetPosition?: XY;
  pasteSequence: number;
  cloneValue: CloneValue;
}): SelectionClipboardPasteResult | null {
  const next = cloneProject(args.project);
  const sheet = next.sheets[args.activeSheetId];
  if (!sheet) return null;

  const translation = resolvePasteTranslation(
    args.clipboard,
    args.targetPosition,
    args.pasteSequence,
  );
  const maps: PasteMaps = {
    nodeIdMap: new Map<string, string>(),
    labelIdMap: new Map<string, string>(),
    portIdMap: new Map<string, string>(),
  };
  const pastedIds: PastedSelectionIds = {
    nodeIds: [],
    labelIds: [],
    commentIds: [],
    portIds: [],
  };

  pasteNodes({
    next,
    sheet,
    clipboard: args.clipboard,
    translatePoint: translation.translatePoint,
    cloneValue: args.cloneValue,
    nodeIdMap: maps.nodeIdMap,
    pastedNodeIds: pastedIds.nodeIds,
  });
  pasteLabelsCommentsAndPorts({
    sheet,
    clipboard: args.clipboard,
    translatePoint: translation.translatePoint,
    cloneValue: args.cloneValue,
    labelIdMap: maps.labelIdMap,
    portIdMap: maps.portIdMap,
    pastedIds,
  });
  pasteRelationships({
    sheet,
    clipboard: args.clipboard,
    translatePoint: translation.translatePoint,
    maps,
  });

  const selection = buildSelectionForPastedItems(pastedIds);
  if (!selection) return null;

  syncProjectUi(next, args.activeSheetId);
  return {
    project: next,
    selection,
    count:
      pastedIds.nodeIds.length +
      pastedIds.labelIds.length +
      pastedIds.commentIds.length +
      pastedIds.portIds.length,
  };
}

function resolvePasteTranslation(
  clipboard: SelectionClipboardSnapshot,
  targetPosition: XY | undefined,
  pasteSequence: number,
): PasteTranslation {
  const pasteOffset =
    targetPosition === undefined ? (pasteSequence + 1) * PASTE_OFFSET_PX : 0;
  const clipboardOrigin = clipboardSnapshotOrigin(clipboard);
  const deltaX =
    targetPosition && clipboardOrigin
      ? targetPosition.x - clipboardOrigin.x
      : pasteOffset;
  const deltaY =
    targetPosition && clipboardOrigin
      ? targetPosition.y - clipboardOrigin.y
      : pasteOffset;

  return {
    translatePoint(point: XY): XY {
      return {
        x: point.x + deltaX,
        y: point.y + deltaY,
      };
    },
  };
}

function pasteNodes(args: {
  next: NoHALProject;
  sheet: SheetDefinition;
  clipboard: SelectionClipboardSnapshot;
  translatePoint: (point: XY) => XY;
  cloneValue: CloneValue;
  nodeIdMap: Map<string, string>;
  pastedNodeIds: string[];
}): void {
  const {
    next,
    sheet,
    clipboard,
    translatePoint,
    cloneValue,
    nodeIdMap,
    pastedNodeIds,
  } = args;

  for (const node of clipboard.nodes) {
    if (node.kind === "component") {
      const component = next.library.components[node.componentId];
      if (!component || isProtectedSystemNode(next, node)) continue;
      const instanceName = nextComponentInstanceName(next, sheet, component);
      if (!instanceName) continue;
      const pastedNode = cloneValue(node);
      pastedNode.id = createId("node");
      pastedNode.instanceName = instanceName;
      pastedNode.position = translatePoint(node.position);
      sheet.nodes.push(pastedNode);
      nodeIdMap.set(node.id, pastedNode.id);
      pastedNodeIds.push(pastedNode.id);
      continue;
    }

    if (isProtectedSystemSheet(next, node.sheetId)) continue;
    const pastedNode = cloneValue(node);
    pastedNode.id = createId("node");
    pastedNode.instanceName = ensureInstanceName(sheet, node.instanceName);
    pastedNode.position = translatePoint(node.position);
    sheet.nodes.push(pastedNode);
    nodeIdMap.set(node.id, pastedNode.id);
    pastedNodeIds.push(pastedNode.id);
  }
}

function pasteLabelsCommentsAndPorts(args: {
  sheet: SheetDefinition;
  clipboard: SelectionClipboardSnapshot;
  translatePoint: (point: XY) => XY;
  cloneValue: CloneValue;
  labelIdMap: Map<string, string>;
  portIdMap: Map<string, string>;
  pastedIds: PastedSelectionIds;
}): void {
  const {
    sheet,
    clipboard,
    translatePoint,
    cloneValue,
    labelIdMap,
    portIdMap,
    pastedIds,
  } = args;
  const usedPortNames = new Set(sheet.ports.map((port) => port.name));

  for (const label of clipboard.labels) {
    const pastedLabel = cloneValue(label);
    pastedLabel.id = createId("label");
    pastedLabel.position = translatePoint(label.position);
    sheet.labels.push(pastedLabel);
    labelIdMap.set(label.id, pastedLabel.id);
    pastedIds.labelIds.push(pastedLabel.id);
  }

  for (const comment of clipboard.comments) {
    const pastedComment = cloneValue(comment);
    pastedComment.id = createId("comment");
    pastedComment.position = translatePoint(comment.position);
    sheet.comments.push(pastedComment);
    pastedIds.commentIds.push(pastedComment.id);
  }

  for (const port of clipboard.ports) {
    const pastedPort = cloneValue(port);
    pastedPort.id = createId("port");
    pastedPort.name = nextName(port.name, usedPortNames);
    usedPortNames.add(pastedPort.name);
    pastedPort.position = translatePoint(port.position);
    sheet.ports.push(pastedPort);
    portIdMap.set(port.id, pastedPort.id);
    pastedIds.portIds.push(pastedPort.id);
  }
}

function pasteRelationships(args: {
  sheet: SheetDefinition;
  clipboard: SelectionClipboardSnapshot;
  translatePoint: (point: XY) => XY;
  maps: PasteMaps;
}): void {
  const {
    sheet,
    clipboard,
    translatePoint,
    maps: { nodeIdMap, labelIdMap, portIdMap },
  } = args;

  for (const connection of clipboard.directConnections) {
    const a = remapEndpoint(connection.a, nodeIdMap, portIdMap);
    const b = remapEndpoint(connection.b, nodeIdMap, portIdMap);
    if (!a || !b) continue;
    sheet.directConnections.push({
      id: createId("conn"),
      a: cloneEndpoint(a),
      b: cloneEndpoint(b),
      signalName: connection.signalName,
      waypoints: connection.waypoints?.map(translatePoint),
    });
  }

  for (const anchor of clipboard.labelAnchors) {
    const labelId = labelIdMap.get(anchor.labelId);
    const endpoint = remapEndpoint(anchor.endpoint, nodeIdMap, portIdMap);
    if (!labelId || !endpoint) continue;
    sheet.labelAnchors.push({
      id: createId("anchor"),
      labelId,
      endpoint,
    });
  }
}

function remapEndpoint(
  endpoint: SheetEndpointRef,
  nodeIdMap: ReadonlyMap<string, string>,
  portIdMap: ReadonlyMap<string, string>,
): SheetEndpointRef | null {
  if (endpoint.kind === "node-pin") {
    const nodeId = nodeIdMap.get(endpoint.nodeId);
    return nodeId
      ? { kind: "node-pin", nodeId, pinKey: endpoint.pinKey }
      : null;
  }
  const portId = portIdMap.get(endpoint.portId);
  return portId ? { kind: "sheet-port", portId } : null;
}
