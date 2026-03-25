import type { ProjectMesaConfig } from "@nohal/core/src/mesa";
import type {
  ComponentDefinition,
  HalImportDraft,
  HalImportPlacementHeuristic,
  MachineConfigHalFileSelection,
  MachineConfigImportDraft,
  MachineConfigImportSetupDraft,
} from "@nohal/core/src/types";

export type MachineImportFlowStep = "machine-files" | "mesa" | "link";

export type MachineImportFlowState = {
  isActive: boolean;
  step: MachineImportFlowStep;
  isBusy: boolean;
  errorMessage: string | null;
  importDraft: HalImportDraft | null;
  machineConfigImport: MachineConfigImportDraft | null;
  machineConfigSetup: MachineConfigImportSetupDraft | null;
  mesaConfig: ProjectMesaConfig | null;
  mesaDetected: boolean;
  selectedMachineHalFiles: MachineConfigHalFileSelection[];
  linkSelections: Record<string, string>;
  linkReasons: Record<string, string>;
  systemLinkGroupIds: string[];
  generatedLocalComponents: Record<string, ComponentDefinition>;
  placementHeuristic: HalImportPlacementHeuristic;
};

export type FlowEvent =
  | { type: "open" }
  | { type: "close" }
  | { type: "setBusy"; value: boolean }
  | { type: "setError"; message: string | null }
  | {
      type: "importDraftLoaded";
      draft: HalImportDraft;
      machineConfigImport: MachineConfigImportDraft;
      step: MachineImportFlowStep;
      mesaDetected: boolean;
      mesaConfig: ProjectMesaConfig | null;
      linkSelections: Record<string, string>;
      linkReasons: Record<string, string>;
      systemLinkGroupIds: string[];
      generatedLocalComponents: Record<string, ComponentDefinition>;
    }
  | {
      type: "machineConfigSetupLoaded";
      setup: MachineConfigImportSetupDraft;
    }
  | { type: "updateMachineHalFile"; index: number; filePath: string }
  | { type: "setMachineHalFileResolveIni"; index: number; value: boolean }
  | { type: "removeMachineHalFile"; index: number }
  | { type: "addBlankMachineHalFile" }
  | { type: "setStep"; step: MachineImportFlowStep }
  | { type: "setLinkSelection"; groupId: string; value: string }
  | {
      type: "setPlacementHeuristic";
      value: HalImportPlacementHeuristic;
    }
  | { type: "setMesaConfig"; value: ProjectMesaConfig };

export function createInitialState(): MachineImportFlowState {
  return {
    isActive: false,
    step: "machine-files",
    isBusy: false,
    errorMessage: null,
    importDraft: null,
    machineConfigImport: null,
    machineConfigSetup: null,
    mesaConfig: null,
    mesaDetected: false,
    selectedMachineHalFiles: [],
    linkSelections: {},
    linkReasons: {},
    systemLinkGroupIds: [],
    generatedLocalComponents: {},
    placementHeuristic: "related-groups",
  };
}

function makeMachineHalSelection(
  filePath: string,
  resolveIniSubstitutions = true,
): MachineConfigHalFileSelection {
  return { filePath, resolveIniSubstitutions };
}

export function reduceFlowState(
  state: MachineImportFlowState,
  event: FlowEvent,
): MachineImportFlowState {
  switch (event.type) {
    case "open":
      return {
        ...createInitialState(),
        isActive: true,
      };
    case "close":
      return {
        ...createInitialState(),
      };
    case "setBusy":
      return { ...state, isBusy: event.value };
    case "setError":
      return { ...state, errorMessage: event.message };
    case "importDraftLoaded":
      return {
        ...state,
        importDraft: event.draft,
        machineConfigImport: event.machineConfigImport,
        mesaDetected: event.mesaDetected,
        mesaConfig: event.mesaConfig,
        linkSelections: event.linkSelections,
        linkReasons: event.linkReasons,
        systemLinkGroupIds: event.systemLinkGroupIds,
        generatedLocalComponents: event.generatedLocalComponents,
        step: event.step,
      };
    case "machineConfigSetupLoaded":
      return {
        ...state,
        machineConfigSetup: event.setup,
        machineConfigImport: null,
        importDraft: null,
        mesaConfig: null,
        mesaDetected: false,
        selectedMachineHalFiles: event.setup.suggestedHalFilePaths.map(
          (filePath) => makeMachineHalSelection(filePath),
        ),
        linkSelections: {},
        linkReasons: {},
        systemLinkGroupIds: [],
        generatedLocalComponents: {},
        errorMessage: null,
        step: "machine-files",
      };
    case "updateMachineHalFile":
      return {
        ...state,
        selectedMachineHalFiles: state.selectedMachineHalFiles.map(
          (item, index) =>
            index === event.index
              ? { ...item, filePath: event.filePath }
              : item,
        ),
      };
    case "setMachineHalFileResolveIni":
      return {
        ...state,
        selectedMachineHalFiles: state.selectedMachineHalFiles.map(
          (item, index) =>
            index === event.index
              ? { ...item, resolveIniSubstitutions: event.value }
              : item,
        ),
      };
    case "removeMachineHalFile":
      return {
        ...state,
        selectedMachineHalFiles: state.selectedMachineHalFiles.filter(
          (_item, index) => index !== event.index,
        ),
      };
    case "addBlankMachineHalFile":
      return {
        ...state,
        selectedMachineHalFiles: [
          ...state.selectedMachineHalFiles,
          makeMachineHalSelection(""),
        ],
      };
    case "setStep":
      return { ...state, step: event.step };
    case "setLinkSelection":
      return {
        ...state,
        linkSelections: {
          ...state.linkSelections,
          [event.groupId]: event.value,
        },
      };
    case "setPlacementHeuristic":
      return { ...state, placementHeuristic: event.value };
    case "setMesaConfig":
      return { ...state, mesaConfig: event.value };
  }
}
