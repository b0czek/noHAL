import type { SheetDefinition } from "@nohal/core/types";
import { createMemo, Show } from "solid-js";
import { useI18n } from "../i18n";
import CanvasSearchMenu from "./CanvasSearchMenu";
import { Badge } from "./ui/badge";

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
  const disabledSheetIds = () => props.disabledSheetIds ?? new Set<string>();
  const items = createMemo(() =>
    props.sheets.map((sheet) => {
      const isDisabled = disabledSheetIds().has(sheet.id);
      return {
        id: sheet.id,
        searchText: sheet.name,
        name: sheet.name,
        meta: (
          <Show
            when={isDisabled}
            fallback={
              <Badge variant="secondary">
                {t("canvasSheetMenu.definition")}
              </Badge>
            }
          >
            <Badge variant="secondary">{t("canvasSheetMenu.recursive")}</Badge>
          </Show>
        ),
        title: sheet.name,
        disabled: isDisabled,
        onSelect: () => props.onSelectSheet(sheet.id),
      };
    }),
  );

  return (
    <CanvasSearchMenu
      items={items()}
      placeholder={t("canvasSheetMenu.filterPlaceholder")}
      emptyLabel={t("canvasSheetMenu.empty")}
      inlineAction={{
        label: t("canvasSheetMenu.newInline"),
        onSelect: props.onCreateSheet,
      }}
      onClose={props.onClose}
      listClass={props.listClass}
    />
  );
}
