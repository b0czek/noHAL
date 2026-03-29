import { getSheetThreadOutputs } from "@nohal/core/sheet";
import type { SheetNode, SheetThreadOutputDefinition } from "@nohal/core/types";
import {
  createContext,
  createMemo,
  type ParentProps,
  useContext,
} from "solid-js";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import { buildSheetQueueRows } from "./sheetQueueRows";
import type { SheetQueueRow } from "./types";

function createSheetSettingsState(sheetId: string) {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();

  const sheet = createMemo(() => state.project.sheets[sheetId]);
  const threadOutputs = createMemo<SheetThreadOutputDefinition[]>(() => {
    const current = sheet();
    if (!current) return [];
    return getSheetThreadOutputs(current);
  });
  const isRootSheet = createMemo(
    () => sheet()?.id === state.project.rootSheetId,
  );
  const instanceNode = createMemo<SheetNode | undefined>(() => {
    const currentSheet = sheet();
    const parentSheetId = currentSheet?.parentSheetId;
    if (!currentSheet || !parentSheetId) return undefined;
    const parentSheet = state.project.sheets[parentSheetId];
    return parentSheet?.nodes.find(
      (node): node is SheetNode =>
        node.kind === "sheet" && node.sheetId === currentSheet.id,
    );
  });
  const halThreads = createMemo(() => state.project.halThreads ?? []);
  const rows = createMemo(() =>
    buildSheetQueueRows(state.project, sheetId, {
      missingSheet: t("sheetSettings.missingSheet"),
      missing: t("sheetSettings.missing"),
      defaultFunction: t("sheetSettings.defaultFunction"),
      unknownFloat: t("common.unknown"),
    }),
  );
  const rowsByThreadOutput = createMemo(() => {
    const rowList = rows();
    return threadOutputs().map((output) => ({
      output,
      rows: rowList.filter((row) => row.sheetThreadOutputId === output.id),
    }));
  });

  const commitRows = (nextRows: SheetQueueRow[]) => {
    const entriesByThread = new Map<string, SheetQueueRow["queueEntry"][]>();
    for (const output of threadOutputs()) entriesByThread.set(output.id, []);
    for (const row of nextRows) {
      const list = entriesByThread.get(row.sheetThreadOutputId);
      if (list) list.push(row.queueEntry);
    }
    const flattened = threadOutputs().flatMap(
      (output) => entriesByThread.get(output.id) ?? [],
    );
    actions.setSheetAddfQueue(sheetId, flattened);
  };

  return {
    sheetId,
    sheet,
    instanceNode,
    threadOutputs,
    isRootSheet,
    halThreads,
    rows,
    rowsByThreadOutput,
    addThreadOutput: () => actions.addSheetThreadOutput(sheetId),
    updateThreadOutputName: (outputId: string, value: string) =>
      actions.updateSheetThreadOutputName(sheetId, outputId, value),
    updateThreadOutputHalBinding: (
      outputId: string,
      halThreadId: string | null,
    ) =>
      actions.updateSheetThreadOutputHalBinding(sheetId, outputId, halThreadId),
    removeThreadOutput: (outputId: string) =>
      actions.removeSheetThreadOutput(sheetId, outputId),
    renameInstance: (value: string) =>
      actions.renameSheetInstance(sheetId, value),
    commitRows,
  };
}

type SheetSettingsContextValue = ReturnType<typeof createSheetSettingsState>;

const SheetSettingsContext = createContext<SheetSettingsContextValue>();

export function SheetSettingsProvider(props: ParentProps<{ sheetId: string }>) {
  const value = createSheetSettingsState(props.sheetId);
  return (
    <SheetSettingsContext.Provider value={value}>
      {props.children}
    </SheetSettingsContext.Provider>
  );
}

export function useSheetSettings() {
  const ctx = useContext(SheetSettingsContext);
  if (!ctx) throw new Error("SheetSettingsProvider is missing");
  return ctx;
}
