import { isSystemComponent } from "@nohal/core/src/componentSystem";
import {
  isComponentPlaceable,
  isComponentSearchable,
} from "@nohal/core/src/componentVisibility";
import { getSheet } from "@nohal/core/src/graph";
import { createMemo } from "solid-js";
import type { KonvaSheetScene } from "../canvas/konvaSheetScene";
import type {
  SceneContextMenuRequest,
  SceneContextMenuTarget,
} from "../canvas/konvaSheetSceneTypes";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";
import type { Selection } from "../state/store";
import CanvasComponentMenu from "./CanvasComponentMenu";
import { useContextMenu } from "./ContextMenuProvider";

interface UseCanvasContextMenuArgs {
  getHostEl: () => HTMLDivElement;
  getScene: () => KonvaSheetScene | null;
}

export function useCanvasContextMenu(args: UseCanvasContextMenuArgs) {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();
  const contextMenu = useContextMenu();
  const currentSheet = () => getSheet(state.project, state.activeSheetId);

  const componentChoices = createMemo(() =>
    Object.values(state.project.library.components)
      .filter(
        (component) =>
          isComponentPlaceable(component) && isComponentSearchable(component),
      )
      .sort((a, b) => a.halComponentName.localeCompare(b.halComponentName)),
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
            actions.addComponentNode(componentId, { x: world.x, y: world.y })
          }
          onClose={close}
        />
      ),
    });
  };

  const deleteWaypoint = (connectionId: string, waypointIndex: number) => {
    const conn = currentSheet().directConnections.find(
      (c) => c.id === connectionId,
    );
    if (!conn?.waypoints) return;
    if (waypointIndex < 0 || waypointIndex >= conn.waypoints.length) return;
    const next = conn.waypoints.filter((_, idx) => idx !== waypointIndex);
    actions.updateDirectConnectionWaypoints(
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
    const sheet = currentSheet();
    if (target.kind === "group") {
      return {
        title: t("canvasContext.selection"),
        items: [
          {
            label: t("canvasContext.putEverythingIntoSubsheet"),
            onSelect: () => actions.putSelectionIntoSubsheet(),
          },
          {
            label: t("inspector.deleteSelection"),
            onSelect: () => actions.removeSelection(),
          },
        ],
      };
    }

    if (target.kind === "node") {
      const node = sheet.nodes.find((n) => n.id === target.id);
      if (!node) return null;
      if (target.nodeKind === "component" && node.kind === "component") {
        const isSystemManagedProtected = Boolean(
          isSystemComponent(state.project.library.components[node.componentId]),
        );
        const canRefreshStoredComponent = (() => {
          const entry = state.componentStore.components[node.componentId];
          if (!entry) return false;
          return entry.sourceRef.kind !== "linuxcnc-builtin";
        })();
        const componentItems = [
          {
            label: t("inspector.openComponentSettings"),
            onSelect: () => editorUi.openComponentEditorForNode(node.id),
          },
          ...(canRefreshStoredComponent
            ? [
                {
                  label: t("inspector.refreshComponentDefinition"),
                  onSelect: () =>
                    void actions.refreshComponentInStore(node.componentId),
                },
              ]
            : []),
          ...(isSystemManagedProtected
            ? []
            : [
                {
                  label: t("inspector.deleteSelection"),
                  onSelect: () => {
                    actions.select({ kind: "node", id: node.id });
                    actions.removeSelection();
                  },
                },
              ]),
        ];
        return {
          title: t("canvasContext.component"),
          items: componentItems,
        };
      }
      return {
        title: t("canvasContext.subsheet"),
        items: [
          {
            label: t("inspector.enterSubsheet"),
            onSelect: () => editorUi.openComponentEditorForNode(node.id),
          },
          {
            label: t("inspector.deleteSelection"),
            onSelect: () => {
              actions.select({ kind: "node", id: node.id });
              actions.removeSelection();
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
              actions.select({ kind: "label", id: target.id });
              actions.removeSelection();
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
              actions.select({ kind: "comment", id: target.id });
              actions.removeSelection();
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
              actions.select({ kind: "sheet-port", id: target.id });
              actions.removeSelection();
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
            onSelect: () => actions.removeDirectConnection(target.connectionId),
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
          onSelect: () => actions.removeDirectConnection(target.connectionId),
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
    const selection = state.selection;
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
      actions.select({ kind: "node", id: request.target.id });
    } else if (request.target.kind === "label") {
      actions.select({ kind: "label", id: request.target.id });
    } else if (request.target.kind === "comment") {
      actions.select({ kind: "comment", id: request.target.id });
    } else if (request.target.kind === "sheet-port") {
      actions.select({ kind: "sheet-port", id: request.target.id });
    } else if (request.target.kind === "wire-connection") {
      actions.select({
        kind: "wire-connection",
        id: request.target.connectionId,
      });
    } else {
      actions.select({
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
