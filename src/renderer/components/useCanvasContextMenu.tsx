import { createMemo } from "solid-js";
import type { NoHALProject, SheetDefinition, XY } from "../../shared/types";
import type { KonvaSheetScene } from "../canvas/konvaSheetScene";
import type {
  SceneContextMenuRequest,
  SceneContextMenuTarget,
} from "../canvas/konvaSheetSceneTypes";
import { useI18n } from "../i18n";
import type { Selection } from "../state/store";
import CanvasComponentMenu from "./CanvasComponentMenu";
import { useContextMenu } from "./ContextMenuProvider";

interface UseCanvasContextMenuArgs {
  getHostEl: () => HTMLDivElement;
  getScene: () => KonvaSheetScene | null;
  getProject: () => NoHALProject;
  getSheet: () => SheetDefinition;
  getSelection: () => Selection;
  onSelect: (selection: Selection) => void;
  onOpenNode: (nodeId: string) => void;
  onMoveConnectionWaypoints: (connectionId: string, waypoints: XY[]) => void;
  onAddComponentAt: (componentId: string, x: number, y: number) => void;
  onRemoveSelection: () => void;
  onPutSelectionIntoSubsheet: () => void;
  onRemoveConnection: (connectionId: string) => void;
  onRefreshComponentInStore: (componentId: string) => void;
}

