import { getSheet } from "@nohal/core/src/graph";
import type {
  ComponentStore,
  NoHALProject,
  SheetDefinition,
  SheetEndpointRef,
  XY,
} from "@nohal/core/src/types";
import { createStore, unwrap } from "solid-js/store";
import type { TranslationKey } from "../i18n";
import { createComponentStoreActions } from "./store/actions/componentStoreActions";
import { createNodeActions } from "./store/actions/nodeActions";
import { createProjectActions } from "./store/actions/projectActions";
import { createSelectionActions } from "./store/actions/selectionActions";
import { createSheetActions } from "./store/actions/sheetActions";
import type {
  EditorSelection,
  EditorState,
  EditorStoreActionContext,
} from "./store/actions/types";
import { createWireActions } from "./store/actions/wireActions";
import {
  applyComponentStoreToProject,
  cloneComponentStore,
  cloneProject,
  createEmptyComponentStore,
  pruneMissingStoredComponentsFromProject,
  snapshotProjectForIpc,
  syncProjectUi,
  toErrorMessage,
} from "./store/helpers";

export type Selection = EditorSelection;

interface EditorHistorySnapshot {
  project: NoHALProject;
  projectRevision: number;
  activeSheetId: string;
  selection: Selection;
  pendingEndpoint: SheetEndpointRef | null;
  pendingWirePoints: XY[];
}

type TranslationParams = Record<
  string,
  string | number | boolean | null | undefined
>;

type TranslateFn = (key: TranslationKey, params?: TranslationParams) => string;

