import type { SheetDefinition, SheetLabel } from "@nohal/core/types";
import type { Selection } from "../../state/store/selectionTypes";

export function getRelatedLocalLabels(
  sheet: SheetDefinition,
  selection: Selection,
): SheetLabel[] {
  if (selection?.kind !== "label") return [];

  const selectedLabel = sheet.labels.find((label) => label.id === selection.id);
  if (!selectedLabel || selectedLabel.scope !== "local") return [];

  return sheet.labels.filter(
    (label) =>
      label.id !== selectedLabel.id &&
      label.scope === "local" &&
      label.name === selectedLabel.name,
  );
}
