import { applyComponentDefinitionToProject } from "@nohal/core/customComponent";
import {
  collectDuplicateExportedInstancePaths,
  componentHasFixedExportNamespace,
  resolveNodeExportNamespace,
} from "@nohal/core/componentNaming";
import {
  fixedExportStageForComponent,
  fixedInstanceNameForComponent,
} from "@nohal/core/componentSystem";
import { isComponentPlaceable } from "@nohal/core/componentVisibility";
import {
  getSheet,
  getSheetReferenceLocations,
  isNodePinConnected,
  resolveEndpointInSheet,
} from "@nohal/core/graph";
import { isValidHalName } from "@nohal/core/halNames";
import { createId } from "@nohal/core/id";
import { createSheetPortDraft } from "@nohal/core/project";
import type {
  ComponentNode,
  HalValueType,
  LabelScope,
  PinDirection,
  SheetComment,
  SheetDefinition,
  SheetEndpointRef,
  XY,
} from "@nohal/core/types";
import {
  applyComponentStoreEntryToProject,
  cloneProject,
  componentUsesLockedCanonicalInstanceNames,
  defaultCommentPosition,
  defaultLabelPosition,
  defaultNodePosition,
  defaultPortPosition,
  forcedPortSideForDirection,
  hasComponentExportPathConflict,
  nextComponentInstanceName,
  nextName,
  normalizeRotationDegrees,
  toErrorMessage,
} from "../helpers";
import type { EditorSelection, EditorStoreActionContext } from "./types";

const ROTATION_STEP_DEGREES = 90;

