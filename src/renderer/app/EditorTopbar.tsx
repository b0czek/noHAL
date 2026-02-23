import {
  HiOutlineArchiveBoxArrowDown,
  HiOutlineDocumentPlus,
  HiOutlineFolderOpen,
} from "solid-icons/hi";
import type { HalValueType, LabelScope } from "../../shared/types";

interface EditorTopbarProps {
  onOpenProjectCreationDialog: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onExportHal: () => void;
  onOpenComponentStore: () => void;
  onAddSubsheet: () => void;
  onAddPort: (direction: "in" | "out" | "io", valueType: HalValueType) => void;
  onAddLabel: (scope: LabelScope) => void;
}

function closeToolbarMenu(el: HTMLElement) {
  const host = el.closest("details");
  if (host instanceof HTMLDetailsElement) host.open = false;
}

export default function EditorTopbar(props: EditorTopbarProps) {
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
          aria-label="New project"
          title="New project"
        >
          <HiOutlineDocumentPlus size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          class="btn subtle icon-btn"
          onClick={props.onOpenProject}
          aria-label="Open project"
          title="Open project"
        >
          <HiOutlineFolderOpen size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          class="btn subtle icon-btn"
          onClick={props.onSaveProject}
          aria-label="Save project"
          title="Save project"
        >
          <HiOutlineArchiveBoxArrowDown size={16} aria-hidden="true" />
        </button>
        <button type="button" class="btn accent" onClick={props.onExportHal}>
          Export HAL
        </button>
      </div>

      <div class="toolbar-group">
        <button type="button" class="btn" onClick={props.onOpenComponentStore}>
          Component Store
        </button>
      </div>

      <div class="toolbar-group">
        <button type="button" class="btn" onClick={props.onAddSubsheet}>
          + Subsheet
        </button>
        <details class="toolbar-menu">
          <summary class="btn toolbar-menu-summary">+ Port</summary>
          <div class="toolbar-menu-popover">
            <button
              type="button"
              class="toolbar-menu-item"
              onClick={(evt) => {
                props.onAddPort("in", "bit");
                closeToolbarMenu(evt.currentTarget);
              }}
            >
              In Port (bit)
            </button>
            <button
              type="button"
              class="toolbar-menu-item"
              onClick={(evt) => {
                props.onAddPort("out", "bit");
                closeToolbarMenu(evt.currentTarget);
              }}
            >
              Out Port (bit)
            </button>
            <button
              type="button"
              class="toolbar-menu-item"
              onClick={(evt) => {
                props.onAddPort("io", "float");
                closeToolbarMenu(evt.currentTarget);
              }}
            >
              IO Port (float)
            </button>
          </div>
        </details>
        <details class="toolbar-menu">
          <summary class="btn toolbar-menu-summary">+ Label</summary>
          <div class="toolbar-menu-popover">
            <button
              type="button"
              class="toolbar-menu-item"
              onClick={(evt) => {
                props.onAddLabel("local");
                closeToolbarMenu(evt.currentTarget);
              }}
            >
              Local Label
            </button>
            <button
              type="button"
              class="toolbar-menu-item"
              onClick={(evt) => {
                props.onAddLabel("hierarchical");
                closeToolbarMenu(evt.currentTarget);
              }}
            >
              Hier Label
            </button>
            <button
              type="button"
              class="toolbar-menu-item"
              onClick={(evt) => {
                props.onAddLabel("global");
                closeToolbarMenu(evt.currentTarget);
              }}
            >
              Global Label
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}
