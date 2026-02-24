import { createStore, unwrap } from "solid-js/store";
import {
  endpointKey,
  getSheet,
  resolveEndpointInSheet,
} from "../../shared/graph";
import { createId, slugify } from "../../shared/id";
import { createSheet, createSheetPortDraft } from "../../shared/project";
import type {
  ComponentDefinition,
  ComponentNode,
  ComponentStore,
  HalValueType,
  LabelScope,
  NoHALProject,
  SheetDefinition,
  SheetEndpointRef,
  SheetNode,
  SheetNodeInstance,
  XY,
} from "../../shared/types";
import { validateDirectConnection } from "../../shared/validation";
import type { TranslationKey } from "../i18n";

export type Selection =
  | { kind: "node"; id: string }
  | { kind: "label"; id: string }
  | { kind: "sheet-port"; id: string }
  | { kind: "wire-connection"; id: string }
  | { kind: "multi"; nodeIds: string[]; labelIds: string[]; portIds: string[] }
  | null;

export interface EditorState {
  project: NoHALProject;
  componentStore: ComponentStore;
  filePath: string | null;
  activeSheetId: string;
  selection: Selection;
  pendingEndpoint: SheetEndpointRef | null;
  pendingWirePoints: XY[];
  status: string;
  exportWarnings: string[];
}

type TranslationParams = Record<
  string,
  string | number | boolean | null | undefined
>;

type TranslateFn = (key: TranslationKey, params?: TranslationParams) => string;

function cloneProject(project: NoHALProject): NoHALProject {
  return structuredClone(unwrap(project));
}

function cloneComponentStore(store: ComponentStore): ComponentStore {
  return structuredClone(unwrap(store));
}

function snapshotProjectForIpc(project: NoHALProject): NoHALProject {
  return structuredClone(unwrap(project));
}

function normalizeRotationDegrees(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const normalized = value % 360;
  return Object.is(normalized, -0) ? 0 : normalized;
}

function createEmptyComponentStore(): ComponentStore {
  return {
    format: "nohal-component-store",
    version: 2,
    sources: {},
    components: {},
  };
}

function applyComponentStoreToProject(
  project: NoHALProject,
  componentStore: ComponentStore,
): void {
  for (const entry of Object.values(componentStore.components)) {
    project.library.components[entry.componentId] = entry.parsed;
    reconcileComponentNodesForDefinition(
      project,
      entry.componentId,
      entry.parsed,
    );
  }
}

function projectUsesComponentDefinition(
  project: NoHALProject,
  componentId: string,
): boolean {
  return Object.values(project.sheets).some((sheet) =>
    sheet.nodes.some(
      (node) => node.kind === "component" && node.componentId === componentId,
    ),
  );
}

function pruneMissingStoredComponentsFromProject(
  project: NoHALProject,
  componentStore: ComponentStore,
): void {
  for (const [componentId, component] of Object.entries(
    project.library.components,
  )) {
    if (component.source !== "comp") continue;
    if (componentId in componentStore.components) continue;
    if (projectUsesComponentDefinition(project, componentId)) continue;
    delete project.library.components[componentId];
  }
}

function getComponentSourceDisplayPath(
  componentStore: ComponentStore,
  sourceId: string,
): string {
  const source = componentStore.sources[sourceId];
  if (!source) return sourceId;
  return source.kind === "comp-dir" ? source.dirPath : source.filePath;
}

function reconcileComponentNodesForDefinition(
  project: NoHALProject,
  componentId: string,
  component: ComponentDefinition,
): void {
  const validParamKeys = new Set(component.params.map((param) => param.key));
  const validPinKeys = new Set(component.pins.map((pin) => pin.key));
  const defaultParams = Object.fromEntries(
    component.params
      .filter((param) => param.defaultValue !== undefined)
      .map((param) => [param.key, param.defaultValue ?? ""]),
  );

  for (const sheet of Object.values(project.sheets)) {
    for (const node of sheet.nodes) {
      if (node.kind !== "component" || node.componentId !== componentId)
        continue;
      const nextValues: Record<string, string> = {};
      for (const [key, value] of Object.entries(node.paramValues)) {
        if (validParamKeys.has(key)) nextValues[key] = value;
      }
      for (const [key, value] of Object.entries(defaultParams)) {
        if (!(key in nextValues)) nextValues[key] = value;
      }
      node.paramValues = nextValues;

      const currentPinInitialValues = node.pinInitialValues ?? {};
      const nextPinInitialValues: Record<string, string> = {};
      for (const [key, value] of Object.entries(currentPinInitialValues)) {
        if (!validPinKeys.has(key)) continue;
        if (!value.trim()) continue;
        nextPinInitialValues[key] = value;
      }
      if (Object.keys(nextPinInitialValues).length > 0) {
        node.pinInitialValues = nextPinInitialValues;
      } else {
        delete node.pinInitialValues;
      }
    }
  }
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
    y: 100 + Math.floor(index / 4) * 180,
  };
}

