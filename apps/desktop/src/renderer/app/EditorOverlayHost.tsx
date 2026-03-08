import { Match, Switch } from "solid-js";
import ComponentNodeDialog from "../components/ComponentNodeDialog";
import ComponentSearchDialog from "../components/ComponentSearchDialog";
import ComponentStoreDialog from "../components/ComponentStoreDialog";
import SheetSettingsDialog from "../components/SheetSettingsDialog";
import ProjectSettingsDialog from "../features/projectSettings";
import { useEditorUi } from "../state/EditorUiProvider";

export default function EditorOverlayHost() {
  const editorUi = useEditorUi();

  return (
    <Switch>
      <Match when={editorUi.activeOverlay()?.kind === "component-editor"}>
        <ComponentNodeDialog />
      </Match>
      <Match when={editorUi.activeOverlay()?.kind === "component-search"}>
        <ComponentSearchDialog />
      </Match>
      <Match when={editorUi.activeOverlay()?.kind === "component-store"}>
        <ComponentStoreDialog />
      </Match>
      <Match when={editorUi.activeOverlay()?.kind === "project-settings"}>
        <ProjectSettingsDialog />
      </Match>
      <Match when={editorUi.activeOverlay()?.kind === "sheet-settings"}>
        <SheetSettingsDialog />
      </Match>
    </Switch>
  );
}
