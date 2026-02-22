import { createStore, unwrap } from "solid-js/store";
import { createId, slugify } from "../../shared/id";
import { getSheet, resolveEndpointInSheet } from "../../shared/graph";
import { createSheet, createSheetPortDraft } from "../../shared/project";
import { validateDirectConnection } from "../../shared/validation";
import type {
  ComponentNode,
  HalValueType,
  LabelScope,
  NochalProject,
  SheetDefinition,
  SheetEndpointRef,
  SheetNode,
  SheetNodeInstance
} from "../../shared/types";

export type Selection =
  | { kind: "node"; id: string }
  | { kind: "label"; id: string }
  | { kind: "sheet-port"; id: string }
  | null;

export interface EditorState {
  project: NochalProject;
  filePath: string | null;
  activeSheetId: string;
  selection: Selection;
  pendingEndpoint: SheetEndpointRef | null;
  status: string;
  exportWarnings: string[];
}

function cloneProject(project: NochalProject): NochalProject {
  return structuredClone(unwrap(project));
}

function snapshotProjectForIpc(project: NochalProject): NochalProject {
  return structuredClone(unwrap(project));
}

function nextName(base: string, used: Set<string>): string {
  if (!used.has(base)) return base;
  let i = 2;
  while (used.has(`${base}${i}`)) i += 1;
  return `${base}${i}`;
}

function defaultNodePosition(sheet: SheetDefinition): { x: number; y: number } {
  const index = sheet.nodes.length;
  return {
    x: 120 + (index % 4) * 280,
    y: 100 + Math.floor(index / 4) * 180
  };
}

function defaultLabelPosition(sheet: SheetDefinition): { x: number; y: number } {
  const index = sheet.labels.length;
  return { x: 160 + (index % 5) * 160, y: 520 + Math.floor(index / 5) * 70 };
}

function defaultPortPosition(sheet: SheetDefinition, side: "left" | "right" | "bottom"): { x: number; y: number } {
  const count = sheet.ports.filter((p) => p.side === side).length;
  if (side === "left") return { x: 20, y: 120 + count * 50 };
  if (side === "right") return { x: 1380, y: 120 + count * 50 };
  return { x: 220 + count * 120, y: 740 };
}

function findNode(sheet: SheetDefinition, nodeId: string): SheetNodeInstance | undefined {
  return sheet.nodes.find((n) => n.id === nodeId);
}

function ensureInstanceName(sheet: SheetDefinition, preferred: string): string {
  const used = new Set(sheet.nodes.map((n) => n.instanceName));
  return nextName(slugify(preferred).replace(/-/g, "_"), used);
}

function sheetContainsSheet(project: NochalProject, rootSheetId: string, searchSheetId: string, seen = new Set<string>()): boolean {
  if (rootSheetId === searchSheetId) return true;
  if (seen.has(rootSheetId)) return false;
  seen.add(rootSheetId);
  const sheet = project.sheets[rootSheetId];
  if (!sheet) return false;
  for (const node of sheet.nodes) {
    if (node.kind !== "sheet") continue;
    if (sheetContainsSheet(project, node.sheetId, searchSheetId, seen)) return true;
  }
  return false;
}

function syncProjectUi(project: NochalProject, activeSheetId: string): void {
  project.ui.activeSheetId = activeSheetId;
}

