import {
  type LinuxCncVersion,
  SUPPORTED_LINUXCNC_VERSIONS,
} from "@nohal/core/src/linuxcncVersion";
import { HiOutlineDocumentPlus, HiOutlineFolderOpen } from "solid-icons/hi";
import { createSignal, For, Show } from "solid-js";
import type { RecentProjectEntry } from "../../shared/recentProjects";
import type { LandingProjectFlowController } from "../app/useLandingProjectFlow";
import GeneralSettingsDialog from "../features/generalSettings";
import { useI18n } from "../i18n";
import BrandLogo from "./BrandLogo";
import StringSelect from "./form/StringSelect";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface LandingPageProps {
  landing: LandingProjectFlowController;
  selectedLinuxCncVersion: LinuxCncVersion;
  onSelectedLinuxCncVersionChange: (value: LinuxCncVersion) => void;
  onImportMachineConfiguration: () => void;
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
  const landing = () => props.landing;
  const [isGeneralSettingsOpen, setIsGeneralSettingsOpen] = createSignal(false);

  return (
    <div class="relative h-screen overflow-hidden bg-[linear-gradient(180deg,#081216_0%,#04090c_100%)]">
      <div
        class="pointer-events-none fixed inset-0 opacity-45 [background-image:radial-gradient(circle_at_12%_6%,hsl(var(--accent)/0.12),transparent_28%),radial-gradient(circle_at_88%_8%,hsl(var(--primary)/0.12),transparent_24%),linear-gradient(rgba(122,230,208,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(122,230,208,0.025)_1px,transparent_1px)] [background-size:auto,auto,28px_28px,28px_28px]"
        aria-hidden="true"
      />
      <main class="relative z-10 mx-auto flex h-full w-full max-w-5xl min-h-0 flex-col gap-5 px-4 py-8 sm:px-6">
        <Card class="shrink-0 overflow-hidden border-white/10 bg-[radial-gradient(circle_at_18%_12%,hsl(var(--accent)/0.14),transparent_38%),radial-gradient(circle_at_88%_14%,hsl(var(--primary)/0.14),transparent_32%),linear-gradient(180deg,rgba(11,24,31,0.9),rgba(8,17,22,0.86))]">
          <CardHeader class="gap-4 pb-0">
            <div class="flex items-center gap-3">
              <BrandLogo
                class="size-12 shadow-lg shadow-black/20"
                alt=""
                aria-hidden="true"
              />
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  NoHAL
                </div>
                <CardDescription>{t("landing.brandSubtitle")}</CardDescription>
              </div>
            </div>
            <div class="grid gap-3">
              <h1 class="max-w-[14ch] text-4xl font-semibold tracking-tight sm:text-5xl">
                {t("landing.title")}
              </h1>
              <p class="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                {t("landing.copy")}
              </p>
            </div>
          </CardHeader>
          <CardContent class="grid gap-5 pt-5">
            <div class="inline-flex w-fit items-center gap-3 rounded-2xl px-1 py-1">
              <span class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {t("landing.targetLinuxCncVersion")}
              </span>
              <StringSelect
                value={props.selectedLinuxCncVersion}
                class="min-w-[11rem]"
                options={SUPPORTED_LINUXCNC_VERSIONS.map((version) => ({
                  value: version,
                  label: `LinuxCNC ${version}`,
                }))}
                onChange={(value) =>
                  props.onSelectedLinuxCncVersionChange(
                    value as LinuxCncVersion,
                  )
                }
              />
            </div>
            <div class="flex flex-wrap gap-3">
              <Button
                class="h-11 rounded-xl px-5"
                disabled={landing().isLandingActionPending()}
                onClick={() => void landing().createBlankProject()}
              >
                <HiOutlineDocumentPlus size={18} aria-hidden="true" />
                {t("projectCreation.createBlank")}
              </Button>
              <Button
                variant="outline"
                class="h-11 rounded-xl px-5"
                disabled={landing().isLandingActionPending()}
                onClick={props.onImportMachineConfiguration}
              >
                {t("projectCreation.importMachineConfig")}
              </Button>
              <Button
                variant="secondary"
                class="h-11 rounded-xl px-5"
                disabled={landing().isLandingActionPending()}
                onClick={() => void landing().openProject()}
              >
                <HiOutlineFolderOpen size={18} aria-hidden="true" />
                {t("landing.openProject")}
              </Button>
              <Button
                variant="outline"
                class="h-11 rounded-xl px-5"
                onClick={() => setIsGeneralSettingsOpen(true)}
              >
                {t("landing.generalSettings")}
              </Button>
            </div>
            <Show when={landing().landingError()}>
              {(message) => <Alert variant="destructive">{message()}</Alert>}
            </Show>
          </CardContent>
        </Card>

        <Card class="flex min-h-0 flex-1 flex-col border-white/8 bg-transparent shadow-none">
          <CardHeader class="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>{t("landing.recentProjects")}</CardTitle>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void landing().refreshRecentProjects()}
              disabled={
                landing().isRecentProjectsLoading() ||
                landing().isLandingActionPending()
              }
            >
              {t("common.refresh")}
            </Button>
          </CardHeader>
          <CardContent class="min-h-0 flex-1">
            <Show
              when={!landing().isRecentProjectsLoading()}
              fallback={
                <div class="py-4 text-sm text-muted-foreground">
                  {t("landing.loadingRecentProjects")}
                </div>
              }
            >
              <Show
                when={landing().recentProjects().length > 0}
                fallback={
                  <div class="py-4 text-sm text-muted-foreground">
                    {t("landing.noRecentProjectsHint")}
                  </div>
                }
              >
                <div class="grid h-full gap-3 overflow-auto">
                  <For each={landing().recentProjects()}>
                    {(entry) => (
                      <button
                        type="button"
                        class="focus-ring grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-white/5 disabled:cursor-default disabled:opacity-60 sm:gap-4 max-sm:grid-cols-1"
                        disabled={landing().isLandingActionPending()}
                        onClick={() =>
                          void landing().openRecentProject(entry.projectPath)
                        }
                        title={entry.projectPath}
                      >
                        <div class="min-w-0">
                          <div class="truncate font-medium">
                            {recentProjectName(entry)}
                          </div>
                          <div class="mono mt-1 truncate text-xs text-muted-foreground">
                            {recentProjectPathTail(entry.projectPath)}
                          </div>
                        </div>
                        <div class="flex flex-col items-end gap-1 justify-self-end text-xs text-muted-foreground max-sm:items-start max-sm:justify-self-start">
                          <Show when={entry.linuxCncVersion}>
                            {(version) => (
                              <div class="font-medium text-foreground/75">
                                {t("landing.recentProjectVersion", {
                                  version: version(),
                                })}
                              </div>
                            )}
                          </Show>
                          <div>{formatDateTime(entry.lastOpenedAt)}</div>
                        </div>
                      </button>
                    )}
                  </For>
                </div>
              </Show>
            </Show>
          </CardContent>
        </Card>
      </main>

      <Show when={isGeneralSettingsOpen()}>
        <GeneralSettingsDialog
          context="standalone"
          onClose={() => setIsGeneralSettingsOpen(false)}
        />
      </Show>
    </div>
  );
}
