import { sortBy } from "remeda";
import type {
  HalGraphColorState,
  HalGraphSignal,
  HalNetworkGraph,
  IndexedGraph,
  SearchResult,
} from "./internal";
import { SEARCH_STEP_LIMIT } from "./internal";
import {
  attachmentKey,
  collectCountMap,
  compareCountMaps,
  compressComparableColorSignatures,
  intersectStringLists,
  partitionStateKey,
  uniqueSorted,
  valuesKey,
} from "./utils";

function componentBaseSignature(component: {
  attachments: Array<{ pinName: string }>;
}): string {
  return JSON.stringify({
    kind: "component",
    degree: component.attachments.length,
    pinNames: component.attachments.map((attachment) => attachment.pinName),
  });
}

function signalBaseSignature(signal: {
  attachments: Array<{ pinName: string }>;
}): string {
  return JSON.stringify({
    kind: "signal",
    degree: signal.attachments.length,
    pinNames: signal.attachments.map((attachment) => attachment.pinName),
  });
}

function buildBaseColorState(graph: HalNetworkGraph): {
  componentBaseSignatures: Map<string, string>;
  signalBaseSignatures: Map<string, string>;
  initialComponentSignatures: Map<string, string>;
  initialSignalSignatures: Map<string, string>;
} {
  const componentBaseSignatures = new Map<string, string>();
  const signalBaseSignatures = new Map<string, string>();
  const initialComponentSignatures = new Map<string, string>();
  const initialSignalSignatures = new Map<string, string>();

  for (const [componentId, component] of graph.components) {
    const signature = componentBaseSignature(component);
    componentBaseSignatures.set(componentId, signature);
    initialComponentSignatures.set(componentId, signature);
  }
  for (const [signalId, signal] of graph.signals) {
    const signature = signalBaseSignature(signal);
    signalBaseSignatures.set(signalId, signature);
    initialSignalSignatures.set(signalId, signature);
  }

  return {
    componentBaseSignatures,
    signalBaseSignatures,
    initialComponentSignatures,
    initialSignalSignatures,
  };
}

export function refineComparableGraphColors(graphs: {
  beforeGraph: HalNetworkGraph;
  afterGraph: HalNetworkGraph;
}): { before: HalGraphColorState; after: HalGraphColorState } {
  const beforeBase = buildBaseColorState(graphs.beforeGraph);
  const afterBase = buildBaseColorState(graphs.afterGraph);

  let componentColors = compressComparableColorSignatures(
    beforeBase.initialComponentSignatures,
    afterBase.initialComponentSignatures,
    "c",
  );
  let signalColors = compressComparableColorSignatures(
    beforeBase.initialSignalSignatures,
    afterBase.initialSignalSignatures,
    "s",
  );
  let changed = true;

  while (changed) {
    changed = false;
    const beforeNextComponentSignatures = new Map<string, string>();
    const afterNextComponentSignatures = new Map<string, string>();
    const beforeNextSignalSignatures = new Map<string, string>();
    const afterNextSignalSignatures = new Map<string, string>();

    const refineComponentSignatures = (args: {
      graph: HalNetworkGraph;
      componentBaseSignatures: Map<string, string>;
      signalColors: Map<string, string>;
      out: Map<string, string>;
    }) => {
      for (const [componentId, component] of args.graph.components) {
        const signature = JSON.stringify({
          base: args.componentBaseSignatures.get(componentId) ?? "",
          neighbors: component.attachments.map((attachment) => [
            attachment.pinName,
            args.signalColors.get(attachment.signalId) ?? "",
          ]),
        });
        args.out.set(componentId, signature);
      }
    };

    refineComponentSignatures({
      graph: graphs.beforeGraph,
      componentBaseSignatures: beforeBase.componentBaseSignatures,
      signalColors: signalColors.left,
      out: beforeNextComponentSignatures,
    });
    refineComponentSignatures({
      graph: graphs.afterGraph,
      componentBaseSignatures: afterBase.componentBaseSignatures,
      signalColors: signalColors.right,
      out: afterNextComponentSignatures,
    });

    const nextComponentColors = compressComparableColorSignatures(
      beforeNextComponentSignatures,
      afterNextComponentSignatures,
      "c",
    );

    const refineSignalSignatures = (args: {
      graph: HalNetworkGraph;
      signalBaseSignatures: Map<string, string>;
      componentColors: Map<string, string>;
      out: Map<string, string>;
    }) => {
      for (const [signalId, signal] of args.graph.signals) {
        const signature = JSON.stringify({
          base: args.signalBaseSignatures.get(signalId) ?? "",
          neighbors: signal.attachments.map((attachment) => [
            attachment.pinName,
            args.componentColors.get(attachment.componentId) ?? "",
          ]),
        });
        args.out.set(signalId, signature);
      }
    };

    refineSignalSignatures({
      graph: graphs.beforeGraph,
      signalBaseSignatures: beforeBase.signalBaseSignatures,
      componentColors: nextComponentColors.left,
      out: beforeNextSignalSignatures,
    });
    refineSignalSignatures({
      graph: graphs.afterGraph,
      signalBaseSignatures: afterBase.signalBaseSignatures,
      componentColors: nextComponentColors.right,
      out: afterNextSignalSignatures,
    });

    const nextSignalColors = compressComparableColorSignatures(
      beforeNextSignalSignatures,
      afterNextSignalSignatures,
      "s",
    );

    changed =
      partitionStateKey(nextComponentColors.left) !==
        partitionStateKey(componentColors.left) ||
      partitionStateKey(nextComponentColors.right) !==
        partitionStateKey(componentColors.right) ||
      partitionStateKey(nextSignalColors.left) !==
        partitionStateKey(signalColors.left) ||
      partitionStateKey(nextSignalColors.right) !==
        partitionStateKey(signalColors.right);
    componentColors = nextComponentColors;
    signalColors = nextSignalColors;
  }

  return {
    before: {
      componentBaseSignatures: beforeBase.componentBaseSignatures,
      signalBaseSignatures: beforeBase.signalBaseSignatures,
      componentColors: componentColors.left,
      signalColors: signalColors.left,
    },
    after: {
      componentBaseSignatures: afterBase.componentBaseSignatures,
      signalBaseSignatures: afterBase.signalBaseSignatures,
      componentColors: componentColors.right,
      signalColors: signalColors.right,
    },
  };
}