export function createEditorStore(initialProject: NochalProject) {
  const [state, setState] = createStore<EditorState>({
    project: initialProject,
    filePath: null,
    activeSheetId: initialProject.ui.activeSheetId,
    selection: null,
    pendingEndpoint: null,
    status: "Ready",
    exportWarnings: []
  });

  const withProject = (mutate: (project: NochalProject) => void) => {
    const next = cloneProject(state.project);
    mutate(next);
    syncProjectUi(next, state.activeSheetId);
    setState("project", next);
  };

  const actions = {
    getCurrentSheet(): SheetDefinition {
      return getSheet(state.project, state.activeSheetId);
    },

    setStatus(message: string): void {
      setState("status", message);
    },

    setActiveSheet(sheetId: string): void {
      if (!state.project.sheets[sheetId]) return;
      setState("activeSheetId", sheetId);
      setState("project", "ui", "activeSheetId", sheetId);
      setState("selection", null);
      setState("pendingEndpoint", null);
    },

    select(sel: Selection): void {
      setState("selection", sel);
    },

    clearPendingEndpoint(): void {
      setState("pendingEndpoint", null);
    },

    async newProject(): Promise<void> {
      const project = await window.nochal.newProject();
      setState({
        project,
        filePath: null,
        activeSheetId: project.ui.activeSheetId,
        selection: null,
        pendingEndpoint: null,
        status: "Created new project",
        exportWarnings: []
      });
    },

    async openProject(): Promise<void> {
      const result = await window.nochal.openProject();
      if (!result) return;
      setState({
        project: result.project,
        filePath: result.filePath,
        activeSheetId: result.project.ui.activeSheetId,
        selection: null,
        pendingEndpoint: null,
        status: `Opened ${result.filePath}`,
        exportWarnings: []
      });
    },

    async saveProject(): Promise<void> {
      const result = await window.nochal.saveProject(snapshotProjectForIpc(state.project), state.filePath);
      if (!result) return;
      setState("filePath", result.filePath);
      setState("status", `Saved ${result.filePath}`);
    },

    async exportHal(): Promise<void> {
      const result = await window.nochal.exportHal(snapshotProjectForIpc(state.project), null);
      if (!result) return;
      setState("exportWarnings", result.warnings);
      setState("status", `Exported HAL: ${result.filePath}`);
    },

    async importCompFile(): Promise<void> {
      const imported = await window.nochal.importCompFile();
      if (!imported) return;
      withProject((project) => {
        project.library.components[imported.id] = imported;
      });
      setState("status", `Imported .comp: ${imported.halComponentName}`);
    },

    async importCompDirectory(): Promise<void> {
      const dirPath = window.prompt("Directory containing .comp files", "linuxcnc/src/hal/components");
      if (!dirPath) return;
      const result = await window.nochal.scanCompDir(dirPath);
      withProject((project) => {
        for (const imported of result.imported) {
          project.library.components[imported.id] = imported;
        }
      });
      setState(
        "status",
        `Imported ${result.imported.length} components (${result.errors.length} errors)`
      );
      if (result.errors.length > 0) {
        setState(
          "exportWarnings",
          result.errors.map((e) => `Import error ${e.filePath}: ${e.error}`)
        );
      }
    },

    addComponentNode(componentId: string): void {
      const comp = state.project.library.components[componentId];
      if (!comp) return;
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        const instanceName = ensureInstanceName(sheet, comp.halComponentName);
        const node: ComponentNode = {
          id: createId("node"),
          kind: "component",
          componentId,
          instanceName,
          position: defaultNodePosition(sheet),
          paramValues: Object.fromEntries(
            comp.params
              .filter((p) => p.defaultValue !== undefined)
              .map((p) => [p.key, p.defaultValue ?? ""])
          )
        };
        sheet.nodes.push(node);
      });
      setState("status", `Placed component ${comp.halComponentName}`);
    },

    addSheetDefinition(): void {
      const current = actions.getCurrentSheet();
      const allNames = new Set(Object.values(state.project.sheets).map((s) => s.name));
      const name = nextName("Sheet", allNames);
      const child = createSheet(name, current.id);

      withProject((project) => {
        project.sheets[child.id] = child;
        const sheet = getSheet(project, state.activeSheetId);
        const instanceName = ensureInstanceName(sheet, name);
        const node: SheetNode = {
          id: createId("node"),
          kind: "sheet",
          sheetId: child.id,
          instanceName,
          position: defaultNodePosition(sheet)
        };
        sheet.nodes.push(node);
      });

      setState("status", `Created subsheet ${name}`);
    },

    placeExistingSheetNode(sheetIdToPlace: string): void {
      if (sheetIdToPlace === state.activeSheetId) {
        setState("status", "Cannot place a sheet inside itself");
        return;
      }
      if (sheetContainsSheet(state.project, sheetIdToPlace, state.activeSheetId)) {
        setState("status", "Cannot create recursive sheet hierarchy");
        return;
      }
      const target = state.project.sheets[sheetIdToPlace];
      if (!target) return;
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        const node: SheetNode = {
          id: createId("node"),
          kind: "sheet",
          sheetId: sheetIdToPlace,
          instanceName: ensureInstanceName(sheet, target.name),
          position: defaultNodePosition(sheet)
        };
        sheet.nodes.push(node);
      });
      setState("status", `Placed subsheet ${target.name}`);
    },

    enterSelectedSheet(): void {
      const selection = state.selection;
      if (!selection || selection.kind !== "node") return;
      const sheet = actions.getCurrentSheet();
      const node = findNode(sheet, selection.id);
      if (!node || node.kind !== "sheet") return;
      actions.setActiveSheet(node.sheetId);
    },

    goToParentSheet(): void {
      const current = actions.getCurrentSheet();
      if (!current.parentSheetId) return;
      actions.setActiveSheet(current.parentSheetId);
    },

    addLabel(scope: LabelScope): void {
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        const used = new Set(sheet.labels.map((l) => l.name));
        const base =
          scope === "global" ? "global_sig" : scope === "hierarchical" ? "sheet_sig" : "sig";
        const name = nextName(base, used);
        sheet.labels.push({
          id: createId("label"),
          name,
          scope,
          position: defaultLabelPosition(sheet)
        });
      });
      setState("status", `Added ${scope} label`);
    },

    addSheetPort(direction: "in" | "out" | "io", type: "bit" | "float" | "s32" | "u32" | "s64" | "u64" | "port"): void {
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        const used = new Set(sheet.ports.map((p) => p.name));
        const base = direction === "in" ? "in_sig" : direction === "out" ? "out_sig" : "io_sig";
        const name = nextName(base, used);
        const port = createSheetPortDraft(name, direction, type);
        port.position = defaultPortPosition(sheet, port.side);
        sheet.ports.push(port);
      });
      setState("status", "Added sheet port");
    },

    moveNode(nodeId: string, x: number, y: number): void {
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        const node = sheet.nodes.find((n) => n.id === nodeId);
        if (node) node.position = { x, y };
      });
    },

    moveLabel(labelId: string, x: number, y: number): void {
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        const label = sheet.labels.find((l) => l.id === labelId);
        if (label) label.position = { x, y };
      });
    },

    moveSheetPort(portId: string, x: number, y: number): void {
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        const port = sheet.ports.find((p) => p.id === portId);
        if (port) port.position = { x, y };
      });
    },

    renameNode(nodeId: string, instanceName: string): void {
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        const node = sheet.nodes.find((n) => n.id === nodeId);
        if (node) node.instanceName = instanceName.trim() || node.instanceName;
      });
    },

    updateNodeParam(nodeId: string, paramKey: string, value: string): void {
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        const node = sheet.nodes.find((n) => n.id === nodeId);
        if (node && node.kind === "component") {
          node.paramValues[paramKey] = value;
        }
      });
    },

    updateLabel(labelId: string, patch: { name?: string; scope?: LabelScope }): void {
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        const label = sheet.labels.find((l) => l.id === labelId);
        if (!label) return;
        if (patch.name !== undefined) label.name = patch.name;
        if (patch.scope !== undefined) label.scope = patch.scope;
      });
    },

    updateSheetPort(
      portId: string,
      patch: { name?: string; direction?: "in" | "out" | "io"; type?: HalValueType; side?: "left" | "right" | "bottom" }
    ): void {
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        const port = sheet.ports.find((p) => p.id === portId);
        if (!port) return;
        if (patch.name !== undefined) port.name = patch.name;
        if (patch.direction !== undefined) port.direction = patch.direction;
        if (patch.type !== undefined) port.type = patch.type;
        if (patch.side !== undefined) port.side = patch.side;
      });
    },

    removeSelection(): void {
      const sel = state.selection;
      if (!sel) return;
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        if (sel.kind === "node") {
          sheet.nodes = sheet.nodes.filter((n) => n.id !== sel.id);
          sheet.directConnections = sheet.directConnections.filter(
            (c) =>
              !(c.a.kind === "node-pin" && c.a.nodeId === sel.id) &&
              !(c.b.kind === "node-pin" && c.b.nodeId === sel.id)
          );
          sheet.labelAnchors = sheet.labelAnchors.filter((a) => !(a.endpoint.kind === "node-pin" && a.endpoint.nodeId === sel.id));
        } else if (sel.kind === "label") {
          sheet.labels = sheet.labels.filter((l) => l.id !== sel.id);
          sheet.labelAnchors = sheet.labelAnchors.filter((a) => a.labelId !== sel.id);
        } else if (sel.kind === "sheet-port") {
          sheet.ports = sheet.ports.filter((p) => p.id !== sel.id);
          sheet.directConnections = sheet.directConnections.filter(
            (c) =>
              !(c.a.kind === "sheet-port" && c.a.portId === sel.id) &&
              !(c.b.kind === "sheet-port" && c.b.portId === sel.id)
          );
          sheet.labelAnchors = sheet.labelAnchors.filter((a) => !(a.endpoint.kind === "sheet-port" && a.endpoint.portId === sel.id));
        }
      });
      setState("selection", null);
      setState("pendingEndpoint", null);
      setState("status", "Removed selection");
    },

    endpointClick(endpoint: SheetEndpointRef): void {
      const pending = state.pendingEndpoint;
      if (!pending) {
        setState("pendingEndpoint", endpoint);
        try {
          const info = resolveEndpointInSheet(state.project, state.activeSheetId, endpoint);
          setState("status", `Selected endpoint ${info.name} (${info.direction} ${info.type})`);
        } catch {
          setState("status", "Selected endpoint");
        }
        return;
      }

      const validation = validateDirectConnection(
        state.project,
        state.activeSheetId,
        pending,
        endpoint,
        actions.getCurrentSheet().directConnections
      );
      if (!validation.ok) {
        setState("status", validation.reason ?? "Invalid connection");
        setState("pendingEndpoint", endpoint);
        return;
      }

      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        sheet.directConnections.push({
          id: createId("conn"),
          a: pending,
          b: endpoint
        });
      });
      setState("pendingEndpoint", null);
      setState("status", "Connected endpoints");
    },

    anchorPendingToLabel(labelId: string): void {
      const pending = state.pendingEndpoint;
      if (!pending) return;
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        const exists = sheet.labelAnchors.some((a) => a.labelId === labelId && JSON.stringify(a.endpoint) === JSON.stringify(pending));
        if (!exists) {
          sheet.labelAnchors.push({
            id: createId("anchor"),
            labelId,
            endpoint: pending
          });
        }
      });
      setState("pendingEndpoint", null);
      setState("status", "Attached endpoint to label");
    },

    removeDirectConnection(connectionId: string): void {
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        sheet.directConnections = sheet.directConnections.filter((c) => c.id !== connectionId);
      });
      setState("status", "Removed connection");
    },

    removeLabelAnchor(anchorId: string): void {
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        sheet.labelAnchors = sheet.labelAnchors.filter((a) => a.id !== anchorId);
      });
      setState("status", "Removed label anchor");
    }
  };

  return { state, setState, actions };
}
