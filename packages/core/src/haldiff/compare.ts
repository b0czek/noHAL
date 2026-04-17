import { sortBy } from "remeda";
import type { HalImportDraft } from "../types";
import { buildHalNetworkGraph } from "./graph";
import type {
  BestEffortMatch,
  HalGraphAttachment,
  HalGraphComponent,
  HalGraphSignal,
  HalNetworkGraph,
  NormalizedSignalDescriptor,
} from "./internal";
import { MIN_OVERLAP_SCORE, UNMAPPED_COMPONENT_PREFIX } from "./internal";
import {
  buildComponentCandidates,
  canSupportExactSearch,
  refineComparableGraphColors,
  searchExactComponentMapping,
  shouldAttemptExactSearch,
} from "./refinement";
import type {
  HalComponentMatch,
  HalDiffConnectionSummary,
  HalNetworkComparison,
  HalNetworkComponentSummary,
  HalSignalComparison,
} from "./types";
import {
  attachmentKey,
  collectCountMap,
  nameSimilarityScore,
  sharedPinCount,
  sortConnections,
  uniqueSorted,
  valuesKey,
} from "./utils";

const MAX_BUCKET_ASSIGNMENT_SIZE = 15;
const MIN_COMPONENT_MATCH_SCORE = 100;
const COMPONENT_TYPE_MATCH_SCORE = 80;
const COMPONENT_TYPE_MISMATCH_PENALTY = 40;
const BASE_SIGNATURE_MATCH_SCORE = 120;
const SHARED_PIN_MATCH_SCORE = 40;
const NAME_SIMILARITY_MATCH_SCORE = 25;
const DEGREE_GAP_PENALTY = 10;
const ANCHORED_NEIGHBOR_MATCH_SCORE = 150;

function filterPreferredCandidatesByComponentType(args: {
  beforeGraph: HalNetworkGraph;
  afterGraph: HalNetworkGraph;
  candidates: Map<string, string[]>;
}): Map<string, string[]> {
  const filtered = new Map<string, string[]>();

  for (const [beforeId, candidateIds] of args.candidates) {
    const beforeType =
      args.beforeGraph.components.get(beforeId)?.componentType ?? "";
    if (!beforeType) {
      filtered.set(beforeId, [...candidateIds]);
      continue;
    }
    const sameTypeCandidates = candidateIds.filter(
      (afterId) =>
        (args.afterGraph.components.get(afterId)?.componentType ?? "") ===
        beforeType,
    );
    filtered.set(
      beforeId,
      sameTypeCandidates.length > 0 ? sameTypeCandidates : [...candidateIds],
    );
  }

  return filtered;
}

function buildReverseCandidates(
  candidates: Map<string, string[]>,
  unresolvedBeforeIds: string[],
  availableAfterIds: Set<string>,
): Map<string, string[]> {
  const reverse = new Map<string, string[]>();

  for (const beforeId of unresolvedBeforeIds) {
    for (const afterId of candidates.get(beforeId) ?? []) {
      if (!availableAfterIds.has(afterId)) continue;
      const existing = reverse.get(afterId);
      if (existing) existing.push(beforeId);
      else reverse.set(afterId, [beforeId]);
    }
  }

  return reverse;
}

