import { getSheet } from "@nohal/core/src/graph";
import { isValidHalName } from "@nohal/core/src/halNames";
import { createId } from "@nohal/core/src/id";
import { createSheetPortDraft } from "@nohal/core/src/project";
import { resolveComponentPinsForInstance } from "@nohal/core/src/componentInstance";
import type {
  ComponentNode,
  HalValueType,
  LabelScope,
  SheetComment,
} from "@nohal/core/src/types";
import {
  componentUsesLockedCanonicalInstanceNames,
  defaultCommentPosition,
  defaultLabelPosition,
  defaultNodePosition,
  defaultPortPosition,
  forcedPortSideForDirection,
  nextName,
  normalizeRotationDegrees,
  nextComponentInstanceName,
  reconcileComponentNodesForDefinition,
  toErrorMessage,
} from "../helpers";
import type { EditorStoreActionContext } from "./types";

export function createNodeActions(deps: EditorStoreActionContext) {
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

    addLabel(scope: LabelScope): void {
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
          position: defaultLabelPosition(sheet),
          rotation: 0,
        });
      });
      deps.setStatusT("store.status.addedLabel", { scope });
    },

    addComment(): void {
      let createdId: string | null = null;
      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const comment: SheetComment = {
          id: createId("comment"),
          text: "Comment",
          position: defaultCommentPosition(sheet),
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
    ): void {
      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const used = new Set(sheet.ports.map((p) => p.name));
        const base =
          direction === "in"
            ? "in_sig"
            : direction === "out"
              ? "out_sig"
              : "io_sig";
        const name = nextName(base, used);
        const port = createSheetPortDraft(name, direction, type);
        port.position = defaultPortPosition(sheet, port.side);
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
      portPositions: Array<{ id: string; x: number; y: number }>;
    }): void {
      if (
        updates.nodePositions.length === 0 &&
        updates.labelPositions.length === 0 &&
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
        const portUpdates = new Map(
          updates.portPositions.map((entry) => [entry.id, entry]),
        );

        for (const node of sheet.nodes) {
          const next = nodeUpdates.get(node.id);
          if (!next) continue;
          node.position = { x: next.x, y: next.y };
        }
        for (const label of sheet.labels) {
          const next = labelUpdates.get(label.id);
          if (!next) continue;
          label.position = { x: next.x, y: next.y };
        }
        for (const port of sheet.ports) {
          const next = portUpdates.get(port.id);
          if (!next) continue;
          port.position = { x: next.x, y: next.y };
        }
      });
    },

    renameNode(nodeId: string, instanceName: string): void {
      const activeSheetId = deps.state.activeSheetId;
      const trimmed = instanceName.trim();
      if (!trimmed) return;
      if (!isValidHalName(trimmed)) {
        deps.setState("status", `Invalid HAL instance name: ${trimmed}`);
        return;
      }
      const currentSheet = getSheet(deps.state.project, activeSheetId);
      const currentNode = currentSheet.nodes.find((n) => n.id === nodeId);
      if (!currentNode || currentNode.instanceName === trimmed) return;
      if (currentNode.kind === "component") {
        const component =
          deps.state.project.library.components[currentNode.componentId];
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
        const sheet = getSheet(project, activeSheetId);
        const node = sheet.nodes.find((n) => n.id === nodeId);
        if (!node) return;
        node.instanceName = trimmed;
      });
    },

    updateSheetNodeThreadMap(
      nodeId: string,
      childThreadOutputId: string,
      parentThreadOutputId: string | null,
    ): void {
      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
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
          field.defaultValue === undefined ? undefined : `${field.defaultValue}`;
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

    updateNodeExportStage(nodeId: string, stage: "main" | "postgui"): void {
      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const node = sheet.nodes.find((n) => n.id === nodeId);
        if (!node || node.kind !== "component") return;
        if (stage === "postgui") {
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
