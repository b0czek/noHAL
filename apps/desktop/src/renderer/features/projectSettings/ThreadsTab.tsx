import { isRequiredHalThreadName } from "@nohal/core/src/project";
import { HiOutlineTrash } from "solid-icons/hi";
import { For, Show } from "solid-js";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";

export default function ThreadsTab() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();

  const threads = () => state.project.halThreads ?? [];
  const isMotmodOwnedThread = (name: string) =>
    name === "servo-thread" || name === "base-thread";
  const isServoThread = (name: string) => isRequiredHalThreadName(name);

  const setThreadPeriodNs = (threadId: string, rawValue: string) => {
    const ns = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(ns) || ns <= 0) return;
    actions.updateHalThreadPeriodNs(threadId, ns);
  };
  const fieldLabelClass =
    "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";

  return (
    <div class="grid gap-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="grid gap-1">
          <div class="text-lg font-semibold">{t("threadsDialog.threads")}</div>
          <div class="text-sm text-muted-foreground">
            {t("threadsDialog.help")}
          </div>
        </div>
        <Button type="button" onClick={() => actions.addHalThread()}>
          {t("threadsDialog.addThread")}
        </Button>
      </div>

      <div class="grid gap-3">
        <For each={threads()}>
          {(thread, index) => (
            <div class="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20 lg:grid-cols-[minmax(180px,1fr)_minmax(140px,220px)_minmax(160px,220px)_140px] lg:items-end">
              <div class="grid gap-2">
                <span class={fieldLabelClass}>{t("threadsDialog.name")}</span>
                <Input
                  type="text"
                  class="mono"
                  value={thread.name}
                  disabled={isRequiredHalThreadName(thread.name)}
                  onChange={(evt) =>
                    actions.updateHalThreadName(
                      thread.id,
                      evt.currentTarget.value,
                    )
                  }
                />
              </div>
              <div class="grid gap-2">
                <span class={fieldLabelClass}>
                  {t("threadsDialog.periodNsLabel")}
                </span>
                <Input
                  type="number"
                  class="mono"
                  min="1"
                  step="1"
                  value={String(thread.periodNs)}
                  onChange={(evt) =>
                    setThreadPeriodNs(thread.id, evt.currentTarget.value)
                  }
                />
              </div>
              <div class="grid gap-2">
                <span class={fieldLabelClass}>
                  {t("threadsDialog.floatMode")}
                </span>
                <div class="inline-flex min-h-9 w-fit items-center gap-2 justify-self-start rounded-xl bg-black/20 p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      !isServoThread(thread.name) &&
                      (thread.floatMode ?? "fp") === "nofp"
                        ? "default"
                        : "ghost"
                    }
                    disabled={isServoThread(thread.name)}
                    onClick={() =>
                      actions.updateHalThreadFloatMode(thread.id, "nofp")
                    }
                  >
                    {t("threadsDialog.floatNoFp")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      isServoThread(thread.name) ||
                      (thread.floatMode ?? "fp") === "fp"
                        ? "default"
                        : "ghost"
                    }
                    onClick={() =>
                      actions.updateHalThreadFloatMode(thread.id, "fp")
                    }
                  >
                    {t("threadsDialog.floatFp")}
                  </Button>
                </div>
              </div>
              <div class="grid grid-cols-[58px_40px_auto] items-center justify-end gap-3 lg:justify-self-end">
                <Show
                  when={isMotmodOwnedThread(thread.name)}
                  fallback={<span aria-hidden="true" class="h-6 w-[58px]" />}
                >
                  <Badge
                    variant="secondary"
                    title={t("threadsDialog.loadedViaMotmod")}
                  >
                    motmod
                  </Badge>
                </Show>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={
                    threads().length <= 1 ||
                    isRequiredHalThreadName(thread.name)
                  }
                  onClick={() => actions.removeHalThread(thread.id)}
                  title={t("threadsDialog.removeThread")}
                  aria-label={t("threadsDialog.removeThread")}
                >
                  <HiOutlineTrash size={16} aria-hidden="true" />
                </Button>
                <span class="text-sm text-muted-foreground">{index() + 1}</span>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