function buildHeuristicCandidates(args: {
  beforeGraph: HalNetworkGraph;
  afterGraph: HalNetworkGraph;
  beforeBaseSignatures: Map<string, string>;
  afterBaseSignatures: Map<string, string>;
  preferredCandidates: Map<string, string[]>;
  availableAfterIds: Set<string>;
  mapping: Map<string, string>;
}): Map<string, string[]> {
  const heuristicCandidates = new Map<string, string[]>();

  for (const [beforeId, beforeComponent] of args.beforeGraph.components) {
    if (args.mapping.has(beforeId)) continue;

    const preferred = (args.preferredCandidates.get(beforeId) ?? []).filter(
      (afterId) => args.availableAfterIds.has(afterId),
    );
    if (preferred.length > 0) {
      heuristicCandidates.set(beforeId, preferred);
      continue;
    }

    const beforeType = beforeComponent.componentType ?? "";
    const typedAfterIds = sortBy(
      [...args.availableAfterIds].filter((afterId) => {
        const afterType =
          args.afterGraph.components.get(afterId)?.componentType ?? "";
        return beforeType && afterType === beforeType;
      }),
      (afterId) => afterId,
    );
    const broadCandidates =
      typedAfterIds.length > 0 ? typedAfterIds : [...args.availableAfterIds];
    const filtered = broadCandidates.filter((afterId) => {
      const afterComponent = args.afterGraph.components.get(afterId);
      if (!afterComponent) return false;
      return (
        args.beforeBaseSignatures.get(beforeId) ===
          args.afterBaseSignatures.get(afterId) ||
        sharedPinCount(beforeComponent, afterComponent) > 0 ||
        nameSimilarityScore(beforeId, afterId) > 0
      );
    });

    heuristicCandidates.set(
      beforeId,
      filtered.length > 0 ? filtered : broadCandidates,
    );
  }

  return heuristicCandidates;
}

function buildReverseMapping(
  mapping: Map<string, string>,
): Map<string, string> {
  const reverse = new Map<string, string>();
  for (const [beforeId, afterId] of mapping) {
    reverse.set(afterId, beforeId);
  }
  return reverse;
}

function collectAnchoredNeighborKeysForBefore(args: {
  graph: HalNetworkGraph;
  componentId: string;
  mapping: Map<string, string>;
}): string[] {
  const component = args.graph.components.get(args.componentId);
  if (!component) return [];

  const anchoredKeys = new Set<string>();
  for (const attachment of component.attachments) {
    const signal = args.graph.signals.get(attachment.signalId);
    if (!signal) continue;
    for (const neighbor of signal.attachments) {
      if (
        neighbor.componentId === args.componentId &&
        neighbor.pinName === attachment.pinName
      ) {
        continue;
      }
      const mappedNeighborId = args.mapping.get(neighbor.componentId);
      if (!mappedNeighborId) continue;
      anchoredKeys.add(attachmentKey(mappedNeighborId, neighbor.pinName));
    }
  }

  return [...anchoredKeys];
}

function collectAnchoredNeighborKeysForAfter(args: {
  graph: HalNetworkGraph;
  componentId: string;
  reverseMapping: Map<string, string>;
}): string[] {
  const component = args.graph.components.get(args.componentId);
  if (!component) return [];

  const anchoredKeys = new Set<string>();
  for (const attachment of component.attachments) {
    const signal = args.graph.signals.get(attachment.signalId);
    if (!signal) continue;
    for (const neighbor of signal.attachments) {
      if (
        neighbor.componentId === args.componentId &&
        neighbor.pinName === attachment.pinName
      ) {
        continue;
      }
      if (!args.reverseMapping.has(neighbor.componentId)) continue;
      anchoredKeys.add(attachmentKey(neighbor.componentId, neighbor.pinName));
    }
  }

  return [...anchoredKeys];
}

function intersectCount(left: string[], right: string[]): number {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value)).length;
}

