import type {
  ComponentNode,
  ComponentPinDefinition,
  HalImportPlacementHeuristic,
  SheetDefinition,
  XY,
} from "../../types";
import { buildGroup, buildLabel, buildLayout, buildNode } from "./constants";
import {
  computeEstimatedBodySize,
  estimateImportedLabelWidth,
  type ImportNodeLayoutMetrics,
} from "./geometry";
import type {
  ImportedLabelPositionResolver,
  ImportPreparedEndpoint,
  ImportPreparedNet,
} from "./layoutTypes";
import {
  directionsCompatibleForDirectImport,
  importPinDirectionToSide,
} from "./matching";
import { buildPlacementNodeGroups, planNodeGrid } from "./placement";

type ImportNodeSide = "left" | "right" | "bottom";

interface ImportLabelDemand {
  left: string[];
  right: string[];
  bottom: string[];
}

interface ImportPlannedLabel {
  anchorKey: string;
  netName: string;
  netLine: number;
  nodeId: string;
  pinKey: string;
  side: ImportNodeSide;
}

interface ImportLabelPlacementInfo {
  slot: number;
  pinSideIndex?: number;
  peerIndexOnPin: number;
  peerCountOnPin: number;
  bottomStackOffsetY?: number;
}

function planDirectConnectionEdgesForNet(options: {
  prepared: ImportPreparedNet;
  placementHeuristic: HalImportPlacementHeuristic;
  placementClusterIndexByNodeId: Map<string, number>;
  netNameUsageCount: Map<string, number>;
}): Array<{ a: ImportPreparedEndpoint; b: ImportPreparedEndpoint }> {
  const endpoints = options.prepared.resolvedEndpoints;
  if (endpoints.length < 2) return [];

  const singleLineNet =
    (options.netNameUsageCount.get(options.prepared.net.name) ?? 0) === 1;
  if (endpoints.length === 2) {
    const [a, b] = endpoints;
    if (
      singleLineNet &&
      directionsCompatibleForDirectImport(a?.direction, b?.direction)
    ) {
      return a && b ? [{ a, b }] : [];
    }
  }

  if (options.placementHeuristic !== "related-groups") return [];

  const uniqueNodeIds = Array.from(
    new Set(endpoints.map((item) => item.nodeId)),
  );
  if (uniqueNodeIds.length < 2) return [];
  const clusterId = options.placementClusterIndexByNodeId.get(
    uniqueNodeIds[0] ?? "",
  );
  if (clusterId === undefined) return [];
  if (
    uniqueNodeIds.some(
      (nodeId) =>
        options.placementClusterIndexByNodeId.get(nodeId) !== clusterId,
    )
  ) {
    return [];
  }

  return buildClusterDirectConnectionEdges(endpoints);
}

function buildClusterDirectConnectionEdges(
  endpoints: ImportPreparedEndpoint[],
): Array<{ a: ImportPreparedEndpoint; b: ImportPreparedEndpoint }> {
  const outEndpoints = endpoints.filter((item) => item.direction === "out");
  const ioEndpoints = endpoints.filter((item) => item.direction === "io");
  const inEndpoints = endpoints.filter((item) => item.direction === "in");

  if (ioEndpoints.length === 0 && outEndpoints.length === 0) return [];
  if (ioEndpoints.length === 0 && outEndpoints.length > 1) return [];

  const root =
    (outEndpoints.length === 1 ? outEndpoints[0] : undefined) ??
    ioEndpoints[0] ??
    outEndpoints[0];
  if (!root) return [];

  const edges: Array<{ a: ImportPreparedEndpoint; b: ImportPreparedEndpoint }> =
    [];
  for (const endpoint of [...ioEndpoints, ...outEndpoints, ...inEndpoints]) {
    if (endpoint === root) continue;
    if (
      !directionsCompatibleForDirectImport(root.direction, endpoint.direction)
    ) {
      return [];
    }
    edges.push({ a: root, b: endpoint });
  }
  return edges;
}

function buildPinSideIndexMap(options: {
  nodeIds: string[];
  resolvedPinsByNodeId: Map<string, ComponentPinDefinition[]>;
}): Map<string, number> {
  const pinSideIndexByNodePin = new Map<string, number>();

  for (const nodeId of options.nodeIds) {
    const pins = options.resolvedPinsByNodeId.get(nodeId);
    if (!pins) continue;
    let leftIndex = 0;
    let rightIndex = 0;
    let bottomIndex = 0;
    for (const pin of pins) {
      const key = `${nodeId}::${pin.key}`;
      if (pin.direction === "in") {
        pinSideIndexByNodePin.set(key, leftIndex);
        leftIndex += 1;
        continue;
      }
      if (pin.direction === "out") {
        pinSideIndexByNodePin.set(key, rightIndex);
        rightIndex += 1;
        continue;
      }
      pinSideIndexByNodePin.set(key, bottomIndex);
      bottomIndex += 1;
    }
  }

  return pinSideIndexByNodePin;
}

