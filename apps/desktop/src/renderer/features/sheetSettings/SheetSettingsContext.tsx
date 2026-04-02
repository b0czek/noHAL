import { getSheetThreadOutputs } from "@nohal/core/sheet";
import type { SheetThreadOutputDefinition } from "@nohal/core/types";
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

function createSheetSettingsState(args: {
  sheetId: string;
  referenceTarget?: {
    parentSheetId: string;
    nodeId: string;
  };
}) {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();

  const sheet = createMemo(() => state.project.sheets[args.sheetId]);
  const threadOutputs = createMemo<SheetThreadOutputDefinition[]>(() => {
    const current = sheet();
    if (!current) return [];
    return getSheetThreadOutputs(current);
  });
  const isRootSheet = createMemo(
    () => sheet()?.id === state.project.rootSheetId,
  );
  const instanceReference = createMemo(() => {
    const target = args.referenceTarget;
    if (!target) return undefined;
    const parentSheet = state.project.sheets[target.parentSheetId];
    const node = parentSheet?.nodes.find(
      (
        entry,
      ): entry is (typeof parentSheet.nodes)[number] & { kind: "sheet" } =>
        entry.kind === "sheet" && entry.id === target.nodeId,
    );
    if (!parentSheet || !node || node.sheetId !== args.sheetId)
      return undefined;
    return {
      parentSheetId: parentSheet.id,
      parentSheetName: parentSheet.name,
      nodeId: node.id,
      instanceName: node.instanceName,
    };
  });
  const halThreads = createMemo(() => state.project.halThreads ?? []);
  const rows = createMemo(() =>
    buildSheetQueueRows(state.project, args.sheetId, {
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
    actions.setSheetAddfQueue(args.sheetId, flattened);
  };

  return {
    sheetId: args.sheetId,
    sheet,
    instanceReference,
    threadOutputs,
    isRootSheet,
    halThreads,
    rows,
    rowsByThreadOutput,
    renameSheetDefinition: (value: string) =>
      actions.renameSheetDefinition(args.sheetId, value),
    addThreadOutput: () => actions.addSheetThreadOutput(args.sheetId),
    updateThreadOutputName: (outputId: string, value: string) =>
      actions.updateSheetThreadOutputName(args.sheetId, outputId, value),
    updateThreadOutputHalBinding: (
      outputId: string,
      halThreadId: string | null,
    ) =>
      actions.updateSheetThreadOutputHalBinding(
        args.sheetId,
        outputId,
        halThreadId,
      ),
    removeThreadOutput: (outputId: string) =>
      actions.removeSheetThreadOutput(args.sheetId, outputId),
    renameInstance: (parentSheetId: string, nodeId: string, value: string) =>
      actions.renameSheetReference(parentSheetId, nodeId, value),
    detachReference: (parentSheetId: string, nodeId: string) =>
      actions.detachSheetReferenceAt(parentSheetId, nodeId),
    commitRows,
  };
}

type SheetSettingsContextValue = ReturnType<typeof createSheetSettingsState>;

const SheetSettingsContext = createContext<SheetSettingsContextValue>();

export function SheetSettingsProvider(
  props: ParentProps<{
    sheetId: string;
    referenceTarget?: {
      parentSheetId: string;
      nodeId: string;
    };
  }>,
) {
  const value = createSheetSettingsState({
    sheetId: props.sheetId,
    referenceTarget: props.referenceTarget,
  });
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
