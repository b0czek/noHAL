import { For } from "solid-js";
import type { ComponentDefinition, NochalProject } from "../../shared/types";

interface SidebarProps {
  project: NochalProject;
  activeSheetId: string;
  onAddComponent: (componentId: string) => void;
  onCreateSubsheet: () => void;
  onPlaceSheet: (sheetId: string) => void;
  onGoToSheet: (sheetId: string) => void;
}

export default function Sidebar(props: SidebarProps) {
  const components = () =>
    Object.values(props.project.library.components).sort((a, b) => a.halComponentName.localeCompare(b.halComponentName));

  const sheets = () =>
    Object.values(props.project.sheets).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <aside class="sidebar">
      <section class="panel">
        <div class="panel-title">Sheets</div>
        <button class="btn" onClick={props.onCreateSubsheet}>
          New Subsheet + Place
        </button>
        <div class="list">
          <For each={sheets()}>
            {(sheet) => (
              <div class={`list-row ${sheet.id === props.activeSheetId ? "is-active" : ""}`}>
                <button class="linkish" onClick={() => props.onGoToSheet(sheet.id)}>
                  {sheet.name}
                </button>
                {sheet.id !== props.activeSheetId && (
                  <button class="mini" onClick={() => props.onPlaceSheet(sheet.id)}>
                    Place
                  </button>
                )}
              </div>
            )}
          </For>
        </div>
      </section>

      <section class="panel">
        <div class="panel-title">Components</div>
        <div class="list component-list">
          <For each={components()}>
            {(comp) => (
              <ComponentRow component={comp} onAdd={() => props.onAddComponent(comp.id)} />
            )}
          </For>
        </div>
      </section>
    </aside>
  );
}

function ComponentRow(props: { component: ComponentDefinition; onAdd: () => void }) {
  return (
    <div class="component-row">
      <div class="component-meta">
        <div class="component-name">{props.component.halComponentName}</div>
        <div class="component-sub">
          {props.component.source}
          {props.component.runtime?.kind ? ` • ${props.component.runtime.kind}` : ""}
          {` • ${props.component.pins.length} pins`}
        </div>
      </div>
      <button class="mini" onClick={props.onAdd}>
        Add
      </button>
    </div>
  );
}
