import { createStore, unwrap } from "solid-js/store";
import {
  buildProjectFromHalImport as buildImportedProject,
  suggestHalImportLinks,
} from "../../../shared/halImport";
import type {
  HalImportDraft,
  HalImportPlacementHeuristic,
  MachineConfigHalFileSelection,
  MachineConfigImportDraft,
  MachineConfigImportSetupDraft,
} from "../../../shared/types";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";

export type MachineImportFlowStep = "machine-files" | "link";

type MachineImportFlowState = {
  isActive: boolean;
  step: MachineImportFlowStep;
  isBusy: boolean;
  errorMessage: string | null;
  importDraft: HalImportDraft | null;
  machineConfigImport: MachineConfigImportDraft | null;
  machineConfigSetup: MachineConfigImportSetupDraft | null;
  selectedMachineHalFiles: MachineConfigHalFileSelection[];
  linkSelections: Record<string, string>;
  linkReasons: Record<string, string>;
  placementHeuristic: HalImportPlacementHeuristic;
};

type MachineImportFlowEvent =
  | { type: "open" }
  | { type: "close" }
  | { type: "setBusy"; value: boolean }
  | { type: "setError"; message: string | null }
  | {
      type: "importDraftLoaded";
      draft: HalImportDraft;
      machineConfigImport: MachineConfigImportDraft;
      linkSelections: Record<string, string>;
      linkReasons: Record<string, string>;
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
    };

function createInitialMachineImportFlowState(): MachineImportFlowState {
  return {
    isActive: false,
    step: "machine-files",
    isBusy: false,
    errorMessage: null,
    importDraft: null,
    machineConfigImport: null,
    machineConfigSetup: null,
    selectedMachineHalFiles: [],
    linkSelections: {},
    linkReasons: {},
    placementHeuristic: "related-groups",
  };
}

function makeMachineHalSelection(
  filePath: string,
  resolveIniSubstitutions = true,
): MachineConfigHalFileSelection {
  return { filePath, resolveIniSubstitutions };
}

