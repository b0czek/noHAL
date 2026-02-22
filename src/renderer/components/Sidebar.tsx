import { For } from "solid-js";
import type { NochalProject } from "../../shared/types";

interface SidebarProps {
  project: NochalProject;
  activeSheetId: string;
  onCreateSubsheet: () => void;
  onPlaceSheet: (sheetId: string) => void;
  onGoToSheet: (sheetId: string) => void;
}

export default function Sidebar(props: SidebarProps) {
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
    </aside>
  );
}