function heuristicComponentMatchScore(args: {
  beforeGraph: HalNetworkGraph;
  afterGraph: HalNetworkGraph;
  beforeId: string;
  afterId: string;
  beforeBaseSignatures: Map<string, string>;
  afterBaseSignatures: Map<string, string>;
  mapping: Map<string, string>;
}): number {
  const beforeComponent = args.beforeGraph.components.get(args.beforeId);
  const afterComponent = args.afterGraph.components.get(args.afterId);
  if (!beforeComponent || !afterComponent) return Number.NEGATIVE_INFINITY;

  let score = 0;
  if (
    (beforeComponent.componentType ?? "") ===
    (afterComponent.componentType ?? "")
  ) {
    score += COMPONENT_TYPE_MATCH_SCORE;
  } else if (beforeComponent.componentType && afterComponent.componentType) {
    score -= COMPONENT_TYPE_MISMATCH_PENALTY;
  }
  if (
    args.beforeBaseSignatures.get(args.beforeId) ===
    args.afterBaseSignatures.get(args.afterId)
  ) {
    score += BASE_SIGNATURE_MATCH_SCORE;
  }

  score +=
    sharedPinCount(beforeComponent, afterComponent) * SHARED_PIN_MATCH_SCORE;
  score +=
    nameSimilarityScore(args.beforeId, args.afterId) *
    NAME_SIMILARITY_MATCH_SCORE;
  score -=
    Math.abs(
      beforeComponent.attachments.length - afterComponent.attachments.length,
    ) * DEGREE_GAP_PENALTY;

  const reverseMapping = buildReverseMapping(args.mapping);
  score +=
    intersectCount(
      collectAnchoredNeighborKeysForBefore({
        graph: args.beforeGraph,
        componentId: args.beforeId,
        mapping: args.mapping,
      }),
      collectAnchoredNeighborKeysForAfter({
        graph: args.afterGraph,
        componentId: args.afterId,
        reverseMapping,
      }),
    ) * ANCHORED_NEIGHBOR_MATCH_SCORE;

  return score;
}

function assignForcedCandidateMatches(args: {
  candidates: Map<string, string[]>;
  mapping: Map<string, string>;
  availableAfterIds: Set<string>;
  confidences: Map<string, HalComponentMatch["confidence"]>;
}): void {
  while (true) {
    const unresolvedBeforeIds = [...args.candidates.keys()].filter(
      (beforeId) => !args.mapping.has(beforeId),
    );
    const reverse = buildReverseCandidates(
      args.candidates,
      unresolvedBeforeIds,
      args.availableAfterIds,
    );
    let changed = false;

    for (const beforeId of sortBy(unresolvedBeforeIds, (id) => id)) {
      const availableCandidates = (args.candidates.get(beforeId) ?? []).filter(
        (afterId) => args.availableAfterIds.has(afterId),
      );
      if (availableCandidates.length !== 1) continue;

      const [afterId] = availableCandidates;
      if (!afterId) continue;
      if ((reverse.get(afterId) ?? []).length !== 1) continue;

      args.mapping.set(beforeId, afterId);
      args.availableAfterIds.delete(afterId);
      args.confidences.set(beforeId, "unique");
      changed = true;
    }

    if (!changed) return;
  }
}

function buildCandidateBuckets(args: {
  candidates: Map<string, string[]>;
  mapping: Map<string, string>;
  availableAfterIds: Set<string>;
}): Array<{ beforeIds: string[]; afterIds: string[] }> {
  const availableCandidates = (beforeId: string): string[] =>
    (args.candidates.get(beforeId) ?? []).filter((afterId) =>
      args.availableAfterIds.has(afterId),
    );
  const unresolvedBeforeIds = [...args.candidates.keys()].filter(
    (beforeId) => !args.mapping.has(beforeId),
  );
  const reverse = buildReverseCandidates(
    args.candidates,
    unresolvedBeforeIds,
    args.availableAfterIds,
  );
  const visitedBefore = new Set<string>();
  const visitedAfter = new Set<string>();
  const buckets: Array<{ beforeIds: string[]; afterIds: string[] }> = [];

  const collectBucket = (
    startBeforeId: string,
  ): { beforeIds: string[]; afterIds: string[] } => {
    const beforeIds = new Set<string>();
    const afterIds = new Set<string>();
    const beforeQueue = [startBeforeId];

    while (beforeQueue.length > 0) {
      const beforeId = beforeQueue.pop();
      if (!beforeId || visitedBefore.has(beforeId)) continue;
      visitedBefore.add(beforeId);
      beforeIds.add(beforeId);

      for (const afterId of availableCandidates(beforeId)) {
        if (visitedAfter.has(afterId)) continue;
        visitedAfter.add(afterId);
        afterIds.add(afterId);
        for (const linkedBeforeId of reverse.get(afterId) ?? []) {
          if (!visitedBefore.has(linkedBeforeId))
            beforeQueue.push(linkedBeforeId);
        }
      }
    }

    return {
      beforeIds: sortBy([...beforeIds], (id) => id),
      afterIds: sortBy([...afterIds], (id) => id),
    };
  };

  for (const startBeforeId of unresolvedBeforeIds) {
    if (visitedBefore.has(startBeforeId)) continue;
    if (availableCandidates(startBeforeId).length === 0) continue;
    buckets.push(collectBucket(startBeforeId));
  }

  return sortBy(
    buckets,
    (bucket) => bucket.afterIds.length,
    (bucket) => bucket.beforeIds.length,
    (bucket) => bucket.beforeIds[0] ?? "",
  );
}