function applyRelatedGroupLayout(args: {
  placementNodeGroups: string[][];
  importNodeLayoutById: Map<string, ImportNodeLayoutMetrics>;
  nodeRefById: Map<string, ComponentNode>;
}): void {
  const groupPlans = args.placementNodeGroups.map((groupNodeIds) => ({
    nodeIds: groupNodeIds,
    ...planNodeGrid(groupNodeIds, args.importNodeLayoutById),
  }));
  const totalArea = groupPlans.reduce(
    (sum, group) => sum + Math.max(1, group.width) * Math.max(1, group.height),
    0,
  );
  const targetRowWidth = Math.max(
    buildGroup.row.widthMin,
    Math.ceil(Math.sqrt(Math.max(1, totalArea)) * buildGroup.row.widthBias),
  );

  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;
  for (const group of groupPlans) {
    if (
      cursorX > 0 &&
      cursorX + group.width > targetRowWidth &&
      rowHeight > 0
    ) {
      cursorX = 0;
      cursorY += rowHeight + buildGroup.gap.y;
      rowHeight = 0;
    }

    for (const nodeId of group.nodeIds) {
      const node = args.nodeRefById.get(nodeId);
      const localPos = group.localPosByNodeId.get(nodeId);
      if (!node || !localPos) continue;
      node.position = {
        x: buildLayout.origin.x + cursorX + localPos.x,
        y: buildLayout.origin.y + cursorY + localPos.y,
      };
    }

    cursorX += group.width + buildGroup.gap.x;
    rowHeight = Math.max(rowHeight, group.height);
  }
}

function applyGridLayout(args: {
  nodeIds: string[];
  importNodeLayoutById: Map<string, ImportNodeLayoutMetrics>;
  nodeRefById: Map<string, ComponentNode>;
}): void {
  const gridPlan = planNodeGrid(args.nodeIds, args.importNodeLayoutById);
  for (const nodeId of args.nodeIds) {
    const node = args.nodeRefById.get(nodeId);
    const localPos = gridPlan.localPosByNodeId.get(nodeId);
    if (!node || !localPos) continue;
    node.position = {
      x: buildLayout.origin.x + localPos.x,
      y: buildLayout.origin.y + localPos.y,
    };
  }
}

