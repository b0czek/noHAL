import Canvas from "../components/Canvas";
import ComponentNodeDialog from "../components/ComponentNodeDialog";
import ComponentSearchDialog from "../components/ComponentSearchDialog";
import ComponentStoreDialog from "../components/ComponentStoreDialog";
import Inspector from "../components/Inspector";
import SheetSettingsDialog from "../components/SheetSettingsDialog";
import Sidebar from "../components/Sidebar";
import StatusBar from "../components/StatusBar";
import ProjectSettingsDialog from "../features/projectSettings";
import { useEditorShortcuts } from "../shortcuts/useEditorShortcuts";
import { EditorUiProvider } from "../state/EditorUiProvider";
import EditorTopbar from "./EditorTopbar";

interface EditorScreenProps {
  onGoToLanding: () => void;
}

export default function EditorScreen(props: EditorScreenProps) {
  return (
    <EditorUiProvider>
      <EditorScreenContent onGoToLanding={props.onGoToLanding} />
    </EditorUiProvider>
  );
}

function EditorScreenContent(props: EditorScreenProps) {
  useEditorShortcuts();

  return (
    <div class="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
      <EditorTopbar onGoToLanding={props.onGoToLanding} />

      <main class="relative grid min-h-0 grid-cols-[minmax(0,1fr)_22rem] overflow-hidden">
        <Sidebar />
        <Canvas />
        <Inspector />
      </main>

      <StatusBar />

      <ComponentNodeDialog />
      <ComponentSearchDialog />
      <ComponentStoreDialog />
      <ProjectSettingsDialog />
      <SheetSettingsDialog />
    </div>
  );
}