function solveBucketByDynamicProgramming(args: {
  beforeIds: string[];
  afterIds: string[];
  candidates: Map<string, string[]>;
  scoreForPair: (beforeId: string, afterId: string) => number;
}): Map<string, string> {
  if (
    args.beforeIds.length === 0 ||
    args.afterIds.length === 0 ||
    args.afterIds.length > MAX_BUCKET_ASSIGNMENT_SIZE
  ) {
    return new Map();
  }

  const afterIndexById = new Map(
    args.afterIds.map((afterId, index) => [afterId, index] as const),
  );
  const memo = new Map<
    string,
    { score: number; picks: Array<string | null> }
  >();

  const solve = (
    beforeIndex: number,
    usedMask: number,
  ): { score: number; picks: Array<string | null> } => {
    const key = `${beforeIndex}:${usedMask}`;
    const cached = memo.get(key);
    if (cached) return cached;
    if (beforeIndex >= args.beforeIds.length) {
      return { score: 0, picks: [] };
    }

    const beforeId = args.beforeIds[beforeIndex];
    if (!beforeId) return { score: 0, picks: [] };

    let best = solve(beforeIndex + 1, usedMask);
    best = { score: best.score, picks: [null, ...best.picks] };

    for (const afterId of args.candidates.get(beforeId) ?? []) {
      const afterIndex = afterIndexById.get(afterId);
      if (afterIndex == null || (usedMask & (1 << afterIndex)) !== 0) continue;

      const pairScore = args.scoreForPair(beforeId, afterId);
      if (pairScore < MIN_COMPONENT_MATCH_SCORE) continue;

      const next = solve(beforeIndex + 1, usedMask | (1 << afterIndex));
      const score = pairScore + next.score;
      if (score <= best.score) continue;
      best = { score, picks: [afterId, ...next.picks] };
    }

    memo.set(key, best);
    return best;
  };

  const solution = solve(0, 0);
  return new Map(
    solution.picks.flatMap((afterId, index) => {
      const beforeId = args.beforeIds[index];
      return beforeId && afterId ? [[beforeId, afterId] as const] : [];
    }),
  );
}

function solveBucketGreedily(args: {
  beforeIds: string[];
  afterIds: string[];
  candidates: Map<string, string[]>;
  scoreForPair: (beforeId: string, afterId: string) => number;
}): Map<string, string> {
  const usedAfterIds = new Set<string>();
  const mapping = new Map<string, string>();

  for (const beforeId of args.beforeIds) {
    let bestAfterId: string | undefined;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const afterId of args.candidates.get(beforeId) ?? []) {
      if (!args.afterIds.includes(afterId) || usedAfterIds.has(afterId))
        continue;
      const score = args.scoreForPair(beforeId, afterId);
      if (score <= bestScore) continue;
      bestScore = score;
      bestAfterId = afterId;
    }
    if (!bestAfterId || bestScore < MIN_COMPONENT_MATCH_SCORE) continue;
    usedAfterIds.add(bestAfterId);
    mapping.set(beforeId, bestAfterId);
  }

  return mapping;
}

