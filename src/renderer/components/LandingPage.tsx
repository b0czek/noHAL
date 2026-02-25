import { HiOutlineDocumentPlus, HiOutlineFolderOpen } from "solid-icons/hi";
import { For, Show } from "solid-js";
import type { RecentProjectEntry } from "../../shared/types";
import { useI18n } from "../i18n";
import "./LandingPage.css";

interface LandingPageProps {
  recentProjects: RecentProjectEntry[];
  isRecentProjectsLoading: boolean;
  isActionPending: boolean;
  errorMessage: string | null;
  onCreateProject: () => void;
  onOpenProject: () => void;
  onRefreshRecentProjects: () => void;
  onOpenRecentProject: (projectPath: string) => void;
}

function recentProjectName(entry: RecentProjectEntry): string {
  if (entry.name?.trim()) return entry.name;
  return entry.projectPath.split(/[\\/]/).pop() ?? entry.projectPath;
}

function recentProjectPathTail(projectPath: string): string {
  const segments = projectPath.split(/[\\/]/).filter(Boolean);
  if (segments.length <= 3) return projectPath;
  return `.../${segments.slice(-3).join("/")}`;
}

export default function LandingPage(props: LandingPageProps) {
  const { t, formatDateTime } = useI18n();

  return (
    <div class="landing-shell">
      <div class="landing-backdrop-grid" aria-hidden="true" />
      <main class="landing-main">
        <section class="landing-hero panel">
          <div class="brand landing-brand">
            <div class="brand-mark">N</div>
            <div>
              <div class="brand-name">NoHAL</div>
              <div class="brand-sub">{t("landing.brandSubtitle")}</div>
            </div>
          </div>
          <h1 class="landing-title">{t("landing.title")}</h1>
          <p class="landing-copy">{t("landing.copy")}</p>
          <div class="landing-actions">
            <button
              type="button"
              class="btn accent landing-action-btn"
              disabled={props.isActionPending}
              onClick={props.onCreateProject}
            >
              <HiOutlineDocumentPlus size={18} aria-hidden="true" />
              {t("landing.newProject")}
            </button>
            <button
              type="button"
              class="btn landing-action-btn"
              disabled={props.isActionPending}
              onClick={props.onOpenProject}
            >
              <HiOutlineFolderOpen size={18} aria-hidden="true" />
              {t("landing.openProject")}
            </button>
          </div>
          <Show when={props.errorMessage}>
            {(message) => <div class="landing-error">{message()}</div>}
          </Show>
        </section>

        <section class="landing-recents panel">
          <div class="landing-recents-header">
            <div class="panel-title">{t("landing.recentProjects")}</div>
            <button
              type="button"
              class="mini"
              onClick={props.onRefreshRecentProjects}
              disabled={props.isRecentProjectsLoading || props.isActionPending}
            >
              {t("common.refresh")}
            </button>
          </div>

          <Show
            when={!props.isRecentProjectsLoading}
            fallback={
              <div class="landing-recents-empty muted">
                {t("landing.loadingRecentProjects")}
              </div>
            }
          >
            <Show
              when={props.recentProjects.length > 0}
              fallback={
                <div class="landing-recents-empty muted">
                  {t("landing.noRecentProjectsPrefix")}
                  <span class="mono">{t("landing.newProject")}</span>
                  {t("landing.noRecentProjectsOr")}
                  <span class="mono">{t("landing.openProject")}</span>
                  {t("landing.noRecentProjectsSuffix")}
                </div>
              }
            >
              <div class="landing-recents-list">
                <For each={props.recentProjects}>
                  {(entry) => (
                    <button
                      type="button"
                      class="landing-recent-row"
                      disabled={props.isActionPending}
                      onClick={() =>
                        props.onOpenRecentProject(entry.projectPath)
                      }
                      title={entry.projectPath}
                    >
                      <div class="landing-recent-main">
                        <div class="landing-recent-name">
                          {recentProjectName(entry)}
                        </div>
                        <div class="landing-recent-path mono">
                          {recentProjectPathTail(entry.projectPath)}
                        </div>
                      </div>
                      <div class="landing-recent-time">
                        {formatDateTime(entry.lastOpenedAt)}
                      </div>
                    </button>
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </section>
      </main>
    </div>
  );
}
