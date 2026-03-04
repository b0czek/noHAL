import type { LinuxCncVersion } from "@nohal/core/src/linuxcncVersion";
import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import EditorScreen from "./app/EditorScreen";
import { useLandingProjectFlow } from "./app/useLandingProjectFlow";
import { ContextMenuProvider } from "./components/ContextMenuProvider";
import LandingPage from "./components/LandingPage";
import MachineImportPage from "./features/machineImport/MachineImportPage";
import { useMachineImportFlow } from "./features/machineImport/useMachineImportFlow";
import { useI18n } from "./i18n";
import {
  EditorStoreProvider,
  useEditorStore,
} from "./state/EditorStoreProvider";

export default function App() {
  return (
    <EditorStoreProvider>
      <AppContent />
    </EditorStoreProvider>
  );
}

function AppContent() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const [isEditorOpen, setIsEditorOpen] = createSignal(false);
  const [selectedLinuxCncVersion, setSelectedLinuxCncVersion] =
    createSignal<LinuxCncVersion>("2.10");
  const landing = useLandingProjectFlow({
    setIsEditorOpen,
    selectedLinuxCncVersion,
  });
  const machineImport = useMachineImportFlow({
    setIsEditorOpen,
    refreshRecentProjects: landing.refreshRecentProjects,
    selectedLinuxCncVersion,
  });

  const goToLanding = async () => {
    if (!isEditorOpen()) return;
    if (!(await actions.confirmProceedWithUnsavedChanges())) return;
    setIsEditorOpen(false);
  };

  createEffect(() => {
    if (!isEditorOpen()) {
      document.title = "NoHAL";
      return;
    }
    const projectName =
      state.project.name.trim() || t("app.defaultProjectName");
    document.title = `${projectName}${state.isDirty ? "*" : ""} - NoHAL`;
  });

  createEffect(() => {
    window.nohal.setWindowDirtyState(isEditorOpen() && state.isDirty);
  });

  onMount(() => {
    const disposeSaveBeforeClose = window.nohal.onRequestSaveBeforeClose(
      async () => {
        if (!isEditorOpen()) return true;
        return actions.saveProject();
      },
    );
    onCleanup(() => {
      disposeSaveBeforeClose();
    });
  });

  return (
    <ContextMenuProvider>
      <Show
        when={isEditorOpen()}
        fallback={
          <Show
            when={machineImport.machineImportFlow.isActive}
            fallback={
              <LandingPage
                landing={landing}
                selectedLinuxCncVersion={selectedLinuxCncVersion()}
                onSelectedLinuxCncVersionChange={setSelectedLinuxCncVersion}
                onImportMachineConfiguration={() =>
                  void machineImport.startMachineImportFlow()
                }
              />
            }
          >
            <MachineImportPage machineImport={machineImport} />
          </Show>
        }
      >
        <EditorScreen onGoToLanding={() => void goToLanding()} />
      </Show>
    </ContextMenuProvider>
  );
}
