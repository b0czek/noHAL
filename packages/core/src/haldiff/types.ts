export interface HalNetworkComponentSummary {
  instanceName: string;
  componentType?: string;
  pinNames: string[];
  degree: number;
}

export interface HalDiffConnectionSummary {
  componentInstanceName: string;
  componentType?: string;
  pinName: string;
  mappedComponentInstanceName?: string;
}

export interface HalSignalComparison {
  beforeSignalName?: string;
  afterSignalName?: string;
  equivalent: boolean;
  beforeConnections: HalDiffConnectionSummary[];
  afterConnections: HalDiffConnectionSummary[];
  missingConnections: HalDiffConnectionSummary[];
  extraConnections: HalDiffConnectionSummary[];
}

export interface HalComponentMatch {
  beforeInstanceName: string;
  afterInstanceName: string;
  componentType?: string;
  confidence: "unique" | "search" | "fallback";
}

export interface HalNetworkComparison {
  equivalent: boolean;
  beforeSummary: {
    componentCount: number;
    signalCount: number;
  };
  afterSummary: {
    componentCount: number;
    signalCount: number;
  };
  invariants: string[];
  matchedComponents: HalComponentMatch[];
  unmatchedBeforeComponents: HalNetworkComponentSummary[];
  unmatchedAfterComponents: HalNetworkComponentSummary[];
  matchedSignals: HalSignalComparison[];
  differingSignals: HalSignalComparison[];
  unmatchedBeforeSignals: HalSignalComparison[];
  unmatchedAfterSignals: HalSignalComparison[];
  warnings: string[];
}