export function useCanvasContextMenu(args: UseCanvasContextMenuArgs) {
  const { t } = useI18n();
  const contextMenu = useContextMenu();

  const componentChoices = createMemo(() =>
    Object.values(args.getProject().library.components).sort((a, b) =>
      a.halComponentName.localeCompare(b.halComponentName),
    ),
  );

  const menuPosition = (
    clientX: number,
    clientY: number,
    menuW: number,
    menuH: number,
  ) => {
    const rect = args.getHostEl().getBoundingClientRect();
    const minX = rect.left + 8;
    const minY = rect.top + 8;
    const maxX = rect.right - menuW - 8;
    const maxY = rect.bottom - menuH - 8;
    return {
      x: Math.max(minX, Math.min(clientX, Math.max(minX, maxX))),
      y: Math.max(minY, Math.min(clientY, Math.max(minY, maxY))),
    };
  };

  const selectionContainsContextTarget = (
    selection: Selection,
    target: SceneContextMenuTarget,
  ): boolean => {
    if (!selection || selection.kind !== "multi") return false;
    if (target.kind === "node") return selection.nodeIds.includes(target.id);
    if (target.kind === "label") return selection.labelIds.includes(target.id);
    if (target.kind === "comment") return false;
    if (target.kind === "sheet-port")
      return selection.portIds.includes(target.id);
    return false;
  };

  const openBackgroundMenu = (clientX: number, clientY: number) => {
    const pos = menuPosition(clientX, clientY, 360, 440);
    const world = args.getScene()?.clientToWorld(clientX, clientY) ?? {
      x: 120,
      y: 120,
    };
    contextMenu.openCustom({
      x: pos.x,
      y: pos.y,
      width: 360,
      maxHeight: 460,
      ariaLabel: t("canvasComponentMenu.ariaLabel"),
      content: ({ close }) => (
        <CanvasComponentMenu
          components={componentChoices()}
          onAddComponent={(componentId) =>
            args.onAddComponentAt(componentId, world.x, world.y)
          }
          onClose={close}
        />
      ),
    });
  };

  const deleteWaypoint = (connectionId: string, waypointIndex: number) => {
    const conn = args
      .getSheet()
      .directConnections.find((c) => c.id === connectionId);
    if (!conn?.waypoints) return;
    if (waypointIndex < 0 || waypointIndex >= conn.waypoints.length) return;
    const next = conn.waypoints.filter((_, idx) => idx !== waypointIndex);
    args.onMoveConnectionWaypoints(
      connectionId,
      next.map((p) => ({ x: p.x, y: p.y })),
    );
  };

  const buildActionMenu = (
    target: SceneContextMenuTarget | { kind: "group" },
  ): {
    title: string;
    items: { label: string; onSelect: () => void }[];
  } | null => {
    const sheet = args.getSheet();
    if (target.kind === "group") {
      return {
        title: t("canvasContext.selection"),
        items: [
          {
            label: t("canvasContext.putEverythingIntoSubsheet"),
            onSelect: () => args.onPutSelectionIntoSubsheet(),
          },
          {
            label: t("inspector.deleteSelection"),
            onSelect: () => args.onRemoveSelection(),
          },
        ],
      };
    }

    if (target.kind === "node") {
      const node = sheet.nodes.find((n) => n.id === target.id);
      if (!node) return null;
      if (target.nodeKind === "component" && node.kind === "component") {
        return {
          title: t("canvasContext.component"),
          items: [
            {
              label: t("inspector.openComponentSettings"),
              onSelect: () => args.onOpenNode(node.id),
            },
            {
              label: t("inspector.refreshComponentDefinition"),
              onSelect: () => args.onRefreshComponentInStore(node.componentId),
            },
            {
              label: t("inspector.deleteSelection"),
              onSelect: () => {
                args.onSelect({ kind: "node", id: node.id });
                args.onRemoveSelection();
              },
            },
          ],
        };
      }
      return {
        title: t("canvasContext.subsheet"),
        items: [
          {
            label: t("inspector.enterSubsheet"),
            onSelect: () => args.onOpenNode(node.id),
          },
          {
            label: t("inspector.deleteSelection"),
            onSelect: () => {
              args.onSelect({ kind: "node", id: node.id });
              args.onRemoveSelection();
            },
          },
        ],
      };
    }

    if (target.kind === "label") {
      return {
        title: t("canvasContext.label"),
        items: [
          {
            label: t("inspector.deleteSelection"),
            onSelect: () => {
              args.onSelect({ kind: "label", id: target.id });
              args.onRemoveSelection();
            },
          },
        ],
      };
    }

    if (target.kind === "comment") {
      return {
        title: t("canvasContext.comment"),
        items: [
          {
            label: t("inspector.deleteSelection"),
            onSelect: () => {
              args.onSelect({ kind: "comment", id: target.id });
              args.onRemoveSelection();
            },
          },
        ],
      };
    }

    if (target.kind === "sheet-port") {
      return {
        title: t("canvasContext.sheetPort"),
        items: [
          {
            label: t("inspector.deleteSelection"),
            onSelect: () => {
              args.onSelect({ kind: "sheet-port", id: target.id });
              args.onRemoveSelection();
            },
          },
        ],
      };
    }

    if (target.kind === "wire-connection") {
      return {
        title: t("canvasContext.connection"),
        items: [
          {
            label: t("canvasContext.removeConnection"),
            onSelect: () => args.onRemoveConnection(target.connectionId),
          },
        ],
      };
    }

    return {
      title: t("canvasContext.waypoint"),
      items: [
        {
          label: t("canvasContext.deleteWaypoint"),
          onSelect: () =>
            deleteWaypoint(target.connectionId, target.waypointIndex),
        },
        {
          label: t("canvasContext.removeConnection"),
          onSelect: () => args.onRemoveConnection(target.connectionId),
        },
      ],
    };
  };

  const openActionMenu = (
    clientX: number,
    clientY: number,
    target: SceneContextMenuTarget | { kind: "group" },
  ) => {
    const pos = menuPosition(clientX, clientY, 280, 280);
    const spec = buildActionMenu(target);
    if (!spec) return;
    contextMenu.openActions({
      x: pos.x,
      y: pos.y,
      width: 280,
      maxHeight: 280,
      ariaLabel: spec.title,
      title: spec.title,
      items: spec.items,
    });
  };

  const handleSceneContextMenuRequest = (request: SceneContextMenuRequest) => {
    const selection = args.getSelection();
    if (
      (request.target.kind === "node" ||
        request.target.kind === "label" ||
        request.target.kind === "comment" ||
        request.target.kind === "sheet-port") &&
      selectionContainsContextTarget(selection, request.target)
    ) {
      openActionMenu(request.clientX, request.clientY, { kind: "group" });
      return;
    }

    if (request.target.kind === "node") {
      args.onSelect({ kind: "node", id: request.target.id });
    } else if (request.target.kind === "label") {
      args.onSelect({ kind: "label", id: request.target.id });
    } else if (request.target.kind === "comment") {
      args.onSelect({ kind: "comment", id: request.target.id });
    } else if (request.target.kind === "sheet-port") {
      args.onSelect({ kind: "sheet-port", id: request.target.id });
    } else if (request.target.kind === "wire-connection") {
      args.onSelect({
        kind: "wire-connection",
        id: request.target.connectionId,
      });
    } else {
      args.onSelect({
        kind: "wire-connection",
        id: request.target.connectionId,
      });
    }
    openActionMenu(request.clientX, request.clientY, request.target);
  };

  return {
    openBackgroundMenu,
    handleSceneContextMenuRequest,
  };
}
