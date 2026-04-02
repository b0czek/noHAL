import type { HalImportPlacementHeuristic, Size, XY } from "../../types";
import { buildGroup, buildLayout } from "./constants";
import type { ImportNodeLayoutMetrics } from "./geometry";
import type { ImportPreparedNet } from "./layoutTypes";

interface PlannedNodeGrid extends Size {
  localPosByNodeId: Map<string, XY>;
}

function buildPlacementGraph(nodeIds: string[]) {
  const adjacency = new Map<string, Map<string, number>>();
  const weightedDegreeByNodeId = new Map<string, number>();

  for (const nodeId of nodeIds) {
    adjacency.set(nodeId, new Map());
    weightedDegreeByNodeId.set(nodeId, 0);
  }

  const addEdge = (a: string, b: string, weight: number) => {
    if (a === b || weight <= 0) return;
    const aMap = adjacency.get(a);
    const bMap = adjacency.get(b);
    if (!aMap || !bMap) return;
    aMap.set(b, (aMap.get(b) ?? 0) + weight);
    bMap.set(a, (bMap.get(a) ?? 0) + weight);
    weightedDegreeByNodeId.set(
      a,
      (weightedDegreeByNodeId.get(a) ?? 0) + weight,
    );
    weightedDegreeByNodeId.set(
      b,
      (weightedDegreeByNodeId.get(b) ?? 0) + weight,
    );
  };

  return { adjacency, weightedDegreeByNodeId, addEdge };
}

function connectPlacementGraphForNet(
  prepared: ImportPreparedNet,
  addEdge: (a: string, b: string, weight: number) => void,
): void {
  const uniqueNodeIds = Array.from(
    new Set(prepared.resolvedEndpoints.map((endpoint) => endpoint.nodeId)),
  );
  if (
    uniqueNodeIds.length < 2 ||
    uniqueNodeIds.length > buildGroup.maxNetFanout
  ) {
    return;
  }

  const edgeWeight = 1 / Math.max(1, uniqueNodeIds.length - 1);
  for (let index = 0; index < uniqueNodeIds.length; index += 1) {
    const a = uniqueNodeIds[index];
    if (!a) continue;
    for (
      let peerIndex = index + 1;
      peerIndex < uniqueNodeIds.length;
      peerIndex += 1
    ) {
      const b = uniqueNodeIds[peerIndex];
      if (!b) continue;
      addEdge(a, b, edgeWeight);
    }
  }
}

function orderConnectedComponent(args: {
  componentNodeIds: string[];
  compareNodeInstanceNames: (a: string, b: string) => number;
  getEdgeWeight: (a: string, b: string) => number;
  weightedDegreeByNodeId: Map<string, number>;
}): string[] {
  const {
    componentNodeIds,
    compareNodeInstanceNames,
    getEdgeWeight,
    weightedDegreeByNodeId,
  } = args;
  if (componentNodeIds.length <= 2) {
    return [...componentNodeIds].sort(compareNodeInstanceNames);
  }

  const remaining = new Set(componentNodeIds);
  const ordered: string[] = [];
  let lastPlacedId: string | undefined;

  const pickBestCandidate = (candidates: string[]) =>
    [...candidates].sort((a, b) => {
      const sumToPlaced = (candidate: string) => {
        let sum = 0;
        for (const placed of ordered) {
          sum += getEdgeWeight(candidate, placed);
        }
        return sum;
      };

      const aSum = sumToPlaced(a);
      const bSum = sumToPlaced(b);
      if (aSum !== bSum) return bSum - aSum;

      const aLast = lastPlacedId ? getEdgeWeight(a, lastPlacedId) : 0;
      const bLast = lastPlacedId ? getEdgeWeight(b, lastPlacedId) : 0;
      if (aLast !== bLast) return bLast - aLast;

      const aDegree = weightedDegreeByNodeId.get(a) ?? 0;
      const bDegree = weightedDegreeByNodeId.get(b) ?? 0;
      if (aDegree !== bDegree) return bDegree - aDegree;

      return compareNodeInstanceNames(a, b);
    })[0];

  const seed = [...remaining].sort((a, b) => {
    const aDegree = weightedDegreeByNodeId.get(a) ?? 0;
    const bDegree = weightedDegreeByNodeId.get(b) ?? 0;
    if (aDegree !== bDegree) return bDegree - aDegree;
    return compareNodeInstanceNames(a, b);
  })[0];

  if (seed) {
    ordered.push(seed);
    remaining.delete(seed);
    lastPlacedId = seed;
  }

  while (remaining.size > 0) {
    const allCandidates = [...remaining];
    const frontierCandidates = allCandidates.filter((candidate) => {
      for (const placed of ordered) {
        if (getEdgeWeight(candidate, placed) > 0) return true;
      }
      return false;
    });
    const next =
      pickBestCandidate(
        frontierCandidates.length > 0 ? frontierCandidates : allCandidates,
      ) ?? allCandidates.sort(compareNodeInstanceNames)[0];
    if (!next) break;
    ordered.push(next);
    remaining.delete(next);
    lastPlacedId = next;
  }

  return ordered;
}

