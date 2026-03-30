import { isSystemComponent } from "@nohal/core/componentSystem";
import {
  isComponentPlaceable,
  isComponentSearchable,
} from "@nohal/core/componentVisibility";
import { getSheet } from "@nohal/core/graph";
import type {
  ComponentNode,
  SheetDefinition,
  SheetNode,
} from "@nohal/core/types";
import { HiOutlineDocumentDuplicate } from "solid-icons/hi";
import { RiDocumentClipboardLine } from "solid-icons/ri";
import { createMemo } from "solid-js";
import type {
  SceneContextMenuNodeTarget,
  SceneContextMenuRequest,
  SceneContextMenuTarget,
  SheetScene,
} from "../canvas";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";
import type { Selection } from "../state/store";
import CanvasComponentMenu from "./CanvasComponentMenu";
import type { ContextMenuActionItem } from "./ContextMenuProvider";
import { useContextMenu } from "./ContextMenuProvider";

interface UseCanvasContextMenuArgs {
  getHostEl: () => HTMLDivElement;
  getScene: () => SheetScene | null;
}

type SelectionActionItems = {
  copyItem: ContextMenuActionItem;
  moveItem: ContextMenuActionItem;
  deleteItem: ContextMenuActionItem;
};

const CONTEXT_MENU_VIEWPORT_PADDING = 8;

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
  const backgroundMenuItems = (point: {
    x: number;
    y: number;
  }): ContextMenuActionItem[] => [
    {
      label: t("canvasContext.paste"),
      icon: <RiDocumentClipboardLine size={16} aria-hidden="true" />,
      onSelect: () => {
        actions.pasteClipboard(point);
      },
    },
    {
      label: t("topbar.addComponent"),
      onSelect: () => undefined,
      childrenClass: "w-[22rem] overflow-hidden p-3",
      renderChildren: ({ close }) => (
        <CanvasComponentMenu
          components={componentChoices()}
          onAddComponent={(componentId) =>
            actions.addComponentNode(componentId, point)
          }
          onClose={close}
          listClass="max-h-[16rem] overflow-y-auto"
        />
      ),
    },
    {
      label: t("topbar.addSubsheet"),
      onSelect: () => actions.addSheetDefinition(point),
    },
    {
      label: t("topbar.addPort"),
      onSelect: () => undefined,
      children: [
        {
          label: t("topbar.inPortBit"),
          onSelect: () => actions.addSheetPort("in", "bit", point),
        },
        {
          label: t("topbar.outPortBit"),
          onSelect: () => actions.addSheetPort("out", "bit", point),
        },
        {
          label: t("topbar.ioPortFloat"),
          onSelect: () => actions.addSheetPort("io", "float", point),
        },
      ],
    },
    {
      label: t("topbar.addText"),
      onSelect: () => actions.addComment(point),
    },
    {
      label: t("topbar.addLabel"),
      onSelect: () => undefined,
      children: [
        {
          label: t("topbar.localLabel"),
          onSelect: () => actions.addLabel("local", point),
        },
        {
          label: t("topbar.globalLabel"),
          onSelect: () => actions.addLabel("global", point),
        },
      ],
    },
  ];

  const menuPosition = (
    clientX: number,
    clientY: number,
    menuW: number,
    menuH: number,
  ) => {
    const rect = args.getHostEl().getBoundingClientRect();
    const minX = rect.left + CONTEXT_MENU_VIEWPORT_PADDING;
    const minY = rect.top + CONTEXT_MENU_VIEWPORT_PADDING;
    const maxX = rect.right - menuW - CONTEXT_MENU_VIEWPORT_PADDING;
    const maxY = rect.bottom - menuH - CONTEXT_MENU_VIEWPORT_PADDING;
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

  const actionSelectionForTarget = (
    target: SceneContextMenuTarget | { kind: "group" },
  ): Selection => {
    if (target.kind === "group") return state.selection;
    if (
      (target.kind === "node" ||
        target.kind === "label" ||
        target.kind === "comment" ||
        target.kind === "sheet-port") &&
      selectionContainsContextTarget(state.selection, target)
    ) {
      return state.selection;
    }
    if (target.kind === "node") return { kind: "node", id: target.id };
    if (target.kind === "label") return { kind: "label", id: target.id };
    if (target.kind === "comment") return { kind: "comment", id: target.id };
    if (target.kind === "sheet-port")
      return { kind: "sheet-port", id: target.id };
    if (target.kind === "wire-connection") {
      return { kind: "wire-connection", id: target.connectionId };
    }
    return { kind: "wire-connection", id: target.connectionId };
  };

  const moveMenuItemsForSelection = (
    selection: Selection,
  ): ContextMenuActionItem[] => {
    const sheet = currentSheet();
    let selectedNodeIds: Set<string>;
    if (selection?.kind === "node") {
      selectedNodeIds = new Set([selection.id]);
    } else if (selection?.kind === "multi") {
      selectedNodeIds = new Set(selection.nodeIds);
    } else {
      selectedNodeIds = new Set<string>();
    }
    const existingSheetItems = sheet.nodes
      .filter(
        (node): node is SheetNode =>
          node.kind === "sheet" && !selectedNodeIds.has(node.id),
      )
      .map((node): ContextMenuActionItem => {
        const childSheet = state.project.sheets[node.sheetId];
        return {
          label: childSheet?.name ?? node.instanceName,
          meta:
            childSheet && childSheet.name !== node.instanceName
              ? node.instanceName
              : undefined,
          onSelect: () => {
            actions.select(selection);
            actions.moveSelectionIntoSubsheetNode(node.id);
          },
        };
      });

    return [
      ...existingSheetItems,
      {
        label: t("canvasContext.newSheet"),
        onSelect: () => {
          actions.select(selection);
          actions.putSelectionIntoSubsheet();
        },
      },
    ];
  };

  const openBackgroundMenu = (clientX: number, clientY: number) => {
    const width = 280;
    const maxHeight = 320;
    const pos = menuPosition(clientX, clientY, width, maxHeight);
    const point = args.getScene()?.clientToWorld(clientX, clientY) ?? {
      x: 120,
      y: 120,
    };
    contextMenu.openActions({
      x: pos.x,
      y: pos.y,
      width,
      maxHeight,
      ariaLabel: t("canvasComponentMenu.ariaLabel"),
      items: backgroundMenuItems(point),
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

  const splitConnectionIntoLabels = (connectionId: string) => {
    const positions =
      args.getScene()?.getSplitLabelPositionsForConnection(connectionId) ??
      undefined;
    actions.splitDirectConnectionIntoLabels(connectionId, positions);
  };

  const deleteSelectionItem = (
    actionSelection: Selection,
  ): ContextMenuActionItem => ({
    label: t("inspector.deleteSelection"),
    onSelect: () => {
      actions.select(actionSelection);
      actions.removeSelection();
    },
  });

  const copySelectionItem = (
    actionSelection: Selection,
  ): ContextMenuActionItem => ({
    label: t("canvasContext.copy"),
    icon: <HiOutlineDocumentDuplicate size={16} aria-hidden="true" />,
    onSelect: () => {
      actions.select(actionSelection);
      actions.copySelection();
    },
  });

  const moveSelectionItem = (
    actionSelection: Selection,
  ): ContextMenuActionItem => ({
    label: t("canvasContext.move"),
    onSelect: () => undefined,
    closeOnSelect: false,
    children: moveMenuItemsForSelection(actionSelection),
  });

  const buildComponentNodeActionMenu = (
    node: ComponentNode,
    selectionItems: SelectionActionItems,
  ) => {
    const isSystemManagedProtected = Boolean(
      isSystemComponent(state.project.library.components[node.componentId]),
    );
    const entry = state.componentStore.components[node.componentId];
    const canRefreshStoredComponent =
      entry?.sourceRef.kind !== "linuxcnc-builtin";

    return {
      title: t("canvasContext.component"),
      items: [
        isSystemManagedProtected ? null : selectionItems.copyItem,
        isSystemManagedProtected ? null : selectionItems.moveItem,
        isSystemManagedProtected ? null : selectionItems.deleteItem,
        {
          label: t("inspector.openComponentSettings"),
          onSelect: () => editorUi.openComponentEditorForNode(node.id),
        },
        canRefreshStoredComponent
          ? {
              label: t("inspector.refreshComponentDefinition"),
              onSelect: () =>
                void actions.refreshComponentInStore(node.componentId),
            }
          : null,
      ].filter((item): item is ContextMenuActionItem => item !== null),
    };
  };

  const buildSheetNodeActionMenu = (
    node: SheetNode,
    selectionItems: SelectionActionItems,
  ) => {
    return {
      title: t("canvasContext.subsheet"),
      items: [
        selectionItems.copyItem,
        {
          label: t("inspector.enterSubsheet"),
          onSelect: () => editorUi.openComponentEditorForNode(node.id),
        },
        {
          label: t("sidebar.sheetSettings"),
          onSelect: () => editorUi.openSheetSettings(node.sheetId),
        },
        selectionItems.deleteItem,
      ],
    };
  };

  const buildNodeActionMenu = (
    target: SceneContextMenuNodeTarget,
    sheet: SheetDefinition,
    selectionItems: SelectionActionItems,
  ) => {
    const node = sheet.nodes.find((n) => n.id === target.id);
    if (!node) return null;

    if (node.kind === "component") {
      return buildComponentNodeActionMenu(node, selectionItems);
    }

    return buildSheetNodeActionMenu(node, selectionItems);
  };

  const buildActionMenu = (
    target: SceneContextMenuTarget | { kind: "group" },
  ): {
    title: string;
    items: ContextMenuActionItem[];
  } | null => {
    const sheet = currentSheet();
    const actionSelection = actionSelectionForTarget(target);
    const selectionItems: SelectionActionItems = {
      copyItem: copySelectionItem(actionSelection),
      moveItem: moveSelectionItem(actionSelection),
      deleteItem: deleteSelectionItem(actionSelection),
    };
    if (target.kind === "group") {
      return {
        title: t("canvasContext.selection"),
        items: [
          selectionItems.copyItem,
          selectionItems.moveItem,
          selectionItems.deleteItem,
        ],
      };
    }

    if (target.kind === "node") {
      return buildNodeActionMenu(target, sheet, selectionItems);
    }

    if (target.kind === "label") {
      return {
        title: t("canvasContext.label"),
        items: [
          selectionItems.copyItem,
          selectionItems.moveItem,
          selectionItems.deleteItem,
        ],
      };
    }

    if (target.kind === "comment") {
      return {
        title: t("canvasContext.comment"),
        items: [selectionItems.copyItem, selectionItems.deleteItem],
      };
    }

    if (target.kind === "sheet-port") {
      return {
        title: t("canvasContext.sheetPort"),
        items: [selectionItems.copyItem, selectionItems.deleteItem],
      };
    }

    if (target.kind === "wire-connection") {
      return {
        title: t("canvasContext.connection"),
        items: [
          {
            label: t("canvasContext.splitConnectionIntoLabels"),
            onSelect: () => splitConnectionIntoLabels(target.connectionId),
          },
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
          label: t("canvasContext.splitConnectionIntoLabels"),
          onSelect: () => splitConnectionIntoLabels(target.connectionId),
        },
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
    const spec = buildActionMenu(target);
    if (!spec) return;
    const width = 280;
    const maxHeight = 280;
    const pos = menuPosition(clientX, clientY, width, maxHeight);
    contextMenu.openActions({
      x: pos.x,
      y: pos.y,
      width,
      maxHeight,
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