export function createEditorStore(
  initialProject: NoHALProject,
  t: TranslateFn,
) {
  const MAX_HISTORY_ENTRIES = 200;
  const [state, setState] = createStore<EditorState>({
    project: initialProject,
    componentStore: createEmptyComponentStore(),
    projectPath: null,
    isDirty: false,
    activeSheetId: initialProject.ui.activeSheetId,
    canUndo: false,
    canRedo: false,
    selection: null,
    pendingEndpoint: null,
    pendingWirePoints: [],
    status: t("store.status.ready"),
    exportWarnings: [],
  });

  const undoStack: EditorHistorySnapshot[] = [];
  const redoStack: EditorHistorySnapshot[] = [];
  let projectRevision = 0;
  let savedProjectRevision = 0;

  const syncDirtyFlag = (): void => {
    setState("isDirty", projectRevision !== savedProjectRevision);
  };

  const markProjectChanged = (): void => {
    projectRevision += 1;
    syncDirtyFlag();
  };

  const markProjectSaved = (): void => {
    savedProjectRevision = projectRevision;
    syncDirtyFlag();
  };

  const resetProjectDirtyTracking = (): void => {
    projectRevision = 0;
    savedProjectRevision = 0;
  };

  const syncHistoryAvailability = (): void => {
    setState("canUndo", undoStack.length > 0);
    setState("canRedo", redoStack.length > 0);
  };

  const cloneSelection = (selection: Selection): Selection =>
    selection ? structuredClone(unwrap(selection)) : null;

  const clonePendingEndpoint = (
    endpoint: SheetEndpointRef | null,
  ): SheetEndpointRef | null =>
    endpoint ? structuredClone(unwrap(endpoint)) : null;

  const clonePendingWirePoints = (points: XY[]): XY[] =>
    structuredClone(unwrap(points));

  const captureHistorySnapshot = (): EditorHistorySnapshot => ({
    project: cloneProject(state.project),
    projectRevision,
    activeSheetId: state.activeSheetId,
    selection: cloneSelection(state.selection),
    pendingEndpoint: clonePendingEndpoint(state.pendingEndpoint),
    pendingWirePoints: clonePendingWirePoints(state.pendingWirePoints),
  });

  const restoreHistorySnapshot = (snapshot: EditorHistorySnapshot): void => {
    projectRevision = snapshot.projectRevision;
    setState("project", snapshot.project);
    setState("activeSheetId", snapshot.activeSheetId);
    setState("selection", snapshot.selection);
    setState("pendingEndpoint", snapshot.pendingEndpoint);
    setState("pendingWirePoints", snapshot.pendingWirePoints);
    syncDirtyFlag();
  };

  const pushUndoSnapshot = (): void => {
    undoStack.push(captureHistorySnapshot());
    if (undoStack.length > MAX_HISTORY_ENTRIES) undoStack.shift();
    redoStack.length = 0;
    syncHistoryAvailability();
  };

  const clearHistory = (): void => {
    undoStack.length = 0;
    redoStack.length = 0;
    syncHistoryAvailability();
  };

  const withProject = (
    mutate: (project: NoHALProject) => void,
    options?: { recordHistory?: boolean; markDirty?: boolean },
  ) => {
    const next = cloneProject(state.project);
    mutate(next);
    syncProjectUi(next, state.activeSheetId);
    if (options?.recordHistory !== false) pushUndoSnapshot();
    setState("project", next);
    const shouldMarkDirty =
      options?.markDirty ?? options?.recordHistory !== false;
    if (shouldMarkDirty) markProjectChanged();
  };

  const withComponentStore = (
    mutate: (componentStore: ComponentStore) => void,
  ) => {
    const next = cloneComponentStore(state.componentStore);
    mutate(next);
    setState("componentStore", next);
  };

  const replaceComponentStore = (componentStore: ComponentStore) => {
    clearHistory();
    setState("componentStore", componentStore);
    withProject(
      (project) => {
        pruneMissingStoredComponentsFromProject(project, componentStore);
        applyComponentStoreToProject(project, componentStore);
      },
      { recordHistory: false, markDirty: false },
    );
  };

  const replaceProjectState = (
    project: NoHALProject,
    projectPath: string | null,
    status: string,
  ): void => {
    pruneMissingStoredComponentsFromProject(project, state.componentStore);
    applyComponentStoreToProject(project, state.componentStore);
    resetProjectDirtyTracking();
    clearHistory();
    setState({
      project,
      componentStore: state.componentStore,
      projectPath,
      isDirty: false,
      activeSheetId: project.ui.activeSheetId,
      canUndo: false,
      canRedo: false,
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

  const performSaveProject = async (): Promise<boolean> => {
    try {
      const result = await window.nohal.saveProject(
        snapshotProjectForIpc(state.project),
        state.projectPath,
      );
      if (!result) return false;
      setState("projectPath", result.projectPath);
      markProjectSaved();
      setStatusT("store.status.savedProjectPath", {
        projectPath: result.projectPath,
      });
      return true;
    } catch (error) {
      setStatusT("store.status.failedSaveProject", {
        error: toErrorMessage(error),
      });
      return false;
    }
  };

  const confirmProceedWithUnsavedChanges = async (): Promise<boolean> => {
    if (!state.isDirty) return true;
    const choice = await window.nohal.promptUnsavedChanges();
    if (choice === "cancel") return false;
    if (choice === "discard") return true;
    return performSaveProject();
  };

  const reloadComponentStoreState = async (): Promise<ComponentStore> => {
    const componentStore = await window.nohal.loadComponentStore();
    replaceComponentStore(componentStore);
    return componentStore;
  };

  const setImportErrorWarnings = (
    errors: ReadonlyArray<{ filePath: string; error: string }>,
  ): void => {
    if (errors.length === 0) return;
    setState(
      "exportWarnings",
      errors.map((e) =>
        t("store.warning.importError", {
          filePath: e.filePath,
          error: e.error,
        }),
      ),
    );
  };

  const clearPendingConnectionUi = (): void => {
    setState("pendingEndpoint", null);
    setState("pendingWirePoints", []);
  };

  const clearSelectionAndPendingUi = (): void => {
    setState("selection", null);
    clearPendingConnectionUi();
  };

  const setActionState: EditorStoreActionContext["setState"] = (key, value) => {
    setState(key, value);
  };

  const setProjectUiActiveSheetId = (sheetId: string): void =>
    setState("project", "ui", "activeSheetId", sheetId);

  const clearSelectionIfWireConnection = (connectionId: string): void => {
    if (
      state.selection?.kind === "wire-connection" &&
      state.selection.id === connectionId
    ) {
      setState("selection", null);
    }
  };

  const actionCtx: EditorStoreActionContext = {
    state,
    setState: setActionState,
    t,
    setStatusT,
    confirmProceedWithUnsavedChanges,
    replaceProjectState,
    reloadComponentStoreState,
    setImportErrorWarnings,
    clearHistory,
    withComponentStore,
    withProject,
    setProjectUiActiveSheetId,
    clearSelectionIfWireConnection,
    clearPendingConnectionUi,
    clearSelectionAndPendingUi,
    pushUndoSnapshot,
    markProjectChanged,
  };

  const projectActions = createProjectActions(actionCtx);
  const componentStoreActions = createComponentStoreActions(actionCtx);
  const wireActions = createWireActions(actionCtx);
  const nodeActions = createNodeActions(actionCtx);
  const sheetActions = createSheetActions(actionCtx);
  const selectionActions = createSelectionActions(actionCtx, {
    deleteSheetDefinition: sheetActions.deleteSheetDefinition,
    removeDirectConnection: wireActions.removeDirectConnection,
  });

  const actions = {
    undo(): boolean {
      const snapshot = undoStack.pop();
      if (!snapshot) return false;
      redoStack.push(captureHistorySnapshot());
      if (redoStack.length > MAX_HISTORY_ENTRIES) redoStack.shift();
      syncHistoryAvailability();
      restoreHistorySnapshot(snapshot);
      return true;
    },

    redo(): boolean {
      const snapshot = redoStack.pop();
      if (!snapshot) return false;
      undoStack.push(captureHistorySnapshot());
      if (undoStack.length > MAX_HISTORY_ENTRIES) undoStack.shift();
      syncHistoryAvailability();
      restoreHistorySnapshot(snapshot);
      return true;
    },

    getCurrentSheet(): SheetDefinition {
      return getSheet(state.project, state.activeSheetId);
    },

    setStatus(message: string): void {
      setState("status", message);
    },

    ...sheetActions,
    ...componentStoreActions,

    ...selectionActions,

    ...projectActions,

    async saveProject(): Promise<boolean> {
      return performSaveProject();
    },

    async confirmProceedWithUnsavedChanges(): Promise<boolean> {
      return confirmProceedWithUnsavedChanges();
    },

    async buildProject(): Promise<void> {
      try {
        if (!state.projectPath) {
          const didSave = await performSaveProject();
          if (!didSave) return;
        }
        if (!state.projectPath) {
          throw new Error("Project folder is required before build");
        }
        const result = await window.nohal.buildProject(
          snapshotProjectForIpc(state.project),
          state.projectPath,
        );
        setState("exportWarnings", result.warnings);
        setStatusT("store.status.builtProject", {
          buildDir: result.buildDir,
          count: result.files.length,
        });
      } catch (error) {
        setStatusT("store.status.failedBuildProject", {
          error: toErrorMessage(error),
        });
      }
    },
    ...nodeActions,

    ...wireActions,
  };

  return { state, setState, actions };
}
