import { createMemo, For } from "solid-js";
import { createEmptyProject } from "../shared/project";
import { getSheet } from "../shared/graph";
import Canvas from "./components/Canvas";
import Inspector from "./components/Inspector";
import Sidebar from "./components/Sidebar";
import { createEditorStore } from "./state/store";

export default function App() {
  const { state, actions } = createEditorStore(createEmptyProject("Nochal Project"));

  const currentSheet = createMemo(() => getSheet(state.project, state.activeSheetId));
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

  return (
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark">N</div>
          <div>
            <div class="brand-name">NocHAL</div>
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
    </div>
  );
}
