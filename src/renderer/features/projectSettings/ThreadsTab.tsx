import { HiOutlineTrash } from "solid-icons/hi";
import { For, Show } from "solid-js";
import { isRequiredHalThreadName } from "../../../shared/project";
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

  return (
    <>
      <div class="threads-dialog-panel-header">
        <div class="panel-title">{t("threadsDialog.threads")}</div>
        <button
          type="button"
          class="btn"
          onClick={() => actions.addHalThread()}
        >
          {t("threadsDialog.addThread")}
        </button>
      </div>

      <div class="muted">{t("threadsDialog.help")}</div>

      <div class="threads-list">
        <For each={threads()}>
          {(thread, index) => (
            <div class="threads-row">
              <label class="threads-field">
                <span class="threads-field-label">
                  {t("threadsDialog.name")}
                </span>
                <input
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
              </label>
              <label class="threads-field">
                <span class="threads-field-label">
                  {t("threadsDialog.periodNsLabel")}
                </span>
                <input
                  type="number"
                  class="mono"
                  min="1"
                  step="1"
                  value={String(thread.periodNs)}
                  onChange={(evt) =>
                    setThreadPeriodNs(thread.id, evt.currentTarget.value)
                  }
                />
              </label>
              <label class="threads-field">
                <span class="threads-field-label">
                  {t("threadsDialog.floatMode")}
                </span>
                <div class="threads-toggle mono">
                  <button
                    type="button"
                    class={`mini ${!isServoThread(thread.name) && (thread.floatMode ?? "fp") === "nofp" ? "is-active-filter" : ""}`}
                    disabled={isServoThread(thread.name)}
                    onClick={() =>
                      actions.updateHalThreadFloatMode(thread.id, "nofp")
                    }
                  >
                    {t("threadsDialog.floatNoFp")}
                  </button>
                  <button
                    type="button"
                    class={`mini ${isServoThread(thread.name) || (thread.floatMode ?? "fp") === "fp" ? "is-active-filter" : ""}`}
                    onClick={() =>
                      actions.updateHalThreadFloatMode(thread.id, "fp")
                    }
                  >
                    {t("threadsDialog.floatFp")}
                  </button>
                </div>
              </label>
              <div class="threads-row-meta">
                <Show when={isMotmodOwnedThread(thread.name)}>
                  <span
                    class="chip threads-origin-chip"
                    title={t("threadsDialog.loadedViaMotmod")}
                  >
                    motmod
                  </span>
                </Show>
                <button
                  type="button"
                  class="btn subtle icon-btn"
                  disabled={
                    threads().length <= 1 ||
                    isRequiredHalThreadName(thread.name)
                  }
                  onClick={() => actions.removeHalThread(thread.id)}
                  title={t("threadsDialog.removeThread")}
                  aria-label={t("threadsDialog.removeThread")}
                >
                  <HiOutlineTrash size={16} aria-hidden="true" />
                </button>
                <span class="muted threads-row-index">{index() + 1}</span>
              </div>
            </div>
          )}
        </For>
      </div>
    </>
  );
}
