import Canvas from "../components/Canvas";
import ComponentNodeDialog from "../components/ComponentNodeDialog";
import ComponentStoreDialog from "../components/ComponentStoreDialog";
import Inspector from "../components/Inspector";
import SheetSettingsDialog from "../components/SheetSettingsDialog";
import Sidebar from "../components/Sidebar";
import { useEditorShortcuts } from "../shortcuts/useEditorShortcuts";
import type { createEditorStore, EditorState } from "../state/store";
import EditorTopbar from "./EditorTopbar";
import { useEditorUiState } from "./useEditorUiState";

type EditorActions = ReturnType<typeof createEditorStore>["actions"];

interface EditorScreenProps {
  state: EditorState;
  actions: EditorActions;
  onOpenProjectCreationDialog: () => void;
}

export default function EditorScreen(props: EditorScreenProps) {
  const editorUi = useEditorUiState({
    state: props.state,
    actions: props.actions,
  });

  useEditorShortcuts({
    isComponentDialogOpen: () => editorUi.componentEditorNodeId() !== null,
    closeComponentDialog: editorUi.closeComponentEditor,
    hasPendingWire: () => props.state.pendingEndpoint !== null,
    cancelPendingWire: props.actions.clearPendingEndpoint,
    hasSelection: () => props.state.selection !== null,
    deleteSelection: props.actions.removeSelection,
  });

  return (
    <div class="app-shell">
      <EditorTopbar
        onOpenProjectCreationDialog={props.onOpenProjectCreationDialog}
        onOpenProject={() => void props.actions.openProject()}
        onSaveProject={() => void props.actions.saveProject()}
        onExportHal={() => void props.actions.exportHal()}
        onOpenComponentStore={editorUi.openComponentStore}
        onAddSubsheet={() => props.actions.addSheetDefinition()}
        onAddPort={(direction, valueType) =>
          props.actions.addSheetPort(direction, valueType)
        }
        onAddLabel={(scope) => props.actions.addLabel(scope)}
      />

      <main class="workspace">
        <Sidebar
          project={props.state.project}
          activeSheetId={props.state.activeSheetId}
          onPlaceSheet={(id) => props.actions.placeExistingSheetNode(id)}
          onGoToSheet={(id) => props.actions.setActiveSheet(id)}
          onGoToParentSheet={() => props.actions.goToParentSheet()}
          canGoToParentSheet={Boolean(editorUi.currentSheet().parentSheetId)}
          onOpenSheetSettings={editorUi.openSheetSettings}
          onDeleteSheet={(id) => props.actions.deleteSheetDefinition(id)}
        />

        <Canvas
          project={props.state.project}
          sheet={editorUi.currentSheet()}
          activeSheetId={props.state.activeSheetId}
          selection={props.state.selection}
          pendingEndpoint={props.state.pendingEndpoint}
          pendingWirePoints={props.state.pendingWirePoints}
          onSelect={props.actions.select}
          onOpenNode={editorUi.openComponentEditorForNode}
          onEndpointClick={props.actions.endpointClick}
          onCanvasBackgroundClick={props.actions.addPendingWirePoint}
          onLabelClick={editorUi.labelClick}
          onMoveNode={props.actions.moveNode}
          onMoveLabel={props.actions.moveLabel}
          onMoveSheetPort={props.actions.moveSheetPort}
          onMoveConnectionWaypoints={
            props.actions.updateDirectConnectionWaypoints
          }
          onAddComponentAt={(id, x, y) =>
            props.actions.addComponentNode(id, { x, y })
          }
        />

        <Inspector
          state={props.state}
          currentSheet={editorUi.currentSheet()}
          onOpenSelectedComponentEditor={editorUi.openSelectedComponentEditor}
          onRenameNode={props.actions.renameNode}
          onUpdateNodeParam={props.actions.updateNodeParam}
          onUpdateLabel={props.actions.updateLabel}
          onUpdateSheetPort={props.actions.updateSheetPort}
          onRemoveSelection={props.actions.removeSelection}
          onRemoveConnection={props.actions.removeDirectConnection}
          onRemoveLabelAnchor={props.actions.removeLabelAnchor}
          onEnterSelectedSheet={props.actions.enterSelectedSheet}
          onRefreshComponentInStore={(componentId) =>
            void props.actions.refreshComponentInStore(componentId)
          }
        />
      </main>

      <ComponentNodeDialog
        open={editorUi.editingComponentNode() !== null}
        project={props.state.project}
        node={editorUi.editingComponentNode()}
        onRename={(name) => {
          const node = editorUi.editingComponentNode();
          if (!node) return;
          props.actions.renameNode(node.id, name);
        }}
        onUpdateParam={(key, value) => {
          const node = editorUi.editingComponentNode();
          if (!node) return;
          props.actions.updateNodeParam(node.id, key, value);
        }}
        onUpdatePinInitialValue={(key, value) => {
          const node = editorUi.editingComponentNode();
          if (!node) return;
          props.actions.updateNodePinInitialValue(node.id, key, value);
        }}
        onClose={editorUi.closeComponentEditor}
      />

      <ComponentStoreDialog
        open={editorUi.isComponentStoreOpen()}
        componentStore={props.state.componentStore}
        onImportCompFile={() => void props.actions.importCompFile()}
        onAddCompDirSource={() => void props.actions.addComponentDirSource()}
        onRefreshComponentSource={(sourceId) =>
          void props.actions.refreshComponentSource(sourceId)
        }
        onDeleteComponentSource={(sourceId) =>
          void props.actions.deleteComponentSource(sourceId)
        }
        onRefreshStoredComponent={(componentId) =>
          void props.actions.refreshComponentInStore(componentId)
        }
        onClose={editorUi.closeComponentStore}
      />

      <SheetSettingsDialog
        open={editorUi.sheetSettingsSheetId() !== null}
        project={props.state.project}
        sheetId={editorUi.sheetSettingsSheetId()}
        onSetSheetAddfQueue={props.actions.setSheetAddfQueue}
        onClose={editorUi.closeSheetSettings}
      />
    </div>
  );
}
