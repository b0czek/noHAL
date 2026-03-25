import { customComponentDefinitionEdits } from "@nohal/core/src/customComponent";
import {
  buildProjectFromHalImport as buildImportedProject,
  detectMesaHalImport,
} from "@nohal/core/src/halImport";
import type {
  ProjectMesaConnectorCardKind,
  ProjectMesaGpioDirection,
  ProjectMesaHostKind,
  ProjectMesaSmartSerialCardKind,
  ProjectMesaSmartSerialTarget,
} from "@nohal/core/src/mesa";
import { createDefaultMesaConfig } from "@nohal/core/src/project";
import type {
  ComponentDefinition,
  HalImportPlacementHeuristic,
  HalValueType,
  LinuxCncVersion,
} from "@nohal/core/src/types";
import type { Accessor } from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import type { CustomComponentEditorProps } from "../projectSettings/CustomComponentEditor";
import {
  buildGeneratedLocalComponents as buildGeneratedComponentsForSelections,
  prepareLinkStepState,
  toLinkSelections,
} from "./flowLinking";
import { mesaEdits } from "./flowMesa";
import {
  createInitialState,
  type FlowEvent,
  reduceFlowState,
} from "./flowState";

interface UseMachineImportFlowArgs {
  setIsEditorOpen: (value: boolean) => void;
  refreshRecentProjects: () => Promise<void>;
  selectedLinuxCncVersion: Accessor<LinuxCncVersion>;
}