function buildBestEffortMapping(args: {
  beforeGraph: HalNetworkGraph;
  afterGraph: HalNetworkGraph;
  beforeColors: Map<string, string>;
  afterColors: Map<string, string>;
  beforeBaseSignatures: Map<string, string>;
  afterBaseSignatures: Map<string, string>;
  candidates: Map<string, string[]>;
  exactMapping?: Map<string, string> | null;
}): BestEffortMatch {
  if (args.exactMapping) {
    const confidences = new Map<string, HalComponentMatch["confidence"]>();
    const beforeColorCounts = collectCountMap(args.beforeColors.values());
    const afterColorCounts = collectCountMap(args.afterColors.values());
    for (const [beforeId] of args.exactMapping) {
      const color = args.beforeColors.get(beforeId) ?? "";
      const beforeCount = beforeColorCounts.get(color) ?? 0;
      const afterCount = afterColorCounts.get(color) ?? 0;
      const confidence =
        beforeCount === 1 && afterCount === 1 ? "unique" : "search";
      confidences.set(beforeId, confidence);
    }
    return {
      mapping: new Map(args.exactMapping),
      confidences,
    };
  }

  const filteredCandidates = filterPreferredCandidatesByComponentType({
    beforeGraph: args.beforeGraph,
    afterGraph: args.afterGraph,
    candidates: args.candidates,
  });
  const mapping = new Map<string, string>();
  const confidences = new Map<string, HalComponentMatch["confidence"]>();
  const availableAfterIds = new Set(args.afterGraph.components.keys());
  assignForcedCandidateMatches({
    candidates: filteredCandidates,
    mapping,
    availableAfterIds,
    confidences,
  });

  const heuristicCandidates = buildHeuristicCandidates({
    beforeGraph: args.beforeGraph,
    afterGraph: args.afterGraph,
    beforeBaseSignatures: args.beforeBaseSignatures,
    afterBaseSignatures: args.afterBaseSignatures,
    preferredCandidates: filteredCandidates,
    availableAfterIds,
    mapping,
  });

  for (const bucket of buildCandidateBuckets({
    candidates: heuristicCandidates,
    mapping,
    availableAfterIds,
  })) {
    const scoreForPair = (beforeId: string, afterId: string) =>
      heuristicComponentMatchScore({
        beforeGraph: args.beforeGraph,
        afterGraph: args.afterGraph,
        beforeId,
        afterId,
        beforeBaseSignatures: args.beforeBaseSignatures,
        afterBaseSignatures: args.afterBaseSignatures,
        mapping,
      });

    const bucketMapping =
      bucket.afterIds.length <= MAX_BUCKET_ASSIGNMENT_SIZE
        ? solveBucketByDynamicProgramming({
            beforeIds: bucket.beforeIds,
            afterIds: bucket.afterIds,
            candidates: heuristicCandidates,
            scoreForPair,
          })
        : solveBucketGreedily({
            beforeIds: bucket.beforeIds,
            afterIds: bucket.afterIds,
            candidates: heuristicCandidates,
            scoreForPair,
          });

    for (const [beforeId, afterId] of bucketMapping) {
      if (!availableAfterIds.has(afterId) || mapping.has(beforeId)) continue;
      mapping.set(beforeId, afterId);
      confidences.set(beforeId, "fallback");
      availableAfterIds.delete(afterId);
    }
  }

  return { mapping, confidences };
}

function summarizeComponent(
  component: HalGraphComponent,
): HalNetworkComponentSummary {
  return {
    instanceName: component.instanceName,
    ...(component.componentType
      ? { componentType: component.componentType }
      : {}),
    pinNames: uniqueSorted(
      component.attachments.map((attachment) => attachment.pinName),
    ),
    degree: component.attachments.length,
  };
}

