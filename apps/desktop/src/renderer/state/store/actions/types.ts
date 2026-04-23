import type {
  Change,
  ComponentStore,
  NoHALProject,
  SheetEndpointRef,
  XY,
} from "@nohal/core";
import type { Result } from "neverthrow";
import type { CameraState } from "../../../canvas";
import type { TranslationKey } from "../../../i18n";
import type { Selection } from "../selectionTypes";

export type ActionStatusParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type SetStatusT = (
  key: TranslationKey,
  params?: ActionStatusParams,
) => void;

export type SetEditorState = <K extends keyof EditorState>(
  key: K,
  value: EditorState[K],
) => void;

export interface WithProjectOptions {
  recordHistory?: boolean;
  markDirty?: boolean;
}

export type EditorSelection = Selection;

export interface EditorState {
  project: NoHALProject;
  componentStore: ComponentStore;
  projectPath: string | null;
  isDirty: boolean;
  canvasCursorPos: XY | null;
  activeSheetId: string;
  sheetCameras: Record<string, CameraState>;
  canUndo: boolean;
  canRedo: boolean;
  selection: EditorSelection;
  pendingEndpoint: SheetEndpointRef | null;
  pendingWirePoints: XY[];
  status: string;
  exportWarnings: string[];
}

export interface EditorStoreActionContext {
  state: Readonly<EditorState>;
  setState: SetEditorState;
  t: (key: TranslationKey, params?: ActionStatusParams) => string;
  setStatusT: SetStatusT;
  confirmProceedWithUnsavedChanges: () => Promise<boolean>;
  replaceProjectState: (
    project: NoHALProject,
    projectPath: string | null,
    status: string,
  ) => void;

  reloadComponentStoreState: () => Promise<ComponentStore>;
  setImportErrorWarnings: (
    errors: ReadonlyArray<{ filePath: string; error: string }>,
  ) => void;
  clearHistory: () => void;
  withComponentStore: (
    mutate: (componentStore: ComponentStore) => void,
  ) => void;

  withProject: <T>(
    mutate: (project: NoHALProject) => T,
    options?: WithProjectOptions,
  ) => T;
  withProjectChange: <T>(
    mutate: (project: NoHALProject) => Change<T>,
    options?: WithProjectOptions,
  ) => Change<T>;
  withProjectResult: <T, E>(
    mutate: (project: NoHALProject) => Result<Change<T>, E>,
    options?: WithProjectOptions,
  ) => Result<Change<T>, E>;
  setProjectUiActiveSheetId: (sheetId: string) => void;
  clearSelectionIfWireConnection: (connectionId: string) => void;
  clearPendingConnectionUi: () => void;
  clearSelectionAndPendingUi: () => void;
  pushUndoSnapshot: () => void;
  markProjectChanged: () => void;
}