function buildLabelPlacementMaps(options: {
  preparedNets: ImportPreparedNet[];
  pinSideIndexByNodePin: Map<string, number>;
}): {
  labelDemandByNodeId: Map<string, ImportLabelDemand>;
  plannedLabelsByNodeSide: Map<string, ImportPlannedLabel[]>;
  labelPlacementByAnchorKey: Map<string, ImportLabelPlacementInfo>;
} {
  const labelDemandByNodeId = new Map<string, ImportLabelDemand>();
  const plannedImportedLabels: ImportPlannedLabel[] = [];
  const countedDemandAnchors = new Set<string>();

  for (const prepared of options.preparedNets) {
    if (prepared.directConnectionEdges.length > 0) continue;
    for (const item of prepared.resolvedEndpoints) {
      const dedupeKey = `${prepared.net.name}::${item.nodeId}::${item.pinKey}`;
      if (countedDemandAnchors.has(dedupeKey)) continue;
      countedDemandAnchors.add(dedupeKey);

      const side = importPinDirectionToSide(item.direction);
      plannedImportedLabels.push({
        anchorKey: dedupeKey,
        netName: prepared.net.name,
        netLine: prepared.net.line,
        nodeId: item.nodeId,
        pinKey: item.pinKey,
        side,
      });

      let demand = labelDemandByNodeId.get(item.nodeId);
      if (!demand) {
        demand = { left: [], right: [], bottom: [] };
        labelDemandByNodeId.set(item.nodeId, demand);
      }
      demand[side].push(prepared.net.name);
    }
  }

  const labelPlacementByAnchorKey = new Map<string, ImportLabelPlacementInfo>();
  const plannedLabelsByNodeSide = new Map<string, ImportPlannedLabel[]>();
  for (const planned of plannedImportedLabels) {
    const groupKey = `${planned.nodeId}:${planned.side}`;
    const list = plannedLabelsByNodeSide.get(groupKey);
    if (list) list.push(planned);
    else plannedLabelsByNodeSide.set(groupKey, [planned]);
  }

  for (const [groupKey, list] of plannedLabelsByNodeSide.entries()) {
    list.sort((a, b) => {
      const aPinIndex =
        options.pinSideIndexByNodePin.get(`${a.nodeId}::${a.pinKey}`) ??
        buildLabel.pinSortFallbackIndex;
      const bPinIndex =
        options.pinSideIndexByNodePin.get(`${b.nodeId}::${b.pinKey}`) ??
        buildLabel.pinSortFallbackIndex;
      if (aPinIndex !== bPinIndex) return aPinIndex - bPinIndex;

      const pinCompare = a.pinKey.localeCompare(b.pinKey);
      if (pinCompare !== 0) return pinCompare;

      const netCompare = a.netName.localeCompare(b.netName);
      if (netCompare !== 0) return netCompare;

      return a.netLine - b.netLine;
    });

    const byPin = new Map<string, ImportPlannedLabel[]>();
    for (const item of list) {
      const pinList = byPin.get(item.pinKey);
      if (pinList) pinList.push(item);
      else byPin.set(item.pinKey, [item]);
    }

    list.forEach((item, slot) => {
      const siblings = byPin.get(item.pinKey) ?? [item];
      const peerIndex = siblings.findIndex(
        (sibling) => sibling.anchorKey === item.anchorKey,
      );

      let bottomStackOffsetY: number | undefined;
      if (item.side === "bottom") {
        bottomStackOffsetY = 0;
        for (let index = 0; index < peerIndex; index += 1) {
          const previous = siblings[index];
          if (!previous) continue;
          bottomStackOffsetY += estimateImportedLabelWidth(previous.netName);
          bottomStackOffsetY += buildLayout.bottomLabel.gapY;
        }
      }

      labelPlacementByAnchorKey.set(item.anchorKey, {
        slot,
        pinSideIndex: options.pinSideIndexByNodePin.get(
          `${item.nodeId}::${item.pinKey}`,
        ),
        peerIndexOnPin: Math.max(0, peerIndex),
        peerCountOnPin: siblings.length,
        ...(bottomStackOffsetY !== undefined ? { bottomStackOffsetY } : {}),
      });
    });

    const groupSide = groupKey.slice(
      groupKey.lastIndexOf(":") + 1,
    ) as ImportNodeSide;
    if (groupSide === "bottom") {
      // Bottom placement uses slot order; side labels additionally use pin-aligned Y.
    }
  }

  return {
    labelDemandByNodeId,
    plannedLabelsByNodeSide,
    labelPlacementByAnchorKey,
  };
}