function summarizeAttachment(
  graph: HalNetworkGraph,
  attachment: HalGraphAttachment,
  mappedComponentInstanceName?: string,
): HalDiffConnectionSummary {
  const component = graph.components.get(attachment.componentId);
  return {
    componentInstanceName: attachment.componentId,
    ...(component?.componentType
      ? { componentType: component.componentType }
      : {}),
    pinName: attachment.pinName,
    ...(mappedComponentInstanceName ? { mappedComponentInstanceName } : {}),
  };
}

function normalizeBeforeSignalDescriptor(
  signal: HalGraphSignal,
  beforeGraph: HalNetworkGraph,
  mapping: Map<string, string>,
): NormalizedSignalDescriptor {
  const connections = sortConnections(
    signal.attachments.map((attachment) => {
      const mappedComponentId = mapping.get(attachment.componentId);
      return summarizeAttachment(beforeGraph, attachment, mappedComponentId);
    }),
  );
  const normalizedKeys = uniqueSorted(
    signal.attachments.map((attachment) => {
      const mappedComponentId =
        mapping.get(attachment.componentId) ??
        `${UNMAPPED_COMPONENT_PREFIX}${attachment.componentId}`;
      return attachmentKey(mappedComponentId, attachment.pinName);
    }),
  );

  return {
    signalName: signal.signalName,
    normalizedKeys,
    connections,
  };
}

function normalizeAfterSignalDescriptor(
  signal: HalGraphSignal,
  afterGraph: HalNetworkGraph,
  reverseMapping: Map<string, string>,
): NormalizedSignalDescriptor {
  const connections = sortConnections(
    signal.attachments.map((attachment) =>
      summarizeAttachment(
        afterGraph,
        attachment,
        reverseMapping.get(attachment.componentId),
      ),
    ),
  );
  const normalizedKeys = uniqueSorted(
    signal.attachments.map((attachment) =>
      attachmentKey(attachment.componentId, attachment.pinName),
    ),
  );

  return {
    signalName: signal.signalName,
    normalizedKeys,
    connections,
  };
}

function compareNormalizedSignals(
  beforeSignal: NormalizedSignalDescriptor,
  afterSignal: NormalizedSignalDescriptor,
): HalSignalComparison {
  const afterKeySet = new Set(afterSignal.normalizedKeys);
  const beforeKeySet = new Set(beforeSignal.normalizedKeys);
  const missingConnections = sortConnections(
    beforeSignal.connections.filter((connection) => {
      const mappedComponentId =
        connection.mappedComponentInstanceName ??
        `${UNMAPPED_COMPONENT_PREFIX}${connection.componentInstanceName}`;
      return !afterKeySet.has(
        attachmentKey(mappedComponentId, connection.pinName),
      );
    }),
  );
  const extraConnections = sortConnections(
    afterSignal.connections.filter(
      (connection) =>
        !beforeKeySet.has(
          attachmentKey(connection.componentInstanceName, connection.pinName),
        ),
    ),
  );

  return {
    beforeSignalName: beforeSignal.signalName,
    afterSignalName: afterSignal.signalName,
    equivalent:
      missingConnections.length === 0 && extraConnections.length === 0,
    beforeConnections: beforeSignal.connections,
    afterConnections: afterSignal.connections,
    missingConnections,
    extraConnections,
  };
}

function signalOverlapScore(
  beforeSignal: NormalizedSignalDescriptor,
  afterSignal: NormalizedSignalDescriptor,
): number {
  const afterKeySet = new Set(afterSignal.normalizedKeys);
  return beforeSignal.normalizedKeys.filter((key) => afterKeySet.has(key))
    .length;
}

