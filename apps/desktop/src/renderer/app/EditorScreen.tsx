import Canvas from "../components/Canvas";
import Inspector from "../components/Inspector";
import Sidebar from "../components/Sidebar";
import StatusBar from "../components/StatusBar";
import { useEditorShortcuts } from "../shortcuts/useEditorShortcuts";
import { EditorUiProvider } from "../state/EditorUiProvider";
import EditorOverlayHost from "./EditorOverlayHost";
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

      <main class="relative min-h-0 overflow-hidden">
        <Sidebar />
        <Canvas />
        <Inspector />
      </main>

      <StatusBar />

      <EditorOverlayHost />
    </div>
  );
}
