import { Match, Switch } from "solid-js";
import ComponentNodeDialog from "../components/ComponentNodeDialog";
import ComponentSearchDialog from "../components/ComponentSearchDialog";
import ComponentStoreDialog from "../components/ComponentStoreDialog";
import SheetSettingsDialog from "../components/SheetSettingsDialog";
import ProjectSettingsDialog from "../features/projectSettings";
import { type EditorOverlay, useEditorUi } from "../state/EditorUiProvider";

type ComponentEditorOverlay = Extract<
  EditorOverlay,
  { kind: "component-editor" }
>;
type ComponentSearchOverlay = Extract<
  EditorOverlay,
  { kind: "component-search" }
>;
type SheetSettingsOverlay = Extract<EditorOverlay, { kind: "sheet-settings" }>;

export default function EditorOverlayHost() {
  const editorUi = useEditorUi();
  const overlay = () => editorUi.activeOverlay();

  return (
    <Switch>
      <Match
        when={
          overlay()?.kind === "component-editor"
            ? (overlay() as ComponentEditorOverlay)
            : undefined
        }
      >
        {(current) => (
          <ComponentNodeDialog
            nodeId={current().nodeId}
            onClose={editorUi.closeActiveOverlay}
          />
        )}
      </Match>
      <Match
        when={
          overlay()?.kind === "component-search"
            ? (overlay() as ComponentSearchOverlay)
            : undefined
        }
      >
        {(current) => (
          <ComponentSearchDialog
            scope={current().scope}
            onClose={editorUi.closeActiveOverlay}
          />
        )}
      </Match>
      <Match
        when={overlay()?.kind === "component-store" ? overlay() : undefined}
      >
        <ComponentStoreDialog onClose={editorUi.closeActiveOverlay} />
      </Match>
      <Match
        when={overlay()?.kind === "project-settings" ? overlay() : undefined}
      >
        <ProjectSettingsDialog onClose={editorUi.closeActiveOverlay} />
      </Match>
      <Match
        when={
          overlay()?.kind === "sheet-settings"
            ? (overlay() as SheetSettingsOverlay)
            : undefined
        }
      >
        {(current) => (
          <SheetSettingsDialog
            sheetId={current().sheetId}
            onClose={editorUi.closeActiveOverlay}
          />
        )}
      </Match>
    </Switch>
  );
}
