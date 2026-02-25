import type { NoHALProject } from "../../../../shared/types";
import type { TranslationKey } from "../../../i18n";
import { toErrorMessage } from "../helpers";
import type { EditorStoreActionContext } from "./types";

type ProjectTransition = {
  project: NoHALProject;
  projectPath: string | null;
  status: string;
  warnings?: string[];
};

type OpenedProjectResult = {
  project: NoHALProject;
  projectPath: string;
};

function openedProjectPathStatus(
  deps: EditorStoreActionContext,
  projectPath: string,
): string {
  return deps.t("store.status.openedProjectPath", { projectPath });
}

function projectTransitionFromOpenedResult(
  deps: EditorStoreActionContext,
  result: OpenedProjectResult,
): ProjectTransition {
  return {
    project: result.project,
    projectPath: result.projectPath,
    status: openedProjectPathStatus(deps, result.projectPath),
  };
}

async function runProjectTransition(
  deps: EditorStoreActionContext,
  load: () => Promise<ProjectTransition | null>,
  errorStatusKey: TranslationKey,
): Promise<boolean> {
  if (!(await deps.confirmProceedWithUnsavedChanges())) return false;
  try {
    const next = await load();
    if (!next) return false;
    deps.replaceProjectState(next.project, next.projectPath, next.status);
    if (next.warnings) deps.setExportWarnings([...next.warnings]);
    return true;
  } catch (error) {
    deps.setStatusT(errorStatusKey, { error: toErrorMessage(error) });
    return false;
  }
}

export function createProjectActions(deps: EditorStoreActionContext) {
  return {
    async newProject(): Promise<boolean> {
      return runProjectTransition(
        deps,
        async () => ({
          project: await window.nohal.newProject(),
          projectPath: null,
          status: deps.t("store.status.createdNewProject"),
        }),
        "store.status.failedCreateProject",
      );
    },

    async openPreparedProject(
      project: NoHALProject,
      options?: {
        projectPath?: string | null;
        status?: string;
        warnings?: string[];
      },
    ): Promise<boolean> {
      return runProjectTransition(
        deps,
        async () => ({
          project,
          projectPath: options?.projectPath ?? null,
          status: options?.status ?? deps.t("store.status.openedProject"),
          warnings: options?.warnings,
        }),
        "store.status.failedLoadPreparedProject",
      );
    },

    async openProject(): Promise<boolean> {
      return runProjectTransition(
        deps,
        async () => {
          const result = await window.nohal.openProject();
          if (!result) return null;
          return projectTransitionFromOpenedResult(deps, result);
        },
        "store.status.failedOpenProject",
      );
    },

    async openProjectAt(projectPath: string): Promise<boolean> {
      return runProjectTransition(
        deps,
        async () =>
          projectTransitionFromOpenedResult(
            deps,
            await window.nohal.openProjectAt(projectPath),
          ),
        "store.status.failedOpenProject",
      );
    },
  };
}