function buildNodeLayoutMetrics(options: {
  nodeIdsInOrder: string[];
  resolvedPinsByNodeId: Map<string, ComponentPinDefinition[]>;
  labelDemandByNodeId: Map<string, ImportLabelDemand>;
  plannedLabelsByNodeSide: Map<string, ImportPlannedLabel[]>;
  labelPlacementByAnchorKey: Map<string, ImportLabelPlacementInfo>;
}): Map<string, ImportNodeLayoutMetrics> {
  const importNodeLayoutById = new Map<string, ImportNodeLayoutMetrics>();

  for (const nodeId of options.nodeIdsInOrder) {
    const pins = options.resolvedPinsByNodeId.get(nodeId);
    if (!pins) continue;

    const demand = options.labelDemandByNodeId.get(nodeId) ?? {
      left: [],
      right: [],
      bottom: [],
    };
    const { bodyWidth, bodyHeight } = computeEstimatedBodySize(pins);
    const leftLabelWidths = demand.left.map(estimateImportedLabelWidth);
    const rightLabelWidths = demand.right.map(estimateImportedLabelWidth);
    const bottomPlannedLabels =
      options.plannedLabelsByNodeSide.get(`${nodeId}:bottom`) ?? [];
    const bottomPinCount = pins.filter((pin) => pin.direction === "io").length;

    const leftLaneWidth =
      leftLabelWidths.length > 0
        ? Math.max(...leftLabelWidths) + buildLayout.sideLabel.gapX
        : 0;
    const sideRightOffsetX = bodyWidth + buildLayout.sideLabel.gapX;
    const rightLaneWidth =
      rightLabelWidths.length > 0
        ? Math.max(...rightLabelWidths) + buildLayout.sideLabel.gapX
        : 0;

    let bottomExtraRight = 0;
    for (const item of bottomPlannedLabels) {
      const placement = options.labelPlacementByAnchorKey.get(item.anchorKey);
      const pinIndex = placement?.pinSideIndex;
      const xStart =
        pinIndex !== undefined && bottomPinCount > 0
          ? (bodyWidth / (bottomPinCount + 1)) * (pinIndex + 1)
          : buildLayout.bottomLabel.startX +
            ((placement?.slot ?? 0) % buildLayout.bottomLabel.perRow) *
              buildLayout.bottomLabel.stepX;
      bottomExtraRight = Math.max(
        bottomExtraRight,
        xStart + buildLayout.bottomLabel.halfHeight - bodyWidth,
      );
    }

    const leftStackHeight =
      demand.left.length > 0
        ? buildLayout.sideLabel.startY +
          (demand.left.length - 1) * buildLayout.sideLabel.stepY +
          buildLayout.sideLabel.halfHeight
        : 0;
    const rightStackHeight =
      demand.right.length > 0
        ? buildLayout.sideLabel.startY +
          (demand.right.length - 1) * buildLayout.sideLabel.stepY +
          buildLayout.sideLabel.halfHeight
        : 0;
    const sideStackHeight = Math.max(leftStackHeight, rightStackHeight);

    let bottomStackMaxHeight = 0;
    for (const item of bottomPlannedLabels) {
      const placement = options.labelPlacementByAnchorKey.get(item.anchorKey);
      const stackOffsetY = placement?.bottomStackOffsetY ?? 0;
      bottomStackMaxHeight = Math.max(
        bottomStackMaxHeight,
        stackOffsetY + estimateImportedLabelWidth(item.netName),
      );
    }
    const bottomLabelBottomY =
      bottomStackMaxHeight > 0
        ? bodyHeight + buildLayout.bottomLabel.gapY + bottomStackMaxHeight
        : 0;

    const rightExtent = Math.max(rightLaneWidth, bottomExtraRight, 0);
    const cellWidth = leftLaneWidth + bodyWidth + rightExtent;
    const cellHeight = Math.max(
      bodyHeight,
      sideStackHeight,
      bottomLabelBottomY,
    );

    importNodeLayoutById.set(nodeId, {
      bodyWidth,
      bodyHeight,
      leftLaneWidth,
      rightLaneWidth: rightExtent,
      sideRightOffsetX,
      sideLabelGapX: buildLayout.sideLabel.gapX,
      sideLabelStartY: buildLayout.sideLabel.startY,
      sideLabelStepY: buildLayout.sideLabel.stepY,
      bottomLabelStartX: buildLayout.bottomLabel.startX,
      bottomLabelGapY: buildLayout.bottomLabel.gapY,
      bottomLabelStepX: buildLayout.bottomLabel.stepX,
      bottomLabelStepY: buildLayout.bottomLabel.stepY,
      bottomLabelsPerRow: buildLayout.bottomLabel.perRow,
      bottomPinCount,
      cellWidth,
      cellHeight,
    });
  }

  return importNodeLayoutById;
}

