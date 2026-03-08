import type { SheetDefinition } from "@nohal/core/src/types";
import { HiOutlineChevronDown, HiOutlineChevronRight } from "solid-icons/hi";
import { createEffect, createMemo, createSignal, For } from "solid-js";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";
import { useContextMenu } from "./ContextMenuProvider";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function Sidebar() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();
  const contextMenu = useContextMenu();
  type SheetTreeNode = {
    sheet: SheetDefinition;
    children: SheetTreeNode[];
    isOrphan: boolean;
  };

  const [collapsedSheetIds, setCollapsedSheetIds] = createSignal<Set<string>>(
    new Set(),
  );
  const [isTreeCollapsed, setIsTreeCollapsed] = createSignal(false);
  const placedSheetIds = createMemo(() => {
    const ids = new Set<string>();
    for (const sheet of Object.values(state.project.sheets)) {
      for (const node of sheet.nodes) {
        if (node.kind === "sheet") ids.add(node.sheetId);
      }
    }
    return ids;
  });

  const treeRoots = createMemo<SheetTreeNode[]>(() => {
    const allSheets = Object.values(state.project.sheets);
    const byId = new Map(allSheets.map((sheet) => [sheet.id, sheet]));
    const childrenByParent = new Map<string | null, SheetDefinition[]>();

    for (const sheet of allSheets) {
      const key = sheet.parentSheetId;
      const bucket = childrenByParent.get(key);
      if (bucket) bucket.push(sheet);
      else childrenByParent.set(key, [sheet]);
    }

    for (const siblings of childrenByParent.values()) {
      siblings.sort((a, b) => a.name.localeCompare(b.name));
    }

    const visited = new Set<string>();

    const buildNode = (
      sheetId: string,
      path: Set<string>,
      isOrphan: boolean,
    ): SheetTreeNode | null => {
      if (visited.has(sheetId) || path.has(sheetId)) return null;
      const sheet = byId.get(sheetId);
      if (!sheet) return null;
      visited.add(sheetId);

      const nextPath = new Set(path);
      nextPath.add(sheetId);
      const children: SheetTreeNode[] = [];
      for (const child of childrenByParent.get(sheetId) ?? []) {
        const childNode = buildNode(child.id, nextPath, false);
        if (childNode) children.push(childNode);
      }

      return { sheet, children, isOrphan };
    };

    const roots: SheetTreeNode[] = [];
    if (byId.has(state.project.rootSheetId)) {
      const root = buildNode(
        state.project.rootSheetId,
        new Set<string>(),
        false,
      );
      if (root) roots.push(root);
    }

    const leftovers = allSheets
      .filter((sheet) => !visited.has(sheet.id))
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const sheet of leftovers) {
      const node = buildNode(sheet.id, new Set<string>(), true);
      if (node) roots.push(node);
    }

    return roots;
  });

  createEffect(() => {
    const activeId = state.activeSheetId;
    const sheets = state.project.sheets;
    const openIds: string[] = [];
    const seen = new Set<string>([activeId]);

    let cursor = sheets[activeId];
    while (cursor?.parentSheetId) {
      const parent = sheets[cursor.parentSheetId];
      if (!parent || seen.has(parent.id)) break;
      openIds.push(parent.id);
      seen.add(parent.id);
      cursor = parent;
    }

    if (openIds.length === 0) return;
    setCollapsedSheetIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const id of openIds) {
        if (next.delete(id)) changed = true;
      }
      return changed ? next : prev;
    });
  });

  const isCollapsed = (sheetId: string) => collapsedSheetIds().has(sheetId);
  const toggleCollapsed = (sheetId: string) => {
    setCollapsedSheetIds((prev) => {
      const next = new Set(prev);
      if (next.has(sheetId)) next.delete(sheetId);
      else next.add(sheetId);
      return next;
    });
  };

  const TreeBranch = (branchProps: { node: SheetTreeNode }) => {
    const hasChildren = () => branchProps.node.children.length > 0;
    const collapsed = () => isCollapsed(branchProps.node.sheet.id);
    const isActive = () => branchProps.node.sheet.id === state.activeSheetId;
    const canPlace = () =>
      !isActive() && !placedSheetIds().has(branchProps.node.sheet.id);

    return (
      <li class="min-w-0">
        <div
          class={`relative flex min-w-0 items-center gap-2 py-1 ${isActive() ? "text-foreground" : "text-muted-foreground"}`}
        >
          {hasChildren() ? (
            <Button
              variant="ghost"
              size="icon"
              class="size-7 rounded-lg border border-white/8 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              aria-label={
                collapsed()
                  ? t("sidebar.expandSheet", {
                      name: branchProps.node.sheet.name,
                    })
                  : t("sidebar.collapseSheet", {
                      name: branchProps.node.sheet.name,
                    })
              }
              aria-expanded={!collapsed()}
              onClick={() => toggleCollapsed(branchProps.node.sheet.id)}
            >
              {collapsed() ? "+" : "-"}
            </Button>
          ) : (
            <span class="inline-block size-7 shrink-0" aria-hidden="true" />
          )}

          <button
            type="button"
            class={`focus-ring min-w-0 flex-1 rounded-xl px-3 py-2 text-left transition hover:bg-white/5 ${isActive() ? "bg-accent/12 text-foreground" : ""}`}
            onClick={() => actions.setActiveSheet(branchProps.node.sheet.id)}
            onContextMenu={(evt) => {
              evt.preventDefault();
              evt.stopPropagation();
              const items = [
                {
                  label: t("sidebar.sheetSettings"),
                  onSelect: () => {
                    editorUi.openSheetSettings(branchProps.node.sheet.id);
                  },
                },
              ];
              if (branchProps.node.sheet.id !== state.project.rootSheetId) {
                items.push({
                  label: t("sidebar.deleteSheet"),
                  onSelect: () => {
                    actions.deleteSheetDefinition(branchProps.node.sheet.id);
                  },
                });
              }
              contextMenu.openActions({
                x: evt.clientX,
                y: evt.clientY,
                width: 220,
                maxHeight: 240,
                ariaLabel: t("sidebar.sheetActions"),
                title: branchProps.node.sheet.name,
                items,
              });
            }}
            title={branchProps.node.sheet.name}
          >
            <span class="block truncate">{branchProps.node.sheet.name}</span>
          </button>

          {branchProps.node.isOrphan && (
            <Badge variant="secondary">{t("sidebar.orphan")}</Badge>
          )}

          {canPlace() && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              class="h-8 rounded-lg px-3"
              onClick={() =>
                actions.placeExistingSheetNode(branchProps.node.sheet.id)
              }
            >
              {t("common.place")}
            </Button>
          )}
        </div>

        {hasChildren() && !collapsed() && (
          <ul class="ml-4 border-l border-white/8 pl-4">
            <For each={branchProps.node.children}>
              {(child) => <TreeBranch node={child} />}
            </For>
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside class="pointer-events-none absolute left-3 top-3 z-10 w-[min(20rem,calc(100%-24rem))] min-w-[16rem]">
      <Card class="pointer-events-auto flex max-h-[min(42rem,calc(100vh-8rem))] flex-col overflow-hidden !border-white/12 ![background:linear-gradient(180deg,rgba(11,24,31,0.42),rgba(8,17,22,0.28))] backdrop-blur-2xl">
        <CardHeader
          class={`flex-row items-center justify-between gap-3 ${
            isTreeCollapsed() ? "px-3 py-3" : "px-4 pb-2 pt-4"
          }`}
        >
          <CardTitle>{t("sidebar.sheets")}</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="size-7 rounded-lg"
            aria-label={
              isTreeCollapsed()
                ? t("sidebar.expandSheet", { name: t("sidebar.sheets") })
                : t("sidebar.collapseSheet", { name: t("sidebar.sheets") })
            }
            aria-expanded={!isTreeCollapsed()}
            onClick={() => setIsTreeCollapsed((value) => !value)}
          >
            {isTreeCollapsed() ? (
              <HiOutlineChevronRight size={16} aria-hidden="true" />
            ) : (
              <HiOutlineChevronDown size={16} aria-hidden="true" />
            )}
          </Button>
        </CardHeader>
        <Show when={!isTreeCollapsed()}>
          <CardContent class="min-h-0 flex-1 overflow-auto pt-0">
            <ul class="grid gap-1">
              <For each={treeRoots()}>
                {(node) => <TreeBranch node={node} />}
              </For>
            </ul>
          </CardContent>
        </Show>
      </Card>
    </aside>
  );
}
