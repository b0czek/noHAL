import type { SheetDefinition } from "@nohal/core/types";
import { createMemo, createSignal, For, Show } from "solid-js";
import { useI18n } from "../i18n";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

interface CanvasSheetMenuProps {
  sheets: SheetDefinition[];
  disabledSheetIds?: ReadonlySet<string>;
  onSelectSheet: (sheetId: string) => void;
  onCreateSheet: () => void;
  onClose: () => void;
  listClass?: string;
}

export default function CanvasSheetMenu(props: CanvasSheetMenuProps) {
  const { t } = useI18n();
  const [query, setQuery] = createSignal("");

  const filtered = createMemo(() => {
    const normalizedQuery = query().trim().toLowerCase();
    if (!normalizedQuery) return props.sheets;
    return props.sheets.filter((sheet) =>
      sheet.name.toLowerCase().includes(normalizedQuery),
    );
  });

  const disabledSheetIds = () => props.disabledSheetIds ?? new Set<string>();

  return (
    <>
      <Input
        type="text"
        class="bg-black/10"
        placeholder={t("canvasSheetMenu.filterPlaceholder")}
        value={query()}
        onInput={(evt) => setQuery(evt.currentTarget.value)}
      />
      <div class="canvas-context-list">
        <button
          type="button"
          class="canvas-context-item"
          onClick={() => {
            props.onCreateSheet();
            props.onClose();
          }}
        >
          <span class="canvas-context-item-name">
            {t("canvasSheetMenu.createSheet")}
          </span>
          <span class="canvas-context-item-meta">
            {t("canvasSheetMenu.createSheetMeta")}
          </span>
        </button>
      </div>
      <div class={`canvas-context-list ${props.listClass ?? ""}`}>
        <Show
          when={filtered().length > 0}
          fallback={
            <div class="canvas-context-empty">{t("canvasSheetMenu.empty")}</div>
          }
        >
          <For each={filtered()}>
            {(sheet) => {
              const isDisabled = () => disabledSheetIds().has(sheet.id);
              return (
                <button
                  type="button"
                  class="canvas-context-item"
                  disabled={isDisabled()}
                  onClick={() => {
                    props.onSelectSheet(sheet.id);
                    props.onClose();
                  }}
                  title={sheet.name}
                >
                  <span class="canvas-context-item-name">{sheet.name}</span>
                  <span class="canvas-context-item-meta">
                    <Show
                      when={isDisabled()}
                      fallback={
                        <Badge variant="secondary">
                          {t("canvasSheetMenu.definition")}
                        </Badge>
                      }
                    >
                      <Badge variant="secondary">
                        {t("canvasSheetMenu.recursive")}
                      </Badge>
                    </Show>
                  </span>
                </button>
              );
            }}
          </For>
        </Show>
      </div>
    </>
  );
}
