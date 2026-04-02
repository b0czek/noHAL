import {
  buildManagedMachineConfigIniSections,
  getMachineConfigIniEntryLockMode,
} from "@nohal/core/machineConfig";
import {
  HiOutlineCheck,
  HiOutlineLockClosed,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineTrash,
} from "solid-icons/hi";
import { createMemo, createSignal, For, Show } from "solid-js";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import { cloneProject } from "../../state/store/helpers";

interface EffectiveIniEntryRow {
  key: string;
  value: string;
  line: number;
  managed: boolean;
  userEntryIndex?: number;
}

interface EffectiveIniSectionRow {
  sectionName: string;
  userSectionIndex: number;
  entries: EffectiveIniEntryRow[];
}

export default function IniTab() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const [isEditMode, setIsEditMode] = createSignal(false);

  const machineConfig = () => state.project.machineConfig;
  const projectSnapshot = createMemo(() => cloneProject(state.project));
  const managedSections = createMemo(() =>
    buildManagedMachineConfigIniSections(projectSnapshot()),
  );
  const effectiveSections = createMemo(() => {
    const userSections = machineConfig()?.userIni.sections ?? [];
    const managedByName = new Map(
      managedSections().map((section) => [section.name.toUpperCase(), section]),
    );
    const seenManaged = new Set<string>();

    const combined: EffectiveIniSectionRow[] = userSections.map(
      (section, sectionIndex) => {
        const managedSection = managedByName.get(section.name.toUpperCase());
        if (managedSection) {
          seenManaged.add(section.name.toUpperCase());
        }
        return {
          sectionName: section.name,
          userSectionIndex: sectionIndex,
          entries: [
            ...(managedSection?.entries.map((entry) => ({
              ...entry,
              managed: true,
            })) ?? []),
            ...section.entries.map((entry, entryIndex) => ({
              ...entry,
              managed: false,
              userEntryIndex: entryIndex,
            })),
          ],
        };
      },
    );

    for (const managedSection of managedSections()) {
      const key = managedSection.name.toUpperCase();
      if (seenManaged.has(key)) continue;
      combined.push({
        sectionName: managedSection.name,
        userSectionIndex: -1,
        entries: managedSection.entries.map((entry) => ({
          ...entry,
          managed: true,
        })),
      });
    }

    return combined;
  });
  const toggleEditMode = () => setIsEditMode((enabled) => !enabled);
  const addFieldToSection = (sectionName: string, userSectionIndex: number) => {
    if (userSectionIndex >= 0) {
      actions.addMachineIniField(userSectionIndex);
      return;
    }
    const nextIndex = machineConfig()?.userIni.sections.length ?? 0;
    actions.addMachineIniSection();
    actions.updateMachineIniSectionName(nextIndex, sectionName);
    actions.addMachineIniField(nextIndex);
  };

  const confirmRemoveSection = (sectionName: string, entryCount: number) =>
    window.confirm(
      entryCount > 0
        ? t("iniEditor.confirmRemoveSectionWithFields", {
            name: sectionName,
            count: entryCount,
          })
        : t("iniEditor.confirmRemoveSection", { name: sectionName }),
    );

  const confirmRemoveField = (sectionName: string, key: string) =>
    window.confirm(t("iniEditor.confirmRemoveField", { sectionName, key }));
  return (
    <div class="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5">
      <div class="grid gap-1">
        <div class="text-lg font-semibold">{t("iniEditor.title")}</div>
        <div class="text-sm text-muted-foreground">
          {t("iniEditor.subtitle")}
        </div>
      </div>

      <Show
        when={machineConfig()}
        fallback={
          <section class="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20">
            <div class="text-base font-semibold">
              {t("iniEditor.noConfigTitle")}
            </div>
            <div class="text-sm text-muted-foreground">
              {t("iniEditor.noConfigHelp")}
            </div>
            <Button
              type="button"
              class="w-fit"
              onClick={() => actions.ensureMachineConfig()}
            >
              {t("iniEditor.createEmptyConfig")}
            </Button>
          </section>
        }
      >
        {(_cfg) => (
          <section class="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="text-base font-semibold">
                {t("iniEditor.valuesTitle")}
              </div>
              <div class="inline-flex flex-wrap items-center gap-2">
                <Show when={isEditMode()}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => actions.addMachineIniSection()}
                    title={t("iniEditor.addSection")}
                    aria-label={t("iniEditor.addSection")}
                  >
                    <HiOutlinePlus size={16} aria-hidden="true" />
                  </Button>
                </Show>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={toggleEditMode}
                  title={
                    isEditMode()
                      ? t("iniEditor.exitEditMode")
                      : t("iniEditor.enterEditMode")
                  }
                  aria-label={
                    isEditMode()
                      ? t("iniEditor.exitEditMode")
                      : t("iniEditor.enterEditMode")
                  }
                >
                  <Show
                    when={isEditMode()}
                    fallback={
                      <HiOutlinePencilSquare size={16} aria-hidden="true" />
                    }
                  >
                    <HiOutlineCheck size={16} aria-hidden="true" />
                  </Show>
                  {isEditMode()
                    ? t("iniEditor.exitEditMode")
                    : t("iniEditor.enterEditMode")}
                </Button>
              </div>
            </div>

            <div class="grid min-h-0 gap-3 overflow-auto pr-1">
              <div class="rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20">
                <div class="mb-4 text-sm text-muted-foreground">
                  {t("iniEditor.managedHelp")}
                </div>

                <Show when={effectiveSections().length === 0}>
                  <div class="text-sm text-muted-foreground">
                    {t("iniEditor.emptyDocument")}
                  </div>
                </Show>

                <For each={effectiveSections()}>
                  {(section) => {
                    const canEditSectionName = () =>
                      isEditMode() && section.userSectionIndex >= 0;
                    const canAddField = () => isEditMode();
                    const canRemoveSection = () =>
                      isEditMode() && section.userSectionIndex >= 0;
                    const entryLocked = (entry: EffectiveIniEntryRow) => {
                      if (entry.managed) {
                        return true;
                      }
                      return (
                        getMachineConfigIniEntryLockMode(
                          section.sectionName,
                          entry.key,
                        ) !== "none"
                      );
                    };
                    const visibleEntries = () =>
                      isEditMode()
                        ? section.entries.filter((entry) => !entryLocked(entry))
                        : section.entries;
                    const showEmptySection = () =>
                      visibleEntries().length === 0 &&
                      (!isEditMode() || section.entries.length === 0);

                    return (
                      <div class="grid gap-3 px-1 py-2">
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <Show
                            when={canEditSectionName()}
                            fallback={
                              <div class="mono text-sm uppercase tracking-[0.16em] text-accent">
                                [{section.sectionName}]
                              </div>
                            }
                          >
                            <div class="flex min-w-0 items-center gap-2">
                              <span class="mono">[</span>
                              <Input
                                type="text"
                                class="mono"
                                value={section.sectionName}
                                onChange={(evt) =>
                                  actions.updateMachineIniSectionName(
                                    section.userSectionIndex,
                                    evt.currentTarget.value,
                                  )
                                }
                              />
                              <span class="mono">]</span>
                            </div>
                          </Show>

                          <Show when={isEditMode()}>
                            <div class="inline-flex items-center gap-2 self-end sm:self-auto">
                              <Show when={canAddField()}>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    addFieldToSection(
                                      section.sectionName,
                                      section.userSectionIndex,
                                    )
                                  }
                                  title={t("iniEditor.addField")}
                                  aria-label={t("iniEditor.addField")}
                                >
                                  <HiOutlinePlus size={16} aria-hidden="true" />
                                </Button>
                              </Show>
                              <Show when={canRemoveSection()}>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (
                                      !confirmRemoveSection(
                                        section.sectionName,
                                        section.entries.length,
                                      )
                                    ) {
                                      return;
                                    }
                                    actions.removeMachineIniSection(
                                      section.userSectionIndex,
                                    );
                                  }}
                                  title={t("iniEditor.removeSection")}
                                  aria-label={t("iniEditor.removeSection")}
                                >
                                  <HiOutlineTrash
                                    size={16}
                                    aria-hidden="true"
                                  />
                                </Button>
                              </Show>
                            </div>
                          </Show>
                        </div>

                        <div class="grid gap-2">
                          <For each={visibleEntries()}>
                            {(entry) => {
                              const canEditEntry = () =>
                                isEditMode() &&
                                section.userSectionIndex >= 0 &&
                                entry.userEntryIndex !== undefined &&
                                !entryLocked(entry);

                              return (
                                <Show
                                  when={canEditEntry()}
                                  fallback={
                                    <div
                                      class="grid gap-2 rounded-xl bg-black/20 px-2 py-1.5 sm:grid-cols-[minmax(180px,280px)_minmax(0,1fr)_auto] sm:items-center"
                                      classList={{
                                        "border border-dashed border-white/10":
                                          entryLocked(entry),
                                      }}
                                    >
                                      <div class="inline-flex items-center gap-2">
                                        <span class="mono text-xs text-muted-foreground">
                                          {entry.key}
                                        </span>
                                        <Show when={entryLocked(entry)}>
                                          <Badge
                                            variant="secondary"
                                            class="gap-1 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]"
                                            title={t("iniEditor.managedHelp")}
                                          >
                                            <HiOutlineLockClosed
                                              size={11}
                                              aria-hidden="true"
                                            />
                                          </Badge>
                                        </Show>
                                      </div>
                                      <div class="min-w-0 break-all px-1 text-sm">
                                        {entry.value}
                                      </div>
                                      <Show when={!entryLocked(entry)}>
                                        <span aria-hidden="true" class="w-0" />
                                      </Show>
                                    </div>
                                  }
                                >
                                  <div class="grid gap-2 rounded-xl bg-black/20 p-3 sm:grid-cols-[minmax(160px,240px)_minmax(0,1fr)_auto] sm:items-center">
                                    <Input
                                      type="text"
                                      class="mono"
                                      value={entry.key}
                                      onChange={(evt) =>
                                        actions.updateMachineIniKey(
                                          section.userSectionIndex,
                                          entry.userEntryIndex ?? 0,
                                          evt.currentTarget.value,
                                        )
                                      }
                                    />
                                    <Input
                                      type="text"
                                      value={entry.value}
                                      onChange={(evt) =>
                                        actions.updateMachineIniValue(
                                          section.userSectionIndex,
                                          entry.userEntryIndex ?? 0,
                                          evt.currentTarget.value,
                                        )
                                      }
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        if (
                                          !confirmRemoveField(
                                            section.sectionName,
                                            entry.key,
                                          )
                                        ) {
                                          return;
                                        }
                                        actions.removeMachineIniField(
                                          section.userSectionIndex,
                                          entry.userEntryIndex ?? 0,
                                        );
                                      }}
                                      title={t("iniEditor.removeField")}
                                      aria-label={t("iniEditor.removeField")}
                                    >
                                      <HiOutlineTrash
                                        size={16}
                                        aria-hidden="true"
                                      />
                                    </Button>
                                  </div>
                                </Show>
                              );
                            }}
                          </For>

                          <Show when={showEmptySection()}>
                            <div class="text-sm text-muted-foreground">
                              {t("iniEditor.emptySection")}
                            </div>
                          </Show>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          </section>
        )}
      </Show>
    </div>
  );
}
