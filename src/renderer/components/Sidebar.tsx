import { createEffect, createMemo, createSignal, For } from "solid-js";
import type { SheetDefinition } from "../../shared/types";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";
import { useContextMenu } from "./ContextMenuProvider";

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
      <li class="sheet-tree-node">
        <div class={`sheet-tree-entry ${isActive() ? "is-active" : ""}`}>
          {hasChildren() ? (
            <button
              type="button"
              class="sheet-tree-toggle"
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
            </button>
          ) : (
            <span class="sheet-tree-toggle-spacer" aria-hidden="true" />
          )}

          <button
            type="button"
            class={`linkish sheet-tree-name ${isActive() ? "is-active" : ""}`}
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
            {branchProps.node.sheet.name}
          </button>

          {branchProps.node.isOrphan && (
            <span class="sheet-tree-tag">{t("sidebar.orphan")}</span>
          )}

          {canPlace() && (
            <button
              type="button"
              class="mini sheet-tree-place"
              onClick={() =>
                actions.placeExistingSheetNode(branchProps.node.sheet.id)
              }
            >
              {t("common.place")}
            </button>
          )}
        </div>

        {hasChildren() && !collapsed() && (
          <ul class="sheet-tree-list">
            <For each={branchProps.node.children}>
              {(child) => <TreeBranch node={child} />}
            </For>
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside class="sidebar">
      <section class="panel">
        <div class="panel-title">{t("sidebar.sheets")}</div>
        <div class="sheet-tree">
          <ul class="sheet-tree-list is-root">
            <For each={treeRoots()}>{(node) => <TreeBranch node={node} />}</For>
          </ul>
        </div>
      </section>
    </aside>
  );
}