function defaultLabelPosition(sheet: SheetDefinition): {
  x: number;
  y: number;
} {
  const index = sheet.labels.length;
  return { x: 160 + (index % 5) * 160, y: 520 + Math.floor(index / 5) * 70 };
}

function defaultPortPosition(
  sheet: SheetDefinition,
  side: "left" | "right" | "top" | "bottom",
): { x: number; y: number } {
  const count = sheet.ports.filter((p) => p.side === side).length;
  if (side === "left") return { x: 20, y: 120 + count * 50 };
  if (side === "right") return { x: 1380, y: 120 + count * 50 };
  if (side === "top") return { x: 220 + count * 120, y: 20 };
  return { x: 220 + count * 120, y: 740 };
}

function forcedPortSideForDirection(
  direction: "in" | "out" | "io",
): "left" | "right" | "top" {
  if (direction === "in") return "right";
  if (direction === "out") return "left";
  return "top";
}

function findNode(
  sheet: SheetDefinition,
  nodeId: string,
): SheetNodeInstance | undefined {
  return sheet.nodes.find((n) => n.id === nodeId);
}

function ensureInstanceName(sheet: SheetDefinition, preferred: string): string {
  const used = new Set(sheet.nodes.map((n) => n.instanceName));
  return nextName(slugify(preferred).replace(/-/g, "_"), used);
}

function sheetContainsSheet(
  project: NoHALProject,
  rootSheetId: string,
  searchSheetId: string,
  seen = new Set<string>(),
): boolean {
  if (rootSheetId === searchSheetId) return true;
  if (seen.has(rootSheetId)) return false;
  seen.add(rootSheetId);
  const sheet = project.sheets[rootSheetId];
  if (!sheet) return false;
  for (const node of sheet.nodes) {
    if (node.kind !== "sheet") continue;
    if (sheetContainsSheet(project, node.sheetId, searchSheetId, seen))
      return true;
  }
  return false;
}

function isSheetPlacedInProject(
  project: NoHALProject,
  sheetId: string,
): boolean {
  return Object.values(project.sheets).some((sheet) =>
    sheet.nodes.some(
      (node) => node.kind === "sheet" && node.sheetId === sheetId,
    ),
  );
}

function pruneSheetNodeReferences(
  sheet: SheetDefinition,
  removedNodeIds: ReadonlySet<string>,
): void {
  if (removedNodeIds.size === 0) return;

  sheet.directConnections = sheet.directConnections.filter(
    (c) =>
      !(c.a.kind === "node-pin" && removedNodeIds.has(c.a.nodeId)) &&
      !(c.b.kind === "node-pin" && removedNodeIds.has(c.b.nodeId)),
  );

  sheet.labelAnchors = sheet.labelAnchors.filter(
    (a) =>
      !(
        a.endpoint.kind === "node-pin" && removedNodeIds.has(a.endpoint.nodeId)
      ),
  );

  if (!sheet.hal?.addfQueue) return;
  sheet.hal.addfQueue = sheet.hal.addfQueue.filter(
    (nodeId) => !removedNodeIds.has(nodeId),
  );
  if (sheet.hal.addfQueue.length === 0) delete sheet.hal.addfQueue;
  if (Object.keys(sheet.hal).length === 0) delete sheet.hal;
}

function collectSheetSubtreeIds(
  project: NoHALProject,
  rootSheetId: string,
): Set<string> {
  const deleted = new Set<string>();
  const queue = [rootSheetId];
  while (queue.length > 0) {
    const sheetId = queue.shift();
    if (!sheetId || deleted.has(sheetId) || !project.sheets[sheetId]) continue;
    deleted.add(sheetId);
    for (const sheet of Object.values(project.sheets)) {
      if (sheet.parentSheetId === sheetId) queue.push(sheet.id);
    }
  }
  return deleted;
}

function removeSheetNodeReferencesForDeletedSheets(
  project: NoHALProject,
  deletedSheetIds: ReadonlySet<string>,
): void {
  for (const sheet of Object.values(project.sheets)) {
    const removedNodeIds = new Set<string>();
    sheet.nodes = sheet.nodes.filter((node) => {
      if (node.kind !== "sheet") return true;
      if (!deletedSheetIds.has(node.sheetId)) return true;
      removedNodeIds.add(node.id);
      return false;
    });
    pruneSheetNodeReferences(sheet, removedNodeIds);
  }
}

function syncProjectUi(project: NoHALProject, activeSheetId: string): void {
  project.ui.activeSheetId = activeSheetId;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isNodeEndpointInSet(
  endpoint: SheetEndpointRef,
  nodeIds: ReadonlySet<string>,
): boolean {
  return endpoint.kind === "node-pin" && nodeIds.has(endpoint.nodeId);
}

function directConnectionPairKey(
  a: SheetEndpointRef,
  b: SheetEndpointRef,
): string {
  const aKey = endpointKey(a);
  const bKey = endpointKey(b);
  return aKey < bKey ? `${aKey}|${bKey}` : `${bKey}|${aKey}`;
}

function cloneEndpoint(endpoint: SheetEndpointRef): SheetEndpointRef {
  return endpoint.kind === "node-pin"
    ? { kind: "node-pin", nodeId: endpoint.nodeId, pinKey: endpoint.pinKey }
    : { kind: "sheet-port", portId: endpoint.portId };
}

function selectionBoundsForNodesAndLabels(
  nodes: SheetNodeInstance[],
  labels: { position: XY }[],
): XY {
  const points = [
    ...nodes.map((node) => node.position),
    ...labels.map((label) => label.position),
  ];
  if (points.length === 0) return { x: 120, y: 100 };
  let minX = points[0].x;
  let minY = points[0].y;
  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
  }
  return { x: minX, y: minY };
}