function pairSignals(args: {
  beforeGraph: HalNetworkGraph;
  afterGraph: HalNetworkGraph;
  mapping: Map<string, string>;
}): {
  matchedSignals: HalSignalComparison[];
  differingSignals: HalSignalComparison[];
  unmatchedBeforeSignals: HalSignalComparison[];
  unmatchedAfterSignals: HalSignalComparison[];
} {
  const reverseMapping = new Map<string, string>();
  for (const [beforeId, afterId] of args.mapping) {
    reverseMapping.set(afterId, beforeId);
  }

  const beforeSignals = sortBy(
    [...args.beforeGraph.signals.values()].map((signal) =>
      normalizeBeforeSignalDescriptor(signal, args.beforeGraph, args.mapping),
    ),
    (signal) => signal.signalName,
  );
  const afterSignals = sortBy(
    [...args.afterGraph.signals.values()].map((signal) =>
      normalizeAfterSignalDescriptor(signal, args.afterGraph, reverseMapping),
    ),
    (signal) => signal.signalName,
  );

  const matchedSignals: HalSignalComparison[] = [];
  const differingSignals: HalSignalComparison[] = [];
  const unmatchedBeforeSignals: HalSignalComparison[] = [];
  const unmatchedAfterSignals: HalSignalComparison[] = [];
  const usedAfterIndices = new Set<number>();

  for (const beforeSignal of beforeSignals) {
    const exactAfterIndex = afterSignals.findIndex(
      (afterSignal, index) =>
        !usedAfterIndices.has(index) &&
        valuesKey(afterSignal.normalizedKeys) ===
          valuesKey(beforeSignal.normalizedKeys),
    );
    if (exactAfterIndex < 0) continue;
    usedAfterIndices.add(exactAfterIndex);
    matchedSignals.push(
      compareNormalizedSignals(beforeSignal, afterSignals[exactAfterIndex]),
    );
  }

  const remainingBefore = beforeSignals.filter(
    (beforeSignal) =>
      !matchedSignals.some(
        (matchedSignal) =>
          matchedSignal.beforeSignalName === beforeSignal.signalName,
      ),
  );

  for (const beforeSignal of remainingBefore) {
    let bestAfterIndex = -1;
    let bestScore = 0;
    for (const [index, afterSignal] of afterSignals.entries()) {
      if (usedAfterIndices.has(index)) continue;
      const score = signalOverlapScore(beforeSignal, afterSignal);
      if (score <= bestScore) continue;
      bestScore = score;
      bestAfterIndex = index;
    }

    if (bestAfterIndex >= 0 && bestScore >= MIN_OVERLAP_SCORE) {
      usedAfterIndices.add(bestAfterIndex);
      differingSignals.push(
        compareNormalizedSignals(beforeSignal, afterSignals[bestAfterIndex]),
      );
      continue;
    }

    unmatchedBeforeSignals.push({
      beforeSignalName: beforeSignal.signalName,
      equivalent: false,
      beforeConnections: beforeSignal.connections,
      afterConnections: [],
      missingConnections: beforeSignal.connections,
      extraConnections: [],
    });
  }

  for (const [index, afterSignal] of afterSignals.entries()) {
    if (usedAfterIndices.has(index)) continue;
    unmatchedAfterSignals.push({
      afterSignalName: afterSignal.signalName,
      equivalent: false,
      beforeConnections: [],
      afterConnections: afterSignal.connections,
      missingConnections: [],
      extraConnections: afterSignal.connections,
    });
  }

  return {
    matchedSignals,
    differingSignals,
    unmatchedBeforeSignals,
    unmatchedAfterSignals,
  };
}

