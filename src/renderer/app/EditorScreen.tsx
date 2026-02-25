import Canvas from "../components/Canvas";
import ComponentNodeDialog from "../components/ComponentNodeDialog";
import ComponentStoreDialog from "../components/ComponentStoreDialog";
import Inspector from "../components/Inspector";
import SheetSettingsDialog from "../components/SheetSettingsDialog";
import Sidebar from "../components/Sidebar";
import StatusBar from "../components/StatusBar";
import { useEditorShortcuts } from "../shortcuts/useEditorShortcuts";
import EditorTopbar from "./EditorTopbar";
import { useEditorUiState } from "./useEditorUiState";

interface EditorScreenProps {
  onOpenProjectCreationDialog: () => void;
}

export default function EditorScreen(props: EditorScreenProps) {
  const editorUi = useEditorUiState();

  useEditorShortcuts({
    isComponentDialogOpen: () => editorUi.componentEditorNodeId() !== null,
    closeComponentDialog: editorUi.closeComponentEditor,
  });

  return (
    <div class="app-shell">
      <EditorTopbar
        onOpenProjectCreationDialog={props.onOpenProjectCreationDialog}
        onOpenComponentStore={editorUi.openComponentStore}
      />

      <main class="workspace">
        <Sidebar onOpenSheetSettings={editorUi.openSheetSettings} />

        <Canvas
          onOpenNode={editorUi.openComponentEditorForNode}
          onLabelClick={editorUi.labelClick}
          onCommentClick={editorUi.commentClick}
        />

        <Inspector
          onOpenSelectedComponentEditor={editorUi.openSelectedComponentEditor}
        />
      </main>

      <StatusBar />

      <ComponentNodeDialog
        open={editorUi.editingComponentNode() !== null}
        node={editorUi.editingComponentNode()}
        onClose={editorUi.closeComponentEditor}
      />

      <ComponentStoreDialog
        open={editorUi.isComponentStoreOpen()}
        onClose={editorUi.closeComponentStore}
      />

      <SheetSettingsDialog
        open={editorUi.sheetSettingsSheetId() !== null}
        sheetId={editorUi.sheetSettingsSheetId()}
        onClose={editorUi.closeSheetSettings}
      />
    </div>
  );
}
