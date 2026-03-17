import { Match, Switch } from "solid-js";
import ComponentSearchDialog from "../components/ComponentSearchDialog";
import ComponentSettings from "../features/componentSettings";
import GeneralSettingsDialog from "../features/generalSettings";
import ProjectSettingsDialog from "../features/projectSettings";
import SheetSettingsDialog from "../features/sheetSettings";
import { type EditorOverlay, useEditorUi } from "../state/EditorUiProvider";

type ComponentEditorOverlay = Extract<
  EditorOverlay,
  { kind: "component-editor" }
>;
type ComponentSearchOverlay = Extract<
  EditorOverlay,
  { kind: "component-search" }
>;
type GeneralSettingsOverlay = Extract<
  EditorOverlay,
  { kind: "general-settings" }
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
          <ComponentSettings
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
        when={
          overlay()?.kind === "general-settings"
            ? (overlay() as GeneralSettingsOverlay)
            : undefined
        }
      >
        {(current) => (
          <GeneralSettingsDialog
            initialTab={current().initialTab}
            context="project"
            onClose={editorUi.closeActiveOverlay}
          />
        )}
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
