import {
  HiOutlineArrowUturnLeft,
  HiOutlineArrowUturnRight,
  HiOutlineArchiveBoxArrowDown,
  HiOutlineDocumentPlus,
  HiOutlineFolderOpen,
} from "solid-icons/hi";
import type { HalValueType, LabelScope } from "../../shared/types";
import { useI18n } from "../i18n";

interface EditorTopbarProps {
  onOpenProjectCreationDialog: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExportHal: () => void;
  onOpenComponentStore: () => void;
  onAddSubsheet: () => void;
  onAddPort: (direction: "in" | "out" | "io", valueType: HalValueType) => void;
  onAddLabel: (scope: LabelScope) => void;
  onAddComment: () => void;
}

function closeToolbarMenu(el: HTMLElement) {
  const host = el.closest("details");
  if (host instanceof HTMLDetailsElement) host.open = false;
}

export default function EditorTopbar(props: EditorTopbarProps) {
  const { t } = useI18n();

  return (
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">N</div>
        <div>
          <div class="brand-name">NoHAL</div>
        </div>
      </div>

      <div class="toolbar-group">
        <button
          type="button"
          class="btn subtle icon-btn"
          onClick={props.onOpenProjectCreationDialog}
          aria-label={t("topbar.newProject")}
          title={t("topbar.newProject")}
        >
          <HiOutlineDocumentPlus size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          class="btn subtle icon-btn"
          onClick={props.onOpenProject}
          aria-label={t("topbar.openProject")}
          title={t("topbar.openProject")}
        >
          <HiOutlineFolderOpen size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          class="btn subtle icon-btn"
          onClick={props.onSaveProject}
          aria-label={t("topbar.saveProject")}
          title={t("topbar.saveProject")}
        >
          <HiOutlineArchiveBoxArrowDown size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          class="btn subtle icon-btn"
          onClick={props.onUndo}
          disabled={!props.canUndo}
          aria-label={t("topbar.undo")}
          title={`${t("topbar.undo")} (Ctrl/Cmd+Z)`}
        >
          <HiOutlineArrowUturnLeft size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          class="btn subtle icon-btn"
          onClick={props.onRedo}
          disabled={!props.canRedo}
          aria-label={t("topbar.redo")}
          title={`${t("topbar.redo")} (Ctrl/Cmd+Y)`}
        >
          <HiOutlineArrowUturnRight size={16} aria-hidden="true" />
        </button>
        <button type="button" class="btn accent" onClick={props.onExportHal}>
          {t("topbar.exportHal")}
        </button>
      </div>

      <div class="toolbar-group">
        <button type="button" class="btn" onClick={props.onOpenComponentStore}>
          {t("topbar.componentStore")}
        </button>
      </div>

      <div class="toolbar-group">
        <button type="button" class="btn" onClick={props.onAddSubsheet}>
          {t("topbar.addSubsheet")}
        </button>
        <button type="button" class="btn" onClick={props.onAddComment}>
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
                props.onAddPort("in", "bit");
                closeToolbarMenu(evt.currentTarget);
              }}
            >
              {t("topbar.inPortBit")}
            </button>
            <button
              type="button"
              class="toolbar-menu-item"
              onClick={(evt) => {
                props.onAddPort("out", "bit");
                closeToolbarMenu(evt.currentTarget);
              }}
            >
              {t("topbar.outPortBit")}
            </button>
            <button
              type="button"
              class="toolbar-menu-item"
              onClick={(evt) => {
                props.onAddPort("io", "float");
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
                props.onAddLabel("local");
                closeToolbarMenu(evt.currentTarget);
              }}
            >
              {t("topbar.localLabel")}
            </button>
            <button
              type="button"
              class="toolbar-menu-item"
              onClick={(evt) => {
                props.onAddLabel("hierarchical");
                closeToolbarMenu(evt.currentTarget);
              }}
            >
              {t("topbar.hierLabel")}
            </button>
            <button
              type="button"
              class="toolbar-menu-item"
              onClick={(evt) => {
                props.onAddLabel("global");
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
