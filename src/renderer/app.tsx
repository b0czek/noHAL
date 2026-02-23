import { createEffect, createMemo, createSignal, For } from "solid-js";
import { createEmptyProject } from "../shared/project";
import { getSheet } from "../shared/graph";
import Canvas from "./components/Canvas";
import ComponentNodeDialog from "./components/ComponentNodeDialog";
import Inspector from "./components/Inspector";
import Sidebar from "./components/Sidebar";
import { createEditorStore } from "./state/store";
import { useEditorShortcuts } from "./shortcuts/useEditorShortcuts";

export default function App() {
  const { state, actions } = createEditorStore(createEmptyProject("NoHAL Project"));
  const [componentEditorNodeId, setComponentEditorNodeId] = createSignal<string | null>(null);

  const currentSheet = createMemo(() => getSheet(state.project, state.activeSheetId));
  const selectedNode = createMemo(() => {
    const selection = state.selection;
    if (!selection || selection.kind !== "node") return undefined;
    return currentSheet().nodes.find((n) => n.id === selection.id);
  });
  const editingComponentNode = createMemo(() => {
    const id = componentEditorNodeId();
    if (!id) return null;
    const node = currentSheet().nodes.find((n) => n.id === id);
    return node && node.kind === "component" ? node : null;
  });
  const breadcrumb = createMemo(() => {
    const items: Array<{ id: string; name: string }> = [];
    let cursor = currentSheet();
    items.push({ id: cursor.id, name: cursor.name });
    while (cursor.parentSheetId) {
      cursor = getSheet(state.project, cursor.parentSheetId);
      items.push({ id: cursor.id, name: cursor.name });
    }
    return items.reverse();
  });

  const labelClick = (labelId: string) => {
    if (state.pendingEndpoint) {
      actions.anchorPendingToLabel(labelId);
    } else {
      actions.select({ kind: "label", id: labelId });
    }
  };

  const openComponentEditorForNode = (nodeId: string) => {
    const node = currentSheet().nodes.find((n) => n.id === nodeId);
    if (!node || node.kind !== "component") return;
    setComponentEditorNodeId(node.id);
  };

  const openSelectedComponentEditor = () => {
    const node = selectedNode();
    if (!node || node.kind !== "component") return;
    setComponentEditorNodeId(node.id);
  };

  createEffect(() => {
    state.activeSheetId;
    state.project;
    if (componentEditorNodeId() && !editingComponentNode()) {
      setComponentEditorNodeId(null);
    }
  });

  useEditorShortcuts({
    isComponentDialogOpen: () => componentEditorNodeId() !== null,
    closeComponentDialog: () => setComponentEditorNodeId(null),
    hasPendingWire: () => state.pendingEndpoint !== null,
    cancelPendingWire: actions.clearPendingEndpoint,
    hasSelection: () => state.selection !== null,
    deleteSelection: actions.removeSelection
  });

  return (
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark">N</div>
          <div>
            <div class="brand-name">NoHAL</div>
          </div>
        </div>

        <div class="toolbar-group">
          <button class="btn" onClick={() => void actions.newProject()}>New</button>
          <button class="btn" onClick={() => void actions.openProject()}>Open</button>
          <button class="btn" onClick={() => void actions.saveProject()}>Save</button>
          <button class="btn accent" onClick={() => void actions.exportHal()}>Export HAL</button>
        </div>

        <div class="toolbar-group">
          <button class="btn" onClick={() => void actions.importCompFile()}>Import .comp</button>
          <button class="btn" onClick={() => void actions.importCompDirectory()}>Scan .comp Dir</button>
        </div>

        <div class="toolbar-group">
          <button class="btn" onClick={() => actions.addSheetPort("in", "bit")}>+ In Port</button>
          <button class="btn" onClick={() => actions.addSheetPort("out", "bit")}>+ Out Port</button>
          <button class="btn" onClick={() => actions.addSheetPort("io", "float")}>+ IO Port</button>
          <button class="btn" onClick={() => actions.addLabel("local")}>+ Local Label</button>
          <button class="btn" onClick={() => actions.addLabel("hierarchical")}>+ Hier Label</button>
          <button class="btn" onClick={() => actions.addLabel("global")}>+ Global Label</button>
        </div>
      </header>

      <div class="crumbs">
        <For each={breadcrumb()}>
          {(item, idx) => (
            <>
              <button class={`crumb ${item.id === state.activeSheetId ? "is-active" : ""}`} onClick={() => actions.setActiveSheet(item.id)}>
                {item.name}
              </button>
              {idx() < breadcrumb().length - 1 && <span class="crumb-sep">/</span>}
            </>
          )}
        </For>
        <button class="btn subtle" onClick={() => actions.goToParentSheet()} disabled={!currentSheet().parentSheetId}>
          Up
        </button>
        <button class="btn subtle" onClick={() => actions.clearPendingEndpoint()} disabled={!state.pendingEndpoint}>
          Cancel Wire
        </button>
      </div>

      <main class="workspace">
        <Sidebar
          project={state.project}
          activeSheetId={state.activeSheetId}
          onCreateSubsheet={() => actions.addSheetDefinition()}
          onPlaceSheet={(id) => actions.placeExistingSheetNode(id)}
          onGoToSheet={(id) => actions.setActiveSheet(id)}
        />

        <Canvas
          project={state.project}
          sheet={currentSheet()}
          activeSheetId={state.activeSheetId}
          selection={state.selection}
          pendingEndpoint={state.pendingEndpoint}
          onSelect={actions.select}
          onOpenNode={openComponentEditorForNode}
          onEndpointClick={actions.endpointClick}
          onLabelClick={labelClick}
          onMoveNode={actions.moveNode}
          onMoveLabel={actions.moveLabel}
          onMoveSheetPort={actions.moveSheetPort}
          onAddComponentAt={(id, x, y) => actions.addComponentNode(id, { x, y })}
        />

        <Inspector
          state={state}
          currentSheet={currentSheet()}
          onOpenSelectedComponentEditor={openSelectedComponentEditor}
          onRenameNode={actions.renameNode}
          onUpdateNodeParam={actions.updateNodeParam}
          onUpdateLabel={actions.updateLabel}
          onUpdateSheetPort={actions.updateSheetPort}
          onRemoveSelection={actions.removeSelection}
          onRemoveConnection={actions.removeDirectConnection}
          onRemoveLabelAnchor={actions.removeLabelAnchor}
          onEnterSelectedSheet={actions.enterSelectedSheet}
        />
      </main>

      <ComponentNodeDialog
        open={editingComponentNode() !== null}
        project={state.project}
        node={editingComponentNode()}
        onRename={(name) => {
          const node = editingComponentNode();
          if (!node) return;
          actions.renameNode(node.id, name);
        }}
        onUpdateParam={(key, value) => {
          const node = editingComponentNode();
          if (!node) return;
          actions.updateNodeParam(node.id, key, value);
        }}
        onClose={() => setComponentEditorNodeId(null)}
      />
    </div>
  );
}