function getRotatableSelectionIds(selection: EditorSelection): {
  labelIds: Set<string>;
  commentIds: Set<string>;
  portIds: Set<string>;
} {
  if (!selection) {
    return {
      labelIds: new Set<string>(),
      commentIds: new Set<string>(),
      portIds: new Set<string>(),
    };
  }

  if (selection.kind === "multi") {
    return {
      labelIds: new Set(selection.labelIds),
      commentIds: new Set(selection.commentIds),
      portIds: new Set(selection.portIds),
    };
  }

  return {
    labelIds: new Set(selection.kind === "label" ? [selection.id] : []),
    commentIds: new Set(selection.kind === "comment" ? [selection.id] : []),
    portIds: new Set(selection.kind === "sheet-port" ? [selection.id] : []),
  };
}

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
      if (
        hasComponentExportPathConflict({
          project: deps.state.project,
          sheetId,
          component,
          candidateNode: {
            instanceName: trimmed,
            exportNamespace: currentNode.exportNamespace,
          },
          excludeNodeId: nodeId,
        })
      ) {
        deps.setState(
          "status",
          `Instance name collides in exported HAL namespace: ${trimmed}`,
        );
        return;
      }
    } else if (
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

  const captureMoveDelta = (
    moveDelta: XY | null,
    currentPosition: XY,
    nextPosition: XY,
  ): XY | null =>
    moveDelta ?? {
      x: nextPosition.x - currentPosition.x,
      y: nextPosition.y - currentPosition.y,
    };

  const applyPositionUpdates = <T extends { id: string; position: XY }>(
    entries: T[],
    updates: Map<string, XY>,
    moveDelta: XY | null,
  ): XY | null => {
    let nextMoveDelta = moveDelta;
    for (const entry of entries) {
      const next = updates.get(entry.id);
      if (!next) continue;
      nextMoveDelta = captureMoveDelta(nextMoveDelta, entry.position, next);
      entry.position = { x: next.x, y: next.y };
    }
    return nextMoveDelta;
  };

  const moveConnectionWaypointsWithGroup = (
    sheet: SheetDefinition,
    movedNodeIds: ReadonlySet<string>,
    movedPortIds: ReadonlySet<string>,
    moveDelta: XY | null,
  ): void => {
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
  };

  const normalizeInstanceConfigValues = (
    node: ComponentNode,
    configKey: string,
    value: string,
    defaultValue: string | undefined,
  ): void => {
    const nextValues = { ...(node.instanceConfigValues ?? {}) };
    const normalizedValue = value.trim();
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
  };

  const pruneNodePinInitialValues = (
    node: ComponentNode,
    validPinKeys: ReadonlySet<string>,
  ): void => {
    const currentPinInitialValues = node.pinInitialValues ?? {};
    const nextPinInitialValues: Record<string, string> = {};
    for (const [key, pinValue] of Object.entries(currentPinInitialValues)) {
      if (!validPinKeys.has(key) || !pinValue.trim()) continue;
      nextPinInitialValues[key] = pinValue;
    }
    if (Object.keys(nextPinInitialValues).length > 0) {
      node.pinInitialValues = nextPinInitialValues;
    } else {
      delete node.pinInitialValues;
    }
  };

  const pruneHiddenPinKeys = (
    node: ComponentNode,
    validPinKeys: ReadonlySet<string>,
  ): void => {
    const nextHiddenPinKeys = (node.hiddenPinKeys ?? []).filter((key) =>
      validPinKeys.has(key),
    );
    if (nextHiddenPinKeys.length > 0) {
      node.hiddenPinKeys = [...new Set(nextHiddenPinKeys)];
    } else {
      delete node.hiddenPinKeys;
    }
  };

  const pruneNodePinOrder = (
    node: ComponentNode,
    validPinKeys: readonly string[],
  ): void => {
    const nextPinOrder = normalizeComponentPinOrder(
      node.pinOrder,
      validPinKeys,
    );
    if (nextPinOrder) {
      node.pinOrder = nextPinOrder;
    } else {
      delete node.pinOrder;
    }
  };

  const setNodeExportNamespace = (
    node: ComponentNode,
    global: boolean,
  ): void => {
    if (global) {
      node.exportNamespace = "global";
    } else {
      delete node.exportNamespace;
    }
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
            applyComponentDefinitionToProject(
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

    addComponentNode(componentId: string, position?: XY): void {
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
      const instanceName = nextComponentInstanceName(
        deps.state.project,
        currentSheet,
        comp,
      );
      if (!instanceName) {
        deps.setState(
          "status",
          `No available export-safe instance names left for component '${comp.halComponentName}'`,
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
      direction: PinDirection,
      type: HalValueType,
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

        moveDelta = applyPositionUpdates(sheet.nodes, nodeUpdates, moveDelta);
        moveDelta = applyPositionUpdates(sheet.labels, labelUpdates, moveDelta);
        moveDelta = applyPositionUpdates(
          sheet.comments,
          commentUpdates,
          moveDelta,
        );
        moveDelta = applyPositionUpdates(sheet.ports, portUpdates, moveDelta);
        moveConnectionWaypointsWithGroup(
          sheet,
          movedNodeIds,
          movedPortIds,
          moveDelta,
        );
      });
    },

    renameNode(nodeId: string, instanceName: string): void {
      renameNodeInSheet(deps.state.activeSheetId, nodeId, instanceName);
    },

    renameSheetReference(
      parentSheetId: string,
      nodeId: string,
      instanceName: string,
    ): void {
      renameNodeInSheet(parentSheetId, nodeId, instanceName);
    },

    renameSheetInstance(sheetId: string, instanceName: string): void {
      const [reference] = getSheetReferenceLocations(
        deps.state.project,
        sheetId,
      );
      if (!reference) return;
      renameNodeInSheet(
        reference.parentSheetId,
        reference.nodeId,
        instanceName,
      );
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
        const defaultValue =
          field.defaultValue === undefined
            ? undefined
            : `${field.defaultValue}`;
        normalizeInstanceConfigValues(node, configKey, value, defaultValue);

        const resolvedPins = resolveComponentPinsForInstance(
          component,
          node.instanceConfigValues,
        );
        const validPinKeys = new Set(resolvedPins.map((pin) => pin.key));
        pruneNodePinInitialValues(node, validPinKeys);
        pruneHiddenPinKeys(node, validPinKeys);
        pruneNodePinOrder(
          node,
          resolvedPins.map((pin) => pin.key),
        );
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

    updateNodePinOrder(nodeId: string, pinOrder: readonly string[]): void {
      const activeSheetId = deps.state.activeSheetId;
      const currentSheet = getSheet(deps.state.project, activeSheetId);
      const currentNode = currentSheet.nodes.find((node) => node.id === nodeId);
      if (!currentNode || currentNode.kind !== "component") return;
      const component =
        deps.state.project.library.components[currentNode.componentId];
      if (!component) return;

      const validPinKeys = resolveComponentPinsForInstance(
        component,
        currentNode.instanceConfigValues,
      ).map((pin) => pin.key);
      const normalizedPinOrder = normalizeComponentPinOrder(
        pinOrder,
        validPinKeys,
      );
      const currentPinOrder = normalizeComponentPinOrder(
        currentNode.pinOrder,
        validPinKeys,
      );
      if (
        normalizedPinOrder &&
        currentPinOrder &&
        normalizedPinOrder.length === currentPinOrder.length &&
        normalizedPinOrder?.every(
          (key, index) => key === currentPinOrder[index],
        )
      ) {
        return;
      }
      if (!normalizedPinOrder && !currentPinOrder) return;

      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const node = sheet.nodes.find((candidate) => candidate.id === nodeId);
        if (!node || node.kind !== "component") return;
        if (normalizedPinOrder) {
          node.pinOrder = normalizedPinOrder;
        } else {
          delete node.pinOrder;
        }
      });
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

    updateNodeGlobalNamespace(nodeId: string, global: boolean): void {
      const activeSheetId = deps.state.activeSheetId;
      const currentSheet = getSheet(deps.state.project, activeSheetId);
      const currentNode = currentSheet.nodes.find((n) => n.id === nodeId);
      if (!currentNode || currentNode.kind !== "component") return;

      const component =
        deps.state.project.library.components[currentNode.componentId];
      if (!component) return;
      if (componentHasFixedExportNamespace(component)) {
        deps.setState(
          "status",
          `Export namespace is fixed for component '${component.halComponentName}'`,
        );
        return;
      }

      const nextNamespace = global ? "global" : "sheet_scoped";
      if (
        resolveNodeExportNamespace(currentNode, component) === nextNamespace
      ) {
        return;
      }

      const nextProject = cloneProject(deps.state.project);
      const nextSheet = getSheet(nextProject, activeSheetId);
      const nextNode = nextSheet.nodes.find((n) => n.id === nodeId);
      if (!nextNode || nextNode.kind !== "component") return;

      const currentDuplicates = new Set(
        collectDuplicateExportedInstancePaths(deps.state.project),
      );
      setNodeExportNamespace(nextNode, global);
      const introducedDuplicates = collectDuplicateExportedInstancePaths(
        nextProject,
      ).filter((path) => !currentDuplicates.has(path));

      if (introducedDuplicates.length > 0) {
        deps.setState(
          "status",
          `Export namespace change would collide at '${introducedDuplicates[0]}'`,
        );
        return;
      }

      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const node = sheet.nodes.find((n) => n.id === nodeId);
        if (!node || node.kind !== "component") return;
        setNodeExportNamespace(node, global);
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

    convertLabelToSheetPort(labelId: string): void {
      const activeSheetId = deps.state.activeSheetId;
      const currentSheet = getSheet(deps.state.project, activeSheetId);
      const label = currentSheet.labels.find((entry) => entry.id === labelId);
      if (!label) return;

      const anchors = currentSheet.labelAnchors.filter(
        (entry) => entry.labelId === labelId,
      );
      if (anchors.length !== 1) {
        deps.setStatusT("store.status.cannotConvertLabelToSheetPort");
        return;
      }

      const [anchor] = anchors;
      if (anchor.endpoint.kind !== "node-pin") {
        deps.setStatusT("store.status.cannotConvertLabelToSheetPort");
        return;
      }

      const endpoint = anchor.endpoint;
      const resolved = resolveEndpointInSheet(
        deps.state.project,
        activeSheetId,
        endpoint,
      );
      const usedPortNames = new Set(
        currentSheet.ports.map((entry) => entry.name),
      );
      const portName = nextName(label.name, usedPortNames);

      let createdPortId: string | null = null;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const currentLabel = sheet.labels.find((entry) => entry.id === labelId);
        if (!currentLabel) return;

        const port = createSheetPortDraft(
          portName,
          resolved.direction,
          resolved.type,
        );
        port.name = portName;
        port.position = { ...currentLabel.position };
        createdPortId = port.id;
        sheet.ports.push(port);
        sheet.directConnections.push({
          id: createId("conn"),
          a: {
            kind: "node-pin",
            nodeId: endpoint.nodeId,
            pinKey: endpoint.pinKey,
          },
          b: { kind: "sheet-port", portId: port.id },
        });
        sheet.labelAnchors = sheet.labelAnchors.filter(
          (entry) => entry.labelId !== labelId,
        );
        sheet.labels = sheet.labels.filter((entry) => entry.id !== labelId);
      });

      if (!createdPortId) return;
      deps.setState("selection", { kind: "sheet-port", id: createdPortId });
      deps.setStatusT("store.status.convertedLabelToSheetPort", {
        name: portName,
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

    rotateSelectionClockwise(
      stepDegrees: number = ROTATION_STEP_DEGREES,
    ): boolean {
      if (!Number.isFinite(stepDegrees) || stepDegrees === 0) return false;

      const { labelIds, commentIds, portIds } = getRotatableSelectionIds(
        deps.state.selection,
      );
      if (labelIds.size === 0 && commentIds.size === 0 && portIds.size === 0) {
        return false;
      }

      const currentSheet = getSheet(
        deps.state.project,
        deps.state.activeSheetId,
      );
      const hasEligibleSelection =
        currentSheet.labels.some((label) => labelIds.has(label.id)) ||
        currentSheet.comments.some((comment) => commentIds.has(comment.id)) ||
        currentSheet.ports.some((port) => portIds.has(port.id));
      if (!hasEligibleSelection) return false;

      deps.withProject((project) => {
        const sheet = getSheet(project, deps.state.activeSheetId);
        for (const label of sheet.labels) {
          if (!labelIds.has(label.id)) continue;
          label.rotation = normalizeRotationDegrees(
            (label.rotation ?? 0) + stepDegrees,
          );
        }
        for (const comment of sheet.comments) {
          if (!commentIds.has(comment.id)) continue;
          comment.rotation = normalizeRotationDegrees(
            (comment.rotation ?? 0) + stepDegrees,
          );
        }
        for (const port of sheet.ports) {
          if (!portIds.has(port.id)) continue;
          port.rotation = normalizeRotationDegrees(
            (port.rotation ?? 0) + stepDegrees,
          );
        }
      });

      return true;
    },
  };
}