export function indexGraph(graph: HalNetworkGraph): IndexedGraph {
  const signalIdsByAttachmentKey = new Map<string, string[]>();
  for (const [signalId, signal] of graph.signals) {
    for (const attachment of signal.attachments) {
      const key = attachmentKey(attachment.componentId, attachment.pinName);
      const existing = signalIdsByAttachmentKey.get(key);
      if (existing) existing.push(signalId);
      else signalIdsByAttachmentKey.set(key, [signalId]);
    }
  }
  for (const [key, signalIds] of signalIdsByAttachmentKey) {
    signalIdsByAttachmentKey.set(
      key,
      signalIds.sort((left, right) => left.localeCompare(right)),
    );
  }
  return { signalIdsByAttachmentKey };
}

export function buildComponentCandidates(
  beforeGraph: HalNetworkGraph,
  afterGraph: HalNetworkGraph,
  beforeColors: Map<string, string>,
  afterColors: Map<string, string>,
): Map<string, string[]> {
  const afterByColor = new Map<string, string[]>();
  for (const [componentId, color] of afterColors) {
    const existing = afterByColor.get(color);
    if (existing) existing.push(componentId);
    else afterByColor.set(color, [componentId]);
  }
  for (const [color, componentIds] of afterByColor) {
    afterByColor.set(
      color,
      sortBy(
        componentIds,
        (componentId) =>
          afterGraph.components.get(componentId)?.componentType ?? "",
        (componentId) => componentId,
      ),
    );
  }

  const candidates = new Map<string, string[]>();
  for (const [componentId] of beforeGraph.components) {
    const color = beforeColors.get(componentId) ?? "";
    candidates.set(componentId, [...(afterByColor.get(color) ?? [])]);
  }
  return candidates;
}

function mappedSignalCandidates(
  beforeSignal: HalGraphSignal,
  mapping: Map<string, string>,
  afterIndex: IndexedGraph,
): string[] {
  const mappedAttachmentSignalIds = beforeSignal.attachments.flatMap(
    (attachment) => {
      const mappedComponentId = mapping.get(attachment.componentId);
      if (!mappedComponentId) return [];
      return [
        afterIndex.signalIdsByAttachmentKey.get(
          attachmentKey(mappedComponentId, attachment.pinName),
        ) ?? [],
      ];
    },
  );

  if (mappedAttachmentSignalIds.length === 0) return [];
  return intersectStringLists(mappedAttachmentSignalIds);
}

