import { resolveComponentPinsForInstance } from "@nohal/core/src/componentInstance";
import {
  fixedExportStageForComponent,
  fixedInstanceNameForComponent,
} from "@nohal/core/src/componentSystem";
import { isComponentPlaceable } from "@nohal/core/src/componentVisibility";
import { reconcileComponentNodesForDefinition } from "@nohal/core/src/customComponent";
import { getSheet, isNodePinConnected } from "@nohal/core/src/graph";
import { isValidHalName } from "@nohal/core/src/halNames";
import { createId } from "@nohal/core/src/id";
import { createSheetPortDraft } from "@nohal/core/src/project";
import type {
  ComponentNode,
  HalValueType,
  LabelScope,
  SheetComment,
  SheetEndpointRef,
  SheetNode,
  XY,
} from "@nohal/core/src/types";
import {
  componentUsesLockedCanonicalInstanceNames,
  defaultCommentPosition,
  defaultLabelPosition,
  defaultNodePosition,
  defaultPortPosition,
  forcedPortSideForDirection,
  nextComponentInstanceName,
  nextName,
  normalizeRotationDegrees,
  toErrorMessage,
} from "../helpers";
import type { EditorStoreActionContext } from "./types";

function endpointMovesWithGroup(
  endpoint: SheetEndpointRef,
  movedNodeIds: ReadonlySet<string>,
  movedPortIds: ReadonlySet<string>,
): boolean {
  return endpoint.kind === "node-pin"
    ? movedNodeIds.has(endpoint.nodeId)
    : movedPortIds.has(endpoint.portId);
}

