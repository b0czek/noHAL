import type { LinuxCncVersion } from "@nohal/core/src/linuxcncVersion";
import { type Accessor, createSignal, onMount, type Setter } from "solid-js";
import type { RecentProjectEntry } from "../../shared/recentProjects";
import { useEditorStore } from "../state/EditorStoreProvider";

interface UseLandingProjectFlowArgs {
  setIsEditorOpen: Setter<boolean>;
  selectedLinuxCncVersion: Accessor<LinuxCncVersion>;
}

export function useLandingProjectFlow({
  setIsEditorOpen,
  selectedLinuxCncVersion,
}: UseLandingProjectFlowArgs) {
  const { state, actions } = useEditorStore();
  const [recentProjects, setRecentProjects] = createSignal<
    RecentProjectEntry[]
  >([]);
  const [isRecentProjectsLoading, setIsRecentProjectsLoading] =
    createSignal(true);
  const [isLandingActionPending, setIsLandingActionPending] =
    createSignal(false);
  const [landingError, setLandingError] = createSignal<string | null>(null);

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

  const createBlankProject = async () => {
    await runLandingAction(() => actions.newProject(selectedLinuxCncVersion()));
  };

  const openProject = async () => {
    await runLandingAction(() => actions.openProject());
  };

  const openRecentProject = async (projectPath: string) => {
    await runLandingAction(() => actions.openProjectAt(projectPath));
  };

  onMount(() => {
    void actions.loadComponentStore();
    void refreshRecentProjects();
  });

  return {
    recentProjects,
    isRecentProjectsLoading,
    isLandingActionPending,
    landingError,
    refreshRecentProjects,
    runLandingAction,
    createBlankProject,
    openProject,
    openRecentProject,
  };
}

export type LandingProjectFlowController = ReturnType<
  typeof useLandingProjectFlow
>;