export function createEditorStore(
  initialProject: NoHALProject,
  t: TranslateFn,
) {
  const [state, setState] = createStore<EditorState>({
    project: initialProject,
    componentStore: createEmptyComponentStore(),
    filePath: null,
    activeSheetId: initialProject.ui.activeSheetId,
    selection: null,
    pendingEndpoint: null,
    pendingWirePoints: [],
    status: t("store.status.ready"),
    exportWarnings: [],
  });

  const withProject = (mutate: (project: NoHALProject) => void) => {
    const next = cloneProject(state.project);
    mutate(next);
    syncProjectUi(next, state.activeSheetId);
    setState("project", next);
  };

  const withComponentStore = (
    mutate: (componentStore: ComponentStore) => void,
  ) => {
    const next = cloneComponentStore(state.componentStore);
    mutate(next);
    setState("componentStore", next);
  };

  const replaceComponentStore = (componentStore: ComponentStore) => {
    setState("componentStore", componentStore);
    withProject((project) => {
      pruneMissingStoredComponentsFromProject(project, componentStore);
      applyComponentStoreToProject(project, componentStore);
    });
  };

  const replaceProjectState = (
    project: NoHALProject,
    filePath: string | null,
    status: string,
  ): void => {
    applyComponentStoreToProject(project, state.componentStore);
    setState({
      project,
      componentStore: state.componentStore,
      filePath,
      activeSheetId: project.ui.activeSheetId,
      selection: null,
      pendingEndpoint: null,
      pendingWirePoints: [],
      status,
      exportWarnings: [],
    });
  };

  const setStatusT = (key: TranslationKey, params?: TranslationParams) => {
    setState("status", t(key, params));
  };

  const actions = {
    getCurrentSheet(): SheetDefinition {
      return getSheet(state.project, state.activeSheetId);
    },

    setStatus(message: string): void {
      setState("status", message);
    },

    setSheetAddfQueue(sheetId: string, nodeOrder: string[]): void {
      const normalized = Array.from(
        new Set(nodeOrder.map((v) => v.trim()).filter(Boolean)),
      );
      withProject((project) => {
        const sheet = getSheet(project, sheetId);
        if (!sheet.hal) sheet.hal = {};
        if (normalized.length > 0) sheet.hal.addfQueue = normalized;
        else delete sheet.hal?.addfQueue;
        if (sheet.hal && Object.keys(sheet.hal).length === 0) delete sheet.hal;
      });
      setStatusT("store.status.updatedSheetAddfQueue", {
        count: normalized.length,
      });
    },

    async loadComponentStore(): Promise<void> {
      const componentStore = await window.nohal.loadComponentStore();
      replaceComponentStore(componentStore);
    },

    setActiveSheet(sheetId: string): void {
      if (!state.project.sheets[sheetId]) return;
      setState("activeSheetId", sheetId);
      setState("project", "ui", "activeSheetId", sheetId);
      setState("selection", null);
      setState("pendingEndpoint", null);
      setState("pendingWirePoints", []);
    },

    select(sel: Selection): void {
      setState("selection", sel);
    },

    clearPendingEndpoint(): void {
      setState("pendingEndpoint", null);
      setState("pendingWirePoints", []);
    },

    addPendingWirePoint(point: XY): void {
      if (!state.pendingEndpoint) return;
      setState("pendingWirePoints", (points) => [...points, point]);
      setStatusT("store.status.addedWireWaypoint", {
        count: state.pendingWirePoints.length + 1,
      });
    },

    async newProject(): Promise<boolean> {
      try {
        const project = await window.nohal.newProject();
        replaceProjectState(project, null, t("store.status.createdNewProject"));
        return true;
      } catch (error) {
        setStatusT("store.status.failedCreateProject", {
          error: toErrorMessage(error),
        });
        return false;
      }
    },

    openPreparedProject(
      project: NoHALProject,
      options?: {
        filePath?: string | null;
        status?: string;
        warnings?: string[];
      },
    ): boolean {
      try {
        replaceProjectState(
          project,
          options?.filePath ?? null,
          options?.status ?? t("store.status.openedProject"),
        );
        if (options?.warnings) {
          setState("exportWarnings", [...options.warnings]);
        }
        return true;
      } catch (error) {
        setStatusT("store.status.failedLoadPreparedProject", {
          error: toErrorMessage(error),
        });
        return false;
      }
    },

    async openProject(): Promise<boolean> {
      try {
        const result = await window.nohal.openProject();
        if (!result) return false;
        replaceProjectState(
          result.project,
          result.filePath,
          t("store.status.openedFile", { filePath: result.filePath }),
        );
        return true;
      } catch (error) {
        setStatusT("store.status.failedOpenProject", {
          error: toErrorMessage(error),
        });
        return false;
      }
    },

    async openProjectAt(filePath: string): Promise<boolean> {
      try {
        const result = await window.nohal.openProjectAt(filePath);
        replaceProjectState(
          result.project,
          result.filePath,
          t("store.status.openedFile", { filePath: result.filePath }),
        );
        return true;
      } catch (error) {
        setStatusT("store.status.failedOpenProject", {
          error: toErrorMessage(error),
        });
        return false;
      }
    },

    async saveProject(): Promise<void> {
      const result = await window.nohal.saveProject(
        snapshotProjectForIpc(state.project),
        state.filePath,
      );
      if (!result) return;
      setState("filePath", result.filePath);
      setStatusT("store.status.savedFile", { filePath: result.filePath });
    },

    async exportHal(): Promise<void> {
      const result = await window.nohal.exportHal(
        snapshotProjectForIpc(state.project),
        null,
      );
      if (!result) return;
      setState("exportWarnings", result.warnings);
      setStatusT("store.status.exportedHal", { filePath: result.filePath });
    },

    async importCompFile(): Promise<void> {
      const entry = await window.nohal.importCompFileToStore();
      if (!entry) return;
      const componentStore = await window.nohal.loadComponentStore();
      replaceComponentStore(componentStore);
      setStatusT("store.status.importedCompToStore", {
        componentName: entry.parsed.halComponentName,
      });
    },

    async addComponentDirSource(): Promise<void> {
      const result = await window.nohal.addCompDirSourceToStore();
      if (!result) return;
      const componentStore = await window.nohal.loadComponentStore();
      replaceComponentStore(componentStore);
      setStatusT("store.status.addedDirSource", {
        path: getComponentSourceDisplayPath(componentStore, result.sourceId),
        components: result.entries.length,
        removed: result.removedComponentIds.length,
        errors: result.errors.length,
      });
      if (result.errors.length > 0) {
        setState(
          "exportWarnings",
          result.errors.map((e) =>
            t("store.warning.importError", {
              filePath: e.filePath,
              error: e.error,
            }),
          ),
        );
      }
    },

    async refreshComponentSource(sourceId: string): Promise<void> {
      try {
        const result =
          await window.nohal.refreshComponentSourceInStore(sourceId);
        const componentStore = await window.nohal.loadComponentStore();
        replaceComponentStore(componentStore);
        setStatusT("store.status.refreshedSource", {
          path: getComponentSourceDisplayPath(componentStore, sourceId),
          components: result.entries.length,
          removed: result.removedComponentIds.length,
          errors: result.errors.length,
        });
        if (result.errors.length > 0) {
          setState(
            "exportWarnings",
            result.errors.map((e) =>
              t("store.warning.importError", {
                filePath: e.filePath,
                error: e.error,
              }),
            ),
          );
        }
      } catch (error) {
        setStatusT("store.status.sourceRefreshFailed", {
          error: toErrorMessage(error),
        });
      }
    },

    async deleteComponentSource(sourceId: string): Promise<void> {
      try {
        const previousPath = getComponentSourceDisplayPath(
          state.componentStore,
          sourceId,
        );
        const result =
          await window.nohal.deleteComponentSourceFromStore(sourceId);
        const componentStore = await window.nohal.loadComponentStore();
        replaceComponentStore(componentStore);
        setStatusT("store.status.deletedSource", {
          path: previousPath,
          removed: result.removedComponentIds.length,
        });
      } catch (error) {
        setStatusT("store.status.deleteSourceFailed", {
          error: toErrorMessage(error),
        });
      }
    },

    async refreshComponentInStore(componentId: string): Promise<void> {
      const current = state.project.library.components[componentId];
      if (!current || current.source !== "comp") {
        setStatusT("store.status.selectedComponentNotStoredComp");
        return;
      }

      try {
        const entry = await window.nohal.refreshComponentInStore(componentId);
        withComponentStore((componentStore) => {
          componentStore.components[entry.componentId] = entry;
        });
        withProject((project) => {
          project.library.components[entry.componentId] = entry.parsed;
          reconcileComponentNodesForDefinition(
            project,
            entry.componentId,
            entry.parsed,
          );
        });
        setStatusT("store.status.refreshedComponent", {
          componentName: entry.parsed.halComponentName,
        });
      } catch (error) {
        setStatusT("store.status.refreshFailed", {
          error: toErrorMessage(error),
        });
      }
    },

    addComponentNode(
      componentId: string,
      position?: { x: number; y: number },
    ): void {
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
          position: position ?? defaultNodePosition(sheet),
          paramValues: Object.fromEntries(
            comp.params
              .filter((p) => p.defaultValue !== undefined)
              .map((p) => [p.key, p.defaultValue ?? ""]),
          ),
        };
        sheet.nodes.push(node);
      });
      setStatusT("store.status.placedComponent", {
        componentName: comp.halComponentName,
      });
    },

    addSheetDefinition(): void {
      const current = actions.getCurrentSheet();
      const allNames = new Set(
        Object.values(state.project.sheets).map((s) => s.name),
      );
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
          position: defaultNodePosition(sheet),
        };
        sheet.nodes.push(node);
      });

      setStatusT("store.status.createdSubsheet", { name });
    },

    putSelectionIntoSubsheet(): void {
      const selection = state.selection;
      if (!selection || selection.kind !== "multi") return;

      const selectedNodeIds = new Set(selection.nodeIds);
      const selectedLabelIds = new Set(selection.labelIds);
      const selectedPortIds = new Set(selection.portIds);
      if (
        selectedNodeIds.size === 0 &&
        selectedLabelIds.size === 0 &&
        selectedPortIds.size > 0
      ) {
        setStatusT("store.status.cannotSubsheetOnlyPortsSelection");
        return;
      }

      const next = cloneProject(state.project);
      const parentSheet = next.sheets[state.activeSheetId];
      if (!parentSheet) return;

      const movedNodes = parentSheet.nodes.filter((n) =>
        selectedNodeIds.has(n.id),
      );
      const movedLabels = parentSheet.labels.filter((l) =>
        selectedLabelIds.has(l.id),
      );
      if (movedNodes.length === 0 && movedLabels.length === 0) {
        setStatusT("store.status.cannotSubsheetEmptySelection");
        return;
      }

      const movedNodeIdSet = new Set(movedNodes.map((n) => n.id));
      const movedLabelIdSet = new Set(movedLabels.map((l) => l.id));

      const allNames = new Set(Object.values(next.sheets).map((s) => s.name));
      const childName = nextName("Sheet", allNames);
      const child = createSheet(childName, parentSheet.id);
      const childPortNames = new Set<string>();
      const childPortsByEndpointKey = new Map<string, { id: string }>();

      const childNodePosition = selectionBoundsForNodesAndLabels(
        movedNodes,
        movedLabels,
      );
      const subsheetNodeId = createId("node");
      const subsheetNode: SheetNode = {
        id: subsheetNodeId,
        kind: "sheet",
        sheetId: child.id,
        instanceName: ensureInstanceName(parentSheet, childName),
        position: { x: childNodePosition.x, y: childNodePosition.y },
      };

      const ensureBoundaryPortForEndpoint = (endpoint: SheetEndpointRef) => {
        const key = endpointKey(endpoint);
        const existing = childPortsByEndpointKey.get(key);
        if (existing) return existing;

        const resolved = resolveEndpointInSheet(
          state.project,
          state.activeSheetId,
          endpoint,
        );
        const port = createSheetPortDraft(
          resolved.name || "sig",
          resolved.direction,
          resolved.type,
        );
        if (childPortNames.has(port.name)) {
          port.name = nextName(port.name, childPortNames);
        }
        childPortNames.add(port.name);
        port.position = defaultPortPosition(child, port.side);
        child.ports.push(port);
        const result = { id: port.id };
        childPortsByEndpointKey.set(key, result);
        return result;
      };

      const subsheetEndpointForPort = (portId: string): SheetEndpointRef => ({
        kind: "node-pin",
        nodeId: subsheetNodeId,
        pinKey: portId,
      });

      const isMovedEndpoint = (endpoint: SheetEndpointRef) =>
        isNodeEndpointInSet(endpoint, movedNodeIdSet);

      const parentConnectionsNext = [] as SheetDefinition["directConnections"];
      const childConnectionsNext = [] as SheetDefinition["directConnections"];
      const parentConnectionPairs = new Set<string>();

      for (const conn of parentSheet.directConnections) {
        const aMoved = isMovedEndpoint(conn.a);
        const bMoved = isMovedEndpoint(conn.b);
        if (aMoved && bMoved) {
          childConnectionsNext.push({
            id: conn.id,
            a: cloneEndpoint(conn.a),
            b: cloneEndpoint(conn.b),
            ...(conn.waypoints
              ? { waypoints: conn.waypoints.map((p) => ({ x: p.x, y: p.y })) }
              : {}),
          });
          continue;
        }
        if (!aMoved && !bMoved) {
          parentConnectionsNext.push({
            id: conn.id,
            a: cloneEndpoint(conn.a),
            b: cloneEndpoint(conn.b),
            ...(conn.waypoints
              ? { waypoints: conn.waypoints.map((p) => ({ x: p.x, y: p.y })) }
              : {}),
          });
          parentConnectionPairs.add(directConnectionPairKey(conn.a, conn.b));
          continue;
        }

        const selectedEndpoint = aMoved ? conn.a : conn.b;
        const port = ensureBoundaryPortForEndpoint(selectedEndpoint);
        const subsheetEndpoint = subsheetEndpointForPort(port.id);

        const parentConn = {
          id: conn.id,
          a: aMoved ? subsheetEndpoint : cloneEndpoint(conn.a),
          b: bMoved ? subsheetEndpoint : cloneEndpoint(conn.b),
        };
        parentConnectionsNext.push(parentConn);
        parentConnectionPairs.add(
          directConnectionPairKey(parentConn.a, parentConn.b),
        );

        childConnectionsNext.push({
          id: createId("conn"),
          a: aMoved
            ? cloneEndpoint(conn.a)
            : ({ kind: "sheet-port", portId: port.id } as const),
          b: bMoved
            ? cloneEndpoint(conn.b)
            : ({ kind: "sheet-port", portId: port.id } as const),
        });
      }

      const ensureParentBoundaryConnection = (
        externalEndpoint: SheetEndpointRef,
        portId: string,
      ) => {
        const subsheetEndpoint = subsheetEndpointForPort(portId);
        const pairKey = directConnectionPairKey(
          externalEndpoint,
          subsheetEndpoint,
        );
        if (parentConnectionPairs.has(pairKey)) return;
        parentConnectionPairs.add(pairKey);
        parentConnectionsNext.push({
          id: createId("conn"),
          a: cloneEndpoint(externalEndpoint),
          b: subsheetEndpoint,
        });
      };

      const parentAnchorsNext = [] as SheetDefinition["labelAnchors"];
      const childAnchorsNext = [] as SheetDefinition["labelAnchors"];
      for (const anchor of parentSheet.labelAnchors) {
        const labelMoved = movedLabelIdSet.has(anchor.labelId);
        const endpointMoved = isMovedEndpoint(anchor.endpoint);

        if (labelMoved && endpointMoved) {
          childAnchorsNext.push({
            id: anchor.id,
            labelId: anchor.labelId,
            endpoint: cloneEndpoint(anchor.endpoint),
          });
          continue;
        }

        if (labelMoved && !endpointMoved) {
          const port = ensureBoundaryPortForEndpoint(anchor.endpoint);
          childAnchorsNext.push({
            id: anchor.id,
            labelId: anchor.labelId,
            endpoint: { kind: "sheet-port", portId: port.id },
          });
          ensureParentBoundaryConnection(anchor.endpoint, port.id);
          continue;
        }

        if (!labelMoved && endpointMoved) {
          const port = ensureBoundaryPortForEndpoint(anchor.endpoint);
          parentAnchorsNext.push({
            id: anchor.id,
            labelId: anchor.labelId,
            endpoint: subsheetEndpointForPort(port.id),
          });
          continue;
        }

        parentAnchorsNext.push({
          id: anchor.id,
          labelId: anchor.labelId,
          endpoint: cloneEndpoint(anchor.endpoint),
        });
      }

      const originalParentQueue = parentSheet.hal?.addfQueue
        ? [...parentSheet.hal.addfQueue]
        : null;

      parentSheet.nodes = parentSheet.nodes.filter(
        (n) => !movedNodeIdSet.has(n.id),
      );
      parentSheet.nodes.push(subsheetNode);
      parentSheet.labels = parentSheet.labels.filter(
        (l) => !movedLabelIdSet.has(l.id),
      );
      parentSheet.directConnections = parentConnectionsNext;
      parentSheet.labelAnchors = parentAnchorsNext;

      if (originalParentQueue) {
        const childQueue = originalParentQueue.filter((id) =>
          movedNodeIdSet.has(id),
        );
        const firstMovedIndex = originalParentQueue.findIndex((id) =>
          movedNodeIdSet.has(id),
        );
        const parentQueue = originalParentQueue.filter(
          (id) => !movedNodeIdSet.has(id),
        );
        if (childQueue.length > 0) {
          const insertAt =
            firstMovedIndex < 0
              ? parentQueue.length
              : originalParentQueue
                  .slice(0, firstMovedIndex)
                  .filter((id) => !movedNodeIdSet.has(id)).length;
          parentQueue.splice(insertAt, 0, subsheetNodeId);
          if (!parentSheet.hal) parentSheet.hal = {};
          parentSheet.hal.addfQueue = parentQueue;
          child.hal = { ...(child.hal ?? {}), addfQueue: childQueue };
        } else if (parentSheet.hal?.addfQueue) {
          parentSheet.hal.addfQueue = parentQueue;
          if (parentSheet.hal.addfQueue.length === 0)
            delete parentSheet.hal.addfQueue;
          if (parentSheet.hal && Object.keys(parentSheet.hal).length === 0)
            delete parentSheet.hal;
        }
      }

      child.nodes = movedNodes;
      child.labels = movedLabels;
      child.directConnections = childConnectionsNext;
      child.labelAnchors = childAnchorsNext;
      next.sheets[child.id] = child;

      syncProjectUi(next, state.activeSheetId);
      setState("project", next);
      setState("selection", { kind: "node", id: subsheetNodeId });
      setState("pendingEndpoint", null);
      setState("pendingWirePoints", []);
      setStatusT("store.status.putSelectionIntoSubsheet", {
        name: childName,
        ports: child.ports.length,
      });
    },

    placeExistingSheetNode(sheetIdToPlace: string): void {
      if (sheetIdToPlace === state.activeSheetId) {
        setStatusT("store.status.cannotPlaceSheetInsideItself");
        return;
      }
      if (isSheetPlacedInProject(state.project, sheetIdToPlace)) {
        setStatusT("store.status.sheetAlreadyPlaced");
        return;
      }
      if (
        sheetContainsSheet(state.project, sheetIdToPlace, state.activeSheetId)
      ) {
        setStatusT("store.status.cannotCreateRecursiveSheetHierarchy");
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
          position: defaultNodePosition(sheet),
        };
        sheet.nodes.push(node);
      });
      setStatusT("store.status.placedSubsheet", { name: target.name });
    },

    deleteSheetDefinition(sheetId: string): void {
      const target = state.project.sheets[sheetId];
      if (!target) return;
      if (sheetId === state.project.rootSheetId) {
        setStatusT("store.status.cannotDeleteRootSheet");
        return;
      }

      const deletedSheetIds = collectSheetSubtreeIds(state.project, sheetId);
      if (deletedSheetIds.size === 0) return;

      const next = cloneProject(state.project);
      removeSheetNodeReferencesForDeletedSheets(next, deletedSheetIds);
      for (const deletedSheetId of deletedSheetIds) {
        delete next.sheets[deletedSheetId];
      }

      let nextActiveSheetId = state.activeSheetId;
      if (!next.sheets[nextActiveSheetId]) {
        nextActiveSheetId =
          target.parentSheetId && next.sheets[target.parentSheetId]
            ? target.parentSheetId
            : next.rootSheetId;
      }
      syncProjectUi(next, nextActiveSheetId);

      setState("project", next);
      setState("activeSheetId", nextActiveSheetId);
      setState("selection", null);
      setState("pendingEndpoint", null);
      setState("pendingWirePoints", []);
      setStatusT("store.status.deletedSheet", {
        name: target.name,
        count: deletedSheetIds.size,
      });
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
      setStatusT("store.status.addedLabel", { scope });
    },

    addSheetPort(
      direction: "in" | "out" | "io",
      type: "bit" | "float" | "s32" | "u32" | "s64" | "u64" | "port",
    ): void {
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
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
      setStatusT("store.status.addedSheetPort");
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

    updateNodePinInitialValue(
      nodeId: string,
      pinKey: string,
      value: string,
    ): void {
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
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
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        const label = sheet.labels.find((l) => l.id === labelId);
        if (!label) return;
        if (patch.name !== undefined) label.name = patch.name;
        if (patch.scope !== undefined) label.scope = patch.scope;
        if (patch.rotation !== undefined) {
          label.rotation = normalizeRotationDegrees(patch.rotation);
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
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
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

    removeSelection(): void {
      const sel = state.selection;
      if (!sel) return;
      if (sel.kind === "node") {
        const currentSheet = actions.getCurrentSheet();
        const node = currentSheet.nodes.find((n) => n.id === sel.id);
        if (node?.kind === "sheet") {
          actions.deleteSheetDefinition(node.sheetId);
          return;
        }
      }
      if (sel.kind === "wire-connection") {
        actions.removeDirectConnection(sel.id);
        setState("pendingEndpoint", null);
        setState("pendingWirePoints", []);
        return;
      }
      if (sel.kind === "multi") {
        const currentSheet = actions.getCurrentSheet();
        const selectedNodeIds = new Set(sel.nodeIds);
        const selectedLabelIds = new Set(sel.labelIds);
        const selectedPortIds = new Set(sel.portIds);

        const deletedSheetIds = new Set<string>();
        for (const node of currentSheet.nodes) {
          if (node.kind !== "sheet" || !selectedNodeIds.has(node.id)) continue;
          for (const sheetId of collectSheetSubtreeIds(
            state.project,
            node.sheetId,
          )) {
            deletedSheetIds.add(sheetId);
          }
        }

        const next = cloneProject(state.project);
        if (deletedSheetIds.size > 0) {
          removeSheetNodeReferencesForDeletedSheets(next, deletedSheetIds);
          for (const deletedSheetId of deletedSheetIds) {
            delete next.sheets[deletedSheetId];
          }
        }

        const sheet = next.sheets[state.activeSheetId];
        if (sheet) {
          const removedNodeIds = new Set<string>();
          sheet.nodes = sheet.nodes.filter((n) => {
            if (!selectedNodeIds.has(n.id)) return true;
            removedNodeIds.add(n.id);
            return false;
          });
          pruneSheetNodeReferences(sheet, removedNodeIds);

          sheet.labels = sheet.labels.filter(
            (l) => !selectedLabelIds.has(l.id),
          );
          sheet.labelAnchors = sheet.labelAnchors.filter((a) => {
            if (selectedLabelIds.has(a.labelId)) return false;
            return !(
              a.endpoint.kind === "sheet-port" &&
              selectedPortIds.has(a.endpoint.portId)
            );
          });

          sheet.ports = sheet.ports.filter((p) => !selectedPortIds.has(p.id));
          sheet.directConnections = sheet.directConnections.filter(
            (c) =>
              !(c.a.kind === "sheet-port" && selectedPortIds.has(c.a.portId)) &&
              !(c.b.kind === "sheet-port" && selectedPortIds.has(c.b.portId)),
          );
        }

        syncProjectUi(next, state.activeSheetId);
        setState("project", next);
        setState("selection", null);
        setState("pendingEndpoint", null);
        setState("pendingWirePoints", []);
        setStatusT("store.status.removedSelection");
        return;
      }
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        if (sel.kind === "node") {
          const removedNodeIds = new Set([sel.id]);
          sheet.nodes = sheet.nodes.filter((n) => n.id !== sel.id);
          pruneSheetNodeReferences(sheet, removedNodeIds);
        } else if (sel.kind === "label") {
          sheet.labels = sheet.labels.filter((l) => l.id !== sel.id);
          sheet.labelAnchors = sheet.labelAnchors.filter(
            (a) => a.labelId !== sel.id,
          );
        } else if (sel.kind === "sheet-port") {
          sheet.ports = sheet.ports.filter((p) => p.id !== sel.id);
          sheet.directConnections = sheet.directConnections.filter(
            (c) =>
              !(c.a.kind === "sheet-port" && c.a.portId === sel.id) &&
              !(c.b.kind === "sheet-port" && c.b.portId === sel.id),
          );
          sheet.labelAnchors = sheet.labelAnchors.filter(
            (a) =>
              !(
                a.endpoint.kind === "sheet-port" && a.endpoint.portId === sel.id
              ),
          );
        }
      });
      setState("selection", null);
      setState("pendingEndpoint", null);
      setState("pendingWirePoints", []);
      setStatusT("store.status.removedSelection");
    },

    endpointClick(endpoint: SheetEndpointRef): void {
      const pending = state.pendingEndpoint;
      if (!pending) {
        setState("pendingEndpoint", endpoint);
        setState("pendingWirePoints", []);
        try {
          const info = resolveEndpointInSheet(
            state.project,
            state.activeSheetId,
            endpoint,
          );
          setState(
            "status",
            t("store.status.selectedEndpointDetailed", {
              name: info.name,
              direction: info.direction,
              type: info.type,
            }),
          );
        } catch {
          setStatusT("store.status.selectedEndpoint");
        }
        return;
      }

      const validation = validateDirectConnection(
        state.project,
        state.activeSheetId,
        pending,
        endpoint,
        actions.getCurrentSheet().directConnections,
      );
      if (!validation.ok) {
        setState(
          "status",
          validation.reason ?? t("store.status.invalidConnection"),
        );
        setState("pendingEndpoint", endpoint);
        setState("pendingWirePoints", []);
        return;
      }

      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        sheet.directConnections.push({
          id: createId("conn"),
          a: pending,
          b: endpoint,
          ...(state.pendingWirePoints.length > 0
            ? { waypoints: [...state.pendingWirePoints] }
            : {}),
        });
      });
      setState("pendingEndpoint", null);
      setState("pendingWirePoints", []);
      setStatusT("store.status.connectedEndpoints");
    },

    anchorPendingToLabel(labelId: string): void {
      const pending = state.pendingEndpoint;
      if (!pending) return;
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        const exists = sheet.labelAnchors.some(
          (a) =>
            a.labelId === labelId &&
            JSON.stringify(a.endpoint) === JSON.stringify(pending),
        );
        if (!exists) {
          sheet.labelAnchors.push({
            id: createId("anchor"),
            labelId,
            endpoint: pending,
          });
        }
      });
      setState("pendingEndpoint", null);
      setState("pendingWirePoints", []);
      setStatusT("store.status.attachedEndpointToLabel");
    },

    removeDirectConnection(connectionId: string): void {
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        sheet.directConnections = sheet.directConnections.filter(
          (c) => c.id !== connectionId,
        );
      });
      if (
        state.selection?.kind === "wire-connection" &&
        state.selection.id === connectionId
      ) {
        setState("selection", null);
      }
      setStatusT("store.status.removedConnection");
    },

    updateDirectConnectionWaypoints(
      connectionId: string,
      waypoints: XY[],
    ): void {
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        const conn = sheet.directConnections.find((c) => c.id === connectionId);
        if (!conn) return;
        if (waypoints.length === 0) delete conn.waypoints;
        else conn.waypoints = waypoints.map((p) => ({ x: p.x, y: p.y }));
      });
      setStatusT("store.status.updatedWireRoute");
    },

    removeLabelAnchor(anchorId: string): void {
      withProject((project) => {
        const sheet = getSheet(project, state.activeSheetId);
        sheet.labelAnchors = sheet.labelAnchors.filter(
          (a) => a.id !== anchorId,
        );
      });
      setStatusT("store.status.removedLabelAnchor");
    },
  };

  return { state, setState, actions };
}