export function useMachineImportFlow({
  setIsEditorOpen,
  refreshRecentProjects,
  selectedLinuxCncVersion,
}: UseMachineImportFlowArgs) {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const [machineImportFlow, setMachineImportFlow] = createStore(
    createInitialState(),
  );

  const dispatchMachineImportFlow = (event: FlowEvent) => {
    setMachineImportFlow((current) => reduceFlowState(current, event));
  };

  const buildGeneratedLocalComponents = (
    encodedSelections = machineImportFlow.linkSelections,
  ) => {
    const draft = machineImportFlow.importDraft;
    if (!draft) return {};
    return buildGeneratedComponentsForSelections({
      draft,
      encodedSelections,
      componentStore: state.componentStore,
    });
  };

  const updateGeneratedLocalComponent = (
    groupId: string,
    edit: (component: ComponentDefinition) => void,
  ) => {
    const component = machineImportFlow.generatedLocalComponents[groupId];
    if (!component) return;
    setMachineImportFlow("generatedLocalComponents", groupId, (current) => {
      const next = structuredClone(unwrap(current));
      edit(next);
      return next;
    });
  };

  const ensureGeneratedLocalComponent = (
    groupId: string,
    encodedSelections = machineImportFlow.linkSelections,
  ) => {
    if (machineImportFlow.generatedLocalComponents[groupId]) return;
    const generated = buildGeneratedLocalComponents(encodedSelections)[groupId];
    if (!generated) return;
    setMachineImportFlow("generatedLocalComponents", groupId, generated);
  };

  const prepareLinkStep = (mesaConfig = machineImportFlow.mesaConfig) => {
    const draft = machineImportFlow.importDraft;
    const machineConfigImport = machineImportFlow.machineConfigImport;
    if (!draft || !machineConfigImport) return;
    dispatchMachineImportFlow({
      type: "importDraftLoaded",
      ...prepareLinkStepState({
        draft,
        machineConfigImport,
        mesaConfig,
        componentStore: state.componentStore,
        linuxcncVersion: selectedLinuxCncVersion(),
        systemAutoReason: t("projectCreation.systemAutoReason"),
        mesaSystemAutoReason: t("projectCreation.mesaSystemAutoReason"),
      }),
    });
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
      if (detectMesaHalImport(draft).detected) {
        dispatchMachineImportFlow({
          type: "importDraftLoaded",
          draft,
          machineConfigImport: machineImport,
          step: "mesa",
          mesaDetected: true,
          mesaConfig: machineImportFlow.mesaConfig ?? createDefaultMesaConfig(),
          linkSelections: {},
          linkReasons: {},
          systemLinkGroupIds: [],
          generatedLocalComponents: {},
        });
        return;
      }

      dispatchMachineImportFlow({
        type: "importDraftLoaded",
        ...prepareLinkStepState({
          draft,
          machineConfigImport: machineImport,
          mesaConfig: null,
          componentStore: state.componentStore,
          linuxcncVersion: selectedLinuxCncVersion(),
          systemAutoReason: t("projectCreation.systemAutoReason"),
          mesaSystemAutoReason: t("projectCreation.mesaSystemAutoReason"),
        }),
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

  const continueFromMesaStep = () => {
    if (!machineImportFlow.mesaConfig) return;
    dispatchMachineImportFlow({ type: "setError", message: null });
    prepareLinkStep();
  };

  const createImportedProject = async () => {
    const draft = machineImportFlow.importDraft;
    if (!draft) return;
    dispatchMachineImportFlow({ type: "setError", message: null });
    dispatchMachineImportFlow({ type: "setBusy", value: true });
    try {
      const linkSelections = toLinkSelections(
        draft,
        machineImportFlow.linkSelections,
      );
      const generatedLocalComponents = buildGeneratedLocalComponents();
      const projectLocalComponentOverrides = Object.fromEntries(
        draft.componentGroups.flatMap((group) => {
          const value = machineImportFlow.linkSelections[group.id] ?? "local";
          if (value !== "local") return [];
          const component =
            machineImportFlow.generatedLocalComponents[group.id] ??
            generatedLocalComponents[group.id];
          return component
            ? [[group.id, structuredClone(unwrap(component))] as const]
            : [];
        }),
      );

      const result = buildImportedProject({
        draft,
        componentStore: state.componentStore,
        linkSelections,
        projectLocalComponentOverrides,
        mesa: machineImportFlow.mesaConfig ?? undefined,
        linuxcncVersion: selectedLinuxCncVersion(),
        placementHeuristic: machineImportFlow.placementHeuristic,
      });
      if (machineImportFlow.machineConfigImport) {
        result.project.machineConfig = structuredClone(
          unwrap(machineImportFlow.machineConfigImport.machineConfig),
        );
      }
      const opened = await actions.openPreparedProject(result.project, {
        status: t("landing.importedMachineStatus", {
          suffix: machineImportFlow.machineConfigImport?.machineConfig.userIni
            .sourcePath
            ? `: ${machineImportFlow.machineConfigImport.machineConfig.userIni.sourcePath}`
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
    if (machineImportFlow.isBusy || !machineImportFlow.machineConfigSetup)
      return;
    dispatchMachineImportFlow({ type: "setStep", step: "machine-files" });
    dispatchMachineImportFlow({ type: "setError", message: null });
  };

  const addMesaImportHost = (kind?: ProjectMesaHostKind) =>
    dispatchMachineImportFlow({
      type: "setMesaConfig",
      value: mesaEdits.addHost(machineImportFlow.mesaConfig, kind),
    });

  const removeMesaImportHost = (hostId: string) =>
    dispatchMachineImportFlow({
      type: "setMesaConfig",
      value: mesaEdits.removeHost(machineImportFlow.mesaConfig, hostId),
    });

  const updateMesaImportHostKind = (
    hostId: string,
    kind: ProjectMesaHostKind,
  ) =>
    dispatchMachineImportFlow({
      type: "setMesaConfig",
      value: mesaEdits.updateHostKind(
        machineImportFlow.mesaConfig,
        hostId,
        kind,
      ),
    });

  const updateMesaImportHostIp = (hostId: string, ip: string) =>
    dispatchMachineImportFlow({
      type: "setMesaConfig",
      value: mesaEdits.updateHostIp(machineImportFlow.mesaConfig, hostId, ip),
    });

  const setMesaImportConnectorCard = (
    hostId: string,
    connectorKey: string,
    cardKind: ProjectMesaConnectorCardKind | undefined,
  ) =>
    dispatchMachineImportFlow({
      type: "setMesaConfig",
      value: mesaEdits.setConnectorCard(
        machineImportFlow.mesaConfig,
        hostId,
        connectorKey,
        cardKind,
      ),
    });

  const setMesaImportRawGpioPinDirection = (
    hostId: string,
    connectorKey: string,
    pinIndex: number,
    direction: ProjectMesaGpioDirection,
  ) =>
    dispatchMachineImportFlow({
      type: "setMesaConfig",
      value: mesaEdits.setRawGpioPinDirection(
        machineImportFlow.mesaConfig,
        hostId,
        connectorKey,
        pinIndex,
        direction,
      ),
    });

  const setMesaImportSmartSerialCard = (
    hostId: string,
    target: ProjectMesaSmartSerialTarget,
    cardKind: ProjectMesaSmartSerialCardKind | undefined,
  ) =>
    dispatchMachineImportFlow({
      type: "setMesaConfig",
      value: mesaEdits.setSmartSerialCard(
        machineImportFlow.mesaConfig,
        hostId,
        target,
        cardKind,
      ),
    });

  const changeHalImportLinkSelection = (groupId: string, value: string) => {
    const nextSelections = {
      ...machineImportFlow.linkSelections,
      [groupId]: value,
    };
    dispatchMachineImportFlow({ type: "setLinkSelection", groupId, value });
    if (value === "local") {
      ensureGeneratedLocalComponent(groupId, nextSelections);
    }
  };

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

  const updateGeneratedLocalComponentHalComponentName = (
    groupId: string,
    value: string,
  ) =>
    updateGeneratedLocalComponent(groupId, (component) => {
      customComponentDefinitionEdits.halComponentName.update(component, value);
    });

  const updateGeneratedLocalComponentRuntimeKind = (
    groupId: string,
    value: "rt" | "userspace" | "unknown",
  ) =>
    updateGeneratedLocalComponent(groupId, (component) => {
      customComponentDefinitionEdits.runtimeKind.update(component, value);
    });

  const updateGeneratedLocalComponentLoadCommand = (
    groupId: string,
    value: string,
  ) =>
    updateGeneratedLocalComponent(groupId, (component) => {
      customComponentDefinitionEdits.loadCommand.update(component, value);
    });

  const addGeneratedLocalComponentPin = (groupId: string) =>
    updateGeneratedLocalComponent(groupId, (component) => {
      customComponentDefinitionEdits.pin.add(component);
    });

  const removeGeneratedLocalComponentPin = (groupId: string, pinKey: string) =>
    updateGeneratedLocalComponent(groupId, (component) => {
      customComponentDefinitionEdits.pin.remove(component, pinKey);
    });

  const updateGeneratedLocalComponentPinName = (
    groupId: string,
    pinKey: string,
    value: string,
  ) =>
    updateGeneratedLocalComponent(groupId, (component) => {
      customComponentDefinitionEdits.pin.name.update(component, pinKey, value);
    });

  const updateGeneratedLocalComponentPinType = (
    groupId: string,
    pinKey: string,
    value: HalValueType,
  ) =>
    updateGeneratedLocalComponent(groupId, (component) => {
      customComponentDefinitionEdits.pin.type.update(component, pinKey, value);
    });

  const updateGeneratedLocalComponentPinDirection = (
    groupId: string,
    pinKey: string,
    value: "in" | "out" | "io",
  ) =>
    updateGeneratedLocalComponent(groupId, (component) => {
      customComponentDefinitionEdits.pin.direction.update(
        component,
        pinKey,
        value,
      );
    });

  const addGeneratedLocalComponentParam = (groupId: string) =>
    updateGeneratedLocalComponent(groupId, (component) => {
      customComponentDefinitionEdits.param.add(component);
    });

  const removeGeneratedLocalComponentParam = (
    groupId: string,
    paramKey: string,
  ) =>
    updateGeneratedLocalComponent(groupId, (component) => {
      customComponentDefinitionEdits.param.remove(component, paramKey);
    });

  const updateGeneratedLocalComponentParamName = (
    groupId: string,
    paramKey: string,
    value: string,
  ) =>
    updateGeneratedLocalComponent(groupId, (component) => {
      customComponentDefinitionEdits.param.name.update(
        component,
        paramKey,
        value,
      );
    });

  const updateGeneratedLocalComponentParamType = (
    groupId: string,
    paramKey: string,
    value: HalValueType,
  ) =>
    updateGeneratedLocalComponent(groupId, (component) => {
      customComponentDefinitionEdits.param.type.update(
        component,
        paramKey,
        value,
      );
    });

  const updateGeneratedLocalComponentParamDirection = (
    groupId: string,
    paramKey: string,
    value: "r" | "rw",
  ) =>
    updateGeneratedLocalComponent(groupId, (component) => {
      customComponentDefinitionEdits.param.direction.update(
        component,
        paramKey,
        value,
      );
    });

  const updateGeneratedLocalComponentParamDefaultValue = (
    groupId: string,
    paramKey: string,
    value: string,
  ) =>
    updateGeneratedLocalComponent(groupId, (component) => {
      customComponentDefinitionEdits.param.defaultValue.update(
        component,
        paramKey,
        value,
      );
    });

  const bindGeneratedLocalComponentEditor = (
    groupId: string,
  ): Omit<CustomComponentEditorProps, "component"> => ({
    onHalComponentNameChange: (value) =>
      updateGeneratedLocalComponentHalComponentName(groupId, value),
    onRuntimeKindChange: (value) =>
      updateGeneratedLocalComponentRuntimeKind(groupId, value),
    onLoadCommandChange: (value) =>
      updateGeneratedLocalComponentLoadCommand(groupId, value),
    onAddPin: () => addGeneratedLocalComponentPin(groupId),
    onRemovePin: (pinKey) => removeGeneratedLocalComponentPin(groupId, pinKey),
    onPinNameChange: (pinKey, value) =>
      updateGeneratedLocalComponentPinName(groupId, pinKey, value),
    onPinTypeChange: (pinKey, value) =>
      updateGeneratedLocalComponentPinType(groupId, pinKey, value),
    onPinDirectionChange: (pinKey, value) =>
      updateGeneratedLocalComponentPinDirection(groupId, pinKey, value),
    onAddParam: () => addGeneratedLocalComponentParam(groupId),
    onRemoveParam: (paramKey) =>
      removeGeneratedLocalComponentParam(groupId, paramKey),
    onParamNameChange: (paramKey, value) =>
      updateGeneratedLocalComponentParamName(groupId, paramKey, value),
    onParamTypeChange: (paramKey, value) =>
      updateGeneratedLocalComponentParamType(groupId, paramKey, value),
    onParamDirectionChange: (paramKey, value) =>
      updateGeneratedLocalComponentParamDirection(groupId, paramKey, value),
    onParamDefaultValueChange: (paramKey, value) =>
      updateGeneratedLocalComponentParamDefaultValue(groupId, paramKey, value),
  });

  return {
    selectedLinuxCncVersion,
    machineImportFlow,
    startMachineImportFlow,
    closeMachineImportFlow,
    pickMachineIniFile,
    pickMachineHalFileForRow,
    continueToLinkStep,
    continueFromMesaStep,
    createImportedProject,
    backToMachineFilesStep,
    addMesaImportHost,
    removeMesaImportHost,
    updateMesaImportHostKind,
    updateMesaImportHostIp,
    setMesaImportConnectorCard,
    setMesaImportRawGpioPinDirection,
    setMesaImportSmartSerialCard,
    changeHalImportLinkSelection,
    updateMachineHalFilePath,
    updateMachineHalFileResolveIni,
    removeMachineHalFilePath,
    addBlankMachineHalFilePath,
    changeHalImportPlacementHeuristic,
    updateGeneratedLocalComponentHalComponentName,
    updateGeneratedLocalComponentRuntimeKind,
    updateGeneratedLocalComponentLoadCommand,
    addGeneratedLocalComponentPin,
    removeGeneratedLocalComponentPin,
    updateGeneratedLocalComponentPinName,
    updateGeneratedLocalComponentPinType,
    updateGeneratedLocalComponentPinDirection,
    addGeneratedLocalComponentParam,
    removeGeneratedLocalComponentParam,
    updateGeneratedLocalComponentParamName,
    updateGeneratedLocalComponentParamType,
    updateGeneratedLocalComponentParamDirection,
    updateGeneratedLocalComponentParamDefaultValue,
    bindGeneratedLocalComponentEditor,
  };
}

export type MachineImportController = ReturnType<typeof useMachineImportFlow>;