export function compareHalNetworks(
  beforeDraft: HalImportDraft,
  afterDraft: HalImportDraft,
): HalNetworkComparison {
  const beforeGraph = buildHalNetworkGraph(beforeDraft);
  const afterGraph = buildHalNetworkGraph(afterDraft);
  const comparableColors = refineComparableGraphColors({
    beforeGraph,
    afterGraph,
  });
  const beforeColors = comparableColors.before;
  const afterColors = comparableColors.after;
  const warnings = [...beforeDraft.warnings, ...afterDraft.warnings];
  const invariants = canSupportExactSearch(
    beforeGraph,
    afterGraph,
    beforeColors.componentColors,
    afterColors.componentColors,
    beforeColors.signalColors,
    afterColors.signalColors,
  );

  const exactCandidates = buildComponentCandidates(
    beforeGraph,
    afterGraph,
    beforeColors.componentColors,
    afterColors.componentColors,
  );
  const exactSearchGate = shouldAttemptExactSearch(exactCandidates);

  const exactSearch =
    invariants.length === 0 && exactSearchGate.allowed
      ? searchExactComponentMapping({
          beforeGraph,
          afterGraph,
          candidates: exactCandidates,
        })
      : { mapping: null, warnings: [] };
  if (exactSearchGate.warning) warnings.push(exactSearchGate.warning);
  warnings.push(...exactSearch.warnings);

  const bestEffort = buildBestEffortMapping({
    beforeGraph,
    afterGraph,
    beforeColors: beforeColors.componentColors,
    afterColors: afterColors.componentColors,
    beforeBaseSignatures: beforeColors.componentBaseSignatures,
    afterBaseSignatures: afterColors.componentBaseSignatures,
    candidates: exactCandidates,
    exactMapping: exactSearch.mapping,
  });

  const signalPairs = pairSignals({
    beforeGraph,
    afterGraph,
    mapping: bestEffort.mapping,
  });

  const matchedComponents = sortBy(
    [...bestEffort.mapping.entries()].map(([beforeId, afterId]) => ({
      beforeInstanceName: beforeId,
      afterInstanceName: afterId,
      ...(beforeGraph.components.get(beforeId)?.componentType
        ? { componentType: beforeGraph.components.get(beforeId)?.componentType }
        : {}),
      confidence: bestEffort.confidences.get(beforeId) ?? "fallback",
    })),
    (match) => match.componentType ?? "",
    (match) => match.beforeInstanceName,
  );

  const matchedBeforeIds = new Set(bestEffort.mapping.keys());
  const matchedAfterIds = new Set(bestEffort.mapping.values());
  const unmatchedBeforeComponents = sortBy(
    [...beforeGraph.components.values()]
      .filter((component) => !matchedBeforeIds.has(component.id))
      .map(summarizeComponent),
    (component) => component.componentType ?? "",
    (component) => component.instanceName,
  );
  const unmatchedAfterComponents = sortBy(
    [...afterGraph.components.values()]
      .filter((component) => !matchedAfterIds.has(component.id))
      .map(summarizeComponent),
    (component) => component.componentType ?? "",
    (component) => component.instanceName,
  );

  const equivalent =
    exactSearch.mapping !== null &&
    signalPairs.differingSignals.length === 0 &&
    signalPairs.unmatchedBeforeSignals.length === 0 &&
    signalPairs.unmatchedAfterSignals.length === 0 &&
    unmatchedBeforeComponents.length === 0 &&
    unmatchedAfterComponents.length === 0;

  return {
    equivalent,
    beforeSummary: {
      componentCount: beforeGraph.components.size,
      signalCount: beforeGraph.signals.size,
    },
    afterSummary: {
      componentCount: afterGraph.components.size,
      signalCount: afterGraph.signals.size,
    },
    invariants,
    matchedComponents,
    unmatchedBeforeComponents,
    unmatchedAfterComponents,
    matchedSignals: signalPairs.matchedSignals,
    differingSignals: signalPairs.differingSignals,
    unmatchedBeforeSignals: signalPairs.unmatchedBeforeSignals,
    unmatchedAfterSignals: signalPairs.unmatchedAfterSignals,
    warnings,
  };
}
