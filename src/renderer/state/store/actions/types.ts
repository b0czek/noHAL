import type {
  ComponentStore,
  NoHALProject,
  SheetDefinition,
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

export interface EditorStoreActionContext {
  t: (key: TranslationKey, params?: ActionStatusParams) => string;
  setStatusT: SetStatusT;
  setStatus: (message: string) => void;
  confirmProceedWithUnsavedChanges: () => Promise<boolean>;
  replaceProjectState: (
    project: NoHALProject,
    projectPath: string | null,
    status: string,
  ) => void;
  setExportWarnings: (warnings: string[]) => void;

  reloadComponentStoreState: () => Promise<ComponentStore>;
  setImportErrorWarnings: (
    errors: ReadonlyArray<{ filePath: string; error: string }>,
  ) => void;
  getCurrentComponentStore: () => ComponentStore;
  clearHistory: () => void;
  withComponentStore: (
    mutate: (componentStore: ComponentStore) => void,
  ) => void;

  withProject: (
    mutate: (project: NoHALProject) => void,
    options?: WithProjectOptions,
  ) => void;
  getProject: () => NoHALProject;
  getActiveSheetId: () => string;
  getSelection: () => EditorSelection;
  getCurrentSheet: () => SheetDefinition;
  getPendingEndpoint: () => SheetEndpointRef | null;
  getPendingWirePoints: () => XY[];
  getCurrentSheetDirectConnections: () => SheetDefinition["directConnections"];
  setProject: (project: NoHALProject) => void;
  setActiveSheetId: (sheetId: string) => void;
  setProjectUiActiveSheetId: (sheetId: string) => void;
  setSelection: (selection: EditorSelection) => void;
  setPendingEndpoint: (endpoint: SheetEndpointRef | null) => void;
  setPendingWirePoints: (points: XY[]) => void;
  clearSelectionIfWireConnection: (connectionId: string) => void;
  clearPendingConnectionUi: () => void;
  clearSelectionAndPendingUi: () => void;
  pushUndoSnapshot: () => void;
  markProjectChanged: () => void;
}
