import {
  HiOutlineCheck,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineTrash,
} from "solid-icons/hi";
import { createSignal, For, Show } from "solid-js";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";

export default function IniTab() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const [isEditMode, setIsEditMode] = createSignal(false);

  const machineConfig = () => state.project.machineConfig;
  const toggleEditMode = () => setIsEditMode((enabled) => !enabled);

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
        {(cfg) => (
          <section class="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="text-base font-semibold">
                {t("iniEditor.valuesTitle")}
              </div>
              <div class="inline-flex flex-wrap items-center gap-2">
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
              </div>
            </div>

            <div class="grid min-h-0 gap-3 overflow-auto pr-1">
              <Show when={cfg().ini.sections.length === 0}>
                <div class="text-sm text-muted-foreground">
                  {t("iniEditor.emptyDocument")}
                </div>
              </Show>

              <For each={cfg().ini.sections}>
                {(section, sectionIndex) => (
                  <div class="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Show
                        when={isEditMode()}
                        fallback={
                          <div class="mono text-xs uppercase tracking-[0.18em] text-accent">
                            [{section.name}]
                          </div>
                        }
                      >
                        <div class="flex min-w-0 items-center gap-2">
                          <span class="mono">[</span>
                          <Input
                            type="text"
                            class="mono"
                            value={section.name}
                            onChange={(evt) =>
                              actions.updateMachineIniSectionName(
                                sectionIndex(),
                                evt.currentTarget.value,
                              )
                            }
                          />
                          <span class="mono">]</span>
                        </div>
                      </Show>

                      <Show when={isEditMode()}>
                        <div class="inline-flex items-center gap-2 self-end sm:self-auto">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              actions.addMachineIniField(sectionIndex())
                            }
                            title={t("iniEditor.addField")}
                            aria-label={t("iniEditor.addField")}
                          >
                            <HiOutlinePlus size={16} aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (
                                !confirmRemoveSection(
                                  section.name,
                                  section.entries.length,
                                )
                              ) {
                                return;
                              }
                              actions.removeMachineIniSection(sectionIndex());
                            }}
                            title={t("iniEditor.removeSection")}
                            aria-label={t("iniEditor.removeSection")}
                          >
                            <HiOutlineTrash size={16} aria-hidden="true" />
                          </Button>
                        </div>
                      </Show>
                    </div>

                    <div class="grid gap-2">
                      <For each={section.entries}>
                        {(entry, entryIndex) => (
                          <Show
                            when={isEditMode()}
                            fallback={
                              <div class="grid gap-2 rounded-xl bg-black/20 px-3 py-2 sm:grid-cols-[minmax(180px,280px)_minmax(0,1fr)] sm:items-center">
                                <span class="mono text-xs text-muted-foreground">
                                  {entry.key}
                                </span>
                                <div class="min-w-0 break-all px-1 text-sm">
                                  {entry.value}
                                </div>
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
                                    sectionIndex(),
                                    entryIndex(),
                                    evt.currentTarget.value,
                                  )
                                }
                              />
                              <Input
                                type="text"
                                value={entry.value}
                                onChange={(evt) =>
                                  actions.updateMachineIniValue(
                                    sectionIndex(),
                                    entryIndex(),
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
                                    !confirmRemoveField(section.name, entry.key)
                                  ) {
                                    return;
                                  }
                                  actions.removeMachineIniField(
                                    sectionIndex(),
                                    entryIndex(),
                                  );
                                }}
                                title={t("iniEditor.removeField")}
                                aria-label={t("iniEditor.removeField")}
                              >
                                <HiOutlineTrash size={16} aria-hidden="true" />
                              </Button>
                            </div>
                          </Show>
                        )}
                      </For>

                      <Show when={section.entries.length === 0}>
                        <div class="text-sm text-muted-foreground">
                          {t("iniEditor.emptySection")}
                        </div>
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </section>
        )}
      </Show>
    </div>
  );
}
