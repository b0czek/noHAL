import { For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";

function formatPeriodMs(periodNs: number): string {
  const ms = periodNs / 1_000_000;
  return Number.isInteger(ms) ? String(ms) : String(ms);
}

export default function ThreadsDialog() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();

  const threads = () => state.project.halThreads ?? [];

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
                            {t("threadsDialog.periodMs")}
                          </span>
                          <input
                            type="number"
                            min="0.000001"
                            step="0.001"
                            value={formatPeriodMs(thread.periodNs)}
                            onChange={(evt) => {
                              const ms = Number.parseFloat(
                                evt.currentTarget.value,
                              );
                              if (!Number.isFinite(ms) || ms <= 0) return;
                              actions.updateHalThreadPeriodNs(
                                thread.id,
                                Math.round(ms * 1_000_000),
                              );
                            }}
                          />
                        </label>
                        <div class="threads-row-meta">
                          <span class="muted mono">
                            {t("threadsDialog.periodNs", {
                              ns: thread.periodNs,
                            })}
                          </span>
                          <button
                            type="button"
                            class="mini"
                            disabled={threads().length <= 1}
                            onClick={() => actions.removeHalThread(thread.id)}
                            title={t("threadsDialog.removeThread")}
                          >
                            {t("common.remove")}
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