function reduceMachineImportFlowState(
  state: MachineImportFlowState,
  event: MachineImportFlowEvent,
): MachineImportFlowState {
  switch (event.type) {
    case "open":
      return {
        ...createInitialMachineImportFlowState(),
        isActive: true,
      };
    case "close":
      return {
        ...createInitialMachineImportFlowState(),
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
        linkSelections: event.linkSelections,
        linkReasons: event.linkReasons,
        step: "link",
      };
    case "machineConfigSetupLoaded":
      return {
        ...state,
        machineConfigSetup: event.setup,
        machineConfigImport: null,
        importDraft: null,
        selectedMachineHalFiles: event.setup.suggestedHalFilePaths.map(
          (filePath) => makeMachineHalSelection(filePath),
        ),
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
          (_filePath, index) => index !== event.index,
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
  }
}

interface UseMachineImportFlowArgs {
  setIsEditorOpen: (value: boolean) => void;
  refreshRecentProjects: () => Promise<void>;
}

export function useMachineImportFlow({
  setIsEditorOpen,
  refreshRecentProjects,
}: UseMachineImportFlowArgs) {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const [machineImportFlow, setMachineImportFlow] = createStore(
    createInitialMachineImportFlowState(),
  );

  const dispatchMachineImportFlow = (event: MachineImportFlowEvent) => {
    setMachineImportFlow((current) =>
      reduceMachineImportFlowState(current, event),
    );
  };

  const closeMachineImportFlow = () => {
    if (machineImportFlow.isBusy) return;
    dispatchMachineImportFlow({ type: "close" });
  };

  const pickMachineIniFile = async () => {
    dispatchMachineImportFlow({ type: "setError", message: null });
    dispatchMachineImportFlow({ type: "setBusy", value: true });
    try {
      const setup = await window.nohal.pickMachineIniFile();
      if (!setup) return;
      dispatchMachineImportFlow({
        type: "machineConfigSetupLoaded",
        setup,
      });
    } catch (error) {
      dispatchMachineImportFlow({
        type: "setError",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      dispatchMachineImportFlow({ type: "setBusy", value: false });
    }
  };

  const startMachineImportFlow = async () => {
    dispatchMachineImportFlow({ type: "open" });
    await pickMachineIniFile();
  };

  const pickMachineHalFileForRow = async (index: number) => {
    dispatchMachineImportFlow({ type: "setError", message: null });
    dispatchMachineImportFlow({ type: "setBusy", value: true });
    try {
      const filePath = await window.nohal.pickMachineHalFile();
      if (!filePath) return;
      dispatchMachineImportFlow({
        type: "updateMachineHalFile",
        index,
        filePath,
      });
    } catch (error) {
      dispatchMachineImportFlow({
        type: "setError",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      dispatchMachineImportFlow({ type: "setBusy", value: false });
    }
  };

  const continueToLinkStep = async () => {
    const setup = machineImportFlow.machineConfigSetup;
    const iniPath = setup?.ini.sourcePath;
    if (!setup || !iniPath) return;
    dispatchMachineImportFlow({ type: "setError", message: null });
    dispatchMachineImportFlow({ type: "setBusy", value: true });
    try {
      const halSelections = unwrap(machineImportFlow.selectedMachineHalFiles)
        .filter((item) => item.filePath.trim())
        .map((item) => ({
          filePath: item.filePath,
          resolveIniSubstitutions: item.resolveIniSubstitutions,
        }));
      const machineImport = await window.nohal.buildMachineConfigurationImport(
        iniPath,
        halSelections,
      );
      const draft = machineImport.halImport;
      const suggestions = suggestHalImportLinks(draft, state.componentStore);
      const nextSelections: Record<string, string> = {};
      const nextReasons: Record<string, string> = {};
      for (const suggestion of suggestions) {
        nextSelections[suggestion.groupId] =
          suggestion.selection.mode === "store"
            ? `store:${suggestion.selection.componentId}`
            : "local";
        nextReasons[suggestion.groupId] = suggestion.reason;
      }
      dispatchMachineImportFlow({
        type: "importDraftLoaded",
        draft,
        machineConfigImport: machineImport,
        linkSelections: nextSelections,
        linkReasons: nextReasons,
      });
    } catch (error) {
      dispatchMachineImportFlow({
        type: "setError",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      dispatchMachineImportFlow({ type: "setBusy", value: false });
    }
  };

  const createImportedProject = async () => {
    const draft = machineImportFlow.importDraft;
    if (!draft) return;
    dispatchMachineImportFlow({ type: "setError", message: null });
    dispatchMachineImportFlow({ type: "setBusy", value: true });
    try {
      const linkSelections = Object.fromEntries(
        draft.componentGroups.map((group) => {
          const value = machineImportFlow.linkSelections[group.id] ?? "local";
          if (value.startsWith("store:")) {
            return [
              group.id,
              {
                groupId: group.id,
                mode: "store" as const,
                componentId: value.slice("store:".length),
              },
            ];
          }
          return [
            group.id,
            { groupId: group.id, mode: "project-local" as const },
          ];
        }),
      );

      const result = buildImportedProject({
        draft,
        componentStore: state.componentStore,
        linkSelections,
        placementHeuristic: machineImportFlow.placementHeuristic,
      });
      if (machineImportFlow.machineConfigImport) {
        result.project.machineConfig = structuredClone(
          unwrap(machineImportFlow.machineConfigImport.machineConfig),
        );
      }
      const opened = await actions.openPreparedProject(result.project, {
        status: t("landing.importedMachineStatus", {
          suffix: machineImportFlow.machineConfigImport?.machineConfig.ini
            .sourcePath
            ? `: ${machineImportFlow.machineConfigImport.machineConfig.ini.sourcePath}`
            : draft.sourcePath
              ? `: ${draft.sourcePath}`
              : "",
        }),
        warnings: result.warnings,
      });
      if (opened) {
        dispatchMachineImportFlow({ type: "close" });
        setIsEditorOpen(true);
        await refreshRecentProjects();
      } else if (state.status.startsWith("Failed")) {
        dispatchMachineImportFlow({
          type: "setError",
          message: state.status,
        });
      }
    } catch (error) {
      dispatchMachineImportFlow({
        type: "setError",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      dispatchMachineImportFlow({ type: "setBusy", value: false });
    }
  };

  const backToMachineFilesStep = () => {
    if (machineImportFlow.isBusy) return;
    if (!machineImportFlow.machineConfigSetup) return;
    dispatchMachineImportFlow({ type: "setStep", step: "machine-files" });
    dispatchMachineImportFlow({ type: "setError", message: null });
  };

  const changeHalImportLinkSelection = (groupId: string, value: string) =>
    dispatchMachineImportFlow({ type: "setLinkSelection", groupId, value });

  const updateMachineHalFilePath = (index: number, filePath: string) =>
    dispatchMachineImportFlow({
      type: "updateMachineHalFile",
      index,
      filePath,
    });

  const updateMachineHalFileResolveIni = (index: number, value: boolean) =>
    dispatchMachineImportFlow({
      type: "setMachineHalFileResolveIni",
      index,
      value,
    });

  const removeMachineHalFilePath = (index: number) =>
    dispatchMachineImportFlow({ type: "removeMachineHalFile", index });

  const addBlankMachineHalFilePath = () =>
    dispatchMachineImportFlow({ type: "addBlankMachineHalFile" });

  const changeHalImportPlacementHeuristic = (
    value: HalImportPlacementHeuristic,
  ) =>
    dispatchMachineImportFlow({
      type: "setPlacementHeuristic",
      value,
    });

  return {
    machineImportFlow,
    startMachineImportFlow,
    closeMachineImportFlow,
    pickMachineIniFile,
    pickMachineHalFileForRow,
    continueToLinkStep,
    createImportedProject,
    backToMachineFilesStep,
    changeHalImportLinkSelection,
    updateMachineHalFilePath,
    updateMachineHalFileResolveIni,
    removeMachineHalFilePath,
    addBlankMachineHalFilePath,
    changeHalImportPlacementHeuristic,
  };
}

export type MachineImportController = ReturnType<typeof useMachineImportFlow>;