function isExactSignalMatch(
  beforeSignal: HalGraphSignal,
  afterSignal: HalGraphSignal,
  mapping: Map<string, string>,
): boolean {
  if (beforeSignal.attachments.length !== afterSignal.attachments.length) {
    return false;
  }

  const normalizedBeforeAttachments = uniqueSorted(
    beforeSignal.attachments.flatMap((attachment) => {
      const mappedComponentId = mapping.get(attachment.componentId);
      return mappedComponentId
        ? [attachmentKey(mappedComponentId, attachment.pinName)]
        : [];
    }),
  );
  const normalizedAfterAttachments = uniqueSorted(
    afterSignal.attachments.map((attachment) =>
      attachmentKey(attachment.componentId, attachment.pinName),
    ),
  );

  return (
    valuesKey(normalizedBeforeAttachments) ===
    valuesKey(normalizedAfterAttachments)
  );
}

function isPartialMappingConsistent(
  beforeGraph: HalNetworkGraph,
  afterGraph: HalNetworkGraph,
  afterIndex: IndexedGraph,
  mapping: Map<string, string>,
): boolean {
  const forcedAfterSignals = new Set<string>();

  for (const beforeSignal of beforeGraph.signals.values()) {
    const candidates = mappedSignalCandidates(
      beforeSignal,
      mapping,
      afterIndex,
    );
    const mappedAttachmentCount = beforeSignal.attachments.filter(
      (attachment) => mapping.has(attachment.componentId),
    ).length;

    if (mappedAttachmentCount === 0) continue;
    if (candidates.length === 0) return false;

    if (mappedAttachmentCount !== beforeSignal.attachments.length) continue;

    const exactCandidates = candidates.filter((candidateId) =>
      isExactSignalMatch(
        beforeSignal,
        afterGraph.signals.get(candidateId) ?? {
          id: candidateId,
          signalName: candidateId,
          attachments: [],
        },
        mapping,
      ),
    );
    if (exactCandidates.length === 0) return false;
    if (exactCandidates.length === 1) {
      const [forcedCandidate] = exactCandidates;
      if (!forcedCandidate) return false;
      if (forcedAfterSignals.has(forcedCandidate)) return false;
      forcedAfterSignals.add(forcedCandidate);
    }
  }

  return true;
}

export function canSupportExactSearch(
  beforeGraph: HalNetworkGraph,
  afterGraph: HalNetworkGraph,
  beforeColors: Map<string, string>,
  afterColors: Map<string, string>,
  beforeSignalColors: Map<string, string>,
  afterSignalColors: Map<string, string>,
): string[] {
  const invariants: string[] = [];

  if (beforeGraph.components.size !== afterGraph.components.size) {
    invariants.push(
      `component count differs: before=${beforeGraph.components.size}, after=${afterGraph.components.size}`,
    );
  }
  if (beforeGraph.signals.size !== afterGraph.signals.size) {
    invariants.push(
      `signal count differs: before=${beforeGraph.signals.size}, after=${afterGraph.signals.size}`,
    );
  }

  invariants.push(
    ...compareCountMaps(
      "component",
      collectCountMap(beforeColors.values()),
      collectCountMap(afterColors.values()),
    ),
  );
  invariants.push(
    ...compareCountMaps(
      "signal",
      collectCountMap(beforeSignalColors.values()),
      collectCountMap(afterSignalColors.values()),
    ),
  );

  return invariants;
}

function estimateAmbiguousGroupSearchCost(groupSize: number): number {
  if (groupSize <= 1) return 1;

  let total = 1;
  let permutations = 1;
  for (let depth = 0; depth < groupSize; depth += 1) {
    permutations *= groupSize - depth;
    total += permutations;
    if (!Number.isFinite(total)) return Number.POSITIVE_INFINITY;
  }

  return total;
}

export function shouldAttemptExactSearch(
  candidates: Map<string, string[]>,
  stepLimit = SEARCH_STEP_LIMIT,
): { allowed: boolean; warning?: string } {
  const groupSizes = collectCountMap(
    [...candidates.values()].map((values) => valuesKey(values)),
  );
  let estimatedCost = 1;

  for (const groupSize of groupSizes.values()) {
    const groupCost = estimateAmbiguousGroupSearchCost(groupSize);
    estimatedCost *= groupCost;
    if (!Number.isFinite(estimatedCost) || estimatedCost > stepLimit) {
      return {
        allowed: false,
        warning:
          "Skipping exact structural search because the candidate graph is too ambiguous; falling back to heuristic mapping",
      };
    }
  }

  return { allowed: true };
}

