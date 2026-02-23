import { HiOutlineDocumentPlus, HiOutlineFolderOpen } from "solid-icons/hi";
import { For, Show } from "solid-js";
import type { RecentProjectEntry } from "../../shared/types";
import "./LandingPage.css";

interface LandingPageProps {
  recentProjects: RecentProjectEntry[];
  isRecentProjectsLoading: boolean;
  isActionPending: boolean;
  errorMessage: string | null;
  onCreateProject: () => void;
  onOpenProject: () => void;
  onRefreshRecentProjects: () => void;
  onOpenRecentProject: (filePath: string) => void;
}

function recentProjectName(entry: RecentProjectEntry): string {
  if (entry.name?.trim()) return entry.name;
  return entry.filePath.split(/[\\/]/).pop() ?? entry.filePath;
}

function recentProjectPathTail(filePath: string): string {
  const segments = filePath.split(/[\\/]/).filter(Boolean);
  if (segments.length <= 3) return filePath;
  return `.../${segments.slice(-3).join("/")}`;
}

function recentProjectTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export default function LandingPage(props: LandingPageProps) {
  return (
    <div class="landing-shell">
      <div class="landing-backdrop-grid" aria-hidden="true" />
      <main class="landing-main">
        <section class="landing-hero panel">
          <div class="brand landing-brand">
            <div class="brand-mark">N</div>
            <div>
              <div class="brand-name">NoHAL</div>
              <div class="brand-sub">Visual HAL IDE for LinuxCNC</div>
            </div>
          </div>
          <h1 class="landing-title">Pick a project and get to work.</h1>
          <p class="landing-copy">
            Open an existing `.nohal.json` file or create a new project and jump
            into the editor only when you are ready.
          </p>
          <div class="landing-actions">
            <button
              type="button"
              class="btn accent landing-action-btn"
              disabled={props.isActionPending}
              onClick={props.onCreateProject}
            >
              <HiOutlineDocumentPlus size={18} aria-hidden="true" />
              New Project
            </button>
            <button
              type="button"
              class="btn landing-action-btn"
              disabled={props.isActionPending}
              onClick={props.onOpenProject}
            >
              <HiOutlineFolderOpen size={18} aria-hidden="true" />
              Open Project
            </button>
          </div>
          <Show when={props.errorMessage}>
            {(message) => <div class="landing-error">{message()}</div>}
          </Show>
        </section>

        <section class="landing-recents panel">
          <div class="landing-recents-header">
            <div class="panel-title">Recent Projects</div>
            <button
              type="button"
              class="mini"
              onClick={props.onRefreshRecentProjects}
              disabled={props.isRecentProjectsLoading || props.isActionPending}
            >
              Refresh
            </button>
          </div>

          <Show
            when={!props.isRecentProjectsLoading}
            fallback={
              <div class="landing-recents-empty muted">
                Loading recent projects...
              </div>
            }
          >
            <Show
              when={props.recentProjects.length > 0}
              fallback={
                <div class="landing-recents-empty muted">
                  No recent projects yet. Use{" "}
                  <span class="mono">New Project</span> or{" "}
                  <span class="mono">Open Project</span>.
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
                      onClick={() => props.onOpenRecentProject(entry.filePath)}
                      title={entry.filePath}
                    >
                      <div class="landing-recent-main">
                        <div class="landing-recent-name">
                          {recentProjectName(entry)}
                        </div>
                        <div class="landing-recent-path mono">
                          {recentProjectPathTail(entry.filePath)}
                        </div>
                      </div>
                      <div class="landing-recent-time">
                        {recentProjectTime(entry.lastOpenedAt)}
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
