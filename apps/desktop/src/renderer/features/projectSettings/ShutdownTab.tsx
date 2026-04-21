import type { Component } from "solid-js";
import { createMemo, createResource, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";

interface LazyCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: "linuxcnc-hal";
}

export default function ShutdownTab() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const [editorModule] = createResource(
    async () => import("../editor/CodeEditor"),
  );
  const Editor = createMemo(() => editorModule()?.default);

  return (
    <div class="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
      <div class="grid gap-1">
        <div class="text-lg font-semibold">
          {t("projectSettings.shutdownTitle")}
        </div>
        <div class="text-sm text-muted-foreground">
          {t("projectSettings.shutdownHelp")}
        </div>
        <div class="text-xs text-muted-foreground">
          {t("projectSettings.shutdownEditorHelp")}
        </div>
      </div>

      <div class="min-h-0 overflow-hidden rounded-xl border border-white/10 bg-[#0a1014]">
        <Show
          when={Editor()}
          fallback={
            <div class="grid h-full min-h-0 place-items-center text-sm text-muted-foreground">
              {t("projectSettings.shutdownLoadingEditor")}
            </div>
          }
        >
          {(LoadedEditor) => (
            <Dynamic
              component={LoadedEditor() as Component<LazyCodeEditorProps>}
              value={state.project.shutdown}
              onChange={(value) => actions.updateProjectShutdown(value)}
              language="linuxcnc-hal"
            />
          )}
        </Show>
      </div>
    </div>
  );
}
