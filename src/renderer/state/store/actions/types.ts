import type {
  ComponentStore,
  NoHALProject,
  SheetEndpointRef,
  XY,
} from "../../../../shared/types";
import type { TranslationKey } from "../../../i18n";

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

export type WithProjectOptions = {
  recordHistory?: boolean;
  markDirty?: boolean;
};

export type EditorSelection =
  | { kind: "node"; id: string }
  | { kind: "label"; id: string }
  | { kind: "comment"; id: string }
  | { kind: "sheet-port"; id: string }
  | { kind: "wire-connection"; id: string }
  | { kind: "multi"; nodeIds: string[]; labelIds: string[]; portIds: string[] }
  | null;

export interface EditorState {
  project: NoHALProject;
  componentStore: ComponentStore;
  projectPath: string | null;
  isDirty: boolean;
  activeSheetId: string;
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

  withProject: (
    mutate: (project: NoHALProject) => void,
    options?: WithProjectOptions,
  ) => void;
  setProjectUiActiveSheetId: (sheetId: string) => void;
  clearSelectionIfWireConnection: (connectionId: string) => void;
  clearPendingConnectionUi: () => void;
  clearSelectionAndPendingUi: () => void;
  pushUndoSnapshot: () => void;
  markProjectChanged: () => void;
}
