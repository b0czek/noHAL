import {
  HiOutlineArchiveBoxArrowDown,
  HiOutlineArrowUturnLeft,
  HiOutlineArrowUturnRight,
  HiOutlineFolderOpen,
} from "solid-icons/hi";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";

interface EditorTopbarProps {
  onGoToLanding: () => void;
}

function closeToolbarMenu(el: HTMLElement) {
  const host = el.closest("details");
  if (host instanceof HTMLDetailsElement) host.open = false;
}

export default function EditorTopbar(props: EditorTopbarProps) {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();

  return (
    <header class="topbar">
      <button
        type="button"
        class="brand brand-button"
        onClick={props.onGoToLanding}
        title={t("topbar.goToLanding")}
        aria-label={t("topbar.goToLanding")}
      >
        <div class="brand-mark">N</div>
        <div>
          <div class="brand-name">NoHAL</div>
        </div>
      </button>

      <div class="toolbar-group">
        <button
          type="button"
          class="btn subtle icon-btn"
          onClick={() => void actions.openProject()}
          aria-label={t("topbar.openProject")}
          title={t("topbar.openProject")}
        >
          <HiOutlineFolderOpen size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          class="btn subtle icon-btn"
          onClick={() => void actions.saveProject()}
          aria-label={t("topbar.saveProject")}
          title={t("topbar.saveProject")}
        >
          <HiOutlineArchiveBoxArrowDown size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          class="btn subtle icon-btn"
          onClick={() => void actions.undo()}
          disabled={!state.canUndo}
          aria-label={t("topbar.undo")}
          title={`${t("topbar.undo")} (Ctrl/Cmd+Z)`}
        >
          <HiOutlineArrowUturnLeft size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          class="btn subtle icon-btn"
          onClick={() => void actions.redo()}
          disabled={!state.canRedo}
          aria-label={t("topbar.redo")}
          title={`${t("topbar.redo")} (Ctrl/Cmd+Y)`}
        >
          <HiOutlineArrowUturnRight size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          class="btn accent"
          onClick={() => void actions.buildProject()}
        >
          {t("topbar.build")}
        </button>
      </div>

      <div class="toolbar-group">
        <button
          type="button"
          class="btn"
          onClick={editorUi.openProjectSettings}
        >
          {t("topbar.projectSettings")}
        </button>
        <button type="button" class="btn" onClick={editorUi.openComponentStore}>
          {t("topbar.componentStore")}
        </button>
      </div>

      <div class="toolbar-group">
        <button
          type="button"
          class="btn"
          onClick={() => actions.addSheetDefinition()}
        >
          {t("topbar.addSubsheet")}
        </button>
        <button type="button" class="btn" onClick={actions.addComment}>
          {t("topbar.addText")}
        </button>
        <details class="toolbar-menu">
          <summary class="btn toolbar-menu-summary">
            {t("topbar.addPort")}
          </summary>
          <div class="toolbar-menu-popover">
            <button
              type="button"
              class="toolbar-menu-item"
              onClick={(evt) => {
                actions.addSheetPort("in", "bit");
                closeToolbarMenu(evt.currentTarget);
              }}
            >
              {t("topbar.inPortBit")}
            </button>
            <button
              type="button"
              class="toolbar-menu-item"
              onClick={(evt) => {
                actions.addSheetPort("out", "bit");
                closeToolbarMenu(evt.currentTarget);
              }}
            >
              {t("topbar.outPortBit")}
            </button>
            <button
              type="button"
              class="toolbar-menu-item"
              onClick={(evt) => {
                actions.addSheetPort("io", "float");
                closeToolbarMenu(evt.currentTarget);
              }}
            >
              {t("topbar.ioPortFloat")}
            </button>
          </div>
        </details>
        <details class="toolbar-menu">
          <summary class="btn toolbar-menu-summary">
            {t("topbar.addLabel")}
          </summary>
          <div class="toolbar-menu-popover">
            <button
              type="button"
              class="toolbar-menu-item"
              onClick={(evt) => {
                actions.addLabel("local");
                closeToolbarMenu(evt.currentTarget);
              }}
            >
              {t("topbar.localLabel")}
            </button>
            <button
              type="button"
              class="toolbar-menu-item"
              onClick={(evt) => {
                actions.addLabel("global");
                closeToolbarMenu(evt.currentTarget);
              }}
            >
              {t("topbar.globalLabel")}
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}
