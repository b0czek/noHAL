import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { HiOutlineArrowSmallUp } from "solid-icons/hi";
import { Portal } from "solid-js/web";
import type { NoHALProject, SheetDefinition } from "../../shared/types";

interface SidebarProps {
  project: NoHALProject;
  activeSheetId: string;
  onPlaceSheet: (sheetId: string) => void;
  onGoToSheet: (sheetId: string) => void;
  onGoToParentSheet: () => void;
  canGoToParentSheet: boolean;
  onOpenSheetSettings: (sheetId: string) => void;
}

export default function Sidebar(props: SidebarProps) {
  type SheetTreeNode = {
    sheet: SheetDefinition;
    children: SheetTreeNode[];
    isOrphan: boolean;
  };

  const [collapsedSheetIds, setCollapsedSheetIds] = createSignal<Set<string>>(new Set());
  const [sheetContextMenu, setSheetContextMenu] = createSignal<{
    sheetId: string;
    x: number;
    y: number;
  } | null>(null);
  const placedSheetIds = createMemo(() => {
    const ids = new Set<string>();
    for (const sheet of Object.values(props.project.sheets)) {
      for (const node of sheet.nodes) {
        if (node.kind === "sheet") ids.add(node.sheetId);
      }
    }
    return ids;
  });

  const treeRoots = createMemo<SheetTreeNode[]>(() => {
    const allSheets = Object.values(props.project.sheets);
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

    const buildNode = (sheetId: string, path: Set<string>, isOrphan: boolean): SheetTreeNode | null => {
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
    if (byId.has(props.project.rootSheetId)) {
      const root = buildNode(props.project.rootSheetId, new Set<string>(), false);
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
    const activeId = props.activeSheetId;
    const sheets = props.project.sheets;
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
    const isActive = () => branchProps.node.sheet.id === props.activeSheetId;
    const canPlace = () => !isActive() && !placedSheetIds().has(branchProps.node.sheet.id);

    return (
      <li class="sheet-tree-node">
        <div class={`sheet-tree-entry ${isActive() ? "is-active" : ""}`}>
          {hasChildren() ? (
            <button
              class="sheet-tree-toggle"
              aria-label={collapsed() ? `Expand ${branchProps.node.sheet.name}` : `Collapse ${branchProps.node.sheet.name}`}
              aria-expanded={!collapsed()}
              onClick={() => toggleCollapsed(branchProps.node.sheet.id)}
            >
              {collapsed() ? "+" : "-"}
            </button>
          ) : (
            <span class="sheet-tree-toggle-spacer" aria-hidden="true" />
          )}

          <button
            class={`linkish sheet-tree-name ${isActive() ? "is-active" : ""}`}
            onClick={() => props.onGoToSheet(branchProps.node.sheet.id)}
            onContextMenu={(evt) => {
              evt.preventDefault();
              evt.stopPropagation();
              setSheetContextMenu({
                sheetId: branchProps.node.sheet.id,
                x: evt.clientX,
                y: evt.clientY
              });
            }}
            title={branchProps.node.sheet.name}
          >
            {branchProps.node.sheet.name}
          </button>

          {branchProps.node.isOrphan && <span class="sheet-tree-tag">orphan</span>}

          {canPlace() && (
            <button class="mini sheet-tree-place" onClick={() => props.onPlaceSheet(branchProps.node.sheet.id)}>
              Place
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
        <div class="panel-title">Sheets</div>
        <div class="sidebar-actions">
          <button
            class="btn subtle icon-btn"
            onClick={props.onGoToParentSheet}
            disabled={!props.canGoToParentSheet}
            aria-label="Go to parent sheet"
            title="Go to parent sheet"
          >
            <HiOutlineArrowSmallUp size={16} aria-hidden="true" />
          </button>
        </div>
        <div class="sheet-tree">
          <ul class="sheet-tree-list is-root">
            <For each={treeRoots()}>
              {(node) => <TreeBranch node={node} />}
            </For>
          </ul>
        </div>
      </section>
      <Show when={sheetContextMenu()}>
        {(menu) => (
          <Portal>
            <div class="sheet-context-backdrop" onPointerDown={() => setSheetContextMenu(null)}>
              <div
                class="sheet-context-menu"
                style={{ left: `${menu().x}px`, top: `${menu().y}px` }}
                onPointerDown={(evt) => evt.stopPropagation()}
                onContextMenu={(evt) => evt.preventDefault()}
              >
                <button
                  class="sheet-context-item"
                  onClick={() => {
                    props.onOpenSheetSettings(menu().sheetId);
                    setSheetContextMenu(null);
                  }}
                >
                  Sheet Settings
                </button>
              </div>
            </div>
          </Portal>
        )}
      </Show>
    </aside>
  );
}
