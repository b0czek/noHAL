import { createSignal, Show } from "solid-js";
import { createEmptyProject } from "../shared/project";
import EditorScreen from "./app/EditorScreen";
import { useLandingProjectFlow } from "./app/useLandingProjectFlow";
import LandingPage from "./components/LandingPage";
import ProjectCreationDialog from "./components/ProjectCreationDialog";
import { useI18n } from "./i18n";
import { createEditorStore } from "./state/store";

export default function App() {
  const { t } = useI18n();
  const { state, actions } = createEditorStore(
    createEmptyProject(t("app.defaultProjectName")),
    t,
  );
  const [isEditorOpen, setIsEditorOpen] = createSignal(false);
  const landing = useLandingProjectFlow({
    state,
    actions,
    isEditorOpen,
    setIsEditorOpen,
  });

  return (
    <>
      <ProjectCreationDialog {...landing.projectCreationDialogProps()} />
      <Show
        when={isEditorOpen()}
        fallback={
          <LandingPage
            recentProjects={landing.recentProjects()}
            isRecentProjectsLoading={landing.isRecentProjectsLoading()}
            isActionPending={landing.isLandingActionPending()}
            errorMessage={landing.landingError()}
            onCreateProject={landing.openProjectCreationDialog}
            onOpenProject={() =>
              void landing.runLandingAction(() => actions.openProject())
            }
            onRefreshRecentProjects={() => void landing.refreshRecentProjects()}
            onOpenRecentProject={(filePath) =>
              void landing.runLandingAction(() =>
                actions.openProjectAt(filePath),
              )
            }
          />
        }
      >
        <EditorScreen
          state={state}
          actions={actions}
          onOpenProjectCreationDialog={landing.openProjectCreationDialog}
        />
      </Show>
    </>
  );
}