function chooseNextComponent(
  beforeGraph: HalNetworkGraph,
  candidates: Map<string, string[]>,
  mapping: Map<string, string>,
  usedAfterIds: Set<string>,
): string | undefined {
  return sortBy(
    [...beforeGraph.components.keys()].filter(
      (componentId) => !mapping.has(componentId),
    ),
    (componentId) =>
      (candidates.get(componentId) ?? []).filter(
        (candidate) => !usedAfterIds.has(candidate),
      ).length,
    (componentId) =>
      -(beforeGraph.components.get(componentId)?.attachments.length ?? 0),
    (componentId) => componentId,
  )[0];
}

function buildExactSignalSignatureCounts(
  beforeGraph: HalNetworkGraph,
  afterGraph: HalNetworkGraph,
  mapping: Map<string, string>,
): { beforeCounts: Map<string, number>; afterCounts: Map<string, number> } {
  const beforeCounts = new Map<string, number>();
  const afterCounts = new Map<string, number>();

  for (const signal of beforeGraph.signals.values()) {
    const signature = valuesKey(
      uniqueSorted(
        signal.attachments.flatMap((attachment) => {
          const mappedComponentId = mapping.get(attachment.componentId);
          return mappedComponentId
            ? [attachmentKey(mappedComponentId, attachment.pinName)]
            : [];
        }),
      ),
    );
    beforeCounts.set(signature, (beforeCounts.get(signature) ?? 0) + 1);
  }
  for (const signal of afterGraph.signals.values()) {
    const signature = valuesKey(
      uniqueSorted(
        signal.attachments.map((attachment) =>
          attachmentKey(attachment.componentId, attachment.pinName),
        ),
      ),
    );
    afterCounts.set(signature, (afterCounts.get(signature) ?? 0) + 1);
  }

  return { beforeCounts, afterCounts };
}

function exactSignalCountsMatch(
  beforeGraph: HalNetworkGraph,
  afterGraph: HalNetworkGraph,
  mapping: Map<string, string>,
): boolean {
  const { beforeCounts, afterCounts } = buildExactSignalSignatureCounts(
    beforeGraph,
    afterGraph,
    mapping,
  );
  return compareCountMaps("signal", beforeCounts, afterCounts).length === 0;
}

export function searchExactComponentMapping(args: {
  beforeGraph: HalNetworkGraph;
  afterGraph: HalNetworkGraph;
  candidates: Map<string, string[]>;
  stepLimit?: number;
}): SearchResult {
  const warnings: string[] = [];
  const afterIndex = indexGraph(args.afterGraph);
  const mapping = new Map<string, string>();
  const usedAfterIds = new Set<string>();
  const stepLimit = args.stepLimit ?? SEARCH_STEP_LIMIT;
  let steps = 0;

  const search = (): Map<string, string> | null => {
    if (mapping.size === args.beforeGraph.components.size) {
      return exactSignalCountsMatch(args.beforeGraph, args.afterGraph, mapping)
        ? new Map(mapping)
        : null;
    }

    steps += 1;
    if (steps > stepLimit) {
      warnings.push(
        `Exact structural search stopped after ${stepLimit} steps; falling back to heuristic mapping`,
      );
      return null;
    }

    const nextBeforeId = chooseNextComponent(
      args.beforeGraph,
      args.candidates,
      mapping,
      usedAfterIds,
    );
    if (!nextBeforeId) return null;

    const nextCandidates = (args.candidates.get(nextBeforeId) ?? []).filter(
      (candidate) => !usedAfterIds.has(candidate),
    );
    for (const afterId of nextCandidates) {
      mapping.set(nextBeforeId, afterId);
      usedAfterIds.add(afterId);
      const consistent = isPartialMappingConsistent(
        args.beforeGraph,
        args.afterGraph,
        afterIndex,
        mapping,
      );
      if (consistent) {
        const result = search();
        if (result) return result;
      }
      usedAfterIds.delete(afterId);
      mapping.delete(nextBeforeId);
    }

    return null;
  };

  return {
    mapping: search(),
    warnings,
  };
}
