import {
  type Accessor,
  createMemo,
  createSignal,
  onMount,
  type Setter,
} from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import {
  buildProjectFromHalImport as buildImportedProject,
  suggestHalImportLinks,
} from "../../shared/halImport";
import type {
  HalImportDraft,
  HalImportPlacementHeuristic,
  MachineConfigHalFileSelection,
  MachineConfigImportDraft,
  MachineConfigImportSetupDraft,
  RecentProjectEntry,
} from "../../shared/types";
import type { ProjectCreationDialogProps } from "../components/ProjectCreationDialog";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";

interface UseLandingProjectFlowArgs {
  isEditorOpen: Accessor<boolean>;
  setIsEditorOpen: Setter<boolean>;
}

type ProjectCreationDialogState = {
  open: boolean;
  step: ProjectCreationDialogProps["step"];
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

type ProjectCreationDialogEvent =
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
  | { type: "setStep"; step: ProjectCreationDialogProps["step"] }
  | { type: "setLinkSelection"; groupId: string; value: string }
  | {
      type: "setPlacementHeuristic";
      value: HalImportPlacementHeuristic;
    };

function createInitialProjectCreationDialogState(): ProjectCreationDialogState {
  return {
    open: false,
    step: "choose",
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

function reduceProjectCreationDialogState(
  state: ProjectCreationDialogState,
  event: ProjectCreationDialogEvent,
): ProjectCreationDialogState {
  switch (event.type) {
    case "open":
      return {
        ...createInitialProjectCreationDialogState(),
        open: true,
      };
    case "close":
      return {
        ...state,
        open: false,
        errorMessage: null,
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

export function useLandingProjectFlow({
  isEditorOpen,
  setIsEditorOpen,
}: UseLandingProjectFlowArgs) {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const [recentProjects, setRecentProjects] = createSignal<
    RecentProjectEntry[]
  >([]);
  const [isRecentProjectsLoading, setIsRecentProjectsLoading] =
    createSignal(true);
  const [isLandingActionPending, setIsLandingActionPending] =
    createSignal(false);
  const [landingError, setLandingError] = createSignal<string | null>(null);
  const [projectCreationDialog, setProjectCreationDialog] = createStore(
    createInitialProjectCreationDialogState(),
  );

  const dispatchProjectCreationDialog = (event: ProjectCreationDialogEvent) => {
    setProjectCreationDialog((current) =>
      reduceProjectCreationDialogState(current, event),
    );
  };

  const refreshRecentProjects = async () => {
    setIsRecentProjectsLoading(true);
    try {
      setRecentProjects(await window.nohal.getRecentProjects());
    } catch (error) {
      setLandingError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRecentProjectsLoading(false);
    }
  };

  const runLandingAction = async (action: () => Promise<boolean>) => {
    setLandingError(null);
    setIsLandingActionPending(true);
    try {
      const opened = await action();
      if (opened) {
        setIsEditorOpen(true);
        await refreshRecentProjects();
      } else if (state.status.startsWith("Failed")) {
        setLandingError(state.status);
      }
    } catch (error) {
      setLandingError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLandingActionPending(false);
    }
  };

  const openProjectCreationDialog = () => {
    dispatchProjectCreationDialog({ type: "open" });
  };

  const closeProjectCreationDialog = () => {
    if (projectCreationDialog.isBusy) return;
    dispatchProjectCreationDialog({ type: "close" });
  };

  const createBlankProjectFromDialog = async () => {
    dispatchProjectCreationDialog({ type: "close" });
    if (!isEditorOpen()) {
      await runLandingAction(() => actions.newProject());
      return;
    }
    void actions.newProject();
  };

  const pickHalFileForNewProject = async () => {
    dispatchProjectCreationDialog({ type: "setError", message: null });
    dispatchProjectCreationDialog({ type: "setBusy", value: true });
    try {
      dispatchProjectCreationDialog({
        type: "setStep",
        step: "choose",
      });
      const setup = await window.nohal.pickMachineIniFile();
      if (!setup) return;
      dispatchProjectCreationDialog({
        type: "machineConfigSetupLoaded",
        setup,
      });
    } catch (error) {
      dispatchProjectCreationDialog({
        type: "setError",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      dispatchProjectCreationDialog({ type: "setBusy", value: false });
    }
  };

  const pickMachineHalFileForRow = async (index: number) => {
    dispatchProjectCreationDialog({ type: "setError", message: null });
    dispatchProjectCreationDialog({ type: "setBusy", value: true });
    try {
      const filePath = await window.nohal.pickMachineHalFile();
      if (!filePath) return;
      dispatchProjectCreationDialog({
        type: "updateMachineHalFile",
        index,
        filePath,
      });
    } catch (error) {
      dispatchProjectCreationDialog({
        type: "setError",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      dispatchProjectCreationDialog({ type: "setBusy", value: false });
    }
  };

  const continueMachineConfigToLinkStep = async () => {
    const setup = projectCreationDialog.machineConfigSetup;
    const iniPath = setup?.ini.sourcePath;
    if (!setup || !iniPath) return;
    dispatchProjectCreationDialog({ type: "setError", message: null });
    dispatchProjectCreationDialog({ type: "setBusy", value: true });
    try {
      const halSelections = unwrap(
        projectCreationDialog.selectedMachineHalFiles,
      )
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
      dispatchProjectCreationDialog({
        type: "importDraftLoaded",
        draft,
        machineConfigImport: machineImport,
        linkSelections: nextSelections,
        linkReasons: nextReasons,
      });
    } catch (error) {
      dispatchProjectCreationDialog({
        type: "setError",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      dispatchProjectCreationDialog({ type: "setBusy", value: false });
    }
  };

  const createImportedProjectFromDialog = async () => {
    const draft = projectCreationDialog.importDraft;
    if (!draft) return;
    dispatchProjectCreationDialog({ type: "setError", message: null });
    dispatchProjectCreationDialog({ type: "setBusy", value: true });
    try {
      const linkSelections = Object.fromEntries(
        draft.componentGroups.map((group) => {
          const value =
            projectCreationDialog.linkSelections[group.id] ?? "local";
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
        placementHeuristic: projectCreationDialog.placementHeuristic,
      });
      if (projectCreationDialog.machineConfigImport) {
        result.project.machineConfig = structuredClone(
          unwrap(projectCreationDialog.machineConfigImport.machineConfig),
        );
      }
      const opened = await actions.openPreparedProject(result.project, {
        status: t("landing.importedMachineStatus", {
          suffix: projectCreationDialog.machineConfigImport?.machineConfig.ini
            .sourcePath
            ? `: ${projectCreationDialog.machineConfigImport.machineConfig.ini.sourcePath}`
            : draft.sourcePath
              ? `: ${draft.sourcePath}`
              : "",
        }),
        warnings: result.warnings,
      });
      if (opened) {
        dispatchProjectCreationDialog({ type: "close" });
        setIsEditorOpen(true);
        await refreshRecentProjects();
      } else if (state.status.startsWith("Failed")) {
        dispatchProjectCreationDialog({
          type: "setError",
          message: state.status,
        });
      }
    } catch (error) {
      dispatchProjectCreationDialog({
        type: "setError",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      dispatchProjectCreationDialog({ type: "setBusy", value: false });
    }
  };

  const backToNewProjectChoice = () => {
    if (projectCreationDialog.isBusy) return;
    dispatchProjectCreationDialog({ type: "setStep", step: "choose" });
    dispatchProjectCreationDialog({ type: "setError", message: null });
  };

  const backToMachineConfigFilesStep = () => {
    if (projectCreationDialog.isBusy) return;
    if (!projectCreationDialog.machineConfigSetup) {
      dispatchProjectCreationDialog({ type: "setStep", step: "choose" });
      return;
    }
    dispatchProjectCreationDialog({ type: "setStep", step: "machine-files" });
    dispatchProjectCreationDialog({ type: "setError", message: null });
  };

  const changeHalImportLinkSelection = (groupId: string, value: string) =>
    dispatchProjectCreationDialog({ type: "setLinkSelection", groupId, value });

  const updateMachineHalFilePath = (index: number, filePath: string) =>
    dispatchProjectCreationDialog({
      type: "updateMachineHalFile",
      index,
      filePath,
    });

  const updateMachineHalFileResolveIni = (index: number, value: boolean) =>
    dispatchProjectCreationDialog({
      type: "setMachineHalFileResolveIni",
      index,
      value,
    });

  const removeMachineHalFilePath = (index: number) =>
    dispatchProjectCreationDialog({ type: "removeMachineHalFile", index });

  const addBlankMachineHalFilePath = () =>
    dispatchProjectCreationDialog({ type: "addBlankMachineHalFile" });

  const changeHalImportPlacementHeuristic = (
    value: HalImportPlacementHeuristic,
  ) =>
    dispatchProjectCreationDialog({
      type: "setPlacementHeuristic",
      value,
    });

  const projectCreationDialogProps = createMemo<ProjectCreationDialogProps>(
    () => ({
      open: projectCreationDialog.open,
      step: projectCreationDialog.step,
      isBusy: projectCreationDialog.isBusy,
      componentStore: state.componentStore,
      importDraft: projectCreationDialog.importDraft,
      machineConfigImport: projectCreationDialog.machineConfigImport,
      machineConfigSetup: projectCreationDialog.machineConfigSetup,
      selectedMachineHalFiles: projectCreationDialog.selectedMachineHalFiles,
      linkSelections: projectCreationDialog.linkSelections,
      linkReasons: projectCreationDialog.linkReasons,
      placementHeuristic: projectCreationDialog.placementHeuristic,
      errorMessage: projectCreationDialog.errorMessage,
      onClose: closeProjectCreationDialog,
      onCreateBlank: () => void createBlankProjectFromDialog(),
      onPickMachineIniFile: () => void pickHalFileForNewProject(),
      onAddBlankMachineHalFile: addBlankMachineHalFilePath,
      onRemoveMachineHalFile: removeMachineHalFilePath,
      onUpdateMachineHalFile: updateMachineHalFilePath,
      onToggleMachineHalFileResolveIni: updateMachineHalFileResolveIni,
      onPickMachineHalFileAtRow: (index) =>
        void pickMachineHalFileForRow(index),
      onContinueMachineConfig: () => void continueMachineConfigToLinkStep(),
      onBackToChoice: backToNewProjectChoice,
      onBackToMachineConfig: backToMachineConfigFilesStep,
      onChangeLinkSelection: changeHalImportLinkSelection,
      onChangePlacementHeuristic: changeHalImportPlacementHeuristic,
      onCreateImportedProject: () => void createImportedProjectFromDialog(),
    }),
  );

  onMount(() => {
    void actions.loadComponentStore();
    void refreshRecentProjects();
  });

  return {
    recentProjects,
    isRecentProjectsLoading,
    isLandingActionPending,
    landingError,
    projectCreationDialogProps,
    projectCreationDialog,
    dispatchProjectCreationDialog,
    refreshRecentProjects,
    runLandingAction,
    openProjectCreationDialog,
    closeProjectCreationDialog,
    createBlankProjectFromDialog,
    pickHalFileForNewProject,
    pickMachineHalFileForRow,
    continueMachineConfigToLinkStep,
    createImportedProjectFromDialog,
    backToNewProjectChoice,
    backToMachineConfigFilesStep,
    changeHalImportLinkSelection,
    updateMachineHalFilePath,
    updateMachineHalFileResolveIni,
    removeMachineHalFilePath,
    addBlankMachineHalFilePath,
    changeHalImportPlacementHeuristic,
  };
}