function collectConnectedComponents(args: {
  alphabeticalNodeIds: string[];
  adjacency: Map<string, Map<string, number>>;
  compareNodeInstanceNames: (a: string, b: string) => number;
  getEdgeWeight: (a: string, b: string) => number;
  weightedDegreeByNodeId: Map<string, number>;
}): string[][] {
  const connectedComponents: string[][] = [];
  const seen = new Set<string>();

  for (const start of args.alphabeticalNodeIds) {
    if (seen.has(start)) continue;

    const queue = [start];
    seen.add(start);
    const componentNodeIds: string[] = [];
    while (queue.length > 0) {
      const nodeId = queue.shift();
      if (!nodeId) continue;
      componentNodeIds.push(nodeId);
      const neighbors = args.adjacency.get(nodeId);
      if (!neighbors) continue;
      for (const neighborId of neighbors.keys()) {
        if (seen.has(neighborId)) continue;
        seen.add(neighborId);
        queue.push(neighborId);
      }
    }

    connectedComponents.push(
      orderConnectedComponent({
        componentNodeIds,
        compareNodeInstanceNames: args.compareNodeInstanceNames,
        getEdgeWeight: args.getEdgeWeight,
        weightedDegreeByNodeId: args.weightedDegreeByNodeId,
      }),
    );
  }

  return connectedComponents;
}

function mergeIsolatedPlacementGroups(
  connectedComponents: string[][],
  compareNodeInstanceNames: (a: string, b: string) => number,
): string[][] {
  const isolatedGroups = connectedComponents.filter(
    (group) => group.length <= 1,
  );
  const connectedGroups = connectedComponents.filter(
    (group) => group.length > 1,
  );
  if (isolatedGroups.length > 1) {
    connectedGroups.push(isolatedGroups.flat().sort(compareNodeInstanceNames));
  } else if (isolatedGroups.length === 1) {
    connectedGroups.push(isolatedGroups[0] ?? []);
  }
  return connectedGroups.filter((group) => group.length > 0);
}

export function buildPlacementNodeGroups(options: {
  alphabeticalNodeIds: string[];
  compareNodeInstanceNames: (a: string, b: string) => number;
  placementHeuristic: HalImportPlacementHeuristic;
  preparedNets: ImportPreparedNet[];
}): string[][] {
  const {
    alphabeticalNodeIds,
    compareNodeInstanceNames,
    placementHeuristic,
    preparedNets,
  } = options;

  if (
    alphabeticalNodeIds.length <= 1 ||
    placementHeuristic === "alphabetical"
  ) {
    return [alphabeticalNodeIds];
  }

  const { adjacency, weightedDegreeByNodeId, addEdge } =
    buildPlacementGraph(alphabeticalNodeIds);
  for (const prepared of preparedNets) {
    connectPlacementGraphForNet(prepared, addEdge);
  }

  const getEdgeWeight = (a: string, b: string) => adjacency.get(a)?.get(b) ?? 0;
  const connectedComponents = collectConnectedComponents({
    alphabeticalNodeIds,
    adjacency,
    compareNodeInstanceNames,
    getEdgeWeight,
    weightedDegreeByNodeId,
  });

  connectedComponents.sort((a, b) => {
    if (a.length !== b.length) return b.length - a.length;

    const aScore = a.reduce(
      (sum, nodeId) => sum + (weightedDegreeByNodeId.get(nodeId) ?? 0),
      0,
    );
    const bScore = b.reduce(
      (sum, nodeId) => sum + (weightedDegreeByNodeId.get(nodeId) ?? 0),
      0,
    );
    if (aScore !== bScore) return bScore - aScore;

    return compareNodeInstanceNames(a[0] ?? "", b[0] ?? "");
  });

  return mergeIsolatedPlacementGroups(
    connectedComponents,
    compareNodeInstanceNames,
  );
}

export function planNodeGrid(
  orderedNodeIds: string[],
  importNodeLayoutById: Map<string, ImportNodeLayoutMetrics>,
): PlannedNodeGrid {
  const computedColumns = Math.max(
    1,
    Math.min(
      buildLayout.maxColumns,
      Math.ceil(Math.sqrt(Math.max(1, orderedNodeIds.length))),
    ),
  );
  const colWidths = Array.from({ length: computedColumns }, () => 0);
  const rowHeights = Array.from(
    { length: Math.ceil(orderedNodeIds.length / computedColumns) },
    () => 0,
  );

  orderedNodeIds.forEach((nodeId, index) => {
    const layout = importNodeLayoutById.get(nodeId);
    if (!layout) return;
    const col = index % computedColumns;
    const row = Math.floor(index / computedColumns);
    colWidths[col] = Math.max(colWidths[col] ?? 0, layout.cellWidth);
    rowHeights[row] = Math.max(rowHeights[row] ?? 0, layout.cellHeight);
  });

  const colStarts: number[] = [];
  let runningX = 0;
  for (const width of colWidths) {
    colStarts.push(runningX);
    runningX += width + buildLayout.gap.column;
  }

  const rowStarts: number[] = [];
  let runningY = 0;
  for (const height of rowHeights) {
    rowStarts.push(runningY);
    runningY += height + buildLayout.gap.row;
  }

  const localPosByNodeId = new Map<string, XY>();
  orderedNodeIds.forEach((nodeId, index) => {
    const layout = importNodeLayoutById.get(nodeId);
    if (!layout) return;
    const col = index % computedColumns;
    const row = Math.floor(index / computedColumns);
    localPosByNodeId.set(nodeId, {
      x: (colStarts[col] ?? 0) + layout.leftLaneWidth,
      y: rowStarts[row] ?? 0,
    });
  });

  const width =
    colWidths.reduce((sum, value) => sum + value, 0) +
    Math.max(0, colWidths.length - 1) * buildLayout.gap.column;
  const height =
    rowHeights.reduce((sum, value) => sum + value, 0) +
    Math.max(0, rowHeights.length - 1) * buildLayout.gap.row;

  return { localPosByNodeId, width, height };
}
