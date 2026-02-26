import { HiOutlineTrash } from "solid-icons/hi";
import { For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { isRequiredHalThreadName } from "../../shared/project";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";

export default function ThreadsDialog() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();

  const threads = () => state.project.halThreads ?? [];
  const isMotmodOwnedThread = (name: string) =>
    name === "servo-thread" || name === "base-thread";

  return (
    <Show when={editorUi.isThreadsDialogOpen()}>
      <Portal>
        <div
          class="modal-backdrop"
          role="presentation"
          onPointerDown={editorUi.closeThreadsDialog}
        >
          <div
            class="modal threads-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={t("threadsDialog.ariaLabel")}
            onPointerDown={(evt) => evt.stopPropagation()}
            onContextMenu={(evt) => evt.preventDefault()}
          >
            <div class="modal-header">
              <div>
                <div class="modal-title">{t("threadsDialog.title")}</div>
                <div class="modal-sub">{t("threadsDialog.subtitle")}</div>
              </div>
              <button
                type="button"
                class="btn subtle"
                onClick={editorUi.closeThreadsDialog}
              >
                {t("common.close")}
              </button>
            </div>

            <div class="modal-body threads-dialog-body">
              <section class="panel">
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
                            onChange={(evt) => {
                              const ns = Number.parseInt(
                                evt.currentTarget.value,
                                10,
                              );
                              if (!Number.isFinite(ns) || ns <= 0) return;
                              actions.updateHalThreadPeriodNs(thread.id, ns);
                            }}
                          />
                        </label>
                        <label class="threads-field">
                          <span class="threads-field-label">
                            {t("threadsDialog.floatMode")}
                          </span>
                          <div class="threads-toggle mono">
                            <button
                              type="button"
                              class={`mini ${(thread.floatMode ?? "fp") === "nofp" ? "is-active-filter" : ""}`}
                              onClick={() =>
                                actions.updateHalThreadFloatMode(
                                  thread.id,
                                  "nofp",
                                )
                              }
                            >
                              {t("threadsDialog.floatNoFp")}
                            </button>
                            <button
                              type="button"
                              class={`mini ${(thread.floatMode ?? "fp") === "fp" ? "is-active-filter" : ""}`}
                              onClick={() =>
                                actions.updateHalThreadFloatMode(
                                  thread.id,
                                  "fp",
                                )
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
                          <span class="muted threads-row-index">
                            {index() + 1}
                          </span>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </section>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