export function createNodeActions(deps: EditorStoreActionContext) {
  const renameNodeInSheet = (
    sheetId: string,
    nodeId: string,
    instanceName: string,
  ): void => {
    const trimmed = instanceName.trim();
    if (!trimmed) return;
    if (!isValidHalName(trimmed)) {
      deps.setState("status", `Invalid HAL instance name: ${trimmed}`);
      return;
    }
    const currentSheet = getSheet(deps.state.project, sheetId);
    const currentNode = currentSheet.nodes.find((n) => n.id === nodeId);
    if (!currentNode || currentNode.instanceName === trimmed) return;
    if (currentNode.kind === "component") {
      const component =
        deps.state.project.library.components[currentNode.componentId];
      if (fixedInstanceNameForComponent(component)) {
        deps.setState(
          "status",
          `Instance name is fixed for component '${component?.halComponentName ?? currentNode.componentId}'`,
        );
        return;
      }
      if (componentUsesLockedCanonicalInstanceNames(component)) {
        deps.setState(
          "status",
          `Instance name is fixed for component '${component?.halComponentName ?? currentNode.componentId}'`,
        );
        return;
      }
    }
    if (
      currentSheet.nodes.some(
        (n) => n.id !== nodeId && n.instanceName === trimmed,
      )
    ) {
      deps.setState("status", `Instance name already exists: ${trimmed}`);
      return;
    }
    deps.withProject((project) => {
      const sheet = getSheet(project, sheetId);
      const node = sheet.nodes.find((n) => n.id === nodeId);
      if (!node) return;
      node.instanceName = trimmed;
    });
  };

  return {
    async refreshComponentInStore(componentId: string): Promise<void> {
      const current = deps.state.project.library.components[componentId];
      if (!current || current.source !== "comp") {
        deps.setStatusT("store.status.selectedComponentNotStoredComp");
        return;
      }

      try {
        const entry = await window.nohal.refreshComponentInStore(componentId);
        deps.clearHistory();
        deps.withComponentStore((componentStore) => {
          componentStore.components[entry.componentId] = entry;
        });
        deps.withProject(
          (project) => {
            project.library.components[entry.componentId] = entry.parsed;
            reconcileComponentNodesForDefinition(
              project,
              entry.componentId,
              entry.parsed,
            );
          },
          { recordHistory: false },
        );
        deps.setStatusT("store.status.refreshedComponent", {
          componentName: entry.parsed.halComponentName,
        });
      } catch (error) {
        deps.setStatusT("store.status.refreshFailed", {
          error: toErrorMessage(error),
        });
      }
    },

    addComponentNode(
      componentId: string,
      position?: { x: number; y: number },
    ): void {
      const comp = deps.state.project.library.components[componentId];
      if (!comp) return;
      if (!isComponentPlaceable(comp)) {
        deps.setStatusT("store.status.componentPlacementDisabled", {
          componentName: comp.halComponentName,
        });
        return;
      }
      const activeSheetId = deps.state.activeSheetId;
      const currentSheet = getSheet(deps.state.project, activeSheetId);
      const instanceName = nextComponentInstanceName(currentSheet, comp);
      if (!instanceName) {
        deps.setState(
          "status",
          `No available canonical instance names left for component '${comp.halComponentName}'`,
        );
        return;
      }
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const node: ComponentNode = {
          id: createId("node"),
          kind: "component",
          componentId,
          instanceName,
          position: position ?? defaultNodePosition(sheet),
          paramValues: Object.fromEntries(
            comp.params
              .filter((p) => p.defaultValue !== undefined)
              .map((p) => [p.key, p.defaultValue ?? ""]),
          ),
          instanceConfigValues: Object.fromEntries(
            (comp.runtime?.instanceConfig?.fields ?? [])
              .filter((field) => field.defaultValue !== undefined)
              .map((field) => [field.key, `${field.defaultValue ?? ""}`]),
          ),
        };
        if (
          node.instanceConfigValues &&
          Object.keys(node.instanceConfigValues).length === 0
        ) {
          delete node.instanceConfigValues;
        }
        sheet.nodes.push(node);
      });
      deps.setStatusT("store.status.placedComponent", {
        componentName: comp.halComponentName,
      });
    },

    addLabel(scope: LabelScope, position?: XY): void {
      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const used = new Set(sheet.labels.map((l) => l.name));
        const base = scope === "global" ? "global_sig" : "sig";
        const name = nextName(base, used);
        sheet.labels.push({
          id: createId("label"),
          name,
          scope,
          position: position ?? defaultLabelPosition(sheet),
          rotation: 0,
        });
      });
      deps.setStatusT("store.status.addedLabel", { scope });
    },

    addComment(position?: XY): void {
      let createdId: string | null = null;
      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const comment: SheetComment = {
          id: createId("comment"),
          text: "Comment",
          position: position ?? defaultCommentPosition(sheet),
          rotation: 0,
        };
        createdId = comment.id;
        sheet.comments.push(comment);
      });
      if (createdId)
        deps.setState("selection", { kind: "comment", id: createdId });
      deps.setStatusT("store.status.addedComment");
    },

    addSheetPort(
      direction: "in" | "out" | "io",
      type: "bit" | "float" | "s32" | "u32" | "s64" | "u64" | "port",
      position?: XY,
    ): void {
      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const used = new Set(sheet.ports.map((p) => p.name));
        let base = "io_sig";
        if (direction === "in") {
          base = "in_sig";
        } else if (direction === "out") {
          base = "out_sig";
        }
        const name = nextName(base, used);
        const port = createSheetPortDraft(name, direction, type);
        port.position = position ?? defaultPortPosition(sheet, port.side);
        sheet.ports.push(port);
      });
      deps.setStatusT("store.status.addedSheetPort");
    },

    moveNode(nodeId: string, x: number, y: number): void {
      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const node = sheet.nodes.find((n) => n.id === nodeId);
        if (node) node.position = { x, y };
      });
    },

    moveLabel(labelId: string, x: number, y: number): void {
      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const label = sheet.labels.find((l) => l.id === labelId);
        if (label) label.position = { x, y };
      });
    },

    moveComment(commentId: string, x: number, y: number): void {
      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const comment = sheet.comments.find((c) => c.id === commentId);
        if (comment) comment.position = { x, y };
      });
    },

    moveSheetPort(portId: string, x: number, y: number): void {
      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const port = sheet.ports.find((p) => p.id === portId);
        if (port) port.position = { x, y };
      });
    },

    moveSelectionGroup(updates: {
      nodePositions: Array<{ id: string; x: number; y: number }>;
      labelPositions: Array<{ id: string; x: number; y: number }>;
      commentPositions: Array<{ id: string; x: number; y: number }>;
      portPositions: Array<{ id: string; x: number; y: number }>;
    }): void {
      if (
        updates.nodePositions.length === 0 &&
        updates.labelPositions.length === 0 &&
        updates.commentPositions.length === 0 &&
        updates.portPositions.length === 0
      ) {
        return;
      }

      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const nodeUpdates = new Map(
          updates.nodePositions.map((entry) => [entry.id, entry]),
        );
        const labelUpdates = new Map(
          updates.labelPositions.map((entry) => [entry.id, entry]),
        );
        const commentUpdates = new Map(
          updates.commentPositions.map((entry) => [entry.id, entry]),
        );
        const portUpdates = new Map(
          updates.portPositions.map((entry) => [entry.id, entry]),
        );
        const movedNodeIds = new Set(nodeUpdates.keys());
        const movedPortIds = new Set(portUpdates.keys());
        let moveDelta: XY | null = null;

        for (const node of sheet.nodes) {
          const next = nodeUpdates.get(node.id);
          if (!next) continue;
          if (!moveDelta) {
            moveDelta = {
              x: next.x - node.position.x,
              y: next.y - node.position.y,
            };
          }
          node.position = { x: next.x, y: next.y };
        }
        for (const label of sheet.labels) {
          const next = labelUpdates.get(label.id);
          if (!next) continue;
          if (!moveDelta) {
            moveDelta = {
              x: next.x - label.position.x,
              y: next.y - label.position.y,
            };
          }
          label.position = { x: next.x, y: next.y };
        }
        for (const comment of sheet.comments) {
          const next = commentUpdates.get(comment.id);
          if (!next) continue;
          if (!moveDelta) {
            moveDelta = {
              x: next.x - comment.position.x,
              y: next.y - comment.position.y,
            };
          }
          comment.position = { x: next.x, y: next.y };
        }
        for (const port of sheet.ports) {
          const next = portUpdates.get(port.id);
          if (!next) continue;
          if (!moveDelta) {
            moveDelta = {
              x: next.x - port.position.x,
              y: next.y - port.position.y,
            };
          }
          port.position = { x: next.x, y: next.y };
        }
        if (
          !moveDelta ||
          (moveDelta.x === 0 && moveDelta.y === 0) ||
          (movedNodeIds.size === 0 && movedPortIds.size === 0)
        ) {
          return;
        }
        for (const connection of sheet.directConnections) {
          if (!connection.waypoints || connection.waypoints.length === 0) {
            continue;
          }
          if (
            !endpointMovesWithGroup(connection.a, movedNodeIds, movedPortIds) ||
            !endpointMovesWithGroup(connection.b, movedNodeIds, movedPortIds)
          ) {
            continue;
          }
          connection.waypoints = connection.waypoints.map((point) => ({
            x: point.x + moveDelta.x,
            y: point.y + moveDelta.y,
          }));
        }
      });
    },

    renameNode(nodeId: string, instanceName: string): void {
      renameNodeInSheet(deps.state.activeSheetId, nodeId, instanceName);
    },

    renameSheetInstance(sheetId: string, instanceName: string): void {
      const currentSheet = deps.state.project.sheets[sheetId];
      if (!currentSheet?.parentSheetId) return;
      const parentSheet = getSheet(
        deps.state.project,
        currentSheet.parentSheetId,
      );
      const subsheetNode = parentSheet.nodes.find(
        (node): node is SheetNode =>
          node.kind === "sheet" && node.sheetId === sheetId,
      );
      if (!subsheetNode) return;
      renameNodeInSheet(parentSheet.id, subsheetNode.id, instanceName);
    },

    updateSheetNodeThreadMap(
      sheetId: string,
      nodeId: string,
      childThreadOutputId: string,
      parentThreadOutputId: string | null,
    ): void {
      deps.withProject((project) => {
        const sheet = getSheet(project, sheetId);
        const node = sheet.nodes.find((n) => n.id === nodeId);
        if (!node || node.kind !== "sheet") return;
        if (!node.hal) node.hal = {};
        if (!node.hal.threadMap) node.hal.threadMap = {};
        if (parentThreadOutputId?.trim()) {
          node.hal.threadMap[childThreadOutputId] = parentThreadOutputId;
          return;
        }
        delete node.hal.threadMap[childThreadOutputId];
        if (Object.keys(node.hal.threadMap).length === 0)
          delete node.hal.threadMap;
        if (Object.keys(node.hal).length === 0) delete node.hal;
      });
      deps.setStatusT("store.status.updatedSubsheetThreadMapping");
    },

    updateNodeParam(nodeId: string, paramKey: string, value: string): void {
      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const node = sheet.nodes.find((n) => n.id === nodeId);
        if (node && node.kind === "component") {
          node.paramValues[paramKey] = value;
        }
      });
    },

    updateNodeInstanceConfigValue(
      nodeId: string,
      configKey: string,
      value: string,
    ): void {
      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const node = sheet.nodes.find((n) => n.id === nodeId);
        if (!node || node.kind !== "component") return;

        const component = project.library.components[node.componentId];
        if (!component) return;
        const field = component.runtime?.instanceConfig?.fields.find(
          (item) => item.key === configKey,
        );
        if (!field) return;

        const nextValues = { ...(node.instanceConfigValues ?? {}) };
        const normalizedValue = value.trim();
        const defaultValue =
          field.defaultValue === undefined
            ? undefined
            : `${field.defaultValue}`;
        if (
          !normalizedValue ||
          (defaultValue !== undefined && normalizedValue === defaultValue)
        ) {
          delete nextValues[configKey];
        } else {
          nextValues[configKey] = normalizedValue;
        }

        if (Object.keys(nextValues).length > 0) {
          node.instanceConfigValues = nextValues;
        } else {
          delete node.instanceConfigValues;
        }

        const resolvedPins = resolveComponentPinsForInstance(
          component,
          node.instanceConfigValues,
        );
        const validPinKeys = new Set(resolvedPins.map((pin) => pin.key));
        const currentPinInitialValues = node.pinInitialValues ?? {};
        const nextPinInitialValues: Record<string, string> = {};
        for (const [key, pinValue] of Object.entries(currentPinInitialValues)) {
          if (!validPinKeys.has(key)) continue;
          if (!pinValue.trim()) continue;
          nextPinInitialValues[key] = pinValue;
        }
        if (Object.keys(nextPinInitialValues).length > 0) {
          node.pinInitialValues = nextPinInitialValues;
        } else {
          delete node.pinInitialValues;
        }

        const nextHiddenPinKeys = (node.hiddenPinKeys ?? []).filter((key) =>
          validPinKeys.has(key),
        );
        if (nextHiddenPinKeys.length > 0) {
          node.hiddenPinKeys = [...new Set(nextHiddenPinKeys)];
        } else {
          delete node.hiddenPinKeys;
        }
      });
    },

    updateNodePinInitialValue(
      nodeId: string,
      pinKey: string,
      value: string,
    ): void {
      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const node = sheet.nodes.find((n) => n.id === nodeId);
        if (!node || node.kind !== "component") return;
        const next = { ...(node.pinInitialValues ?? {}) };
        if (value.trim()) next[pinKey] = value;
        else delete next[pinKey];
        if (Object.keys(next).length > 0) node.pinInitialValues = next;
        else delete node.pinInitialValues;
      });
    },

    updateNodePinVisibility(
      nodeId: string,
      pinKey: string,
      visible: boolean,
    ): void {
      const activeSheetId = deps.state.activeSheetId;
      const currentSheet = getSheet(deps.state.project, activeSheetId);
      const currentNode = currentSheet.nodes.find((n) => n.id === nodeId);
      if (!currentNode || currentNode.kind !== "component") return;
      if (!visible && isNodePinConnected(currentSheet, nodeId, pinKey)) return;

      const isCurrentlyVisible = !currentNode.hiddenPinKeys?.includes(pinKey);
      if (isCurrentlyVisible === visible) return;

      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const node = sheet.nodes.find((n) => n.id === nodeId);
        if (!node || node.kind !== "component") return;

        const nextHiddenPinKeys = new Set(node.hiddenPinKeys ?? []);
        if (visible) nextHiddenPinKeys.delete(pinKey);
        else nextHiddenPinKeys.add(pinKey);

        if (nextHiddenPinKeys.size > 0) {
          node.hiddenPinKeys = [...nextHiddenPinKeys].sort();
        } else {
          delete node.hiddenPinKeys;
        }
      });

      if (
        !visible &&
        deps.state.pendingEndpoint?.kind === "node-pin" &&
        deps.state.pendingEndpoint.nodeId === nodeId &&
        deps.state.pendingEndpoint.pinKey === pinKey
      ) {
        deps.clearPendingConnectionUi();
      }
    },

    updateNodeExportStage(nodeId: string, stage: "main" | "postgui"): void {
      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const node = sheet.nodes.find((n) => n.id === nodeId);
        if (!node || node.kind !== "component") return;
        const component = project.library.components[node.componentId];
        const fixedExportStage = fixedExportStageForComponent(component);
        if (fixedExportStage) {
          node.exportStage = fixedExportStage;
        } else if (stage === "postgui") {
          node.exportStage = "postgui";
        } else {
          delete node.exportStage;
        }
      });
    },

    updateLabel(
      labelId: string,
      patch: { name?: string; scope?: LabelScope; rotation?: number },
    ): void {
      const activeSheetId = deps.state.activeSheetId;
      const normalizedName =
        patch.name !== undefined ? patch.name.trim() : undefined;
      if (normalizedName !== undefined && normalizedName.length > 0) {
        if (!isValidHalName(normalizedName)) {
          deps.setState("status", `Invalid HAL signal name: ${normalizedName}`);
          return;
        }
      }
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const label = sheet.labels.find((l) => l.id === labelId);
        if (!label) return;
        if (normalizedName !== undefined && normalizedName.length > 0)
          label.name = normalizedName;
        if (patch.scope !== undefined) label.scope = patch.scope;
        if (patch.rotation !== undefined) {
          label.rotation = normalizeRotationDegrees(patch.rotation);
        }
      });
    },

    updateComment(
      commentId: string,
      patch: { text?: string; rotation?: number },
    ): void {
      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const comment = sheet.comments.find((c) => c.id === commentId);
        if (!comment) return;
        if (patch.text !== undefined) comment.text = patch.text;
        if (patch.rotation !== undefined) {
          comment.rotation = normalizeRotationDegrees(patch.rotation);
        }
      });
    },

    updateSheetPort(
      portId: string,
      patch: {
        name?: string;
        direction?: "in" | "out" | "io";
        type?: HalValueType;
        rotation?: number;
      },
    ): void {
      const activeSheetId = deps.state.activeSheetId;
      const normalizedName =
        patch.name !== undefined ? patch.name.trim() : undefined;
      if (normalizedName !== undefined && normalizedName.length > 0) {
        if (!isValidHalName(normalizedName)) {
          deps.setState("status", `Invalid HAL port name: ${normalizedName}`);
          return;
        }
        const currentSheet = getSheet(deps.state.project, activeSheetId);
        const duplicate = currentSheet.ports.some(
          (p) => p.id !== portId && p.name === normalizedName,
        );
        if (duplicate) {
          deps.setState(
            "status",
            `Sheet port name already exists: ${normalizedName}`,
          );
          return;
        }
      }
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const port = sheet.ports.find((p) => p.id === portId);
        if (!port) return;
        if (normalizedName !== undefined && normalizedName.length > 0)
          port.name = normalizedName;
        if (patch.direction !== undefined) {
          port.direction = patch.direction;
          port.side = forcedPortSideForDirection(patch.direction);
          port.position = defaultPortPosition(sheet, port.side);
        }
        if (patch.type !== undefined) port.type = patch.type;
        if (patch.rotation !== undefined) {
          port.rotation = normalizeRotationDegrees(patch.rotation);
        }
      });
    },
  };
}
