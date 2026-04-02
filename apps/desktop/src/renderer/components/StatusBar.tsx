import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";

import { Badge } from "./ui/badge";

export default function StatusBar() {
  const { t } = useI18n();
  const { state } = useEditorStore();
  const currentProjectLabel = () => state.projectPath ?? t("common.unsaved");
  const cursorLabel = () => {
    const pos = state.canvasCursorPos;
    if (!pos) return null;
    return `X: ${pos.x} Y: ${pos.y}`;
  };

  return (
    <footer class="flex min-w-0 items-center justify-between gap-4 border-t border-white/8 bg-black/20 px-4 py-2 backdrop-blur">
      <div class="flex min-w-0 items-center gap-3 text-sm">
        <Badge variant="secondary">{t("common.status")}</Badge>
        <span class="truncate text-muted-foreground">{state.status}</span>
      </div>
      <div class="flex min-w-0 max-w-[65%] items-center gap-3 text-sm">
        {cursorLabel() ? (
          <span class="mono whitespace-nowrap text-muted-foreground">
            {cursorLabel()}
          </span>
        ) : null}
        <Badge variant={state.isDirty ? "warning" : "secondary"}>
          {t("common.project")}
          {state.isDirty ? "*" : ""}
        </Badge>
        <span
          class="mono truncate text-muted-foreground"
          title={currentProjectLabel()}
        >
          {currentProjectLabel()}
        </span>
      </div>
    </footer>
  );
}
