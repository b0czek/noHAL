import type { ComponentDefinition } from "@nohal/core/types";
import { createMemo } from "solid-js";
import { useI18n } from "../i18n";
import CanvasSearchMenu from "./CanvasSearchMenu";

interface CanvasComponentMenuProps {
  components: ComponentDefinition[];
  onAddComponent: (componentId: string) => void;
  onClose: () => void;
  listClass?: string;
}

export default function CanvasComponentMenu(props: CanvasComponentMenuProps) {
  const { t } = useI18n();
  const items = createMemo(() =>
    props.components.map((comp) => ({
      id: comp.id,
      searchText: `${comp.halComponentName} ${comp.name} ${comp.source}`,
      name: comp.halComponentName,
      meta: t("canvasComponentMenu.itemMeta", {
        source: comp.source,
        pins: comp.pins.length,
      }),
      title: t("canvasComponentMenu.itemTitle", {
        name: comp.halComponentName,
        pins: comp.pins.length,
      }),
      onSelect: () => props.onAddComponent(comp.id),
    })),
  );

  return (
    <CanvasSearchMenu
      items={items()}
      placeholder={t("canvasComponentMenu.filterPlaceholder")}
      emptyLabel={t("canvasComponentMenu.empty")}
      onClose={props.onClose}
      listClass={props.listClass}
    />
  );
}
