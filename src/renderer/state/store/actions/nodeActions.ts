import { getSheet } from "../../../../shared/graph";
import { createId } from "../../../../shared/id";
import { createSheetPortDraft } from "../../../../shared/project";
import type {
  ComponentNode,
  HalValueType,
  LabelScope,
  SheetComment,
} from "../../../../shared/types";
import {
  defaultCommentPosition,
  defaultLabelPosition,
  defaultNodePosition,
  defaultPortPosition,
  ensureInstanceName,
  forcedPortSideForDirection,
  nextName,
  normalizeRotationDegrees,
  reconcileComponentNodesForDefinition,
  toErrorMessage,
} from "../helpers";
import type { EditorStoreActionContext } from "./types";

export function createNodeActions(deps: EditorStoreActionContext) {
  return {
    async refreshComponentInStore(componentId: string): Promise<void> {
      const current = deps.getProject().library.components[componentId];
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
      const comp = deps.getProject().library.components[componentId];
      if (!comp) return;
      const activeSheetId = deps.getActiveSheetId();
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const instanceName = ensureInstanceName(sheet, comp.halComponentName);
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
        };
        sheet.nodes.push(node);
      });
      deps.setStatusT("store.status.placedComponent", {
        componentName: comp.halComponentName,
      });
    },

    addLabel(scope: LabelScope): void {
      const activeSheetId = deps.getActiveSheetId();
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const used = new Set(sheet.labels.map((l) => l.name));
        const base =
          scope === "global"
            ? "global_sig"
            : scope === "hierarchical"
              ? "sheet_sig"
              : "sig";
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
      const activeSheetId = deps.getActiveSheetId();
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
      if (createdId) deps.setSelection({ kind: "comment", id: createdId });
      deps.setStatusT("store.status.addedComment");
    },

    addSheetPort(
      direction: "in" | "out" | "io",
      type: "bit" | "float" | "s32" | "u32" | "s64" | "u64" | "port",
    ): void {
      const activeSheetId = deps.getActiveSheetId();
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
      const activeSheetId = deps.getActiveSheetId();
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const node = sheet.nodes.find((n) => n.id === nodeId);
        if (node) node.position = { x, y };
      });
    },

    moveLabel(labelId: string, x: number, y: number): void {
      const activeSheetId = deps.getActiveSheetId();
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const label = sheet.labels.find((l) => l.id === labelId);
        if (label) label.position = { x, y };
      });
    },

    moveComment(commentId: string, x: number, y: number): void {
      const activeSheetId = deps.getActiveSheetId();
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const comment = sheet.comments.find((c) => c.id === commentId);
        if (comment) comment.position = { x, y };
      });
    },

    moveSheetPort(portId: string, x: number, y: number): void {
      const activeSheetId = deps.getActiveSheetId();
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const port = sheet.ports.find((p) => p.id === portId);
        if (port) port.position = { x, y };
      });
    },

    renameNode(nodeId: string, instanceName: string): void {
      const activeSheetId = deps.getActiveSheetId();
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const node = sheet.nodes.find((n) => n.id === nodeId);
        if (node) node.instanceName = instanceName.trim() || node.instanceName;
      });
    },

    updateNodeParam(nodeId: string, paramKey: string, value: string): void {
      const activeSheetId = deps.getActiveSheetId();
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const node = sheet.nodes.find((n) => n.id === nodeId);
        if (node && node.kind === "component") {
          node.paramValues[paramKey] = value;
        }
      });
    },

    updateNodePinInitialValue(
      nodeId: string,
      pinKey: string,
      value: string,
    ): void {
      const activeSheetId = deps.getActiveSheetId();
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

    updateLabel(
      labelId: string,
      patch: { name?: string; scope?: LabelScope; rotation?: number },
    ): void {
      const activeSheetId = deps.getActiveSheetId();
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const label = sheet.labels.find((l) => l.id === labelId);
        if (!label) return;
        if (patch.name !== undefined) label.name = patch.name;
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
      const activeSheetId = deps.getActiveSheetId();
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
      const activeSheetId = deps.getActiveSheetId();
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const port = sheet.ports.find((p) => p.id === portId);
        if (!port) return;
        if (patch.name !== undefined) port.name = patch.name;
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