export function buildImportedSheetLayoutPlan(options: {
  rootSheet: SheetDefinition;
  resolvedPinsByNodeId: Map<string, ComponentPinDefinition[]>;
  preparedNets: ImportPreparedNet[];
  nodeInstanceNameById: Map<string, string>;
  placementHeuristic: HalImportPlacementHeuristic;
}): ImportedLabelPositionResolver {
  const netNameUsageCount = new Map<string, number>();
  for (const prepared of options.preparedNets) {
    netNameUsageCount.set(
      prepared.net.name,
      (netNameUsageCount.get(prepared.net.name) ?? 0) + 1,
    );
  }

  const compareNodeInstanceNames = (a: string, b: string) =>
    (options.nodeInstanceNameById.get(a) ?? a).localeCompare(
      options.nodeInstanceNameById.get(b) ?? b,
    );
  const alphabeticalNodeIds = options.rootSheet.nodes
    .filter((node) => node.kind === "component")
    .map((node) => node.id)
    .sort(compareNodeInstanceNames);
  const nodeRefById = new Map(
    options.rootSheet.nodes
      .filter((node) => node.kind === "component")
      .map((node) => [node.id, node]),
  );

  const placementNodeGroups = buildPlacementNodeGroups({
    alphabeticalNodeIds,
    compareNodeInstanceNames,
    placementHeuristic: options.placementHeuristic,
    preparedNets: options.preparedNets,
  });
  const placementClusterIndexByNodeId = new Map<string, number>();
  placementNodeGroups.forEach((groupNodeIds, groupIndex) => {
    for (const nodeId of groupNodeIds) {
      placementClusterIndexByNodeId.set(nodeId, groupIndex);
    }
  });

  for (const prepared of options.preparedNets) {
    prepared.directConnectionEdges = planDirectConnectionEdgesForNet({
      prepared,
      placementHeuristic: options.placementHeuristic,
      placementClusterIndexByNodeId,
      netNameUsageCount,
    });
  }

  const pinSideIndexByNodePin = buildPinSideIndexMap({
    nodeIds: alphabeticalNodeIds,
    resolvedPinsByNodeId: options.resolvedPinsByNodeId,
  });

  const {
    labelDemandByNodeId,
    plannedLabelsByNodeSide,
    labelPlacementByAnchorKey,
  } = buildLabelPlacementMaps({
    preparedNets: options.preparedNets,
    pinSideIndexByNodePin,
  });
  const importNodeLayoutById = buildNodeLayoutMetrics({
    nodeIdsInOrder: alphabeticalNodeIds,
    resolvedPinsByNodeId: options.resolvedPinsByNodeId,
    labelDemandByNodeId,
    plannedLabelsByNodeSide,
    labelPlacementByAnchorKey,
  });

  if (options.placementHeuristic === "related-groups") {
    applyRelatedGroupLayout({
      placementNodeGroups,
      importNodeLayoutById,
      nodeRefById,
    });
  } else {
    applyGridLayout({
      nodeIds: alphabeticalNodeIds,
      importNodeLayoutById,
      nodeRefById,
    });
  }

  const nodePosById = new Map(
    options.rootSheet.nodes
      .filter((node) => node.kind === "component")
      .map((node) => [node.id, node.position]),
  );

  const resolveSideLabelPosition = (options: {
    pos: XY;
    layout: ImportNodeLayoutMetrics;
    placement: ImportLabelPlacementInfo | undefined;
    slot: number;
    labelName: string;
    side: "left" | "right";
  }) => {
    const pinCenterY =
      options.placement?.pinSideIndex !== undefined
        ? options.pos.y +
          buildNode.header.height +
          options.placement.pinSideIndex * buildNode.side.rowHeight +
          buildNode.side.rowHeight / 2
        : options.pos.y +
          options.layout.sideLabelStartY +
          options.slot * options.layout.sideLabelStepY;
    const duplicateOffset =
      options.placement && options.placement.peerCountOnPin > 1
        ? (options.placement.peerIndexOnPin -
            (options.placement.peerCountOnPin - 1) / 2) *
          buildLabel.duplicateOffset
        : 0;

    return {
      x:
        options.side === "left"
          ? options.pos.x -
            options.layout.sideLabelGapX -
            estimateImportedLabelWidth(options.labelName)
          : options.pos.x + options.layout.sideRightOffsetX,
      y: pinCenterY + duplicateOffset,
    };
  };

  return (nodeId, direction, labelName, pinKey, netIndex, endpointIndex) => {
    const pos = nodePosById.get(nodeId);
    const layout = importNodeLayoutById.get(nodeId);
    if (!pos || !layout) {
      return {
        x:
          buildLayout.fallbackLabel.origin.x +
          (netIndex % buildLabel.fallback.columns) *
            buildLayout.fallbackLabel.pitch.column,
        y:
          buildLayout.fallbackLabel.origin.y +
          Math.floor(netIndex / buildLabel.fallback.columns) *
            buildLayout.fallbackLabel.pitch.row +
          endpointIndex * buildLabel.fallback.rowJitter,
      };
    }

    const side = importPinDirectionToSide(direction);
    const anchorKey = `${labelName}::${nodeId}::${pinKey}`;
    const placement = labelPlacementByAnchorKey.get(anchorKey);
    const slot = placement?.slot ?? endpointIndex;

    if (side === "left") {
      return resolveSideLabelPosition({
        pos,
        layout,
        placement,
        slot,
        labelName,
        side: "left",
      });
    }

    if (side === "right") {
      return resolveSideLabelPosition({
        pos,
        layout,
        placement,
        slot,
        labelName,
        side: "right",
      });
    }

    return {
      x:
        pos.x +
        (placement?.pinSideIndex !== undefined && layout.bottomPinCount > 0
          ? (layout.bodyWidth / (layout.bottomPinCount + 1)) *
            (placement.pinSideIndex + 1)
          : layout.bottomLabelStartX +
            (slot % layout.bottomLabelsPerRow) * layout.bottomLabelStepX),
      y:
        pos.y +
        layout.bodyHeight +
        layout.bottomLabelGapY +
        (placement?.bottomStackOffsetY ??
          Math.floor(slot / layout.bottomLabelsPerRow) *
            layout.bottomLabelStepY),
    };
  };
}
