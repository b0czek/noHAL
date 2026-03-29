import { getNodeTitle } from "@nohal/core/graph";
import type { NoHALProject } from "@nohal/core/types";

export type CanvasSearchTarget = {
  kind: "node" | "label" | "comment" | "sheet-port";
  id: string;
};

export type CanvasSearchResult = {
  key: string;
  kind: "component" | "subsheet" | "label" | "comment" | "port";
  target: CanvasSearchTarget;
  sheetId: string;
  sheetName: string;
  title: string;
  searchText: string;
};

const COMMENT_TITLE_MAX_LENGTH = 72;
const COMMENT_TITLE_PREVIEW_LENGTH = 69;

export function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

function formatCommentTitle(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "Text";
  return normalized.length > COMMENT_TITLE_MAX_LENGTH
    ? `${normalized.slice(0, COMMENT_TITLE_PREVIEW_LENGTH).trimEnd()}...`
    : normalized;
}

export function buildCanvasSearchResults(
  project: NoHALProject,
  scope: "sheet" | "project",
  activeSheetId: string,
): CanvasSearchResult[] {
  const allSheets = Object.values(project.sheets);
  const sourceSheets =
    scope === "sheet"
      ? allSheets.filter((sheet) => sheet.id === activeSheetId)
      : allSheets;

  const collected: CanvasSearchResult[] = [];
  for (const sheet of sourceSheets) {
    for (const node of sheet.nodes) {
      const title = getNodeTitle(project, node);
      if (node.kind === "component") {
        const component = project.library.components[node.componentId];
        const componentName = component?.name ?? "";
        const halComponentName = component?.halComponentName ?? "";
        const searchText = normalizeSearchText(
          `${node.instanceName} ${title} ${componentName} ${halComponentName} ${sheet.name}`,
        );

        collected.push({
          key: `node:${node.id}`,
          kind: "component",
          target: { kind: "node", id: node.id },
          sheetId: sheet.id,
          sheetName: sheet.name,
          title,
          searchText,
        });
        continue;
      }

      const subsheet = project.sheets[node.sheetId];
      collected.push({
        key: `node:${node.id}`,
        kind: "subsheet",
        target: { kind: "node", id: node.id },
        sheetId: sheet.id,
        sheetName: sheet.name,
        title,
        searchText: normalizeSearchText(
          `${node.instanceName} ${title} ${subsheet?.name ?? ""} subsheet ${sheet.name}`,
        ),
      });
    }

    for (const label of sheet.labels) {
      collected.push({
        key: `label:${label.id}`,
        kind: "label",
        target: { kind: "label", id: label.id },
        sheetId: sheet.id,
        sheetName: sheet.name,
        title: label.name,
        searchText: normalizeSearchText(
          `${label.name} ${label.scope} ${sheet.name}`,
        ),
      });
    }

    for (const port of sheet.ports) {
      collected.push({
        key: `port:${port.id}`,
        kind: "port",
        target: { kind: "sheet-port", id: port.id },
        sheetId: sheet.id,
        sheetName: sheet.name,
        title: port.name,
        searchText: normalizeSearchText(
          `${port.name} ${port.direction} ${port.type} ${port.side} port ${sheet.name}`,
        ),
      });
    }

    for (const comment of sheet.comments) {
      collected.push({
        key: `comment:${comment.id}`,
        kind: "comment",
        target: { kind: "comment", id: comment.id },
        sheetId: sheet.id,
        sheetName: sheet.name,
        title: formatCommentTitle(comment.text),
        searchText: normalizeSearchText(`${comment.text} ${sheet.name}`),
      });
    }
  }

  if (scope === "project") {
    collected.sort(
      (a, b) =>
        a.sheetName.localeCompare(b.sheetName) ||
        a.title.localeCompare(b.title) ||
        a.kind.localeCompare(b.kind),
    );
  } else {
    collected.sort(
      (a, b) => a.title.localeCompare(b.title) || a.kind.localeCompare(b.kind),
    );
  }

  return collected;
}
